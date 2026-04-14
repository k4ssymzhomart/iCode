import { useEffect, useMemo, useState } from "react";
import type {
  StudentOverview,
  TaskSetSummary,
  TeacherSession,
  TeacherSessionSnapshot,
  UserProfile,
} from "@shared/types";
import { MonitorPlay } from "lucide-react";
import { appPaths } from "@/app/paths";
import { useNavigate, useRoute } from "@/lib/router";
import {
  buildSessionRoomId,
  SessionRoomProvider,
  useSessionBroadcastEvent,
  useSessionEventListener,
} from "@/lib/liveblocks";
import { classroomService } from "@/services/classroom";
import { authService } from "@/services/auth";
import { LoadingState } from "@/components/ui/app-states";
import TeacherSidebar from "./Teacher/TeacherSidebar";
import TopStrip from "./Teacher/TopStrip";
import ClassroomGrid from "./Teacher/ClassroomGrid";
import HelpAndStatsRail from "./Teacher/HelpAndStatsRail";
import AnalyticsView from "./Teacher/AnalyticsView";
import StudentDetailPanel from "./Teacher/StudentDetailPanel";
import StudentsManager from "./Teacher/StudentsManager";
import MaterialsManager from "./Teacher/MaterialsManager";
import SessionsManager from "./Teacher/SessionsManager";
import { type StudentData } from "./Teacher/mockData";

const palette = [
  "bg-[#ccff00]",
  "bg-cyan-300",
  "bg-orange-400",
  "bg-rose-300",
  "bg-sky-300",
  "bg-emerald-300",
];

const mapStudentStatus = (student: StudentOverview): StudentData["status"] => {
  if (student.completed) {
    return "solved";
  }

  if (student.helpStatus === "requested" || student.status === "help") {
    return "needs-help";
  }

  if (student.status === "idle") {
    return "stuck";
  }

  if (student.status === "offline") {
    return "offline";
  }

  return "coding";
};

const mapOverviewToStudentCard = (student: StudentOverview, index: number): StudentData => ({
  id: student.studentId,
  name: student.profile?.fullName ?? "Student",
  avatarUrl: student.profile?.avatarUrl,
  avatarColor: palette[index % palette.length],
  avatarShape: "circle",
  status: mapStudentStatus(student),
  currentTask: student.currentTaskTitle ?? "No active task",
  currentTaskId: student.currentTaskId,
  timeSpent: student.totalTimeSeconds,
  attempts: student.runAttempts,
  correctionsUsed: student.correctionsUsed,
  mockCode: student.currentCodeSnippet,
  currentCodeSnippet: student.currentCodeSnippet,
  lastError: student.lastError ?? null,
  helpRequestedAt: student.helpRequestedAt ? new Date(student.helpRequestedAt) : null,
  successRate: student.successRate,
  pendingInterventionCount: student.pendingInterventionCount,
  lastActivityAt: student.lastActivityAt,
});

const mapProfileToStudentRow = (student: UserProfile, index: number): StudentData => ({
  id: student.id,
  name: student.fullName,
  avatarUrl: student.avatarUrl,
  avatarColor: palette[index % palette.length],
  avatarShape: "circle",
  status: "offline",
  currentTask: "-",
  timeSpent: 0,
  attempts: 0,
  correctionsUsed: 0,
  mockCode: "",
  currentCodeSnippet: "",
  lastError: null,
  helpRequestedAt: null,
  successRate: 0,
});

