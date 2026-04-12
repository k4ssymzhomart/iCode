import React, { useState, useEffect } from "react";
import { Play, Pause, StopCircle, RefreshCw, Hash, Users, AlertCircle, Clock, Activity } from "lucide-react";

interface TopStripProps {
  sessionCode: string;
  topic: string;
  totalStudents: number;
  activeCount: number;
  stuckCount: number;
  helpCount: number;
  avgTime: string;
}

const TopStrip: React.FC<TopStripProps> = ({ sessionCode, topic, totalStudents, activeCount, stuckCount, helpCount, avgTime }) => {
  const [sessionState, setSessionState] = useState<"live" | "paused" | "ended">("live");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (sessionState !== "live") return;
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [sessionState]);

  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');

  return (
    <div className="bg-white border-b-2 border-[#11110f] flex flex-col md:flex-row items-stretch shrink-0">
      
      {/* Session Info & Controls */}
      <div className="flex md:w-1/3 border-b-2 md:border-b-0 md:border-r-2 border-[#11110f]">
         <div className="p-4 flex flex-col justify-center flex-1">
            <h1 className="text-xl font-black uppercase tracking-tight text-[#11110f] truncate">{topic}</h1>
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
         </div>
         <div className="flex flex-col border-l-2 border-[#11110f] shrink-0 w-16">
            <button onClick={() => setSessionState("live")} disabled={sessionState === "live"} className={`flex-1 flex justify-center items-center border-b-2 border-[#11110f] ${sessionState === 'live' ? 'bg-[#ccff00]' : 'bg-white hover:bg-gray-50'} transition-colors`}>
               <Play className="w-5 h-5 fill-[#11110f]" />
            </button>
            <button onClick={() => setSessionState("paused")} disabled={sessionState === "ended"} className={`flex-1 flex justify-center items-center border-b-2 border-[#11110f] ${sessionState === 'paused' ? 'bg-orange-200' : 'bg-white hover:bg-gray-50'} transition-colors`}>
               <Pause className="w-5 h-5 fill-[#11110f]" />
            </button>
            <button onClick={() => setSessionState("ended")} className={`flex-1 flex justify-center items-center ${sessionState === 'ended' ? 'bg-rose-200' : 'bg-white hover:bg-gray-50'} transition-colors`}>
               <StopCircle className="w-5 h-5 text-rose-600" />
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
            <span className="text-xl font-black text-[#11110f] font-mono">{avgTime}</span>
         </div>
      </div>

    </div>
  );
};

export default TopStrip;
