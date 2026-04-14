import { useEffect, useMemo, useRef, useState } from "react";
import type {
  SessionControls,
  SessionStudent,
  SessionTask,
  TeacherSession,
} from "@shared/types";
import LobbyScreen from "@/components/Classroom/Student/LobbyScreen";
import LabLayout from "@/components/Classroom/Student/LabLayout";
import TaskPanel from "@/components/Classroom/Student/TaskPanel";
import CollaborativeEditor from "@/components/Classroom/CollaborativeEditor";
import StudentCompilerPanel from "@/components/Classroom/Student/StudentCompilerPanel";
import ClassmatesPanel from "@/components/Classroom/Student/ClassmatesPanel";
import { LoadingState, ErrorState } from "@/components/ui/app-states";
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

const StudentLabSession = ({
  session,
  initialTasks,
  initialControls,
  initialActiveTaskId,
  initialMembership,
}: {
  session: TeacherSession;
  initialTasks: SessionTask[];
  initialControls: SessionControls;
  initialActiveTaskId: string;
  initialMembership?: SessionStudent;
}) => {
  const { profile } = useAuth();
  const broadcast = useSessionBroadcastEvent();
  const sessionStatus = useSessionStatus();
  const [tasks, setTasks] = useState<SessionTask[]>(initialTasks);
  const [controls, setControls] = useState<SessionControls>(initialControls);
  const [activeTaskId, setActiveTaskId] = useState(initialActiveTaskId);
  const [editorCode, setEditorCode] = useState(
    initialTasks.find((task) => task.taskId === initialActiveTaskId)?.task.initialCode ?? "",
  );
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(
    session.broadcastMessage ?? null,
  );
  const [pinnedHint, setPinnedHint] = useState<string | null>(
    session.pinnedHint ?? null,
  );
  const [helpState, setHelpState] = useState<StudentHelpState>(
    deriveHelpState(initialMembership),
  );
  const activityTimerRef = useRef<number | null>(null);

  const activeTask =
    tasks.find((task) => task.taskId === activeTaskId)?.task ??
    tasks.find((task) => task.isActive)?.task ??
    tasks[0]?.task;

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
      setActiveTaskId(event.taskId);
      return;
    }

    if (event.type === "help-resolved" && event.studentId === profile?.id) {
      setHelpState("resolved");
    }
  });

  useEffect(() => {
    setEditorCode(activeTask?.initialCode ?? "");
  }, [activeTask?.id, activeTask?.initialCode]);

  useEffect(() => {
    let cancelled = false;

    const refreshSession = async () => {
      try {
        const response = await classroomService.getStudentSession(session.id);
        if (cancelled) {
          return;
        }

        setTasks(response.tasks);
        setActiveTaskId(response.session.activeTaskId ?? response.activeTask?.id ?? activeTaskId);
        setBroadcastMessage(response.session.broadcastMessage ?? null);
        setPinnedHint(response.session.pinnedHint ?? null);
        setControls(response.session.controls);
        setHelpState(deriveHelpState(response.membership));
      } catch (error) {
        console.error("[ClassroomModePage] Failed to refresh session", error);
      }
    };

    const interval = window.setInterval(refreshSession, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeTaskId, session.id]);

  const publishActivity = (nextCode: string) => {
    if (!activeTask || !profile) {
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
          taskId: activeTask.id,
          status: "active",
          overviewSnippet: snippet,
        });
        safeBroadcast({
          type: "student-activity",
          studentId: profile.id,
          currentTaskId: activeTask.id,
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
    if (!activeTask || helpState === "requesting" || helpState === "requested") {
      return;
    }

    setHelpState("requesting");
    try {
      await classroomService.requestHelp({ sessionId: session.id, taskId: activeTask.id });
      setHelpState("requested");
      safeBroadcast({
        type: "help-requested",
        studentId: profile?.id ?? "",
        taskId: activeTask.id,
        requestedAt: new Date().toISOString(),
      });
      safeBroadcast({
        type: "student-activity",
        studentId: profile?.id ?? "",
        currentTaskId: activeTask.id,
        status: "help",
        snippet: editorCode,
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

  if (!profile || !activeTask) {
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
      leftPanel={<TaskPanel task={activeTask} allowHint={controls.allowHint} />}
      centerPanel={
        <CollaborativeEditor
          sessionId={session.id}
          taskId={activeTask.id}
          workspaceStudentId={profile.id}
          currentUserId={profile.id}
          userName={profile.fullName}
          initialCode={activeTask.initialCode}
          language={activeTask.language}
          role="student"
          onChange={(value) => setEditorCode(value)}
          onSnippetChange={publishActivity}
        />
      }
      rightPanel={
        <StudentCompilerPanel
          code={editorCode}
          sessionId={session.id}
          taskId={activeTask.id}
          task={activeTask}
          config={controls}
          broadcastMessage={broadcastMessage}
          pinnedHint={pinnedHint}
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
    activeTaskId: string;
    controls: SessionControls;
    membership?: SessionStudent;
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
        setSessionData({
          session: response.session,
          tasks: response.tasks,
          activeTaskId: response.activeTask.id,
          controls: response.config ?? response.session.controls,
          membership: response.membership,
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
    return <LoadingState message="Joining Session..." />;
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
        currentTaskId: sessionData.activeTaskId,
        status: "active",
        workspaceStudentId: profile.id,
        mode: null,
      }}
      initialStorage={{
        activeTaskId: sessionData.activeTaskId,
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
        initialActiveTaskId={sessionData.activeTaskId}
        initialMembership={sessionData.membership}
      />
    </SessionRoomProvider>
  );
};

export default ClassroomModePage;