const TeacherLiveDashboard = ({
  snapshot,
  isRightRailCollapsed,
  onToggleRightRail,
  onRefresh,
  onSelectStudent,
  selectedStudentId,
}: {
  snapshot: TeacherSessionSnapshot;
  isRightRailCollapsed: boolean;
  onToggleRightRail: () => void;
  onRefresh: () => Promise<void>;
  onSelectStudent: (studentId: string | null) => void;
  selectedStudentId: string | null;
}) => {
  const navigate = useNavigate();
  const broadcast = useSessionBroadcastEvent();
  const [students, setStudents] = useState<StudentData[]>(
    snapshot.students.map(mapOverviewToStudentCard),
  );

  useEffect(() => {
    setStudents(snapshot.students.map(mapOverviewToStudentCard));
  }, [snapshot.students]);

  useSessionEventListener(({ event }) => {
    if (event.type === "student-activity") {
      setStudents((current) =>
        current.map((student) =>
          student.id === event.studentId
            ? {
                ...student,
                status:
                  event.helpStatus === "requested"
                    ? "needs-help"
                    : event.status === "idle"
                      ? "stuck"
                      : event.status === "help"
                        ? "needs-help"
                        : "coding",
                currentTaskId: event.currentTaskId ?? student.currentTaskId,
                currentCodeSnippet: event.snippet ?? student.currentCodeSnippet,
                mockCode: event.snippet ?? student.mockCode,
                helpRequestedAt: event.helpRequestedAt
                  ? new Date(event.helpRequestedAt)
                  : student.helpRequestedAt,
              }
            : student,
        ),
      );
      return;
    }

    if (event.type === "help-requested") {
      setStudents((current) =>
        current.map((student) =>
          student.id === event.studentId
            ? {
                ...student,
                status: "needs-help",
                helpRequestedAt: new Date(event.requestedAt),
              }
            : student,
        ),
      );
      return;
    }

    if (event.type === "help-resolved") {
      setStudents((current) =>
        current.map((student) =>
          student.id === event.studentId
            ? {
                ...student,
                status: "coding",
                helpRequestedAt: null,
              }
            : student,
        ),
      );
      return;
    }

    if (event.type === "active-task") {
      void onRefresh();
    }
  });

  const activeCount = students.filter((student) => student.status === "coding").length;
  const stuckCount = students.filter((student) => student.status === "stuck").length;
  const helpCount = students.filter((student) => student.status === "needs-help").length;
  const avgTimeRaw =
    students.length > 0
      ? students.reduce((sum, student) => sum + student.timeSpent, 0) / students.length
      : 0;
  const avgTime = `${Math.floor(avgTimeRaw / 60)}m ${Math.floor(avgTimeRaw % 60)}s`;
  const selectedStudent = students.find((student) => student.id === selectedStudentId);

  const handleIntervene = (type: string, studentId: string) => {
    const targetStudent = students.find((student) => student.id === studentId);
    const targetTaskId = targetStudent?.currentTaskId ?? snapshot.session.activeTaskId;
    if (!targetTaskId) {
      return;
    }

    if (type === "join") {
      navigate(appPaths.teacherSession(snapshot.session.id, studentId, targetTaskId));
    }
  };

  return (
    <>
      <TopStrip
        sessionCode={snapshot.session.joinCode}
        topic={snapshot.session.topic}
        sessionState={snapshot.session.state}
        startTime={snapshot.session.startTime}
        tasks={snapshot.session.taskSet}
        activeTaskId={snapshot.session.activeTaskId}
        totalStudents={students.length}
        activeCount={activeCount}
        stuckCount={stuckCount}
        helpCount={helpCount}
        avgTime={avgTime}
        onStateChange={async (nextState) => {
          await classroomService.updateTeacherSessionState(snapshot.session.id, nextState);
          await onRefresh();
        }}
        onRegenerateCode={async () => {
          await classroomService.regenerateJoinCode(snapshot.session.id);
          await onRefresh();
        }}
        onActiveTaskChange={async (taskId) => {
          await classroomService.switchActiveTask(snapshot.session.id, taskId);
          broadcast({ type: "active-task", taskId });
          await onRefresh();
        }}
        onBroadcastMessage={async () => {
          const message = window.prompt(
            "Broadcast a message to the whole session:",
            snapshot.session.broadcastMessage ?? "",
          );
          if (message === null) {
            return;
          }
          await classroomService.broadcastMessage(snapshot.session.id, message.trim() || null);
          broadcast({ type: "broadcast-message", message: message.trim() || null });
          await onRefresh();
        }}
        onPinHint={async () => {
          const hint = window.prompt(
            "Pin a hint for the class:",
            snapshot.session.pinnedHint ?? "",
          );
          if (hint === null) {
            return;
          }
          await classroomService.pinHint(snapshot.session.id, hint.trim() || null);
          broadcast({ type: "pinned-hint", hint: hint.trim() || null });
          await onRefresh();
        }}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <ClassroomGrid
            students={students}
            onSelectStudent={(student) => onSelectStudent(student.id)}
          />
        </div>
        <HelpAndStatsRail
          students={students}
          onSelectStudent={(id) => onSelectStudent(id)}
          isCollapsed={isRightRailCollapsed}
          onToggle={onToggleRightRail}
        />

        {selectedStudent ? (
          <StudentDetailPanel
            student={selectedStudent}
            sessionId={snapshot.session.id}
            taskId={selectedStudent.currentTaskId ?? snapshot.session.activeTaskId}
            onClose={() => onSelectStudent(null)}
            onIntervene={handleIntervene}
          />
        ) : null}
      </div>
    </>
  );
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const route = useRoute();
  const activeView = route.name === "teacher" ? route.view : "lab";
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [liveSnapshot, setLiveSnapshot] = useState<TeacherSessionSnapshot | null>(null);
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [teacherStudents, setTeacherStudents] = useState<UserProfile[]>([]);
  const [teacherTaskSets, setTeacherTaskSets] = useState<TaskSetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTeacherData = async () => {
    setIsLoading(true);
    try {
      const [liveResponse, sessionsResponse, studentsResponse, taskSetsResponse] = await Promise.all([
        classroomService.getTeacherLiveSnapshot(),
        classroomService.listTeacherSessions(),
        classroomService.listTeacherStudents(),
        classroomService.listTeacherTaskSets(),
      ]);

      setLiveSnapshot(liveResponse.snapshot);
      setSessions(sessionsResponse.sessions);
      setTeacherStudents(studentsResponse.students);
      setTeacherTaskSets(taskSetsResponse.taskSets);
    } catch (error) {
      console.error("[TeacherDashboard] Failed to refresh teacher data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshTeacherData();
  }, []);

  const studentRows = useMemo(
    () => teacherStudents.map(mapProfileToStudentRow),
    [teacherStudents],
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white selection:bg-[#ccff00] selection:text-[#11110f]">
      <TeacherSidebar
        isCollapsed={isSidebarCollapsed}
        activeView={activeView}
        onToggle={() => setSidebarCollapsed((current) => !current)}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        {activeView === "lab" && liveSnapshot ? (
          <SessionRoomProvider
            id={buildSessionRoomId(liveSnapshot.session.id)}
            initialPresence={{
              currentTaskId: liveSnapshot.session.activeTaskId ?? null,
              status: "active",
              workspaceStudentId: null,
              mode: "view",
            }}
            initialStorage={{
              activeTaskId: liveSnapshot.session.activeTaskId ?? null,
              broadcastMessage: liveSnapshot.session.broadcastMessage ?? null,
              pinnedHint: liveSnapshot.session.pinnedHint ?? null,
              snippets: {},
              studentStatuses: {},
              helpStatuses: {},
            }}
          >
            <TeacherLiveDashboard
              snapshot={liveSnapshot}
              isRightRailCollapsed={isRightRailCollapsed}
              onToggleRightRail={() => setRightRailCollapsed((current) => !current)}
              onRefresh={refreshTeacherData}
              onSelectStudent={setSelectedStudentId}
              selectedStudentId={selectedStudentId}
            />
          </SessionRoomProvider>
        ) : null}

        {activeView === "lab" && !liveSnapshot ? (
          <div className="flex flex-1 items-center justify-center bg-[#fafafa] p-8">
            <div className="max-w-xl border-2 border-[#11110f] bg-white p-10 text-center shadow-[8px_8px_0_#11110f]">
              <MonitorPlay className="mx-auto mb-4 h-8 w-8 text-[#ccff00]" />
              <h2 className="text-2xl font-black uppercase tracking-tight text-[#11110f]">
                No Live Session
              </h2>
              <p className="mt-3 text-sm font-medium text-gray-500">
                Create a teacher-owned session and start it live to monitor code, help requests, and task progress in real time.
              </p>
              <button
                type="button"
                onClick={() => navigate(appPaths.teacherSessions)}
                className="mt-6 border-2 border-[#11110f] bg-[#ccff00] px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#11110f] shadow-[4px_4px_0_#11110f]"
              >
                Open Session Manager
              </button>
            </div>
          </div>
        ) : null}

        {activeView === "analytics" ? (
          <div className="flex-1 overflow-hidden">
            <AnalyticsView
              students={(liveSnapshot?.students ?? []).map(mapOverviewToStudentCard)}
            />
          </div>
        ) : null}

        {activeView === "students" ? (
          <div className="flex-1 overflow-hidden">
            <StudentsManager students={studentRows} />
          </div>
        ) : null}

        {activeView === "materials" ? (
          <div className="flex-1 overflow-y-auto">
            <MaterialsManager
              taskSets={teacherTaskSets}
              onImport={async (payload) => {
                await classroomService.importTeacherTaskSet(payload);
                await refreshTeacherData();
              }}
            />
          </div>
        ) : null}

        {activeView === "sessions" ? (
          <div className="flex-1 overflow-y-auto">
            <SessionsManager
              sessions={sessions}
              taskSets={teacherTaskSets}
              students={teacherStudents}
              onCreateSession={async (payload) => {
                await classroomService.createTeacherSession(payload);
                await refreshTeacherData();
              }}
              onChangeState={async (sessionId, nextState) => {
                await classroomService.updateTeacherSessionState(sessionId, nextState);
                await refreshTeacherData();
              }}
              onRegenerateCode={async (sessionId) => {
                await classroomService.regenerateJoinCode(sessionId);
                await refreshTeacherData();
              }}
            />
          </div>
        ) : null}

        {activeView === "settings" ? (
          <div className="flex flex-1 flex-col bg-[#fafafa] p-8">
            <h2 className="mb-8 text-2xl font-black uppercase tracking-tight text-[#11110f]">
              Settings
            </h2>
            <div className="flex max-w-xl flex-col gap-6 border-[3px] border-[#11110f] bg-white p-8 shadow-[8px_8px_0_#11110f]">
              <div>
                <h3 className="mb-2 text-lg font-bold">Account Management</h3>
                <p className="mb-6 text-sm font-medium text-gray-500">
                  You are currently signed in as a teacher. Signing out will securely end your session and return you to the main portal.
                </p>
                <button
                  onClick={() => authService.signOut()}
                  className="inline-flex items-center gap-2 border-[3px] border-[#11110f] bg-rose-500 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-[4px_4px_0_#11110f] transition-colors hover:bg-rose-600"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isLoading && !liveSnapshot && activeView !== "settings" ? (
          <div className="absolute inset-0 z-20 flex bg-white justify-center items-center">
            <LoadingState message="Loading Teacher Data..." />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TeacherDashboard;
