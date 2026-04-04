import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { generateCompilerText } from "./lib/compiler/ai";
import { buildCorrectMessages, buildRunMessages } from "./lib/compiler/prompts";
import type {
  CompilerActionRequest,
  CompilerActionResponse,
} from "./lib/compiler/types";

const PORT = Number(process.env.PORT || 3000);

const validateSourceCode = (sourceCode?: string) => {
  if (!sourceCode?.trim()) {
    throw new Error("Source code is required.");
  }

  return sourceCode;
};

const createRunResponse = async (request: CompilerActionRequest) => {
  const sourceCode = validateSourceCode(request.sourceCode);
  const content = await generateCompilerText(
    buildRunMessages(sourceCode, request.stdin),
  );

  const response: CompilerActionResponse = {
    action: "run",
    statusLabel: "AI output",
    content,
  };

  return response;
};

const createCorrectResponse = async (request: CompilerActionRequest) => {
  const sourceCode = validateSourceCode(request.sourceCode);
  const correctedCode = await generateCompilerText(
    buildCorrectMessages(sourceCode, request.stdin),
  );

  const response: CompilerActionResponse = {
    action: "correct",
    statusLabel: "Code corrected",
    content: correctedCode,
    correctedCode,
  };

  return response;
};

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  app.post("/api/compiler/run", async (req, res) => {
    try {
      const payload = req.body as CompilerActionRequest;
      const response = await createRunResponse(payload);
      res.json(response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected compiler run error.";
      res.status(400).json({ error: message });
    }
  });

  app.post("/api/compiler/correct", async (req, res) => {
    try {
      const payload = req.body as CompilerActionRequest;
      const response = await createCorrectResponse(payload);
      res.json(response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unexpected compiler correction error.";
      res.status(400).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
