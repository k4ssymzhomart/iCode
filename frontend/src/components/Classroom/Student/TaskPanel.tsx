import React, { useState } from "react";
import { MockTask } from "./mockData";
import { Lightbulb, ListOrdered, ChevronRight, Activity, Terminal } from "lucide-react";

interface TaskPanelProps {
  task: MockTask;
}

const TaskPanel: React.FC<TaskPanelProps> = ({ task }) => {
  const [showLogicSteps, setShowLogicSteps] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  return (
    <div className="h-full flex flex-col bg-[#fafafa]">
      
      {/* Header */}
      <div className="border-b border-[#11110f] bg-[#11110f] px-4 py-3 shrink-0 flex items-center justify-between">
         <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#ccff00]" />
            Current Task
         </span>
         <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 ${
           task.difficulty === 'Easy' ? 'bg-[#ccff00] text-[#11110f]' : 
           task.difficulty === 'Medium' ? 'bg-orange-400 text-[#11110f]' : 'bg-rose-500 text-white'
         }`}>
           {task.difficulty}
         </span>
      </div>

      <div className="flex-1 overflow-y-auto w-full relative">
        <div className="p-4 space-y-6 lg:p-6">
          {/* Title & Desc */}
          <div>
            <h2 className="text-xl font-black text-[#11110f] tracking-tight mb-3">
              {task.title}
            </h2>
            <div className="text-sm font-medium text-[#666259] leading-relaxed">
              {task.description.split("`").map((part, i) => 
                 i % 2 === 1 ? <code key={i} className="bg-gray-200 text-[#11110f] px-1.5 py-0.5 text-xs font-mono font-bold mx-0.5">{part}</code> : part
              )}
            </div>
          </div>

          {/* Test cases */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#11110f] border-b border-gray-200 pb-2">
              Examples
            </h3>
            {task.tests.map((test, i) => (
              <div key={i} className="bg-white border-2 border-gray-200 p-3 space-y-2">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Input:</span>
                    <code className="text-sm font-mono text-[#11110f] font-bold">{test.input}</code>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Output:</span>
                    <code className="text-sm font-mono text-[#ccff00] bg-[#11110f] px-2 py-0.5 font-bold self-start mt-1">{test.expectedOutput}</code>
                 </div>
              </div>
            ))}
          </div>

          <hr className="border-t-2 border-gray-200 my-6" />

          {/* Smart Tooling */}
          <div className="space-y-3">
             <button className="w-full flex items-center justify-between border-2 border-[#11110f] bg-white px-4 py-3 hover:bg-gray-50 transition-colors">
                <span className="flex items-center gap-2 text-sm font-bold text-[#11110f] uppercase tracking-wider">
                   <Lightbulb className="h-4 w-4 text-orange-400" />
                   Show a Hint
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
             </button>

             <button 
                onClick={() => setShowLogicSteps(true)}
                className="w-full flex items-center justify-between border-2 border-[#11110f] bg-[#ccff00] px-4 py-3 hover:bg-[#bdf300] shadow-[2px_2px_0_#11110f] transition-transform hover:translate-y-[1px] hover:shadow-[1px_1px_0_#11110f]"
             >
                <span className="flex items-center gap-2 text-sm font-bold text-[#11110f] uppercase tracking-wider">
                   <ListOrdered className="h-4 w-4" />
                   Show Logic Steps
                </span>
                <ChevronRight className="h-4 w-4 text-[#11110f]" />
             </button>
          </div>
        </div>

        {/* Logic Steps Overlay */}
        <div className={`absolute inset-0 bg-white z-10 transition-transform duration-300 ${showLogicSteps ? "translate-x-0" : "translate-x-full"}`}>
           <div className="h-full flex flex-col bg-[#11110f]">
              <div className="bg-[#ccff00] px-4 py-3 flex items-center gap-2 shrink-0 cursor-pointer hover:bg-[#bdf300]" onClick={() => setShowLogicSteps(false)}>
                 <ChevronRight className="h-5 w-5 text-[#11110f] rotate-180" />
                 <span className="text-[#11110f] font-bold uppercase tracking-wider text-xs">Back to Task</span>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto">
                 <h2 className="text-xl font-black text-white tracking-tight mb-8 uppercase">
                   Logic Steps
                 </h2>
                 
                 <div className="space-y-6 relative border-l-2 border-gray-800 ml-4 pl-6">
                    {task.logicSteps.map((step, i) => (
                      <div key={step.id} className="relative">
                         {/* Circle indicator */}
                         <div className={`absolute -left-[35px] top-0 w-4 h-4 rounded-full border-2 border-[#11110f] transition-colors duration-500 mt-1 ${
                            i <= currentStepIndex ? "bg-[#ccff00]" : "bg-gray-800 border-gray-700"
                         }`} />
                         
                         <div className={`transition-all duration-500 ${i <= currentStepIndex ? "opacity-100 translate-y-0" : "opacity-30 translate-y-2 pointer-events-none"}`}>
                            <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${i === currentStepIndex ? 'text-[#ccff00]' : 'text-gray-400'}`}>
                               Step {i + 1}: {step.title}
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed font-medium">
                               {step.description}
                            </p>
                            
                            {i === currentStepIndex && i < task.logicSteps.length - 1 && (
                               <button 
                                 onClick={() => setCurrentStepIndex(i + 1)}
                                 className="mt-4 border-2 border-white text-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-[#11110f] transition-all"
                               >
                                 Next Step
                               </button>
                            )}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default TaskPanel;
