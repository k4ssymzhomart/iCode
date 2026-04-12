import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { generateCompilerText } from "./compiler/ai";
import { buildCorrectMessages, buildRunMessages } from "./compiler/prompts";
import type {
  CompilerActionRequest,
  CompilerActionResponse,
} from "../../shared/compiler";

const port = Number(process.env.PORT || 3000);
const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const frontendRoot = path.join(projectRoot, "frontend");
const frontendDistPath = path.join(frontendRoot, "dist");

const validateSourceCode = (sourceCode?: string) => {
  if (!sourceCode?.trim()) {
    throw new Error("Source code is required.");
  }

  return sourceCode;
};

const createRunResponse = async (
  request: CompilerActionRequest,
): Promise<CompilerActionResponse> => {
  const sourceCode = validateSourceCode(request.sourceCode);
  const content = await generateCompilerText(
    buildRunMessages(sourceCode, request.stdin),
  );

  return {
    action: "run",
    statusLabel: "AI output",
    content,
  };
};

const createCorrectResponse = async (
  request: CompilerActionRequest,
): Promise<CompilerActionResponse> => {
  const sourceCode = validateSourceCode(request.sourceCode);
  const correctedCode = await generateCompilerText(
    buildCorrectMessages(sourceCode, request.stdin),
  );

  return {
    action: "correct",
    statusLabel: "Code corrected",
    content: correctedCode,
    correctedCode,
  };
};

const startServer = async () => {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  const { requireAuth } = await import("./middleware/auth");
  const { handleProfileSync } = await import("./controllers/auth");
  const { handleJoinClassroom, handleGetTeacherActiveSession } = await import("./controllers/session");
  const { handleLiveblocksAuth } = await import("./controllers/liveblocks");
  const { handleSaveCode, handleLoadCode, handleHelpRequest } = await import("./controllers/editor");
  const { handleLeaderboard, handleGetHelpRequests, handleUpdateSessionControl } = await import("./controllers/metrics");

  // Mount API Routes
  app.post("/api/auth/profile", requireAuth, handleProfileSync);
  app.post("/api/classroom/join", requireAuth, handleJoinClassroom);
  app.get("/api/classroom/active", requireAuth, handleGetTeacherActiveSession);
  app.post("/api/liveblocks-auth", requireAuth, handleLiveblocksAuth);
  
  app.post("/api/code/save", requireAuth, handleSaveCode);
  app.get("/api/code/load", requireAuth, handleLoadCode);
  app.post("/api/help/request", requireAuth, handleHelpRequest);

  app.get("/api/leaderboard", requireAuth, handleLeaderboard);
  app.get("/api/help/requests", requireAuth, handleGetHelpRequests);
  app.put("/api/session/control", requireAuth, handleUpdateSessionControl);

  app.post("/api/compiler/run", requireAuth, async (request, response) => {
    try {
      const payload = request.body as CompilerActionRequest;
      const resp = await createRunResponse(payload);
      
      const userId = (request as any).user.id;
      if (payload.taskId) {
         // Increment run_attempts quietly
         const { supabaseAdmin } = await import("./supabaseClient");
         const { data: sessionInfo } = await supabaseAdmin
           .from("lab_sessions")
           .select("id")
           .eq("task_id", payload.taskId)
           .eq("state", "active")
           .single();

         if (sessionInfo) {
            await supabaseAdmin.rpc('increment_metric', { 
               p_session_id: sessionInfo.id, 
               p_task_id: payload.taskId, 
               p_student_id: userId, 
               p_metric: 'run_attempts' 
            });
            // Note: In real postgres, an RPC would be best, or we just rely on an UPSERT read/write.
            // Let's do a basic read+upsert for simplicity if no RPC exists.
            const { data: mData } = await supabaseAdmin.from("student_metrics")
               .select("run_attempts")
               .eq("session_id", sessionInfo.id)
               .eq("task_id", payload.taskId)
               .eq("student_id", userId)
               .single();
            await supabaseAdmin.from("student_metrics").upsert({
               session_id: sessionInfo.id,
               task_id: payload.taskId,
               student_id: userId,
               run_attempts: (mData?.run_attempts || 0) + 1
            }, { onConflict: "session_id, task_id, student_id" });
         }
      }
      
      response.json(resp);
    } catch (error) {
      response.status(400).json({
        error: error instanceof Error ? error.message : "Unexpected compiler run error.",
      });
    }
  });

  app.post("/api/compiler/correct", requireAuth, async (request, response) => {
    try {
      const payload = request.body as CompilerActionRequest;
      const resp = await createCorrectResponse(payload);
      
      const userId = (request as any).user.id;
      if (payload.taskId) {
         const { supabaseAdmin } = await import("./supabaseClient");
         const { data: sessionInfo } = await supabaseAdmin
           .from("lab_sessions")
           .select("id")
           .eq("task_id", payload.taskId)
           .eq("state", "active")
           .single();

         if (sessionInfo) {
            const { data: mData } = await supabaseAdmin.from("student_metrics")
               .select("corrections_used")
               .eq("session_id", sessionInfo.id)
               .eq("task_id", payload.taskId)
               .eq("student_id", userId)
               .single();
               
            await supabaseAdmin.from("student_metrics").upsert({
               session_id: sessionInfo.id,
               task_id: payload.taskId,
               student_id: userId,
               corrections_used: (mData?.corrections_used || 0) + 1
            }, { onConflict: "session_id, task_id, student_id" });
         }
      }
      
      response.json(resp);
    } catch (error) {
      response.status(400).json({
        error: error instanceof Error ? error.message : "Unexpected compiler correction error.",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: frontendRoot,
      configFile: path.join(frontendRoot, "vite.config.ts"),
      server: {
        middlewareMode: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(frontendDistPath));
    app.use((_request, response) => {
      response.sendFile(path.join(frontendDistPath, "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server.", error);
  process.exit(1);
});
