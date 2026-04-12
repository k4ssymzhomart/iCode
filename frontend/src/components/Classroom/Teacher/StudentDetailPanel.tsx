import React from "react";
import Editor from "@monaco-editor/react";
import { StudentData } from "./mockData";
import { X, SearchCode, MessageSquare, Lightbulb, PenTool, ExternalLink, ShieldAlert } from "lucide-react";

interface StudentDetailPanelProps {
  student: StudentData;
  onClose: () => void;
  onIntervene: (type: string, studentId: string) => void;
}

const StudentDetailPanel: React.FC<StudentDetailPanelProps> = ({ student, onClose, onIntervene }) => {
  return (
    <div className="absolute right-0 top-0 bottom-0 w-full md:w-[450px] bg-white border-l-2 border-[#11110f] shadow-[-10px_0_20px_rgba(0,0,0,0.05)] z-40 flex flex-col font-sans transition-transform transform translate-x-0">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b-2 border-[#11110f] bg-[#11110f] shrink-0">
         <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${student.avatarColor} border-2 border-white`} style={{
               borderRadius: student.avatarShape === 'circle' ? '50%' : student.avatarShape === 'triangle' ? '0' : '20%',
            }} />
            <h2 className="text-white font-black uppercase tracking-wider">{student.name}</h2>
         </div>
         <button onClick={onClose} className="p-1 hover:bg-[#222] transition-colors rounded-sm group">
            <X className="w-5 h-5 text-white group-hover:text-[#ccff00]" />
         </button>
      </div>

      {/* Code Area */}
      <div className="h-[40vh] border-b-2 border-[#11110f] shrink-0 relative bg-[#fafafa]">
         <div className="absolute top-0 left-0 right-0 px-3 py-1 bg-white border-b border-gray-200 z-10 flex justify-between items-center opacity-90">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
               <SearchCode className="w-3 h-3" /> Live Editor Preview
            </span>
            <span className="text-[10px] font-bold text-[#11110f] border border-[#11110f] bg-[#ccff00] px-1.5 uppercase tracking-widest">
               Read Only
            </span>
         </div>
         <Editor
           height="100%"
           language="python"
           value={student.mockCode}
           theme="vs"
           options={{
             readOnly: true,
             minimap: { enabled: false },
             scrollBeyondLastLine: false,
             fontSize: 12,
             fontFamily: "'Consolas', 'Courier New', monospace",
             padding: { top: 32, bottom: 16 },
             renderLineHighlight: "none",
           }}
         />
      </div>

      {/* Detail & Interventions */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#fafafa]">
         
         {/* Status / Errors */}
         {student.lastError && (
           <div className="border-2 border-rose-600 bg-rose-50 p-3 relative">
             <div className="absolute -top-3 left-2 bg-rose-600 text-white text-[10px] uppercase font-black tracking-widest px-2 py-0.5 border-2 border-rose-600">
               Last Error
             </div>
             <p className="mt-2 text-sm font-mono text-rose-900 font-bold whitespace-pre-wrap breakdown-words">
                {student.lastError}
             </p>
           </div>
         )}
         
         {student.status === "needs-help" && (
           <div className="border-2 border-yellow-500 bg-yellow-50 p-3 relative shadow-[4px_4px_0_theme(colors.yellow.400)]">
              <div className="flex items-center gap-2 mb-1">
                 <ShieldAlert className="w-4 h-4 fill-yellow-400 text-yellow-900" />
                 <span className="text-xs font-black uppercase tracking-widest text-yellow-900">Assistance Requested</span>
              </div>
              <p className="text-sm font-bold text-yellow-800">
                 Student initiated a manual help request.
              </p>
           </div>
         )}

         {/* Intervention Actions */}
         <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b-2 border-gray-200 pb-1">
               Direct Actions
            </h3>
            <div className="grid grid-cols-1 gap-2">
               <button onClick={() => onIntervene("join", student.id)} className="col-span-1 flex items-center justify-center gap-2 p-3 border-2 border-[#11110f] bg-[#ccff00] hover:bg-[#bdf300] shadow-[2px_2px_0_#11110f] transition-transform hover:translate-y-[-1px] font-black uppercase tracking-widest text-sm">
                  <ExternalLink className="w-5 h-5" /> Join Focus Mode
               </button>
               <button onClick={() => onIntervene("chat", student.id)} className="col-span-1 flex items-center justify-center gap-2 p-3 border-2 border-[#11110f] bg-white hover:bg-gray-100 font-bold uppercase tracking-widest text-xs mt-1 text-[#11110f] shadow-[2px_2px_0_#11110f]">
                  <MessageSquare className="w-5 h-5" /> Message Direct
               </button>
            </div>
         </div>

      </div>

    </div>
  );
};

export default StudentDetailPanel;
