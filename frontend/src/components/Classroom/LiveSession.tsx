import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Code,
  Edit3,
  Eye,
  RotateCcw,
  Send,
} from "lucide-react";
import type {
  ResolvedHelpResponse,
  StudentOverview,
  TeacherFocusMode,
  TeacherHelpNote,
  TeacherSession,
} from "@shared/types";
import CollaborativeEditor, {
  type CollaborativeEditorHandle,
} from "./CollaborativeEditor";
import { useAuth } from "@/lib/auth-context";
import { useSessionBroadcastEvent } from "@/lib/liveblocks";

interface LiveSessionProps {
  session: TeacherSession;
  student: StudentOverview;
  onExit: () => void;
  onResolveHelp: (payload: {
    taskId: string;
    responseNotes: TeacherHelpNote[];
  }) => Promise<ResolvedHelpResponse | null>;
  onResetCode: () => Promise<void>;
  onCompleteSession?: () => Promise<void>;
}

const modeButtonStyles: Record<TeacherFocusMode, string> = {
  view: "bg-white text-[#11110f] border-[#11110f]",
  edit: "bg-[#11110f] text-[#ccff00] border-[#11110f]",
};

const formatNoteTime = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const LiveSession = ({
  session,
  student,
  onExit,
  onResolveHelp,
  onResetCode,
  onCompleteSession,
}: LiveSessionProps) => {
  const { profile } = useAuth();
  const editorRef = useRef<CollaborativeEditorHandle | null>(null);
  const broadcastSessionEvent = useSessionBroadcastEvent();
  const [mode, setMode] = useState<TeacherFocusMode>("view");
  const [teacherNotice, setTeacherNotice] = useState<string | null>(null);
  const [teacherNotes, setTeacherNotes] = useState<TeacherHelpNote[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sessionDuration, setSessionDuration] = useState("00:00");
  const [isResolvingHelp, setIsResolvingHelp] = useState(false);
  const [isResettingCode, setIsResettingCode] = useState(false);

  const currentTask =
    session.taskSet.find((task) => task.taskId === student.currentTaskId)?.task ??
    session.taskSet.find((task) => task.taskId === session.activeTaskId)?.task ??
    session.taskSet[0]?.task;

  const currentTaskId = currentTask?.id ?? student.currentTaskId ?? session.activeTaskId;

  useEffect(() => {
    if (!currentTaskId) {
      return;
    }

    broadcastSessionEvent({
      type: "teacher-focus",
      studentId: student.studentId,
      taskId: currentTaskId,
      mode,
    });
  }, [broadcastSessionEvent, currentTaskId, mode, student.studentId]);

  useEffect(() => {
    if (!session.startTime) {
      setSessionDuration("00:00");
      return;
    }

    const updateDuration = () => {
      const elapsedSeconds = Math.max(
        0,
        Math.floor((Date.now() - new Date(session.startTime!).getTime()) / 1000),
      );
      const minutes = Math.floor(elapsedSeconds / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");
      setSessionDuration(`${minutes}:${seconds}`);
    };

    updateDuration();
    const timer = window.setInterval(updateDuration, 1000);
    return () => window.clearInterval(timer);
  }, [session.startTime]);

  const handleSendMessage = (event?: FormEvent) => {
    event?.preventDefault();
    const text = newMessage.trim();
    if (!text) {
      return;
    }

    setTeacherNotes((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        sender: "teacher",
        text,
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewMessage("");
  };

  const handleResolve = async () => {
    if (!currentTaskId || isResolvingHelp) {
      return;
    }

    setIsResolvingHelp(true);
    try {
      const response = await onResolveHelp({
        taskId: currentTaskId,
        responseNotes: teacherNotes,
      });

      if (response) {
        broadcastSessionEvent({
          type: "help-resolved",
          studentId: student.studentId,
          taskId: currentTaskId,
          resolvedAt: response.resolvedAt,
          response,
        });
      }
    } finally {
      setIsResolvingHelp(false);
    }
  };

  const handleReset = async () => {
    if (isResettingCode) {
      return;
    }

    setIsResettingCode(true);
    try {
      await onResetCode();
      if (currentTask?.initialCode) {
        editorRef.current?.replaceCode(currentTask.initialCode);
      }
      editorRef.current?.notifyInterventionsChanged();
    } finally {
      setIsResettingCode(false);
    }
  };

  const statusLabel =
    student.helpStatus === "requested"
      ? "Needs help"
      : student.completed
        ? "Completed"
        : student.status;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fafafa] font-sans text-[#11110f] selection:bg-[#ccff00] selection:text-black">
      <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b-2 border-[#11110f] bg-white px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="rounded-none border-2 border-[#11110f] bg-white p-1.5 transition hover:bg-[#ccff00]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ccff00] opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full border border-[#11110f] bg-[#a3cc00]" />
              </span>
              <span className="text-sm font-bold uppercase tracking-tight">
                Viewing: {student.profile?.fullName ?? "Student"}
              </span>
            </div>
            <span className="border-l-2 border-[#11110f] py-1 pl-3 font-mono text-xs font-bold">
              {sessionDuration}
            </span>
            <span className="bg-[#11110f] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[#ccff00]">
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void onCompleteSession?.()}
            className="border-2 border-[#11110f] bg-rose-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-rose-600"
          >
            End Session
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="relative flex flex-1 flex-col overflow-hidden bg-white">
          {currentTaskId ? (
            <CollaborativeEditor
              ref={editorRef}
              sessionId={session.id}
              taskId={currentTaskId}
              workspaceStudentId={student.studentId}
              currentUserId={profile?.id ?? `teacher-${session.id}`}
              userName={profile?.fullName ?? "Teacher"}
              role="teacher"
              mode={mode}
              initialCode={currentTask?.initialCode}
              language={currentTask?.language}
              announceTeacherPresence={true}
              showInterventionTray={false}
              onTeacherPresenceChange={setTeacherNotice}
              onSnippetChange={(nextCode) =>
                broadcastSessionEvent({
                  type: "student-activity",
                  studentId: student.studentId,
                  currentTaskId,
                  status: "active",
                  snippet: nextCode,
                  helpStatus: student.helpStatus,
                })
              }
            />
          ) : null}
        </div>

        <aside className="flex w-[420px] shrink-0 flex-col border-l-2 border-[#11110f] bg-white">
          <div className="border-b-2 border-[#11110f] bg-[#fafafa] p-4">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#11110f]">
              Focus Mode
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["view", "edit"] as const).map((nextMode) => (
                <button
                  key={nextMode}
                  type="button"
                  onClick={() => setMode(nextMode)}
                  className={`border-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${mode === nextMode ? modeButtonStyles[nextMode] : "bg-white text-[#11110f] border-[#11110f]"}`}
                >
                  {nextMode === "view" ? <Eye className="mx-auto mb-1 h-4 w-4" /> : null}
                  {nextMode === "edit" ? <Edit3 className="mx-auto mb-1 h-4 w-4" /> : null}
                  {nextMode}
                </button>
              ))}
            </div>
            {teacherNotice ? (
              <div className="mt-3 border-2 border-[#11110f] bg-[#ccff00] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]">
                {teacherNotice}
              </div>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto bg-[#fafafa] p-4">
            <div className="space-y-5">
              <div className="border-2 border-[#11110f] bg-white p-4 shadow-[4px_4px_0_#ccff00]">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]">
                  <Code className="h-4 w-4" />
                  Current Task
                </div>
                <div className="text-sm font-bold text-[#11110f]">
                  {currentTask?.title ?? "No task selected"}
                </div>
                <div className="mt-2 text-xs font-medium text-gray-500">
                  {currentTask?.description ??
                    "Teacher focus mode is attached to the student's current workspace."}
                </div>
              </div>

              <div className="border-2 border-[#11110f] bg-white p-4">
                <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]">
                  Direct Actions
                </div>
                <div className="space-y-3">
                  <div className="border-2 border-[#11110f] bg-[#ccff00] px-3 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]">
                    {mode === "edit"
                      ? "Edit mode is live. Teacher changes sync to the student immediately."
                      : "Switch to edit mode to type directly into the student's workspace in real time."}
                  </div>
                  <button
                    type="button"
                    disabled={isResolvingHelp || !currentTaskId}
                    onClick={() => void handleResolve()}
                    className="inline-flex w-full items-center justify-center gap-2 border-2 border-[#11110f] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {isResolvingHelp ? "Resolving Help..." : "Mark Help Resolved"}
                  </button>
                  <button
                    type="button"
                    disabled={isResettingCode}
                    onClick={() => void handleReset()}
                    className="inline-flex w-full items-center justify-center gap-2 border-2 border-[#11110f] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {isResettingCode ? "Resetting..." : "Reset to Starter"}
                  </button>
                </div>
              </div>

              <div className="border-2 border-[#11110f] bg-white p-4">
                <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]">
                  Teacher Notes
                </div>

                <div className="mb-3 border-2 border-[#11110f] bg-[#fafafa] p-3">
                  <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                    System
                  </div>
                  <div className="text-sm font-medium text-[#11110f]">
                    Teacher focused on {student.profile?.fullName ?? "student"}.
                  </div>
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Now
                  </div>
                </div>

                <div className="space-y-3">
                  {teacherNotes.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 bg-[#fafafa] p-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                      Add a short response before resolving the student's help request.
                    </div>
                  ) : (
                    teacherNotes.map((note) => (
                      <div key={note.id} className="border-2 border-[#11110f] bg-[#fafafa] p-3">
                        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                          Teacher
                        </div>
                        <div className="text-sm font-medium text-[#11110f]">{note.text}</div>
                        <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {formatNoteTime(note.createdAt)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-[#11110f] bg-white p-4">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                id="teacher-note-input"
                name="teacherNote"
                aria-label="Teacher note"
                type="text"
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                placeholder="Write the response the student should see..."
                className="w-full rounded-none border-2 border-[#11110f] bg-white py-3 pl-4 pr-12 text-sm font-bold text-[#11110f] shadow-[4px_4px_0_#11110f] transition-all placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-none bg-[#11110f] p-2 text-[#ccff00] transition hover:bg-gray-800"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LiveSession;
