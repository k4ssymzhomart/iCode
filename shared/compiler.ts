import type { Task } from "./types";

export type CompilerAction = "run" | "correct" | "explain";
export type CompilerFixMode = "full" | "last-console-error";

export interface CompilerResponseSection {
  title: string;
  content: string;
  kind?: "task" | "code" | "log";
}

export interface CompilerActionRequest {
  sourceCode: string;
  stdin?: string;
  fixMode?: CompilerFixMode;
  consoleOutput?: string;
  sessionId?: string;
  taskId?: string;
  language?: Task["language"];
  outputLog?: string;
}

export interface CompilerActionResponse {
  action: CompilerAction;
  statusLabel: string;
  content: string;
  correctedCode?: string;
  fixMode?: CompilerFixMode;
  sections?: CompilerResponseSection[];
}

export interface CompilerHistoryEntry {
  id: string;
  action: "run" | "correct" | "save";
  verdict: "success" | "saved" | "error";
  statusLabel: string;
  title: string;
  createdAt: string;
}
