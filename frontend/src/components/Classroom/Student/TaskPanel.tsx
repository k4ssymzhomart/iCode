import React, { useEffect, useState } from "react";
import { Lightbulb, ListOrdered, ChevronLeft, ChevronRight, Activity, CheckCircle2, X } from "lucide-react";
import { SessionTask, Task } from "@shared/types";

interface TaskPanelProps {
  task: Task & { logicSteps?: any[] };
  allowHint?: boolean;
  tasks?: SessionTask[];
  selectedTaskId?: string;
  teacherActiveTaskId?: string;
  onSelectTask?: (taskId: string) => void;
}

const TaskPanel: React.FC<TaskPanelProps> = ({
  task,
  allowHint = true,
  tasks,
  selectedTaskId,
  teacherActiveTaskId,
  onSelectTask,
}) => {
  const [showLogicSteps, setShowLogicSteps] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentTaskIndex =
    tasks && selectedTaskId
      ? tasks.findIndex((sessionTask) => sessionTask.taskId === selectedTaskId)
      : -1;
  const hasTaskNavigation = (tasks?.length ?? 0) > 1 && currentTaskIndex >= 0;
  const previousTaskId =
    hasTaskNavigation && currentTaskIndex > 0
      ? tasks?.[currentTaskIndex - 1]?.taskId
      : undefined;
  const nextTaskId =
    hasTaskNavigation && tasks && currentTaskIndex < tasks.length - 1
      ? tasks[currentTaskIndex + 1]?.taskId
      : undefined;

  useEffect(() => {
    setShowLogicSteps(false);
    setCurrentStepIndex(0);
  }, [task.id]);

  const logicSteps = task.logicSteps ?? [];
  const totalSteps = logicSteps.length;
  const clampedStepIndex =
    totalSteps > 0 ? Math.min(currentStepIndex, totalSteps - 1) : 0;

  return (
    <div className="h-full flex flex-col bg-[#fafafa]">
      
      {/* Header */}
      <div className="border-b border-[#11110f] bg-[#11110f] px-4 py-3 shrink-0 flex items-center justify-between">
         <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#ccff00]" />
            Current Task
         </span>
         <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 ${
           (task.difficulty ?? "Medium") === 'Easy' ? 'bg-[#ccff00] text-[#11110f]' : 
           (task.difficulty ?? "Medium") === 'Medium' ? 'bg-orange-400 text-[#11110f]' : 'bg-rose-500 text-white'
         }`}>
           {task.difficulty ?? "Medium"}
         </span>
      </div>

      <div className="flex-1 overflow-y-auto w-full relative">
        <div className="p-4 space-y-6 lg:p-6">
          {hasTaskNavigation ? (
            <div className="border-2 border-[#11110f] bg-white p-3 shadow-[2px_2px_0_#11110f]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                    Question Navigator
                  </div>
                  <div className="text-sm font-bold text-[#11110f]">
                    Question {currentTaskIndex + 1} of {tasks?.length ?? 0}
                  </div>
                </div>
                {teacherActiveTaskId === selectedTaskId ? (
                  <span className="border-2 border-[#11110f] bg-[#ccff00] px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]">
                    Teacher Focus
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!previousTaskId}
                  onClick={() => previousTaskId && onSelectTask?.(previousTaskId)}
                  className="inline-flex items-center justify-center gap-2 border-2 border-[#11110f] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!nextTaskId}
                  onClick={() => nextTaskId && onSelectTask?.(nextTaskId)}
                  className="inline-flex items-center justify-center gap-2 border-2 border-[#11110f] bg-[#11110f] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#ccff00] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          {tasks && tasks.length > 1 ? (
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-[#11110f] border-b border-gray-200 pb-2">
                Assigned Tasks
              </div>
              <div className="space-y-2">
                {tasks.map((sessionTask, index) => {
                  const isSelected = sessionTask.taskId === selectedTaskId;
                  const isTeacherTask = sessionTask.taskId === teacherActiveTaskId;

                  return (
                    <button
                      key={sessionTask.taskId}
                      type="button"
                      onClick={() => onSelectTask?.(sessionTask.taskId)}
                      className={`w-full border-2 px-3 py-3 text-left transition-colors ${
                        isSelected
                          ? "border-[#11110f] bg-[#11110f] text-white"
                          : "border-gray-200 bg-white text-[#11110f] hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
                            Task {index + 1}
                          </div>
                          <div className="truncate text-sm font-bold">
                            {sessionTask.task.title}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {isTeacherTask ? (
                            <span className="border border-[#ccff00] bg-[#ccff00] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]">
                              Teacher Live
                            </span>
                          ) : null}
                          {isSelected ? (
                            <span className="border border-white/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-white">
                              Open
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

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

          {(task.inputFormat || task.outputFormat || (task.constraints?.length ?? 0) > 0) && (
            <div className="grid gap-3">
              {task.inputFormat ? (
                <div className="border-2 border-gray-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Input Format
                  </div>
                  <div className="mt-2 text-sm font-medium text-[#11110f]">
                    {task.inputFormat}
                  </div>
                </div>
              ) : null}

              {task.outputFormat ? (
                <div className="border-2 border-gray-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Output Format
                  </div>
                  <div className="mt-2 text-sm font-medium text-[#11110f]">
                    {task.outputFormat}
                  </div>
                </div>
              ) : null}

              {(task.constraints?.length ?? 0) > 0 ? (
                <div className="border-2 border-gray-200 bg-white p-3">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Constraints
                  </div>
                  <div className="mt-2 space-y-2">
                    {(task.constraints ?? []).map((constraint, index) => (
                      <div
                        key={`${constraint}-${index}`}
                        className="border border-gray-200 bg-[#fafafa] px-2 py-1 text-xs font-bold text-[#11110f]"
                      >
                        {constraint}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Test cases */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#11110f] border-b border-gray-200 pb-2">
              Examples
            </h3>
            {task.testCases && task.testCases.length > 0 ? task.testCases.map((test, i) => (
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
            )) : (
              <div className="border-2 border-dashed border-gray-300 bg-white p-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                No examples provided.
              </div>
            )}
          </div>

          <hr className="border-t-2 border-gray-200 my-6" />

          {/* Smart Tooling */}
          <div className="space-y-3">
             <button disabled={!allowHint} className={`w-full flex items-center justify-between border-2 border-[#11110f] px-4 py-3 transition-colors ${allowHint ? "bg-white hover:bg-gray-50" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
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
        <div className={`absolute inset-0 z-10 bg-[#f7f5ef] transition-transform duration-300 ${showLogicSteps ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex h-full flex-col">
            <div className="sticky top-0 z-10 border-b-2 border-[#11110f] bg-white px-4 py-4 shadow-[0_4px_0_rgba(17,17,15,0.05)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">
                    Logic Steps
                  </div>
                  <h2 className="mt-1 text-base font-black uppercase tracking-tight text-[#11110f]">
                    {task.title}
                  </h2>
                  <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
                    {totalSteps > 0 ? `Step ${clampedStepIndex + 1} / ${totalSteps}` : "No steps yet"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowLogicSteps(false)}
                  className="inline-flex items-center gap-2 border-2 border-[#11110f] bg-[#ccff00] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f] shadow-[2px_2px_0_#11110f]"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>

              <div className="mt-4 h-3 overflow-hidden border-2 border-[#11110f] bg-[#f1efe8]">
                <div
                  className="h-full bg-[#ccff00] transition-all duration-300"
                  style={{
                    width:
                      totalSteps > 0
                        ? `${((clampedStepIndex + 1) / totalSteps) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {totalSteps === 0 ? (
                <div className="border-2 border-dashed border-[#11110f] bg-white p-5 text-center text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                  No logic steps were provided for this task yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {logicSteps.map((step, index) => {
                    const isCurrent = index === clampedStepIndex;
                    const isCompleted = index < clampedStepIndex;

                    return (
                      <button
                        key={step.id || index}
                        type="button"
                        onClick={() => setCurrentStepIndex(index)}
                        className={`w-full border-2 text-left transition-all ${
                          isCurrent
                            ? "border-[#11110f] bg-white shadow-[4px_4px_0_#ccff00]"
                            : isCompleted
                              ? "border-[#11110f] bg-[#f2ffd1]"
                              : "border-gray-200 bg-white hover:border-[#11110f]"
                        }`}
                      >
                        <div className="flex items-start gap-3 p-4">
                          <div
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border-2 text-xs font-black ${
                              isCurrent
                                ? "border-[#11110f] bg-[#11110f] text-[#ccff00]"
                                : isCompleted
                                  ? "border-[#11110f] bg-[#ccff00] text-[#11110f]"
                                  : "border-gray-300 bg-[#fafafa] text-gray-500"
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                                Step {index + 1}
                              </div>
                              {isCurrent ? (
                                <span className="border border-[#11110f] bg-[#11110f] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#ccff00]">
                                  Current
                                </span>
                              ) : null}
                              {isCompleted ? (
                                <span className="border border-[#11110f] bg-[#ccff00] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]">
                                  Completed
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-2 text-sm font-bold text-[#11110f]">
                              {step.title}
                            </div>

                            <div className={`mt-2 text-sm leading-relaxed text-[#4d493f] ${isCurrent ? "block" : "max-h-10 overflow-hidden"}`}>
                              {step.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {totalSteps > 0 ? (
              <div className="border-t-2 border-[#11110f] bg-white p-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={clampedStepIndex === 0}
                    onClick={() => setCurrentStepIndex((current) => Math.max(0, current - 1))}
                    className="inline-flex items-center justify-center gap-2 border-2 border-[#11110f] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous Step
                  </button>
                  <button
                    type="button"
                    disabled={clampedStepIndex >= totalSteps - 1}
                    onClick={() =>
                      setCurrentStepIndex((current) =>
                        Math.min(totalSteps - 1, current + 1),
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 border-2 border-[#11110f] bg-[#11110f] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#ccff00] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next Step
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TaskPanel;
