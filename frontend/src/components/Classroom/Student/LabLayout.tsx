import React, { useState, useEffect } from "react";
import { Maximize2, Minimize2, Clock, Users, HelpCircle, Activity, MessageSquareText, ChevronDown, ChevronUp } from "lucide-react";
import type { ResolvedHelpResponse } from "@shared/types";

interface LabLayoutProps {
  sessionCode: string;
  sessionTitle?: string;
  sessionTopic?: string;
  nickname: string;
  avatarId: string;
  classmatesCount: number;
  helpState: "idle" | "requesting" | "requested" | "resolved";
  onRequestHelp: () => void;
  broadcastMessage?: string | null;
  pinnedHint?: string | null;
  resolvedHelpResponse?: ResolvedHelpResponse | null;
  currentTaskTitle?: string;
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  classmatesPanel: React.ReactNode;
}

const LabLayout: React.FC<LabLayoutProps> = ({
  sessionCode,
  sessionTitle,
  sessionTopic,
  nickname,
  avatarId,
  classmatesCount,
  helpState,
  onRequestHelp,
  broadcastMessage,
  pinnedHint,
  resolvedHelpResponse,
  currentTaskTitle,
  leftPanel,
  centerPanel,
  rightPanel,
  classmatesPanel
}) => {
  const [focusMode, setFocusMode] = useState(false);
  const [showClassmates, setShowClassmates] = useState(false);
  const [showTeacherResponse, setShowTeacherResponse] = useState(false);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('toggle-header', { detail: focusMode }));
    return () => {
      window.dispatchEvent(new CustomEvent('toggle-header', { detail: false }));
    }
  }, [focusMode]);

  useEffect(() => {
    if (resolvedHelpResponse) {
      setShowTeacherResponse(true);
    }
  }, [resolvedHelpResponse?.requestId]);
  
  // Fake Timer logic
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');
  const helpButtonDisabled = helpState === "requesting" || helpState === "requested";
  const helpLabel =
    helpState === "idle"
      ? "Request Help"
      : helpState === "requesting"
        ? "Notifying..."
        : helpState === "requested"
          ? "Teacher Notified"
          : "Request Again";

  return (
    <div className="flex h-screen flex-col bg-[#11110f] font-sans selection:bg-[#ccff00] selection:text-black overflow-hidden relative">
      
      {/* Top Bar */}
      <div className="h-14 bg-white border-b-2 border-[#11110f] flex items-center justify-between px-4 z-30 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-[#ccff00] border-2 border-[#11110f] px-3 py-1 text-sm font-black text-[#11110f] uppercase tracking-widest shadow-[2px_2px_0_#11110f]">
            {sessionCode}
          </div>
          <div className="hidden min-w-0 md:block">
            <div className="truncate text-sm font-black uppercase tracking-wider text-[#11110f]">
              {sessionTitle || "Student Lab"}
            </div>
            {sessionTopic ? (
              <div className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                {sessionTopic}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Classmates Toggle */}
          <button 
             onClick={() => setShowClassmates(!showClassmates)}
             className={`flex items-center gap-2 px-3 py-1.5 border-2 text-xs font-bold uppercase tracking-wider transition-all ${
               showClassmates ? "bg-[#11110f] border-[#11110f] text-[#ccff00]" : "bg-white border-[#11110f] text-[#11110f] hover:bg-gray-100"
             }`}
          >
            <Users className="h-4 w-4" />
            Class ({classmatesCount})
          </button>
          
          <div className="border-l-2 border-[#11110f] h-6 mx-2"></div>

          {/* Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-2 border-[#11110f] bg-[#fafafa] text-sm font-mono font-bold text-[#11110f]">
            <Clock className="w-4 h-4 text-gray-500" />
            {mins}:{secs}
          </div>

          <div className="border-l-2 border-[#11110f] h-6 mx-2"></div>

          {/* Request Help */}
          <button 
            onClick={onRequestHelp}
            disabled={helpButtonDisabled}
            className={`flex items-center gap-2 px-3 py-1.5 border-2 text-xs font-bold uppercase tracking-wider transition-all ${
              helpState === "idle"
                ? "bg-white border-[#11110f] text-rose-600 hover:bg-rose-50"
                : helpState === "requesting"
                  ? "bg-yellow-300 border-[#11110f] text-[#11110f]"
                  : helpState === "requested"
                    ? "bg-[#11110f] border-[#11110f] text-[#ccff00]"
                    : "bg-[#ccff00] border-[#11110f] text-[#11110f] hover:bg-[#bdf300]"
            }`}
          >
            {helpState === "requesting" ? (
              <Activity className="h-4 w-4 animate-spin text-[#11110f]" />
            ) : (
              <HelpCircle className="h-4 w-4" />
            )}
            {helpLabel}
          </button>

          {/* Focus Mode Toggle */}
          <button
            onClick={() => setFocusMode(!focusMode)}
            className="flex items-center justify-center p-1.5 ml-2 border-2 border-[#11110f] text-[#11110f] hover:bg-gray-100 transition-colors bg-white"
            title="Toggle Focus Mode"
          >
            {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {(broadcastMessage || pinnedHint) && (
        <div className="z-20 flex flex-wrap items-stretch gap-2 border-b-2 border-[#11110f] bg-[#fafafa] px-4 py-2">
          {broadcastMessage ? (
            <div className="border-2 border-[#11110f] bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#11110f] shadow-[2px_2px_0_#11110f]">
              Teacher Broadcast: {broadcastMessage}
            </div>
          ) : null}
          {pinnedHint ? (
            <div className="border-2 border-[#11110f] bg-[#ccff00] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#11110f] shadow-[2px_2px_0_#11110f]">
              Pinned Hint: {pinnedHint}
            </div>
          ) : null}
        </div>
      )}

      {resolvedHelpResponse ? (
        <div className="z-20 border-b-2 border-[#11110f] bg-white px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 border-2 border-[#11110f] bg-[#ccff00] px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#11110f] shadow-[2px_2px_0_#11110f]">
              <MessageSquareText className="h-4 w-4" />
              Teacher Response Ready
            </div>

            <button
              type="button"
              onClick={() => setShowTeacherResponse((current) => !current)}
              className="inline-flex items-center gap-2 border-2 border-[#11110f] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f] shadow-[2px_2px_0_#11110f]"
            >
              {showTeacherResponse ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showTeacherResponse ? "Hide Response" : "Show Response"}
            </button>
          </div>

          {showTeacherResponse ? (
            <div className="mt-3 border-2 border-[#11110f] bg-[#fafafa] p-4 shadow-[4px_4px_0_rgba(17,17,15,0.08)]">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                <span>Resolved for {currentTaskTitle || "Current Task"}</span>
                <span className="h-1 w-1 rounded-full bg-gray-400" />
                <span>{new Date(resolvedHelpResponse.resolvedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>

              <div className="space-y-3">
                {resolvedHelpResponse.notes.length > 0 ? (
                  resolvedHelpResponse.notes.map((note, index) => (
                    <div key={note.id} className="border-2 border-[#11110f] bg-white p-3">
                      <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        Teacher Note {index + 1}
                      </div>
                      <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-[#11110f]">
                        {note.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="border-2 border-dashed border-gray-300 bg-white p-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                    Teacher marked this help request as resolved.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Main Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col md:flex-row bg-[#fafafa] p-2 gap-2">
        
        {/* Left Panel - Task Panel */}
        <div 
          className={`flex-shrink-0 transition-all duration-300 ease-in-out border-2 border-[#11110f] bg-white overflow-hidden ${
            focusMode ? "w-0 border-0 opacity-0" : "w-full md:w-[25%] lg:w-[22%] opacity-100"
          }`}
        >
          <div className="min-w-[280px] h-full overflow-hidden">
            {leftPanel}
          </div>
        </div>

        {/* Center Panel - Editor */}
        <div className="flex-1 transition-all duration-300 border-2 border-[#11110f] bg-white overflow-hidden">
          {centerPanel}
        </div>

        {/* Right Panel - Compiler / AI */}
        <div 
          className={`flex-shrink-0 transition-all duration-300 border-2 border-[#11110f] bg-white overflow-hidden ${
            focusMode ? "w-0 border-0 opacity-0" : "w-full md:w-[35%] lg:w-[30%] opacity-100"
          }`}
        >
           <div className="min-w-[320px] h-full overflow-hidden">
             {rightPanel}
           </div>
        </div>

      </div>

      {/* Classmates Overlay */}
      {showClassmates && (
        <div className="absolute top-14 left-0 right-0 bottom-0 bg-white/60 backdrop-blur-sm z-40 flex justify-center p-6">
          <div className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
             <div className="flex justify-end mb-4">
                <button onClick={() => setShowClassmates(false)} className="bg-[#11110f] text-[#ccff00] px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-[#11110f] hover:bg-[#222]">
                  Close View
                </button>
             </div>
             {classmatesPanel}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabLayout;
