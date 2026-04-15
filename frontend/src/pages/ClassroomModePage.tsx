import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ResolvedHelpResponse,
  SessionControls,
  SessionStudent,
  SessionTask,
  TeacherSession,
} from "@shared/types";
import LobbyScreen from "@/components/Classroom/Student/LobbyScreen";
import LabLayout from "@/components/Classroom/Student/LabLayout";
import TaskPanel from "@/components/Classroom/Student/TaskPanel";
import CollaborativeEditor from "@/components/Classroom/CollaborativeEditor";
import StudentCompilerPanel, {
  createEmptyStudentCompilerPanelState,
  type StudentCompilerPanelState,
} from "@/components/Classroom/Student/StudentCompilerPanel";
import ClassmatesPanel from "@/components/Classroom/Student/ClassmatesPanel";
import ClassroomLoader from "@/components/Classroom/Student/ClassroomLoader";
import { ErrorState } from "@/components/ui/app-states";
import { useAuth } from "@/lib/auth-context";
import {
  buildSessionRoomId,
  type SessionRoomEvent,
  SessionRoomProvider,
  useSessionBroadcastEvent,
  useSessionEventListener,
  useSessionStatus,
} from "@/lib/liveblocks";
import { classroomService } from "@/services/classroom";
import { sessionService } from "@/services/session";

type AppState = "lobby" | "loading" | "lab" | "error";
type StudentHelpState = "idle" | "requesting" | "requested" | "resolved";

const deriveHelpState = (
  membership?: Pick<SessionStudent, "helpStatus" | "status">,
): StudentHelpState => {
  if (
    membership?.helpStatus === "requested" ||
    membership?.helpStatus === "active" ||
    membership?.status === "help"
  ) {
    return "requested";
  }

  if (membership?.helpStatus === "resolved" || membership?.status === "resolved") {
    return "resolved";
  }

  return "idle";
};

const resolveSelectedTaskId = (
  tasks: SessionTask[],
  preferredTaskId?: string,
  teacherActiveTaskId?: string,
) => {
  const validTaskIds = new Set(tasks.map((task) => task.taskId));

  if (preferredTaskId && validTaskIds.has(preferredTaskId)) {
    return preferredTaskId;
  }

  if (teacherActiveTaskId && validTaskIds.has(teacherActiveTaskId)) {
    return teacherActiveTaskId;
  }

  return tasks[0]?.taskId ?? "";
};

const buildEditorCodeCache = (tasks: SessionTask[]) =>
  tasks.reduce<Record<string, string>>((cache, sessionTask) => {
    cache[sessionTask.taskId] = sessionTask.task.initialCode ?? "";
    return cache;
  }, {});

const mergeEditorCodeCache = (
  current: Record<string, string>,
  tasks: SessionTask[],
) =>
  tasks.reduce<Record<string, string>>((cache, sessionTask) => {
    cache[sessionTask.taskId] =
      current[sessionTask.taskId] ?? sessionTask.task.initialCode ?? "";
    return cache;
  }, {});

const pruneCompilerStateCache = (
  current: Record<string, StudentCompilerPanelState>,
  tasks: SessionTask[],
) =>
  tasks.reduce<Record<string, StudentCompilerPanelState>>((cache, sessionTask) => {
    if (current[sessionTask.taskId]) {
      cache[sessionTask.taskId] = current[sessionTask.taskId];
    }
    return cache;
  }, {});

