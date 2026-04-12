import React, { useState, useMemo } from "react";
import { StudentData } from "./mockData";
import { Search, Filter, AlertTriangle, MonitorPlay, CheckCircle2 } from "lucide-react";

interface ClassroomGridProps {
  students: StudentData[];
  onSelectStudent: (student: StudentData) => void;
}

const ClassroomGrid: React.FC<ClassroomGridProps> = ({ students, onSelectStudent }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "needs-help" | "stuck" | "solved">("all");

  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        if (filter !== "all" && s.status !== filter) return false;
        if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const priority = { "needs-help": 4, "stuck": 3, "coding": 2, "solved": 1, "offline": 0 };
        return priority[b.status] - priority[a.status];
      });
  }, [students, search, filter]);

  return (
    <div className="flex flex-col h-full bg-[#fafafa]">
      
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 border-b-2 border-[#11110f] bg-white shrink-0">
         <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#11110f]" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-9 pr-4 py-2 border-2 border-[#11110f] bg-[#fafafa] font-bold text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-[#ccff00] transition-shadow placeholder:text-gray-400 text-[#11110f]"
            />
         </div>
         <div className="flex gap-2">
            <button onClick={() => setFilter("all")} className={`px-3 py-2 border-2 border-[#11110f] text-xs font-bold uppercase tracking-widest transition-colors ${filter === 'all' ? 'bg-[#11110f] text-white' : 'bg-white text-[#11110f] hover:bg-gray-100'}`}>All</button>
            <button onClick={() => setFilter("needs-help")} className={`px-3 py-2 border-2 border-yellow-500 text-xs font-bold uppercase tracking-widest transition-colors ${filter === 'needs-help' ? 'bg-yellow-400 text-[#11110f]' : 'bg-white text-yellow-600 hover:bg-yellow-50'}`}>Requests</button>
            <button onClick={() => setFilter("stuck")} className={`px-3 py-2 border-2 border-transparent text-xs font-bold uppercase tracking-widest transition-colors ${filter === 'stuck' ? 'bg-rose-500 text-white border-rose-500' : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200'}`}>Stuck</button>
         </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 relative">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStudents.map((student) => {
              
              let statusStyle = "border-[#11110f] bg-white text-[#11110f]";
              let icon = <MonitorPlay className="w-4 h-4 text-sky-500" />;
              let statusText = "Coding";
              
              if (student.status === "needs-help") {
                statusStyle = "border-yellow-400 bg-yellow-50 text-yellow-900 ring-2 ring-yellow-400 shadow-[4px_4px_0_theme(colors.yellow.400)]";
                icon = <AlertTriangle className="w-4 h-4 fill-yellow-400 text-yellow-900" />;
                statusText = "Needs Help";
              } else if (student.status === "stuck") {
                statusStyle = "border-rose-400 bg-rose-50 text-rose-900 shadow-[4px_4px_0_theme(colors.rose.400)]";
                icon = <AlertTriangle className="w-4 h-4 text-rose-600" />;
                statusText = "Stuck";
              } else if (student.status === "solved") {
                statusStyle = "border-[#ccff00] bg-white text-[#11110f] shadow-[4px_4px_0_theme(colors.gray.200)]";
                icon = <CheckCircle2 className="w-4 h-4 text-[#ccff00]" />;
                statusText = "Solved";
              } else {
                statusStyle += " hover:-translate-y-0.5 hover:shadow-[4px_4px_0_theme(colors.gray.300)]";
              }

              return (
                <div 
                  key={student.id} 
                  onClick={() => onSelectStudent(student)}
                  className={`border-2 flex p-4 cursor-pointer transition-all duration-200 items-center justify-between ${statusStyle}`}
                >
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${student.avatarColor} border-2 border-[#11110f] flex-shrink-0`} style={{
                         borderRadius: student.avatarShape === 'circle' ? '50%' : student.avatarShape === 'triangle' ? '0' : '20%',
                      }} />
                      <div className="flex flex-col">
                        <h3 className="font-bold text-base leading-tight text-[#11110f] truncate max-w-[140px]">{student.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {icon}
                          <span className="text-[10px] font-black uppercase tracking-widest">{statusText}</span>
                        </div>
                      </div>
                   </div>
                </div>
              );
            })}
         </div>

         {filteredStudents.length === 0 && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6 text-center">
              <span className="font-bold text-gray-400 uppercase tracking-widest border-2 border-dashed border-gray-300 p-8">No students matching criteria</span>
           </div>
         )}
      </div>
    </div>
  );
};

export default ClassroomGrid;
