import React, { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
 Play,
 RotateCcw,
 Save,
 Sparkles,
 TerminalSquare,
 Wand2,
} from "lucide-react";
import type { CompilerActionResponse } from "../../lib/compiler/types";
import {
  appendCompilerHistory,
  clearCompilerDraft,
  loadCompilerDraft,
  loadCompilerHistory,
  loadCompilerStdin,
  saveCompilerDraft,
  saveCompilerStdin,
} from "./compilerStorage";

const defaultCode = `import sys

def solve(data: str) -> str:
    # Write your logic here.
    return data.strip()

if __name__ == "__main__":
    print(solve(sys.stdin.read()))
`;

const fetchJson = async <T,>(url: string, init?: RequestInit) => {
  const response = await fetch(url, init);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Compiler request failed.");
  }

  return data as T;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Not saved yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const statusTone = (statusLabel?: string) => {
  if (!statusLabel) {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }

  if (statusLabel === "Code corrected") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (statusLabel === "AI output") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
};

const SmartCompiler = () => {
  const [code, setCode] = useState(defaultCode);
  const [stdin, setStdin] = useState("");
  const [result, setResult] = useState<CompilerActionResponse | null>(null);
  const [pendingAction, setPendingAction] = useState<"run" | "correct" | null>(
    null,
  );
  const [screenReady, setScreenReady] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadCompilerDraft();
    const history = loadCompilerHistory();
    const latestSave = history.find((entry) => entry.action === "save");

    setCode(draft?.code ?? defaultCode);
    setStdin(loadCompilerStdin());
    setLastSavedAt(draft?.updatedAt ?? latestSave?.createdAt ?? null);
    setScreenReady(true);
  }, []);

  const statusChip = useMemo(() => {
    if (!result) {
      return {
        label: "Ready",
        tone: statusTone(undefined),
      };
    }

    return {
      label: result.statusLabel,
      tone: statusTone(result.statusLabel),
    };
  }, [result]);

  const handleSaveDraft = () => {
    const savedAt = saveCompilerDraft(code);
    setLastSavedAt(savedAt);
    setActionError(null);
    appendCompilerHistory({
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `save-${Date.now()}`,
      action: "save",
      verdict: "saved",
      statusLabel: "Draft saved",
      title: "Draft saved",
      createdAt: savedAt,
    });
  };

  const handleReset = () => {
    setCode(defaultCode);
    setResult(null);
    setActionError(null);
    clearCompilerDraft();
    setLastSavedAt(null);
  };

  const handleAction = async (action: "run" | "correct") => {
    setPendingAction(action);
    setActionError(null);

    try {
      const response = await fetchJson<CompilerActionResponse>(
        `/api/compiler/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceCode: code,
            stdin,
          }),
        },
      );

      if (action === "correct" && response.correctedCode) {
        setCode(response.correctedCode);
      }

      setResult(response);
      appendCompilerHistory({
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${action}-${Date.now()}`,
        action,
        verdict: "success",
        statusLabel: response.statusLabel,
        title: response.statusLabel,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : `The ${action} request failed.`,
      );
      setResult(null);
    } finally {
      setPendingAction(null);
    }
  };

  const handleStdinChange = (value: string) => {
    setStdin(value);
    saveCompilerStdin(value);
  };

  if (!screenReady) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-white">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          Loading compiler...
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-white text-slate-900">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-slate-900">
                Smart Compiler
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full border border-slate-200 px-2.5 py-1">
                  Python
                </span>
                <span className="rounded-full border border-slate-200 px-2.5 py-1">
                  Draft: {formatDate(lastSavedAt)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusChip.tone}`}
              >
                {statusChip.label}
              </span>

              <button
                onClick={() => handleAction("run")}
                disabled={pendingAction !== null}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {pendingAction === "run" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run
              </button>

              <button
                onClick={() => handleAction("correct")}
                disabled={pendingAction !== null}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {pendingAction === "correct" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Correct
              </button>

              <button
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                <Save className="h-4 w-4" />
                Save draft
              </button>

              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {actionError && (
          <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              {actionError}
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1">
          <Editor
            path="/smart-compiler/main.py"
            language="python"
            value={code}
            onChange={(value) => setCode(value ?? "")}
            theme="vs"
            loading="Loading editor..."
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbersMinChars: 3,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              smoothScrolling: true,
              padding: { top: 14, bottom: 14 },
              fontFamily:
                "JetBrains Mono, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              renderLineHighlight: "line",
              roundedSelection: false,
              overviewRulerBorder: false,
            }}
          />
        </div>

        <div className="grid min-h-[320px] border-t border-slate-200 bg-white xl:grid-cols-[320px_minmax(0,1fr)]">
          <section className="border-b border-slate-200 p-4 xl:border-b-0 xl:border-r">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <TerminalSquare className="h-4 w-4 text-blue-600" />
              Standard input
            </div>
            <textarea
              value={stdin}
              onChange={(event) => handleStdinChange(event.target.value)}
              placeholder="Optional stdin for the AI run..."
              className="h-[220px] w-full resize-none rounded-xl border border-slate-200 px-3 py-3 font-mono text-xs leading-5 text-slate-700 outline-none transition focus:border-blue-500"
            />
          </section>

          <section className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              {result?.action === "correct" ? (
                <Sparkles className="h-4 w-4 text-blue-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              )}
              {result?.action === "correct" ? "Corrected code" : "Output"}
            </div>

            {!result ? (
              <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                Run to get AI output or use Correct to rewrite the code with short change comments.
              </div>
            ) : (
              <div className="space-y-3">
                {result.action === "correct" && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    The corrected code has been applied to the editor.
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-slate-50">
                  <div className="border-b border-slate-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {result.action === "correct" ? "Corrected code" : "AI output"}
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 font-mono text-xs leading-5 text-slate-700">
                    {result.content}
                  </pre>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default SmartCompiler;
