import React from "react";
import { StudentData } from "./mockData";
import { AlertCircle, ChevronRight, ChevronLeft } from "lucide-react";

interface HelpAndStatsRailProps {
  students: StudentData[];
  onSelectStudent: (id: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const HelpAndStatsRail: React.FC<HelpAndStatsRailProps> = ({ students, onSelectStudent, isCollapsed, onToggle }) => {
  const helpQueue = students
    .filter(s => s.status === "needs-help")
    .sort((a, b) => {
      const timeA = a.helpRequestedAt ? a.helpRequestedAt.getTime() : 0;
      const timeB = b.helpRequestedAt ? b.helpRequestedAt.getTime() : 0;
      return timeA - timeB;
    });

  return (
    <div className={`flex flex-col bg-white border-l-2 border-[#11110f] transition-all duration-300 relative shrink-0 font-sans ${isCollapsed ? 'w-16' : 'w-80'}`}>
      
      {!isCollapsed ? (
        <div className="flex-1 flex flex-col overflow-y-auto bg-[#fafafa]">
           {/* Header with Toggle */}
           <div className="p-4 border-b-2 border-[#11110f] flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="font-black text-[#11110f] uppercase tracking-widest text-sm flex items-center gap-2">
                 <AlertCircle className="w-4 h-4 text-yellow-500" /> Help Queue
              </h3>
              <button onClick={onToggle} className="p-1 hover:bg-[#ccff00] border-2 border-transparent hover:border-[#11110f] transition-colors rounded-sm ml-2 outline-none">
                 <ChevronRight className="w-4 h-4 text-[#11110f]" />
              </button>
           </div>

           <div className="flex-1 p-4">
               {helpQueue.length === 0 ? (
                  <div className="text-sm font-bold text-gray-400 border-2 border-dashed border-gray-300 p-4 text-center">
                     Queue is empty
                  </div>
               ) : (
                  <div className="space-y-3">
                     {helpQueue.map(student => (
                       <div key={student.id} className="border-2 border-yellow-400 bg-yellow-50 p-3 shadow-[2px_2px_0_theme(colors.yellow.400)]">
                          <div className="flex justify-between items-start mb-2">
                             <span className="font-bold text-xs text-[#11110f]">{student.name}</span>
                             <span className="text-[9px] font-black uppercase text-yellow-800 bg-yellow-200 px-1 py-0.5 border border-yellow-400">
                                Waiting
                             </span>
                          </div>
                          <p className="text-[10px] uppercase font-bold text-gray-600 mb-3 truncate">
                             {student.currentTask}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                             <button onClick={() => onSelectStudent(student.id)} className="col-span-2 text-[10px] font-black uppercase tracking-widest bg-yellow-400 border-2 border-[#11110f] text-[#11110f] py-1 shadow-[1px_1px_0_#11110f] hover:-translate-y-[1px] hover:shadow-[2px_2px_0_#11110f] transition-all">
                                Select
                             </button>
                          </div>
                       </div>
                     ))}
                  </div>
               )}
           </div>
        </div>
      ) : (
        <div className="flex-1 bg-white flex flex-col items-center py-4 border-l border-transparent z-10">
           <button onClick={onToggle} className="bg-[#11110f] hover:bg-[#ccff00] text-white hover:text-[#11110f] border-2 border-[#11110f] p-2 transition-colors mb-4 outline-none">
              <ChevronLeft className="w-5 h-5" />
           </button>
           <div className="w-full flex justify-center py-4">
              <span className="[writing-mode:vertical-rl] font-black text-gray-400 tracking-widest uppercase text-sm transform rotate-180">
                 Help Queue ({helpQueue.length})
              </span>
           </div>
        </div>
      )}

    </div>
  );
};

export default HelpAndStatsRail;
