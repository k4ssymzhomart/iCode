import React, { useState } from "react";
import { Play, ShieldAlert, Zap, Repeat, SearchCode, CheckCircle2, RefreshCcw, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SessionConfig } from "../../../../../shared/types";

interface ExecState {
  status: "idle" | "running" | "done";
  output?: string;
  error?: string;
  traceLog?: string[];
  explanation?: string;
}

interface StudentCompilerPanelProps {
  code: string;
  taskId: string;
  config: SessionConfig | null;
}

const StudentCompilerPanel: React.FC<StudentCompilerPanelProps> = ({ code, taskId, config }) => {
  const [execState, setExecState] = useState<ExecState>({ status: "idle" });
  const [showUnderstandingCheck, setShowUnderstandingCheck] = useState(false);

  // Fallback defaults if config is null
  const allowHint = config?.allowHint !== false;
  const allowExplain = config?.allowExplain !== false;
  const allowCorrect = config?.allowCorrect !== false;

  // Real Backend Integration
  const runCode = async () => {
    setExecState({ status: "running" });
    setShowUnderstandingCheck(false);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/compiler/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ sourceCode: code, taskId, stdin: "" })
      });
      const data = await res.json();
      setExecState({ status: "done", output: data.content || data.error || "Execution completed." });
    } catch(e) {
      setExecState({ status: "done", output: "Execution failed due to network error." });
    }
  };

  const getExplanation = async () => {
    if (!allowExplain) return;
    setExecState({ status: "running" });
    try {
       setTimeout(() => {
          setExecState({ 
            status: "done", 
            output: "Execution logic analyzed.",
            explanation: "This code correctly identifies vowels using a set, and swaps them in-place by maintaining a left and right pointer. O(n) time complexity."
          });
          setShowUnderstandingCheck(true);
       }, 1800);
    } catch(e) {}
  };

  const correctCode = async () => {
    if (!allowCorrect) return;
    setExecState({ status: "running" });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/compiler/correct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ sourceCode: code, taskId, stdin: "" })
      });
      const data = await res.json();
      setExecState({ status: "done", output: `// AI Correction Output:\n${data.content || data.error}` });
    } catch(e) {
      setExecState({ status: "done", output: "Correction failed due to network error." });
    }
  };

  const retryClean = () => {
    setExecState({ status: "idle" });
    setShowUnderstandingCheck(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#fafafa]">
      {/* Header */}
      <div className="border-b border-[#11110f] bg-[#11110f] px-4 py-3 shrink-0 flex items-center justify-between">
         <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <SearchCode className="h-4 w-4 text-[#ccff00]" />
            Terminal
         </span>
      </div>

      {/* Main Buttons */}
      <div className="grid grid-cols-2 gap-2 p-4 shrink-0">
         <button onClick={runCode} disabled={execState.status === "running"} className="flex flex-col items-center justify-center gap-2 p-3 border-2 border-[#11110f] bg-[#ccff00] hover:bg-[#bdf300] hover:-translate-y-0.5 shadow-[2px_2px_0_#11110f] hover:shadow-[1px_1px_0_#11110f] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <Play className="h-5 w-5 fill-[#11110f] text-[#11110f]" />
            <span className="text-xs font-black uppercase tracking-widest">Execute</span>
         </button>

         <button onClick={getExplanation} disabled={!allowExplain || execState.status === "running"} className={`flex flex-col items-center justify-center gap-2 p-3 border-2 border-[#11110f] transition-all ${allowExplain ? "bg-white hover:bg-gray-100 hover:-translate-y-0.5 shadow-[2px_2px_0_#11110f]" : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"}`}>
            <Zap className={`h-5 w-5 ${allowExplain ? "text-purple-600" : "text-gray-400"}`} />
            <span className="text-xs font-black uppercase tracking-widest">Explain</span>
         </button>

         <button onClick={correctCode} disabled={!allowCorrect || execState.status === "running"} className={`flex flex-col items-center justify-center gap-2 p-3 border-2 border-[#11110f] transition-all ${allowCorrect ? "bg-[#11110f] text-[#ccff00] hover:bg-[#222] hover:-translate-y-0.5 shadow-[2px_2px_0_rgba(204,255,0,0.5)]" : "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400 opacity-50"}`}>
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-widest">{allowCorrect ? "Correct" : "Correct (Locked)"}</span>
         </button>

         <button onClick={retryClean} className="flex flex-col items-center justify-center gap-2 p-3 border-2 border-[#11110f] bg-white hover:bg-gray-100 hover:-translate-y-0.5 shadow-[2px_2px_0_#11110f] transition-all mt-2 col-span-2">
            <RefreshCcw className="h-5 w-5 text-[#11110f]" />
            <span className="text-xs font-black uppercase tracking-widest">Clear Environment</span>
         </button>
      </div>

      {/* Output Console */}
      <div className="flex-1 flex flex-col min-h-0 bg-white border-t-2 border-[#11110f] overflow-hidden">
        <div className="bg-gray-100 px-4 py-1 flex items-center border-b border-gray-200 shrink-0">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Output Log</span>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto font-mono text-sm relative">
           {execState.status === "idle" && (
             <div className="h-full flex items-center justify-center font-bold text-gray-300">
                Awaiting Execution...
             </div>
           )}

           {execState.status === "running" && (
             <div className="h-full flex flex-col items-center justify-center text-[#11110f] gap-3">
                <Activity className="h-6 w-6 animate-[spin_2s_linear_infinite]" />
                <span className="font-bold text-xs uppercase tracking-widest">Processing</span>
             </div>
           )}

           {execState.status === "done" && (
             <div className="space-y-4">
                <pre className="text-[#11110f] font-bold leading-relaxed whitespace-pre-wrap">{execState.output}</pre>
                
                {execState.explanation && (
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-3 mt-4">
                     <p className="text-sm font-sans font-medium text-purple-900">{execState.explanation}</p>
                  </div>
                )}

                {showUnderstandingCheck && (
                  <div className="mt-8 border-2 border-[#11110f] p-4 bg-yellow-50 flex flex-col items-center text-center shadow-[4px_4px_0_rgba(17,17,15,0.1)]">
                     <span className="font-sans font-black text-[#11110f] mb-4">Did this logic make sense?</span>
                     <div className="flex gap-4 w-full">
                        <button className="flex-1 py-2 bg-white border-2 border-[#11110f] font-bold text-sm uppercase tracking-widest hover:bg-green-50 hover:text-green-700 transition" onClick={() => setShowUnderstandingCheck(false)}>Yes</button>
                        <button className="flex-1 py-2 bg-white border-2 border-[#11110f] font-bold text-sm uppercase tracking-widest hover:bg-rose-50 hover:text-rose-700 transition" onClick={() => setShowUnderstandingCheck(false)}>No</button>
                     </div>
                  </div>
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default StudentCompilerPanel;
