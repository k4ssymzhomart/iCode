import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Save,
  SquareTerminal,
  Activity,
  Terminal,
  History,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  X,
  Code
} from "lucide-react";
import type { CompilerActionResponse, CompilerHistoryEntry } from "@shared/compiler";
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
    return "border-[rgba(17,17,15,0.1)] bg-white text-[#11110f]";
  }
  if (statusLabel === "Code corrected" || statusLabel === "AI output") {
    return "border-[#11110f] bg-[#ccff00] text-[#11110f]";
  }
  return "border-[rgba(17,17,15,0.1)] bg-white text-[#11110f]";
};

const placeboMessages = [
  "Initializing process...",
  "Allocating resources...",
  "Parsing source code...",
  "Building bytecode...",
  "Analyzing dependencies...",
  "Invoking compiler...",
  "Resolving logic...",
  "Verifying outputs...",
];

const SmartCompiler = () => {
  const [code, setCode] = useState(defaultCode);
  const [stdin, setStdin] = useState("");
  const [result, setResult] = useState<CompilerActionResponse | null>(null);
  const [pendingAction, setPendingAction] = useState<"run" | "correct" | null>(null);
  const [screenReady, setScreenReady] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  
  const [loadingText, setLoadingText] = useState("");

  const [consoleHeight, setConsoleHeight] = useState(250);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<CompilerHistoryEntry[]>([]);

  const [showInputModal, setShowInputModal] = useState(false);
  const [pendingInputRun, setPendingInputRun] = useState<"run" | "correct" | null>(null);
  const [localModalStdin, setLocalModalStdin] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pendingAction) {
      let step = 0;
      setLoadingText(placeboMessages[0]);
      interval = setInterval(() => {
        step = (step + 1) % placeboMessages.length;
        setLoadingText(placeboMessages[step]);
      }, 350);
    }
    return () => clearInterval(interval);
  }, [pendingAction]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY - 40;
      if (newHeight >= 50 && newHeight <= window.innerHeight * 0.7) {
        setConsoleHeight(newHeight);
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const draft = loadCompilerDraft();
    const loadedHistory = loadCompilerHistory();
    const latestSave = loadedHistory.find((entry) => entry.action === "save");

    setCode(draft?.code ?? defaultCode);
    setStdin(loadCompilerStdin());
    setHistoryItems(loadedHistory);
    setLastSavedAt(draft?.updatedAt ?? latestSave?.createdAt ?? null);
    setScreenReady(true);
  }, []);

  const pushHistory = (entry: CompilerHistoryEntry) => {
    appendCompilerHistory(entry);
    setHistoryItems((prev) => [entry, ...prev].slice(0, 16));
  };

  const statusChip = result
    ? { label: result.statusLabel, tone: statusTone(result.statusLabel) }
    : { label: "Ready", tone: statusTone(undefined) };

  const handleSaveDraft = () => {
    const savedAt = saveCompilerDraft(code);
    setLastSavedAt(savedAt);
    setActionError(null);
    pushHistory({
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `save-${Date.now()}`,
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

  const executeAction = async (action: "run" | "correct", effectiveStdin: string) => {
    setPendingAction(action);
    setActionError(null);
    if (!isConsoleOpen) setIsConsoleOpen(true);

    try {
      const response = await fetchJson<CompilerActionResponse>(`/api/compiler/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceCode: code, stdin: effectiveStdin }),
      });

      if (action === "correct" && response.correctedCode) {
        setCode(response.correctedCode);
      }

      setResult(response);
      pushHistory({
        id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${action}-${Date.now()}`,
        action,
        verdict: "success",
        statusLabel: response.statusLabel,
        title: response.statusLabel,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : `The ${action} request failed.`);
      setResult(null);
    } finally {
      setPendingAction(null);
    }
  };

  const handleActionClick = (action: "run" | "correct") => {
    const hasInputCall = /\binput\s*\(/.test(code) || /sys\.stdin\.read/.test(code);
    if (hasInputCall && !stdin.trim()) {
      setPendingInputRun(action);
      setLocalModalStdin("");
      setShowInputModal(true);
      return;
    }
    executeAction(action, stdin);
  };

  const handleStdinChange = (value: string) => {
    setStdin(value);
    saveCompilerStdin(value);
  };

  if (!screenReady) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-[#fafafa]">
        <div className="flex items-center gap-3 rounded-none border-2 border-[#11110f] bg-white px-6 py-4 text-sm font-semibold text-[#11110f] shadow-[4px_4px_0_#ccff00]">
          <Activity className="h-5 w-5 animate-pulse text-[#11110f]" />
          Loading environment...
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] bg-[#fafafa] p-4 text-[#11110f] font-sans overflow-hidden relative selection:bg-[#ccff00] selection:text-black">
      <div className="flex h-full flex-col border border-[#11110f] bg-white relative overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="border-b border-[#11110f] bg-white px-4 py-3 relative z-20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="text-lg font-bold uppercase tracking-tight text-[#11110f] flex items-center gap-2">
                <Code className="h-5 w-5" />
                Smart Editor
              </div>
              <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 border-l border-gray-200">
                <span className="bg-[#ccff00] text-[#11110f] px-2 py-0.5 border border-[#11110f] font-semibold">
                  PYTHON
                </span>
                <span className="text-[#666259]">
                  {formatDate(lastSavedAt)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className={`border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${statusChip.tone}`}>
                {statusChip.label}
              </span>

              <button
                onClick={() => handleActionClick("run")}
                disabled={pendingAction !== null}
                className="inline-flex items-center gap-2 rounded-none border-2 border-[#11110f] bg-[#ccff00] px-5 py-2 text-sm font-semibold text-[#11110f] transition hover:bg-[#bdf300] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pendingAction === "run" ? <Activity className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run
              </button>

              <button
                onClick={() => handleActionClick("correct")}
                disabled={pendingAction !== null}
                className="inline-flex items-center gap-2 rounded-none border-2 border-[#11110f] bg-[#11110f] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pendingAction === "correct" ? <Activity className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Fix with AI
              </button>

              <div className="flex items-center border-l border-gray-200 pl-3 gap-2">
                <button
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-2 rounded-none border-2 border-[#11110f] bg-white px-3 py-2 text-sm font-semibold text-[#11110f] transition hover:bg-gray-50"
                  title="Save Draft"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-none border-2 border-[#11110f] bg-white px-3 py-2 text-sm font-semibold text-[#11110f] transition hover:bg-gray-50"
                  title="Reset to default code"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className={`inline-flex items-center gap-2 rounded-none border-2 border-[#11110f] px-3 py-2 text-sm font-semibold transition ${isHistoryOpen ? "bg-[#ccff00] text-[#11110f]" : "bg-white text-[#11110f] hover:bg-gray-50"}`}
                  title="Execution History"
                >
                  <History className="h-4 w-4" />
                  History
                </button>
              </div>
            </div>
          </div>
        </div>

        {actionError && (
          <div className="border-b border-[#11110f] bg-red-50 px-4 py-2 text-sm text-red-900 relative z-20">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              {actionError}
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden relative border-t-[1px] border-[transparent]">
          {/* Main Editor */}
          <div className="flex-1 flex flex-col min-w-0 bg-white relative">
            <div className="flex-1 relative">
              <Editor
                path="smart-compiler/main.py"
                language="python"
                value={code}
                onChange={(value) => setCode(value ?? "")}
                theme="vs"
                loading={<div className="text-[#11110f] text-sm font-mono p-4">Loading environment...</div>}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbersMinChars: 4,
                  scrollBeyondLastLine: true,
                  automaticLayout: true,
                  smoothScrolling: true,
                  wordWrap: "on",
                  padding: { top: 16, bottom: 16 },
                  renderLineHighlight: "all",
                  roundedSelection: false,
                  overviewRulerBorder: false,
                  cursorBlinking: "solid",
                }}
              />
              {/* Placebo Loading Mask */}
              {pendingAction && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                   <div className="bg-[#11110f] border border-gray-800 p-6 shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">
                      <Activity className="h-8 w-8 text-[#ccff00] animate-pulse mb-4" />
                      <div className="font-mono text-sm uppercase tracking-wider text-[#ccff00] font-semibold">
                         Working
                      </div>
                      <div className="mt-2 text-gray-400 font-mono text-xs w-full bg-black/50 border border-[#333] p-2 overflow-hidden h-8 flex items-center">
                        {loadingText}
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Bottom Panel Toggle & Draggable Resizer */}
            <div className="flex items-center justify-between border-t border-[#11110f] bg-gray-50 px-4 py-1.5 shrink-0 z-20">
               <button
                 onClick={() => setIsConsoleOpen(prev => !prev)}
                 className="flex items-center gap-1.5 text-xs font-semibold text-[#11110f] hover:text-gray-600 focus:outline-none uppercase tracking-wider"
               >
                 {isConsoleOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                 Console Output
               </button>
               <div
                 className="w-16 h-1.5 bg-gray-300 hover:bg-[#ccff00] cursor-row-resize rounded-full transition-colors flex items-center justify-center"
                 onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
               />
            </div>

            {/* Console Pane */}
            {isConsoleOpen && (
              <div style={{ height: `${consoleHeight}px` }} className="flex flex-col bg-white shrink-0 max-h-[85vh]">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#11110f] border-b border-[#11110f] px-3 py-2 shrink-0">
                    {result?.action === "correct" ? <CheckCircle2 className="h-4 w-4 text-[#ccff00]" /> : <SquareTerminal className="h-4 w-4 text-[#ccff00]" />}
                    {result?.action === "correct" ? "Fix Log" : "Console Output"}
                  </div>

                  <div className="flex-1 p-0 overflow-auto relative bg-[#fafafa]">
                    {!result ? (
                      <div className="flex h-full items-center justify-center p-6 text-sm font-mono text-gray-400 font-semibold">
                        Awaiting execution...
                      </div>
                    ) : (
                      <div className="h-full flex flex-col">
                        {result.action === "correct" && (
                          <div className="border-b border-[#11110f] bg-[#ccff00] px-4 py-2 text-sm font-medium tracking-tight text-[#11110f] shrink-0">
                            Correction applied to editor.
                          </div>
                        )}
                        <pre className="flex-1 overflow-auto whitespace-pre-wrap px-4 py-3 font-mono text-sm leading-6 text-[#11110f] bg-white m-0">
                          {result.content || "Program exited with no output."}
                        </pre>
                      </div>
                    )}
                  </div>
              </div>
            )}
          </div>

          {/* History Sidebar Panel */}
          {isHistoryOpen && (
            <div className="w-80 border-l border-[#11110f] bg-white flex flex-col shrink-0 absolute right-0 top-0 bottom-0 z-30 shadow-2xl">
               <div className="bg-[#11110f] text-white px-4 py-3 border-b border-[#11110f] flex justify-between items-center text-sm font-semibold uppercase tracking-wider shrink-0">
                 <div className="flex items-center gap-2">
                   <History className="h-4 w-4 text-[#ccff00]" />
                   History Log
                 </div>
                 <button onClick={() => setIsHistoryOpen(false)} className="hover:text-[#ccff00] transition-colors p-1">
                   <X className="h-4 w-4" />
                 </button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                 {historyItems.length === 0 ? (
                   <p className="text-gray-400 text-sm font-mono text-center mt-10">No history yet.</p>
                 ) : (
                   historyItems.map((item) => (
                     <div key={item.id} className="bg-white border border-gray-200 p-3 shadow-sm hover:border-[#11110f] transition-all cursor-default">
                       <div className="flex items-center justify-between mb-2">
                         <span className={`text-xs font-semibold uppercase px-2 py-0.5 border ${item.action === 'correct' ? 'border-[#11110f] bg-[#11110f] text-[#ccff00]' : 'border-gray-200 bg-gray-100 text-[#11110f]'}`}>
                           {item.action}
                         </span>
                         <span className="text-[10px] text-gray-500 font-mono font-medium flex items-center gap-1">
                           <Clock className="w-3 h-3" />
                           {new Date(item.createdAt).toLocaleTimeString()}
                         </span>
                       </div>
                       <p className="text-sm font-medium text-[#11110f] leading-tight">
                         {item.title}
                       </p>
                     </div>
                   ))
                 )}
               </div>
            </div>
          )}
        </div>

        {/* Input Required Interception Modal */}
        {showInputModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/40 backdrop-blur-md shadow-2xl">
             <div className="bg-white border border-[#11110f] shadow-2xl max-w-md w-full m-auto flex flex-col p-6 animate-in slide-in-from-bottom-4 fade-in duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#ccff00] border border-[#11110f] flex items-center justify-center shrink-0">
                    <Info className="h-6 w-6 text-[#11110f]" />
                  </div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-[#11110f]">Input Required</h2>
                </div>
                
                <p className="text-[#666259] font-sans text-sm leading-relaxed mb-6 font-medium">
                  Your code uses <code className="bg-gray-100 px-1 py-0.5 border border-gray-300 text-black font-bold text-xs mx-0.5">input()</code>, but you haven't provided any Standard Input. Would you like to provide it now before running?
                </p>

                <textarea
                  value={localModalStdin}
                  onChange={(e) => setLocalModalStdin(e.target.value)}
                  placeholder="Enter inputs line by line..."
                  className="w-full h-32 resize-none bg-gray-50 border border-gray-300 p-3 font-mono text-sm focus:border-[#11110f] focus:outline-none focus:ring-1 focus:ring-[#11110f] transition-all mb-6 relative z-10"
                />

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowInputModal(false);
                      if (pendingInputRun) executeAction(pendingInputRun, stdin);
                    }}
                    className="flex-1 py-2 text-sm font-semibold uppercase transition-colors border-2 border-[#11110f] text-[#11110f] hover:bg-gray-50 bg-white"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => {
                      setShowInputModal(false);
                      handleStdinChange(localModalStdin);
                      if (pendingInputRun) executeAction(pendingInputRun, localModalStdin);
                    }}
                    disabled={!localModalStdin.trim()}
                    className="flex-1 py-2 text-sm font-semibold uppercase tracking-wider transition-colors border-2 border-[#11110f] bg-[#ccff00] text-[#11110f] hover:bg-[#bdf300] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SmartCompiler;
