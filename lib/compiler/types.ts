export type CompilerAction = "run" | "correct";

export interface CompilerActionRequest {
  sourceCode: string;
  stdin?: string;
}

export interface CompilerActionResponse {
  action: CompilerAction;
  statusLabel: string;
  content: string;
  correctedCode?: string;
}

export interface CompilerHistoryEntry {
  id: string;
  action: "run" | "correct" | "save";
  verdict: "success" | "saved" | "error";
  statusLabel: string;
  title: string;
  createdAt: string;
}
