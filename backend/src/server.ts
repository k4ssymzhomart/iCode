import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { generateCompilerText } from "./compiler/ai";
import {
  buildCorrectMessages,
  buildExplainMessages,
  buildTargetedCorrectMessages,
} from "./compiler/prompts";
import { runPythonSource } from "./compiler/pythonRunner";
import { ensureBackendSchema } from "./bootstrapSchema";
import type {
  CompilerActionRequest,
  CompilerActionResponse,
  CompilerFixMode,
} from "../../shared/compiler";
import {
  assertStudentCanAccessWorkspace,
  assertTeacherOwnsSession,
  getSessionTasks,
  getUserRole,
  incrementStudentMetric,
  loadSessionRecord,
  normalizeSessionControls,
  HttpError,
} from "./lib/classroom";
import { sendControllerError } from "./lib/responses";
import { AuthenticatedRequest } from "./middleware/auth";
import { supabaseAdmin } from "./supabaseClient";
import type { Task } from "../../shared/types";

const port = Number(process.env.PORT || 3000);
const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const frontendRoot = path.join(projectRoot, "frontend");
const frontendDistPath = path.join(frontendRoot, "dist");

const validateSourceCode = (sourceCode?: string) => {
  if (!sourceCode?.trim()) {
    throw new HttpError(400, "Source code is required.");
  }

  return sourceCode;
};

const buildUnsupportedRuntimeResponse = (
  language?: Task["language"],
): CompilerActionResponse => ({
  action: "run",
  statusLabel: "Runtime unavailable",
  content: `Ordinary classroom execution is currently available only for Python tasks. ${
    language?.toUpperCase() ?? "This"
  } classroom execution is not supported yet.`,
});

const buildTaskContext = (task?: Task | null) => {
  if (!task) {
    return "No classroom task context was provided.";
  }

  const examples =
    task.testCases.length > 0
      ? task.testCases
          .map(
            (testCase, index) =>
              `Example ${index + 1}\nInput: ${testCase.input || "(empty)"}\nOutput: ${
                testCase.expectedOutput || "(empty)"
              }`,
          )
          .join("\n\n")
      : "No examples were provided.";

  const constraints =
    task.constraints && task.constraints.length > 0
      ? task.constraints.map((constraint) => `- ${constraint}`).join("\n")
      : "No extra constraints were provided.";

  return [
    `Title: ${task.title}`,
    `Description: ${task.description}`,
    `Input Format: ${task.inputFormat ?? "Not specified."}`,
    `Output Format: ${task.outputFormat ?? "Not specified."}`,
    `Constraints:\n${constraints}`,
    `Examples:\n${examples}`,
  ].join("\n\n");
};

const resolveRequestTask = async (
  request: CompilerActionRequest,
  session?: Awaited<ReturnType<typeof loadSessionRecord>> | null,
) => {
  if (!request.sessionId || !request.taskId) {
    return null;
  }

  const resolvedSession = session ?? (await loadSessionRecord(request.sessionId));
  const taskEntry = (await getSessionTasks(request.sessionId, resolvedSession)).find(
    (entry) => entry.taskId === request.taskId,
  );

  return taskEntry?.task ?? null;
};

const createRunResponse = async (
  request: CompilerActionRequest,
): Promise<CompilerActionResponse> => {
  const sourceCode = validateSourceCode(request.sourceCode);
  const requestedLanguage = request.language ?? "python";

  if (requestedLanguage !== "python") {
    return buildUnsupportedRuntimeResponse(requestedLanguage);
  }

  const execution = await runPythonSource(sourceCode, request.stdin ?? "");

  if (execution.success) {
    return {
      action: "run",
      statusLabel: "Program output",
      content: execution.stdout,
    };
  }

  return {
    action: "run",
    statusLabel: "Problem found",
    content: "formattedError" in execution ? execution.formattedError : "Line ?: runtime issue",
  };
};

const createCorrectResponse = async (
  request: CompilerActionRequest,
): Promise<CompilerActionResponse> => {
  const sourceCode = validateSourceCode(request.sourceCode);
  const fixMode: CompilerFixMode = request.fixMode ?? "full";

  if (fixMode === "last-console-error" && !request.consoleOutput?.trim()) {
    throw new HttpError(
      400,
      "The targeted AI fix needs the latest console error. Run the code first, then try again.",
    );
  }

  const correctedCode = await generateCompilerText(
    fixMode === "last-console-error"
      ? buildTargetedCorrectMessages(sourceCode, request.consoleOutput ?? "", request.stdin)
      : buildCorrectMessages(sourceCode, request.stdin),
    {
      temperature: 0.1,
      max_tokens: 500,
      top_p: 0.5
    }
  );

  return {
    action: "correct",
    statusLabel: fixMode === "last-console-error" ? "Last error corrected" : "Code corrected",
    content: correctedCode,
    correctedCode,
    fixMode,
  };
};

