import React, { useEffect, useState } from "react";
import { Activity, Play, RefreshCcw, SearchCode, ShieldAlert, Zap } from "lucide-react";
import type { CompilerActionResponse, CompilerResponseSection } from "@shared/compiler";
import type { SessionConfig, Task } from "@shared/types";
import { supabase } from "@/lib/supabase";

interface ExecState {
  status: "idle" | "running" | "done";
  action?: "run" | "correct" | "explain";
  response?: CompilerActionResponse;
  error?: string;
}

interface StudentCompilerPanelProps {
  code: string;
  sessionId: string;
  taskId: string;
  task: Task;
  config: SessionConfig | null;
  broadcastMessage?: string | null;
  pinnedHint?: string | null;
}

const renderSection = (section: CompilerResponseSection) => {
  const useMono = section.kind === "code" || section.kind === "log";

  return (
    <div
      key={`${section.title}-${section.kind ?? "default"}`}
      className="border-2 border-[#11110f] bg-[#fafafa] p-3 shadow-[2px_2px_0_rgba(17,17,15,0.08)]"
    >
      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
        {section.title}
      </div>
      {useMono ? (
        <pre className="whitespace-pre-wrap break-words font-mono text-sm font-bold leading-relaxed text-[#11110f]">
          {section.content}
        </pre>
      ) : (
        <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-[#11110f]">
          {section.content}
        </div>
      )}
    </div>
  );
};

const StudentCompilerPanel: React.FC<StudentCompilerPanelProps> = ({
  code,
  sessionId,
  taskId,
  task,
  config,
}) => {
  const [execState, setExecState] = useState<ExecState>({ status: "idle" });
  const [latestOutputLog, setLatestOutputLog] = useState("");

  const allowRun = config?.allowRun !== false;
  const allowExplain = config?.allowExplain !== false;
  const allowCorrect = config?.allowCorrect !== false;

  useEffect(() => {
    setExecState({ status: "idle" });
    setLatestOutputLog("");
  }, [task.id]);

  const requestCompiler = async (
    action: "run" | "correct" | "explain",
  ): Promise<CompilerActionResponse> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch(`/api/compiler/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        sourceCode: code,
        sessionId,
        taskId,
        stdin: "",
        language: task.language,
        outputLog: latestOutputLog,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as CompilerActionResponse & {
      error?: string;
    };

    if (!response.ok) {
      throw new Error(data.error || `${action} request failed.`);
    }

    return data;
  };

  const runAction = async (action: "run" | "correct" | "explain") => {
    setExecState({ status: "running", action });

    try {
      const response = await requestCompiler(action);

      if (action === "run") {
        setLatestOutputLog(response.content ?? "");
      }

      setExecState({
        status: "done",
        action,
        response,
      });
    } catch (error) {
      setExecState({
        status: "done",
        action,
        error: error instanceof Error ? error.message : "Request failed.",
      });
    }
  };

  const retryClean = () => {
    setExecState({ status: "idle" });
    setLatestOutputLog("");
  };

  const runningLabel =
    execState.action === "run"
      ? "Executing code"
      : execState.action === "correct"
        ? "Preparing correction"
        : "Building explanation";

  return (
    <div className="h-full flex flex-col bg-[#fafafa]">
      <div className="border-b border-[#11110f] bg-[#11110f] px-4 py-3 shrink-0 flex items-center justify-between">
        <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <SearchCode className="h-4 w-4 text-[#ccff00]" />
          Terminal
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 p-4 shrink-0">
        <button
          onClick={() => void runAction("run")}
          disabled={!allowRun || execState.status === "running"}
          className={`flex flex-col items-center justify-center gap-2 p-3 border-2 border-[#11110f] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            allowRun
              ? "bg-[#ccff00] hover:bg-[#bdf300] hover:-translate-y-0.5 shadow-[2px_2px_0_#11110f] hover:shadow-[1px_1px_0_#11110f]"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          <Play className="h-5 w-5 fill-[#11110f] text-[#11110f]" />
          <span className="text-xs font-black uppercase tracking-widest">
            {allowRun ? "Execute" : "Run Locked"}
          </span>
        </button>

        <button
          onClick={() => void runAction("explain")}
          disabled={!allowExplain || execState.status === "running"}
          className={`flex flex-col items-center justify-center gap-2 p-3 border-2 border-[#11110f] transition-all ${
            allowExplain
              ? "bg-white hover:bg-gray-100 hover:-translate-y-0.5 shadow-[2px_2px_0_#11110f]"
              : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
          }`}
        >
          <Zap className={`h-5 w-5 ${allowExplain ? "text-[#11110f]" : "text-gray-400"}`} />
          <span className="text-xs font-black uppercase tracking-widest">Explain</span>
        </button>

        <button
          onClick={() => void runAction("correct")}
          disabled={!allowCorrect || execState.status === "running"}
          className={`flex flex-col items-center justify-center gap-2 p-3 border-2 border-[#11110f] transition-all ${
            allowCorrect
              ? "bg-[#11110f] text-[#ccff00] hover:bg-[#222] hover:-translate-y-0.5 shadow-[2px_2px_0_rgba(204,255,0,0.5)]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400 opacity-50"
          }`}
        >
          <ShieldAlert className="h-5 w-5" />
          <span className="text-xs font-black uppercase tracking-widest">
            {allowCorrect ? "Correct" : "Correct Locked"}
          </span>
        </button>

        <button
          onClick={retryClean}
          className="flex flex-col items-center justify-center gap-2 p-3 border-2 border-[#11110f] bg-white hover:bg-gray-100 hover:-translate-y-0.5 shadow-[2px_2px_0_#11110f] transition-all mt-2 col-span-2"
        >
          <RefreshCcw className="h-5 w-5 text-[#11110f]" />
          <span className="text-xs font-black uppercase tracking-widest">Clear Environment</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-white border-t-2 border-[#11110f] overflow-hidden">
        <div className="bg-gray-100 px-4 py-1 flex items-center justify-between border-b border-gray-200 shrink-0">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Output Log
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {task.language.toUpperCase()}
          </span>
        </div>

        <div className="flex-1 p-4 overflow-y-auto relative">
          {execState.status === "idle" && (
            <div className="h-full flex items-center justify-center font-bold text-gray-300">
              Awaiting Execution...
            </div>
          )}

          {execState.status === "running" && (
            <div className="h-full flex flex-col items-center justify-center text-[#11110f] gap-3">
              <Activity className="h-6 w-6 animate-[spin_2s_linear_infinite]" />
              <span className="font-bold text-xs uppercase tracking-widest">{runningLabel}</span>
            </div>
          )}

          {execState.status === "done" && (
            <div className="space-y-4">
              {execState.error ? (
                <div className="border-2 border-rose-300 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                  {execState.error}
                </div>
              ) : null}

              {execState.response ? (
                <>
                  <div className="inline-flex border-2 border-[#11110f] bg-[#ccff00] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]">
                    {execState.response.statusLabel}
                  </div>

                  {execState.response.sections?.length ? (
                    <div className="space-y-3">
                      {execState.response.sections.map((section) => renderSection(section))}
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap break-words font-mono text-sm font-bold leading-relaxed text-[#11110f]">
                      {execState.response.content}
                    </pre>
                  )}
                </>
              ) : null}

              {!execState.response && !execState.error ? (
                <div className="border-2 border-dashed border-gray-300 bg-[#fafafa] p-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                  No compiler output yet.
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCompilerPanel;
