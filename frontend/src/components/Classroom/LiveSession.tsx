import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Code,
  Edit3,
  Eye,
  Lightbulb,
  RotateCcw,
  Send,
  Wand2,
} from "lucide-react";
import type {
  EditorIntervention,
  StudentOverview,
  TeacherInterventionMode,
  TeacherSession,
} from "@shared/types";
import CollaborativeEditor, {
  type CollaborativeEditorHandle,
} from "./CollaborativeEditor";
import { useAuth } from "@/lib/auth-context";
import { classroomService } from "@/services/classroom";
import { useSessionBroadcastEvent } from "@/lib/liveblocks";

interface LiveSessionProps {
  session: TeacherSession;
  student: StudentOverview;
  onExit: () => void;
  onResolveHelp: () => Promise<void>;
  onResetCode: () => Promise<void>;
  onCompleteSession?: () => Promise<void>;
}

const modeButtonStyles: Record<TeacherInterventionMode, string> = {
  view: "bg-white text-[#11110f] border-[#11110f]",
  suggest: "bg-[#ccff00] text-[#11110f] border-[#11110f]",
  edit: "bg-[#11110f] text-[#ccff00] border-[#11110f]",
};

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
  const [mode, setMode] = useState<TeacherInterventionMode>("view");
  const [commentText, setCommentText] = useState("");
  const [suggestedCode, setSuggestedCode] = useState("");
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [teacherNotice, setTeacherNotice] = useState<string | null>(null);
  const [messages, setMessages] = useState([
    {
      sender: "System",
      text: `Teacher focused on ${student.profile?.fullName ?? "student"}.`,
      time: "Now",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [editBaseline, setEditBaseline] = useState("");
  const [sessionDuration, setSessionDuration] = useState("00:00");

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
    if (mode === "edit") {
      setEditBaseline(editorRef.current?.getCode() ?? "");
    }
  }, [mode, student.studentId, currentTaskId]);

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

  const pushIntervention = async (
    type: EditorIntervention["type"],
    options?: {
      content?: string;
      suggestedCode?: string;
      beforeExcerpt?: string;
      afterExcerpt?: string;
      mode?: TeacherInterventionMode;
    },
  ) => {
    if (!currentTaskId) {
      return;
    }

    const selectedRange = editorRef.current?.getSelectedRange();
    const codeSnapshot = editorRef.current?.getCode() ?? "";

    setIsSavingAction(true);
    try {
      await classroomService.createIntervention({
        sessionId: session.id,
        studentId: student.studentId,
        taskId: currentTaskId,
        type,
        mode: options?.mode ?? mode,
        range: selectedRange ?? {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
        },
        content: options?.content,
        suggestedCode:
          type === "suggestion"
            ? options?.suggestedCode || codeSnapshot
            : options?.suggestedCode,
        beforeExcerpt: options?.beforeExcerpt,
        afterExcerpt: options?.afterExcerpt,
      });
      editorRef.current?.notifyInterventionsChanged();
      setCommentText("");
      setSuggestedCode("");
    } finally {
      setIsSavingAction(false);
    }
  };

  const handleCommitTeacherEdit = async () => {
    const currentCode = editorRef.current?.getCode() ?? "";
    if (!currentTaskId || currentCode === editBaseline) {
      return;
    }

    await pushIntervention("direct_edit", {
      content: "Teacher edited the code live in edit mode.",
      beforeExcerpt: editBaseline,
      afterExcerpt: currentCode,
      suggestedCode: currentCode,
      mode: "edit",
    });

    setEditBaseline(currentCode);
    broadcastSessionEvent({
      type: "student-activity",
      studentId: student.studentId,
      currentTaskId,
      status: "active",
      snippet: currentCode,
      helpStatus: student.helpStatus,
    });
  };

  const handleSendMessage = (event?: FormEvent) => {
    event?.preventDefault();
    if (!newMessage.trim()) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        sender: "Teacher",
        text: newMessage.trim(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setNewMessage("");
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
            <span className="border-l-2 border-[#11110f] pl-3 py-1 font-mono text-xs font-bold">
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
              Intervention Mode
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["view", "suggest", "edit"] as const).map((nextMode) => (
                <button
                  key={nextMode}
                  type="button"
                  onClick={() => setMode(nextMode)}
                  className={`border-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${mode === nextMode ? modeButtonStyles[nextMode] : "bg-white text-[#11110f] border-[#11110f]"}`}
                >
                  {nextMode === "view" ? <Eye className="mx-auto mb-1 h-4 w-4" /> : null}
                  {nextMode === "suggest" ? <Lightbulb className="mx-auto mb-1 h-4 w-4" /> : null}
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
                  {currentTask?.description ?? "Teacher focus mode is attached to the student's current workspace."}
                </div>
              </div>

              <div className="border-2 border-[#11110f] bg-white p-4">
                <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]">
                  Add Feedback
                </div>
                <textarea
                  id="teacher-feedback-comment"
                  name="teacherFeedbackComment"
                  aria-label="Teacher feedback comment"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Add a comment or explain what the student should focus on..."
                  className="min-h-24 w-full resize-none border-2 border-[#11110f] bg-[#fafafa] px-3 py-3 text-sm font-medium text-[#11110f] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isSavingAction || !commentText.trim()}
                    onClick={() =>
                      void pushIntervention("comment", { content: commentText.trim(), mode: "view" })
                    }
                    className="border-2 border-[#11110f] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]"
                  >
                    Add Comment
                  </button>
                  <button
                    type="button"
                    disabled={isSavingAction || !commentText.trim()}
                    onClick={() =>
                      void pushIntervention("highlight", {
                        content: commentText.trim(),
                        mode: "suggest",
                      })
                    }
                    className="border-2 border-[#11110f] bg-[#ccff00] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]"
                  >
                    Highlight
                  </button>
                </div>
              </div>

              <div className="border-2 border-[#11110f] bg-white p-4">
                <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]">
                  Suggestion Block
                </div>
                <textarea
                  id="teacher-suggested-code"
                  name="teacherSuggestedCode"
                  aria-label="Teacher suggested code"
                  value={suggestedCode}
                  onChange={(event) => setSuggestedCode(event.target.value)}
                  placeholder="Paste a suggested code replacement or leave blank to snapshot the current view."
                  className="min-h-28 w-full resize-none border-2 border-[#11110f] bg-[#fafafa] px-3 py-3 text-sm font-medium text-[#11110f] focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
                />
                <button
                  type="button"
                  disabled={isSavingAction || mode === "edit"}
                  onClick={() =>
                    void pushIntervention("suggestion", {
                      content: commentText.trim() || "Teacher suggested a code change.",
                      suggestedCode: suggestedCode.trim() || editorRef.current?.getCode(),
                      mode: "suggest",
                    })
                  }
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 border-2 border-[#11110f] bg-[#11110f] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#ccff00]"
                >
                  <Wand2 className="h-4 w-4" />
                  Create Suggestion
                </button>
              </div>

              <div className="border-2 border-[#11110f] bg-white p-4">
                <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]">
                  Direct Actions
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={mode !== "edit" || isSavingAction}
                    onClick={() => void handleCommitTeacherEdit()}
                    className="inline-flex w-full items-center justify-center gap-2 border-2 border-[#11110f] bg-[#ccff00] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Commit Teacher Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onResolveHelp();
                      broadcastSessionEvent({
                        type: "help-resolved",
                        studentId: student.studentId,
                        resolvedAt: new Date().toISOString(),
                      });
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 border-2 border-[#11110f] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark Help Resolved
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onResetCode();
                      if (currentTask?.initialCode) {
                        editorRef.current?.replaceCode(currentTask.initialCode);
                      }
                      editorRef.current?.notifyInterventionsChanged();
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 border-2 border-[#11110f] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-600"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset to Starter
                  </button>
                </div>
              </div>

              <div className="border-2 border-[#11110f] bg-white p-4">
                <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]">
                  Teacher Notes
                </div>
                <div className="space-y-3">
                  {messages.map((message, index) => (
                    <div key={`${message.sender}-${index}`} className="border-2 border-[#11110f] bg-[#fafafa] p-3">
                      <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        {message.sender}
                      </div>
                      <div className="text-sm font-medium text-[#11110f]">{message.text}</div>
                      <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {message.time}
                      </div>
                    </div>
                  ))}
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
                placeholder="Leave a short note..."
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
