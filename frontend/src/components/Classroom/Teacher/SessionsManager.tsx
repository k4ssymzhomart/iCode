import { useMemo, useState } from "react";
import type { TaskSetSummary, TeacherSession, UserProfile } from "@shared/types";
import {
  BookOpen,
  FileText,
  Hash,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  StopCircle,
  Users,
  Loader2,
} from "lucide-react";

interface SessionsManagerProps {
  sessions: TeacherSession[];
  taskSets: TaskSetSummary[];
  students: UserProfile[];
  onCreateSession: (payload: {
    title: string;
    topic: string;
    description?: string;
    taskSetId: string;
    studentIds: string[];
  }) => Promise<void>;
  onChangeState: (sessionId: string, nextState: TeacherSession["state"]) => Promise<void>;
  onRegenerateCode: (sessionId: string) => Promise<void>;
}

const SessionsManager = ({
  sessions,
  taskSets,
  students,
  onCreateSession,
  onChangeState,
  onRegenerateCode,
}: SessionsManagerProps) => {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTaskSetId, setSelectedTaskSetId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionStates, setActionStates] = useState<Record<string, boolean>>({});

  const liveSessionId = sessions.find((session) => session.state === "live")?.id;
  const taskSetLookup = useMemo(
    () => new Map(taskSets.map((taskSet) => [taskSet.id, taskSet])),
    [taskSets],
  );
  const sortedSessions = useMemo(
    () =>
      [...sessions].sort((left, right) => {
        const order = { live: 3, paused: 2, draft: 1, completed: 0 };
        return order[right.state] - order[left.state];
      }),
    [sessions],
  );

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((entry) => entry !== studentId)
        : [...current, studentId],
    );
  };

  const canCreateDraft =
    title.trim().length > 0 &&
    topic.trim().length > 0 &&
    selectedTaskSetId.length > 0 &&
    selectedStudentIds.length > 0;

  const handleCreate = async () => {
    if (!canCreateDraft) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateSession({
        title: title.trim(),
        topic: topic.trim(),
        description: description.trim() || undefined,
        taskSetId: selectedTaskSetId,
        studentIds: selectedStudentIds,
      });
      setTitle("");
      setTopic("");
      setDescription("");
      setSelectedTaskSetId("");
      setSelectedStudentIds([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStateChange = async (sessionId: string, nextState: TeacherSession["state"]) => {
    const key = `${sessionId}-${nextState}`;
    setActionStates(prev => ({ ...prev, [key]: true }));
    try {
      await onChangeState(sessionId, nextState);
    } finally {
      setActionStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRegenerate = async (sessionId: string) => {
    const key = `${sessionId}-regen`;
    setActionStates(prev => ({ ...prev, [key]: true }));
    try {
      await onRegenerateCode(sessionId);
    } finally {
      setActionStates(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#fafafa] p-6 font-sans">
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="border-2 border-[#11110f] bg-white p-6 shadow-[8px_8px_0_#11110f]">
          <div className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-[#11110f]">
            <Plus className="h-4 w-4 text-[#ccff00]" />
            Create Session Draft
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Session Title
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Python Basics Morning Lab"
                className="w-full border-2 border-[#11110f] bg-[#fafafa] px-4 py-3 text-sm font-bold text-[#11110f] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Topic
              </label>
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Python Fundamentals"
                className="w-full border-2 border-[#11110f] bg-[#fafafa] px-4 py-3 text-sm font-bold text-[#11110f] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Description
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional notes for this classroom session."
                className="min-h-24 w-full resize-none border-2 border-[#11110f] bg-[#fafafa] px-4 py-3 text-sm font-medium text-[#11110f] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Task Set
              </label>
              <div className="border-2 border-[#11110f] bg-[#fafafa] p-3">
                <select
                  value={selectedTaskSetId}
                  onChange={(event) => setSelectedTaskSetId(event.target.value)}
                  className="w-full border-2 border-[#11110f] bg-white px-4 py-3 text-sm font-bold text-[#11110f] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                >
                  <option value="">Select a task set</option>
                  {taskSets.map((taskSet) => (
                    <option key={taskSet.id} value={taskSet.id}>
                      {taskSet.title} ({taskSet.taskCount} tasks)
                    </option>
                  ))}
                </select>

                {selectedTaskSetId ? (
                  <div className="mt-3 border-2 border-[#11110f] bg-white p-3">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-[#11110f]">
                      {taskSetLookup.get(selectedTaskSetId)?.title ?? "Selected Task Set"}
                    </div>
                    <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                      {taskSetLookup.get(selectedTaskSetId)?.topic ?? ""}
                    </div>
                    <div className="mt-2 text-xs font-medium text-gray-600">
                      {taskSetLookup.get(selectedTaskSetId)?.description || "No description."}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Roster
              </label>
              <div className="max-h-56 space-y-2 overflow-y-auto border-2 border-[#11110f] bg-[#fafafa] p-3">
                {students.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => toggleStudentSelection(student.id)}
                    className={`flex w-full items-center justify-between border-2 px-3 py-2 text-left transition-colors ${
                      selectedStudentIds.includes(student.id)
                        ? "border-[#11110f] bg-[#ccff00] text-[#11110f]"
                        : "border-[#11110f] bg-white text-[#11110f]"
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-[0.2em]">
                      {student.fullName}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      {selectedStudentIds.includes(student.id) ? "Assigned" : "Available"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={isSubmitting || !canCreateDraft}
              className="inline-flex w-full items-center justify-center gap-2 border-2 border-[#11110f] bg-[#11110f] px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#ccff00] shadow-[4px_4px_0_#ccff00] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isSubmitting ? "Creating..." : "Create Draft Session"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-black uppercase tracking-[0.2em] text-[#11110f]">
              Session Library
            </div>
            {liveSessionId ? (
              <span className="border-2 border-[#11110f] bg-[#ccff00] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]">
                One Live Session Enforced
              </span>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {sortedSessions.map((session) => {
              const matchedTaskSet = session.taskSetId
                ? taskSetLookup.get(session.taskSetId)
                : undefined;
              const taskSetLabel =
                matchedTaskSet?.title ??
                (session.taskSet.length === 1
                  ? session.taskSet[0]?.task.title
                  : "Custom Task Assignment");

              return (
                <div
                  key={session.id}
                  className="border-2 border-[#11110f] bg-white p-5 shadow-[6px_6px_0_#11110f]"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black uppercase tracking-tight text-[#11110f]">
                        {session.title}
                      </h3>
                      <div className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">
                        {session.topic}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        <span className="inline-flex items-center gap-1 border-2 border-[#11110f] px-2 py-1 text-[#11110f]">
                          <Hash className="h-3 w-3" />
                          {session.joinCode || "-----"}
                        </span>
                        <span className="inline-flex items-center gap-1 border-2 border-[#11110f] px-2 py-1 text-[#11110f]">
                          <BookOpen className="h-3 w-3" />
                          {session.taskSet.length} Tasks
                        </span>
                        <span className="inline-flex items-center gap-1 border-2 border-[#11110f] px-2 py-1 text-[#11110f]">
                          <Users className="h-3 w-3" />
                          {session.roster?.length ?? 0} Students
                        </span>
                      </div>
                    </div>
                    <span
                      className={`border-2 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                        session.state === "live"
                          ? "border-[#11110f] bg-[#ccff00] text-[#11110f]"
                          : session.state === "paused"
                            ? "border-[#11110f] bg-orange-200 text-[#11110f]"
                            : session.state === "completed"
                              ? "border-[#11110f] bg-gray-200 text-[#11110f]"
                              : "border-[#11110f] bg-white text-[#11110f]"
                      }`}
                    >
                      {session.state}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs font-medium text-[#666259]">
                    <div className="flex items-start gap-2">
                      <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#11110f]" />
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                          Task Set
                        </div>
                        <div className="text-xs font-bold text-[#11110f]">{taskSetLabel}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#11110f]" />
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                          Description
                        </div>
                        <div>
                          {session.description?.trim()
                            ? session.description
                            : "No description added."}
                        </div>
                      </div>
                    </div>
                    <div>
                      Active task:{" "}
                      {session.taskSet.find((task) => task.isActive)?.task.title ?? "Not set"}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {session.state === "draft" || session.state === "paused" ? (
                      <button
                        type="button"
                        disabled={Boolean(liveSessionId && liveSessionId !== session.id) || actionStates[`${session.id}-live`]}
                        onClick={() => void handleStateChange(session.id, "live")}
                        className="inline-flex items-center gap-2 border-2 border-[#11110f] bg-[#ccff00] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionStates[`${session.id}-live`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        {session.state === "draft" ? "Start Session" : "Resume"}
                      </button>
                    ) : null}

                    {session.state === "live" ? (
                      <button
                        type="button"
                        disabled={actionStates[`${session.id}-paused`]}
                        onClick={() => void handleStateChange(session.id, "paused")}
                        className="inline-flex items-center gap-2 border-2 border-[#11110f] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionStates[`${session.id}-paused`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
                        Pause
                      </button>
                    ) : null}

                    {session.state !== "completed" ? (
                      <button
                        type="button"
                        disabled={actionStates[`${session.id}-completed`]}
                        onClick={() => void handleStateChange(session.id, "completed")}
                        className="inline-flex items-center gap-2 border-2 border-[#11110f] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {actionStates[`${session.id}-completed`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <StopCircle className="h-4 w-4" />}
                        Complete
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void handleRegenerate(session.id)}
                      disabled={session.state === "completed" || actionStates[`${session.id}-regen`]}
                      className="inline-flex items-center gap-2 border-2 border-[#11110f] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionStates[`${session.id}-regen`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                      {session.joinCode ? "Regenerate Code" : "Generate Code"}
                    </button>
                  </div>
                </div>
              );
            })}

            {sortedSessions.length === 0 ? (
              <div className="border-2 border-dashed border-[#11110f] bg-white p-10 text-center text-sm font-bold uppercase tracking-widest text-gray-400 lg:col-span-2">
                No sessions created yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionsManager;