const StudentLabSession = ({
  session,
  initialTasks,
  initialControls,
  initialTeacherActiveTaskId,
  initialSelectedTaskId,
  initialMembership,
  initialResolvedHelpResponsesByTask,
}: {
  session: TeacherSession;
  initialTasks: SessionTask[];
  initialControls: SessionControls;
  initialTeacherActiveTaskId: string;
  initialSelectedTaskId: string;
  initialMembership?: SessionStudent;
  initialResolvedHelpResponsesByTask?: Record<string, ResolvedHelpResponse | undefined>;
}) => {
  const { profile } = useAuth();
  const broadcast = useSessionBroadcastEvent();
  const sessionStatus = useSessionStatus();
  const [tasks, setTasks] = useState<SessionTask[]>(initialTasks);
  const [controls, setControls] = useState<SessionControls>(initialControls);
  const [teacherActiveTaskId, setTeacherActiveTaskId] = useState(initialTeacherActiveTaskId);
  const [selectedTaskId, setSelectedTaskId] = useState(initialSelectedTaskId);
  const [editorCodeByTaskId, setEditorCodeByTaskId] = useState<Record<string, string>>(
    () => buildEditorCodeCache(initialTasks),
  );
  const [compilerStateByTaskId, setCompilerStateByTaskId] = useState<
    Record<string, StudentCompilerPanelState>
  >({});
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(
    session.broadcastMessage ?? null,
  );
  const [pinnedHint, setPinnedHint] = useState<string | null>(
    session.pinnedHint ?? null,
  );
  const [helpState, setHelpState] = useState<StudentHelpState>(
    deriveHelpState(initialMembership),
  );
  const [resolvedHelpResponsesByTask, setResolvedHelpResponsesByTask] = useState<
    Record<string, ResolvedHelpResponse | undefined>
  >(initialResolvedHelpResponsesByTask ?? {});
  const activityTimerRef = useRef<number | null>(null);

  const selectedTaskEntry =
    tasks.find((task) => task.taskId === selectedTaskId) ??
    tasks.find((task) => task.taskId === teacherActiveTaskId) ??
    tasks[0];
  const selectedTask = selectedTaskEntry?.task;
  const selectedTaskCode = selectedTaskEntry
    ? editorCodeByTaskId[selectedTaskEntry.taskId] ?? selectedTaskEntry.task.initialCode ?? ""
    : "";
  const selectedCompilerState = selectedTaskEntry
    ? compilerStateByTaskId[selectedTaskEntry.taskId] ?? createEmptyStudentCompilerPanelState()
    : createEmptyStudentCompilerPanelState();

  const roster = session.roster ?? [];

  const safeBroadcast = (event: SessionRoomEvent) => {
    if (sessionStatus !== "connected") {
      return;
    }

    try {
      broadcast(event);
    } catch (error) {
      console.warn("[ClassroomModePage] Failed to broadcast session event", error);
    }
  };

  useSessionEventListener(({ event }) => {
    if (event.type === "student-activity") {
      return;
    }

    if (event.type === "broadcast-message") {
      setBroadcastMessage(event.message);
      return;
    }

    if (event.type === "pinned-hint") {
      setPinnedHint(event.hint);
      return;
    }

    if (event.type === "active-task") {
      setTeacherActiveTaskId(event.taskId);
      setTasks((current) =>
        current.map((task) => ({
          ...task,
          isActive: task.taskId === event.taskId,
        })),
      );
      return;
    }

    if (event.type === "help-resolved" && event.studentId === profile?.id) {
      setHelpState("resolved");
      setResolvedHelpResponsesByTask((current) => ({
        ...current,
        [event.taskId]: event.response,
      }));
    }
  });

  useEffect(() => {
    setEditorCodeByTaskId((current) => mergeEditorCodeCache(current, tasks));
    setCompilerStateByTaskId((current) => pruneCompilerStateCache(current, tasks));
    setSelectedTaskId((current) =>
      resolveSelectedTaskId(tasks, current, teacherActiveTaskId),
    );
  }, [tasks, teacherActiveTaskId]);

  useEffect(() => {
    let cancelled = false;

    const refreshSession = async () => {
      try {
        const response = await classroomService.getStudentSession(session.id);
        if (cancelled) {
          return;
        }

        const nextTeacherActiveTaskId =
          response.session.activeTaskId ?? response.activeTask?.id ?? teacherActiveTaskId;

        setTasks(response.tasks);
        setTeacherActiveTaskId(nextTeacherActiveTaskId);
        setSelectedTaskId((current) =>
          resolveSelectedTaskId(
            response.tasks,
            response.membership?.currentTaskId ?? current,
            nextTeacherActiveTaskId,
          ),
        );
        setBroadcastMessage(response.session.broadcastMessage ?? null);
        setPinnedHint(response.session.pinnedHint ?? null);
        setControls(response.session.controls);
        setHelpState(deriveHelpState(response.membership));
        setResolvedHelpResponsesByTask(response.resolvedHelpResponsesByTask ?? {});
      } catch (error) {
        console.error("[ClassroomModePage] Failed to refresh session", error);
      }
    };

    const interval = window.setInterval(refreshSession, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [session.id, teacherActiveTaskId]);

  useEffect(() => {
    if (!profile || !selectedTaskEntry) {
      return;
    }

    const snippet =
      editorCodeByTaskId[selectedTaskEntry.taskId] ?? selectedTaskEntry.task.initialCode ?? "";

    void classroomService
      .updateStudentActivity({
        sessionId: session.id,
        taskId: selectedTaskEntry.taskId,
        status: "active",
        overviewSnippet: snippet,
      })
      .then(() => {
        safeBroadcast({
          type: "student-activity",
          studentId: profile.id,
          currentTaskId: selectedTaskEntry.taskId,
          status: "active",
          snippet,
          helpStatus: helpState === "requested" ? "requested" : "none",
        });
      })
      .catch((error) => {
        console.error("[ClassroomModePage] Failed to persist selected task", error);
      });
  }, [profile, selectedTaskEntry, session.id]);

  const publishActivity = (taskId: string, nextCode: string) => {
    if (!profile) {
      return;
    }

    if (activityTimerRef.current) {
      window.clearTimeout(activityTimerRef.current);
    }

    const snippet = nextCode;
    activityTimerRef.current = window.setTimeout(async () => {
      try {
        await classroomService.updateStudentActivity({
          sessionId: session.id,
          taskId,
          status: "active",
          overviewSnippet: snippet,
        });
        safeBroadcast({
          type: "student-activity",
          studentId: profile.id,
          currentTaskId: taskId,
          status: "active",
          snippet,
          helpStatus: helpState === "requested" ? "requested" : "none",
        });
      } catch (error) {
        console.error("[ClassroomModePage] Failed to publish student activity", error);
      }
    }, 1100);
  };

  const handleRequestHelp = async () => {
    if (!selectedTaskEntry || helpState === "requesting" || helpState === "requested") {
      return;
    }

    setHelpState("requesting");
    try {
      await classroomService.requestHelp({
        sessionId: session.id,
        taskId: selectedTaskEntry.taskId,
      });
      setHelpState("requested");
      safeBroadcast({
        type: "help-requested",
        studentId: profile?.id ?? "",
        taskId: selectedTaskEntry.taskId,
        requestedAt: new Date().toISOString(),
      });
      safeBroadcast({
        type: "student-activity",
        studentId: profile?.id ?? "",
        currentTaskId: selectedTaskEntry.taskId,
        status: "help",
        snippet: selectedTaskCode,
        helpStatus: "requested",
        helpRequestedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[ClassroomModePage] Failed to request help", error);
      setHelpState("idle");
    }
  };

  const classmates = useMemo<SessionStudent[]>(
    () => roster.filter((student) => student.studentId !== profile?.id),
    [profile?.id, roster],
  );

  if (!profile || !selectedTaskEntry || !selectedTask) {
    return (
      <ErrorState
        title="Session Unavailable"
        message="No active task was found for this classroom session."
      />
    );
  }

  return (
    <LabLayout
      sessionCode={session.joinCode}
      sessionTitle={session.title}
      sessionTopic={session.topic}
      nickname={profile.fullName}
      avatarId={profile.avatarUrl || "circle"}
      classmatesCount={roster.length}
      helpState={helpState}
      onRequestHelp={handleRequestHelp}
      broadcastMessage={broadcastMessage}
      pinnedHint={pinnedHint}
      resolvedHelpResponse={
        selectedTaskEntry
          ? resolvedHelpResponsesByTask[selectedTaskEntry.taskId] ?? null
          : null
      }
      currentTaskTitle={selectedTask.title}
      leftPanel={
        <TaskPanel
          task={selectedTask}
          allowHint={controls.allowHint}
          tasks={tasks}
          selectedTaskId={selectedTaskEntry.taskId}
          teacherActiveTaskId={teacherActiveTaskId}
          onSelectTask={setSelectedTaskId}
        />
      }
      centerPanel={
        <CollaborativeEditor
          sessionId={session.id}
          taskId={selectedTaskEntry.taskId}
          workspaceStudentId={profile.id}
          currentUserId={profile.id}
          userName={profile.fullName}
          initialCode={selectedTask.initialCode}
          language={selectedTask.language}
          role="student"
          onChange={(value) =>
            setEditorCodeByTaskId((current) => ({
              ...current,
              [selectedTaskEntry.taskId]: value,
            }))
          }
          onSnippetChange={(value) => publishActivity(selectedTaskEntry.taskId, value)}
        />
      }
      rightPanel={
        <StudentCompilerPanel
          code={selectedTaskCode}
          sessionId={session.id}
          taskId={selectedTaskEntry.taskId}
          task={selectedTask}
          config={controls}
          broadcastMessage={broadcastMessage}
          pinnedHint={pinnedHint}
          panelState={selectedCompilerState}
          onPanelStateChange={(state) =>
            setCompilerStateByTaskId((current) => ({
              ...current,
              [selectedTaskEntry.taskId]: state,
            }))
          }
        />
      }
      classmatesPanel={<ClassmatesPanel students={classmates} />}
    />
  );
};

const ClassroomModePage = () => {
  const { profile } = useAuth();
  const [appState, setAppState] = useState<AppState>("lobby");
  const [errorMessage, setErrorMessage] = useState("");
  const [sessionData, setSessionData] = useState<{
    session: TeacherSession;
    tasks: SessionTask[];
    teacherActiveTaskId: string;
    selectedTaskId: string;
    controls: SessionControls;
    membership?: SessionStudent;
    resolvedHelpResponsesByTask?: Record<string, ResolvedHelpResponse | undefined>;
  } | null>(null);

  const handleJoin = async (joinCode: string) => {
    setAppState("loading");

    try {
      const response = await sessionService.joinSession({
        joinCode,
        studentName: profile?.fullName || "Student",
        avatarId: profile?.avatarUrl || "circle",
      });

      if (
        response.success &&
        response.session &&
        response.tasks &&
        response.activeTask
      ) {
        const teacherActiveTaskId =
          response.session.activeTaskId ?? response.tasks.find((task) => task.isActive)?.taskId ?? "";
        const selectedTaskId = resolveSelectedTaskId(
          response.tasks,
          response.membership?.currentTaskId ?? response.activeTask.id,
          teacherActiveTaskId,
        );

        setSessionData({
          session: response.session,
          tasks: response.tasks,
          teacherActiveTaskId,
          selectedTaskId,
          controls: response.config ?? response.session.controls,
          membership: response.membership,
          resolvedHelpResponsesByTask: response.resolvedHelpResponsesByTask,
        });
        setAppState("lab");
      } else {
        setErrorMessage(response.error || "Failed to join session.");
        setAppState("error");
      }
    } catch (error) {
      setErrorMessage("Network error occurred while joining the session.");
      setAppState("error");
    }
  };

  if (appState === "lobby") {
    return <LobbyScreen onJoin={handleJoin} />;
  }

  if (appState === "loading") {
    return <ClassroomLoader message="Joining classroom..." />;
  }

  if (appState === "error") {
    return (
      <ErrorState
        title="Connection Failed"
        message={errorMessage}
        onRetry={() => setAppState("lobby")}
      />
    );
  }

  if (!sessionData || !profile) {
    return (
      <ErrorState
        title="Session Missing"
        message="No active classroom session was loaded."
        onRetry={() => setAppState("lobby")}
      />
    );
  }

  return (
    <SessionRoomProvider
      id={buildSessionRoomId(sessionData.session.id)}
      initialPresence={{
        currentTaskId: sessionData.selectedTaskId,
        status: "active",
        workspaceStudentId: profile.id,
        mode: null,
      }}
      initialStorage={{
        activeTaskId: sessionData.teacherActiveTaskId,
        broadcastMessage: sessionData.session.broadcastMessage ?? null,
        pinnedHint: sessionData.session.pinnedHint ?? null,
        snippets: {},
        studentStatuses: {},
        helpStatuses: {},
      }}
    >
      <StudentLabSession
        session={sessionData.session}
        initialTasks={sessionData.tasks}
        initialControls={sessionData.controls}
        initialTeacherActiveTaskId={sessionData.teacherActiveTaskId}
        initialSelectedTaskId={sessionData.selectedTaskId}
        initialMembership={sessionData.membership}
        initialResolvedHelpResponsesByTask={sessionData.resolvedHelpResponsesByTask}
      />
    </SessionRoomProvider>
  );
};

export default ClassroomModePage;
