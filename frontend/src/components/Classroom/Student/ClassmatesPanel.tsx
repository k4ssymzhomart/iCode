import React from "react";
import { mockLeaderboard, avatarOptions } from "./mockData";
import { User, Clock, Target, CheckCircle2, AlertTriangle, MonitorPlay } from "lucide-react";

const ClassmatesPanel: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12 w-full text-sans font-sans">
      {mockLeaderboard.map((entry) => {
        const avatar = avatarOptions.find((a) => a.id === entry.avatarId) || avatarOptions[0];
        
        let statusObj = { text: "Undefined", color: "bg-gray-200", border: "border-gray-200", icon: <User className="w-4 h-4" /> };
        if (entry.status === "coding") {
           statusObj = { text: "Coding", color: "bg-sky-100", border: "border-sky-300", icon: <MonitorPlay className="w-3 h-3" /> };
        } else if (entry.status === "stuck") {
           statusObj = { text: "Stuck", color: "bg-rose-100", border: "border-rose-300", icon: <AlertTriangle className="w-3 h-3 text-rose-600" /> };
        } else if (entry.status === "solved") {
           statusObj = { text: "Solved", color: "bg-[#ccff00]", border: "border-[#11110f]", icon: <CheckCircle2 className="w-3 h-3 text-[#11110f]" /> };
        }

        return (
          <div key={entry.userId} className={`bg-white border-2 flex flex-col p-4 shadow-[4px_4px_0_#11110f] transition-transform hover:-translate-y-1 ${entry.isMe ? "border-[#ccff00]" : "border-[#11110f]"}`}>
             <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 ${avatar.color} border-2 border-[#11110f] shrink-0`} style={{
                  borderRadius: avatar.shape === 'circle' ? '50%' : 
                               avatar.shape === 'triangle' ? '0' : // simplified triangle
                               avatar.shape === 'square' ? '0' : '20%',
                  clipPath: avatar.shape === 'triangle' ? 'polygon(50% 10%, 0% 100%, 100% 100%)' :
                            avatar.shape === 'hexagon' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : 'none'
                }} />
                <div>
                  <h4 className="text-sm font-black text-[#11110f] uppercase tracking-wide leading-none">{entry.name}</h4>
                  <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 mt-1.5 border leading-none text-[9px] font-bold uppercase tracking-widest text-[#11110f] ${statusObj.color} ${statusObj.border}`}>
                     {statusObj.icon}
                     {statusObj.text}
                  </div>
                </div>
             </div>

             <div className="border-t-2 border-gray-100 pt-3 mt-auto space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-[#666259]">
                   <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#11110f]" /> Time</span>
                   <span className="font-mono text-[#11110f]">{entry.timeSpent}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-[#666259]">
                   <span className="flex items-center gap-1"><Target className="w-3 h-3 text-[#11110f]" /> Attempts</span>
                   <span className="font-mono text-[#11110f]">{entry.attempts}</span>
                </div>
             </div>
          </div>
        );
      })}
    </div>
  );
};

export default ClassmatesPanel;
