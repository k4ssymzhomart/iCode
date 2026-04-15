import React, { useState, useEffect } from "react";
import { Play, Pause, StopCircle, RefreshCw, Hash, Users, AlertCircle, Clock, Activity, Loader2 } from "lucide-react";
import type { TeacherSession } from "@shared/types";

interface TopStripProps {
  sessionCode: string;
  topic: string;
  sessionState: TeacherSession["state"];
  startTime?: string;
  tasks?: Array<{ taskId: string; task: { title: string } }>;
  activeTaskId?: string;
  totalStudents: number;
  activeCount: number;
  stuckCount: number;
  helpCount: number;
  avgTime: string;
  onStateChange?: (state: TeacherSession["state"]) => void | Promise<void>;
  onRegenerateCode?: () => void | Promise<void>;
  onActiveTaskChange?: (taskId: string) => void | Promise<void>;
  onBroadcastMessage?: () => void | Promise<void>;
  onPinHint?: () => void | Promise<void>;
}

const TopStrip: React.FC<TopStripProps> = ({
  sessionCode,
  topic: initialTopic,
  sessionState,
  startTime,
  tasks,
  activeTaskId,
  totalStudents,
  activeCount,
  stuckCount,
  helpCount,
  avgTime,
  onStateChange,
  onRegenerateCode,
  onActiveTaskChange,
  onBroadcastMessage,
  onPinHint,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [topic, setTopic] = useState(initialTopic);
  const [isEditing, setIsEditing] = useState(false);
  const [actionStates, setActionStates] = useState<Record<string, boolean>>({});

  const handleAsyncAction = async (key: string, action?: () => void | Promise<void>) => {
    if (!action) return;
    setActionStates((prev) => ({ ...prev, [key]: true }));
    try {
      await action();
    } finally {
      setActionStates((prev) => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    if (!startTime || sessionState !== "live") return;
    const sync = () => {
      const nextElapsed = Math.max(
        0,
        Math.floor((Date.now() - new Date(startTime).getTime()) / 1000),
      );
      setElapsed(nextElapsed);
    };
    sync();
    const timer = setInterval(sync, 1000);
    return () => clearInterval(timer);
  }, [sessionState, startTime]);

  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');

  return (
    <div className="bg-white border-b-2 border-[#11110f] flex flex-col md:flex-row items-stretch shrink-0">
      
      {/* Session Info & Controls */}
      <div className="flex md:w-1/3 border-b-2 md:border-b-0 md:border-r-2 border-[#11110f]">
         <div className="p-4 flex flex-col justify-center flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                autoFocus
                className="text-xl font-black uppercase tracking-tight text-[#11110f] bg-transparent border-b-2 border-[#11110f] focus:outline-none w-full"
              />
            ) : (
              <h1 
                onDoubleClick={() => setIsEditing(true)} 
                className="text-xl font-black uppercase tracking-tight text-[#11110f] truncate cursor-pointer select-none hover:text-gray-600 transition-colors" 
                title="Double-click to edit topic"
              >
                {topic}
              </h1>
            )}
            <div className="flex items-center gap-3 mt-1">
               <span className="flex items-center gap-1 text-xs font-bold bg-[#ccff00] text-[#11110f] px-2 py-0.5 border border-[#11110f]">
                 <Hash className="w-3 h-3" /> {sessionCode}
               </span>
               <span className="flex items-center gap-1 text-xs font-mono font-bold text-gray-500">
                 <Clock className="w-3 h-3" /> {mins}:{secs}
               </span>
               <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border border-[#11110f] ${
                 sessionState === 'live' ? 'bg-[#11110f] text-[#ccff00]' : 
                 sessionState === 'paused' ? 'bg-orange-300 text-orange-900' : 'bg-gray-300 text-gray-600'
               }`}>
                 {sessionState}
               </span>
            </div>
            {tasks && tasks.length > 0 ? (
              <div className="mt-3 space-y-2">
                <select
                  value={activeTaskId}
                  onChange={(event) => onActiveTaskChange?.(event.target.value)}
                  className="w-full border-2 border-[#11110f] bg-[#fafafa] px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#11110f] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                >
                  {tasks.map((task) => (
                    <option key={task.taskId} value={task.taskId}>
                      {task.task.title}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAsyncAction('broadcast', onBroadcastMessage)}
                    disabled={actionStates['broadcast']}
                    className="flex justify-center items-center gap-2 border-2 border-[#11110f] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f] disabled:opacity-50"
                  >
                    {actionStates['broadcast'] && <Loader2 className="w-3 h-3 animate-spin" />}
                    Broadcast
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAsyncAction('pinHint', onPinHint)}
                    disabled={actionStates['pinHint']}
                    className="flex justify-center items-center gap-2 border-2 border-[#11110f] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f] disabled:opacity-50"
                  >
                    {actionStates['pinHint'] && <Loader2 className="w-3 h-3 animate-spin" />}
                    Pin Hint
                  </button>
                </div>
              </div>
            ) : null}
         </div>
         <div className="flex flex-col border-l-2 border-[#11110f] shrink-0 w-16">
            <button onClick={() => handleAsyncAction('state-live', () => onStateChange?.("live"))} disabled={sessionState === "live" || actionStates['state-live']} className={`flex-1 flex justify-center items-center border-b-2 border-[#11110f] ${sessionState === 'live' ? 'bg-[#ccff00]' : 'bg-white hover:bg-gray-50'} transition-colors disabled:opacity-50`}>
               {actionStates['state-live'] ? <Loader2 className="w-5 h-5 animate-spin text-[#11110f]" /> : <Play className="w-5 h-5 fill-[#11110f]" />}
            </button>
            <button onClick={() => handleAsyncAction('state-paused', () => onStateChange?.("paused"))} disabled={sessionState === "completed" || actionStates['state-paused']} className={`flex-1 flex justify-center items-center border-b-2 border-[#11110f] ${sessionState === 'paused' ? 'bg-orange-200' : 'bg-white hover:bg-gray-50'} transition-colors disabled:opacity-50`}>
               {actionStates['state-paused'] ? <Loader2 className="w-5 h-5 animate-spin text-[#11110f]" /> : <Pause className="w-5 h-5 fill-[#11110f]" />}
            </button>
            <button onClick={() => handleAsyncAction('state-completed', () => onStateChange?.("completed"))} disabled={actionStates['state-completed']} className={`flex-1 flex justify-center items-center ${sessionState === 'completed' ? 'bg-rose-200' : 'bg-white hover:bg-gray-50'} transition-colors disabled:opacity-50`}>
               {actionStates['state-completed'] ? <Loader2 className="w-5 h-5 animate-spin text-[#11110f]" /> : <StopCircle className="w-5 h-5 text-rose-600" />}
            </button>
         </div>
      </div>

      {/* Live Metrics */}
      <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 divide-x-2 divide-[#11110f] bg-[#fafafa]">
         <div className="p-3 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><Users className="w-3 h-3" /> Active</span>
            <span className="text-2xl font-black text-[#11110f] font-mono">{activeCount}<span className="text-sm text-gray-400">/{totalStudents}</span></span>
         </div>
         <div className={`p-3 flex flex-col justify-center transition-colors ${helpCount > 0 ? 'bg-yellow-200' : ''}`}>
            <span className="text-[10px] font-bold text-[#11110f] uppercase tracking-widest flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Help Queue</span>
            <span className="text-2xl font-black text-[#11110f] font-mono">{helpCount}</span>
         </div>
         <div className={`p-3 flex flex-col justify-center transition-colors ${stuckCount > 0 ? 'bg-rose-200' : ''}`}>
            <span className="text-[10px] font-bold text-[#11110f] uppercase tracking-widest flex items-center gap-1"><Activity className="w-3 h-3" /> Stuck</span>
            <span className="text-2xl font-black text-[#11110f] font-mono">{stuckCount}</span>
         </div>
         <div className="p-3 flex flex-col justify-center bg-[#ccff00]">
            <span className="text-[10px] font-bold text-[#11110f] uppercase tracking-widest flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Avg Time</span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xl font-black text-[#11110f] font-mono">{avgTime}</span>
              <button
                type="button"
                disabled={actionStates['regenCode']}
                onClick={() => handleAsyncAction('regenCode', onRegenerateCode)}
                className="flex items-center gap-1 border-2 border-[#11110f] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f] disabled:opacity-50"
              >
                {actionStates['regenCode'] && <Loader2 className="w-3 h-3 animate-spin" />}
                New Code
              </button>
            </div>
         </div>
      </div>

    </div>
  );
};

export default TopStrip;