const createExplainResponse = async (
  request: CompilerActionRequest,
  task?: Task | null,
): Promise<CompilerActionResponse> => {
  const sourceCode = validateSourceCode(request.sourceCode);
  const taskContext = buildTaskContext(task);
  const outputLog = request.outputLog?.trim() || "No execution log was available yet.";
  const explanation = await generateCompilerText(
    buildExplainMessages({
      sourceCode,
      stdin: request.stdin,
      outputLog,
      taskContext,
    }),
    {
      temperature: 0.2,
      max_tokens: 700,
      top_p: 0.8,
    },
  );

  return {
    action: "explain",
    statusLabel: "Explanation ready",
    content: explanation,
    sections: [
      {
        title: "Teacher Task",
        content: taskContext,
        kind: "task",
      },
      {
        title: "Your Code",
        content: sourceCode,
        kind: "code",
      },
      {
        title: "Execution Log",
        content: outputLog,
        kind: "log",
      },
      {
        title: "Personalized Explanation",
        content: explanation,
      },
    ],
  };
};

const startServer = async () => {
  await ensureBackendSchema();
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  const { requireAuth } = await import("./middleware/auth");
  const { handleProfileSync } = await import("./controllers/auth");
  const {
    handleJoinClassroom,
    handleGetTeacherActiveSession,
    handleSessionActivity,
    handleGetStudentSessionSnapshot,
  } = await import("./controllers/session");
  const { handleLiveblocksAuth } = await import("./controllers/liveblocks");
  const { handleSaveCode, handleLoadCode, handleHelpRequest } = await import("./controllers/editor");
  const { handleLeaderboard, handleGetHelpRequests, handleUpdateSessionControl } = await import("./controllers/metrics");
  const {
    handleImportTaskSet,
    handleListTaskSets,
    handleTasksImport,
    handleListTasks,
  } = await import("./controllers/tasks");
  const {
    handleCreateTeacherSession,
    handleGetTeacherSessionDashboard,
    handleGetTeacherSessionDetail,
    handleListAssignableStudents,
    handleListTeacherSessions,
    handleUpdateTeacherSessionState,
    handleRegenerateSessionCode,
    handleUpdateSessionControls,
    handleAssignSessionRoster,
    handleAssignSessionTasks,
    handleSwitchSessionActiveTask,
    handleBroadcastSessionMessage,
    handlePinSessionHint,
    handleResetStudentCode,
    handleResolveHelpRequest,
  } = await import("./controllers/teacherSessions");
  const {
    handleCreateIntervention,
    handleListInterventions,
    handleUpdateInterventionStatus,
  } = await import("./controllers/interventions");
  const { handleSubmitFeedback } = await import("./controllers/feedback");

  const validateCompilerAction = async (
    request: AuthenticatedRequest,
    action: "run" | "correct" | "explain",
    payload: CompilerActionRequest,
  ) => {
    if (!payload.sessionId || !payload.taskId) {
      return null;
    }

    const userId = request.user!.id;
    const role = await getUserRole(userId);
    const session = await loadSessionRecord(payload.sessionId);
    const controls = normalizeSessionControls(session.controls ?? session.config);

    if (role === "teacher") {
      await assertTeacherOwnsSession(userId, payload.sessionId);
    } else {
      await assertStudentCanAccessWorkspace(userId, payload.sessionId, payload.taskId);
    }

    if (action === "run" && !controls.allowRun) {
      throw new HttpError(403, "Run is currently locked for this session.");
    }

    if (action === "correct" && !controls.allowCorrect) {
      throw new HttpError(403, "Correct is currently locked for this session.");
    }

    if (action === "explain" && !controls.allowExplain) {
      throw new HttpError(403, "Explain is currently locked for this session.");
    }

    if (role !== "teacher") {
      const workspaceMetric = await supabaseAdmin
        .from("student_metrics")
        .select("run_attempts, corrections_used")
        .eq("session_id", payload.sessionId)
        .eq("task_id", payload.taskId)
        .eq("student_id", userId)
        .maybeSingle();

      if (workspaceMetric.error) {
        throw new HttpError(500, `Failed to read session limits: ${workspaceMetric.error.message}`);
      }

      const currentRunAttempts = workspaceMetric.data?.run_attempts ?? 0;
      const currentCorrections = workspaceMetric.data?.corrections_used ?? 0;

      if (action === "run" && controls.runLimit >= 0 && currentRunAttempts >= controls.runLimit) {
        throw new HttpError(403, "Run limit reached for this session.");
      }

      if (
        action === "correct" &&
        controls.correctionLimit >= 0 &&
        currentCorrections >= controls.correctionLimit
      ) {
        throw new HttpError(403, "Correction limit reached for this session.");
      }
    }

    return { role, session };
  };

  // Mount API Routes
  app.post("/api/auth/profile", requireAuth, handleProfileSync);
  app.post("/api/classroom/join", requireAuth, handleJoinClassroom);
  app.get("/api/classroom/active", requireAuth, handleGetTeacherActiveSession);
  app.get("/api/classroom/session", requireAuth, handleGetStudentSessionSnapshot);
  app.post("/api/classroom/activity", requireAuth, handleSessionActivity);
  app.post("/api/liveblocks-auth", requireAuth, handleLiveblocksAuth);
  
  app.post("/api/code/save", requireAuth, handleSaveCode);
  app.get("/api/code/load", requireAuth, handleLoadCode);
  app.post("/api/help/request", requireAuth, handleHelpRequest);
  app.post("/api/feedback", requireAuth, handleSubmitFeedback);

  app.get("/api/leaderboard", requireAuth, handleLeaderboard);
  app.get("/api/help/requests", requireAuth, handleGetHelpRequests);
  app.put("/api/session/control", requireAuth, handleUpdateSessionControl);
  app.get("/api/teacher/sessions", requireAuth, handleListTeacherSessions);
  app.post("/api/teacher/sessions", requireAuth, handleCreateTeacherSession);
  app.get("/api/teacher/sessions/:sessionId", requireAuth, handleGetTeacherSessionDetail);
  app.get("/api/teacher/sessions/:sessionId/dashboard", requireAuth, handleGetTeacherSessionDashboard);
  app.put("/api/teacher/sessions/:sessionId/state", requireAuth, handleUpdateTeacherSessionState);
  app.post("/api/teacher/sessions/:sessionId/regenerate-code", requireAuth, handleRegenerateSessionCode);
  app.put("/api/teacher/sessions/:sessionId/controls", requireAuth, handleUpdateSessionControls);
  app.put("/api/teacher/sessions/:sessionId/roster", requireAuth, handleAssignSessionRoster);
  app.put("/api/teacher/sessions/:sessionId/tasks", requireAuth, handleAssignSessionTasks);
  app.post("/api/teacher/sessions/:sessionId/active-task", requireAuth, handleSwitchSessionActiveTask);
  app.post("/api/teacher/sessions/:sessionId/broadcast", requireAuth, handleBroadcastSessionMessage);
  app.post("/api/teacher/sessions/:sessionId/pinned-hint", requireAuth, handlePinSessionHint);
  app.post("/api/teacher/sessions/:sessionId/reset-student-code", requireAuth, handleResetStudentCode);
  app.post("/api/teacher/sessions/:sessionId/help/resolve", requireAuth, handleResolveHelpRequest);
  app.get("/api/teacher/students", requireAuth, handleListAssignableStudents);
  app.get("/api/teacher/task-sets", requireAuth, handleListTaskSets);
  app.post("/api/teacher/task-sets/import", requireAuth, handleImportTaskSet);
  app.post("/api/teacher/tasks/import", requireAuth, handleTasksImport);
  app.get("/api/teacher/tasks", requireAuth, handleListTasks);
  app.get("/api/interventions", requireAuth, handleListInterventions);
  app.post("/api/interventions", requireAuth, handleCreateIntervention);
  app.put("/api/interventions/:interventionId/status", requireAuth, handleUpdateInterventionStatus);

  app.post("/api/compiler/run", requireAuth, async (request, response) => {
    try {
      const payload = request.body as CompilerActionRequest;
      await validateCompilerAction(request as AuthenticatedRequest, "run", payload);
      const resp = await createRunResponse(payload);
      
      const userId = (request as any).user.id;
      const role = await getUserRole(userId);
      if (payload.sessionId && payload.taskId && role !== "teacher") {
        await incrementStudentMetric(payload.sessionId, payload.taskId, userId, "run_attempts");
      }
      
      response.json(resp);
    } catch (error) {
      sendControllerError(response, error);
    }
  });

  app.post("/api/compiler/correct", requireAuth, async (request, response) => {
    try {
      const payload = request.body as CompilerActionRequest;
      await validateCompilerAction(request as AuthenticatedRequest, "correct", payload);
      const resp = await createCorrectResponse(payload);
      
      const userId = (request as any).user.id;
      const role = await getUserRole(userId);
      if (payload.sessionId && payload.taskId && role !== "teacher") {
        await incrementStudentMetric(payload.sessionId, payload.taskId, userId, "corrections_used");
      }
      
      response.json(resp);
    } catch (error) {
      sendControllerError(response, error);
    }
  });

  app.post("/api/compiler/explain", requireAuth, async (request, response) => {
    try {
      const payload = request.body as CompilerActionRequest;
      const validation = await validateCompilerAction(
        request as AuthenticatedRequest,
        "explain",
        payload,
      );
      const task = await resolveRequestTask(payload, validation?.session ?? null);
      const resp = await createExplainResponse(payload, task);

      const userId = (request as AuthenticatedRequest).user!.id;
      const role = validation?.role ?? (await getUserRole(userId));
      if (payload.sessionId && payload.taskId && role !== "teacher") {
        await incrementStudentMetric(payload.sessionId, payload.taskId, userId, "explain_used");
      }

      response.json(resp);
    } catch (error) {
      sendControllerError(response, error);
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
