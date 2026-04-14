import type {
  EditorIntervention,
  JoinSessionRequest,
  JoinSessionResponse,
  SessionControls,
  SessionStudent,
  Task,
  TaskSetSummary,
  TeacherSession,
  TeacherSessionSnapshot,
  UserProfile,
} from "@shared/types";
import { authorizedJsonFetch } from "./api";

export const classroomService = {
  joinSession(request: JoinSessionRequest) {
    return authorizedJsonFetch<JoinSessionResponse>("/api/classroom/join", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  getStudentSession(sessionId: string) {
    return authorizedJsonFetch<{
      success: boolean;
      session: TeacherSession;
      tasks: TeacherSession["taskSet"];
      activeTask: Task | null;
      membership?: SessionStudent;
    }>(`/api/classroom/session?sessionId=${encodeURIComponent(sessionId)}`);
  },

  updateStudentActivity(payload: {
    sessionId: string;
    taskId: string;
    status?: "joined" | "active" | "idle" | "help" | "resolved" | "completed";
    overviewSnippet?: string;
  }) {
    return authorizedJsonFetch<{ success: boolean }>("/api/classroom/activity", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  loadWorkspace(payload: { sessionId: string; taskId: string; studentId?: string }) {
    const params = new URLSearchParams({
      sessionId: payload.sessionId,
      taskId: payload.taskId,
    });

    if (payload.studentId) {
      params.set("studentId", payload.studentId);
    }

    return authorizedJsonFetch<{
      success: boolean;
      code: string | null;
      updatedAt: string | null;
      revision: number;
      updatedByRole?: "teacher" | "student" | "admin" | null;
    }>(`/api/code/load?${params.toString()}`);
  },

  saveWorkspace(payload: {
    sessionId: string;
    taskId: string;
    code: string;
    studentId?: string;
    revision?: number;
  }) {
    return authorizedJsonFetch<{
      success: boolean;
      revision: number;
      savedAt: string;
    }>("/api/code/save", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  requestHelp(payload: { sessionId: string; taskId?: string }) {
    return authorizedJsonFetch<{ success: boolean }>("/api/help/request", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getTeacherLiveSnapshot() {
    return authorizedJsonFetch<{
      success: boolean;
      snapshot: TeacherSessionSnapshot | null;
    }>("/api/classroom/active");
  },

  listTeacherSessions() {
    return authorizedJsonFetch<{ success: boolean; sessions: TeacherSession[] }>(
      "/api/teacher/sessions",
    );
  },

  createTeacherSession(payload: {
    title: string;
    topic: string;
    description?: string;
    taskSetId: string;
    studentIds: string[];
    controls?: Partial<SessionControls>;
  }) {
    return authorizedJsonFetch<{ success: boolean; session: TeacherSession }>(
      "/api/teacher/sessions",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },

  getTeacherSession(sessionId: string) {
    return authorizedJsonFetch<{ success: boolean; session: TeacherSession }>(
      `/api/teacher/sessions/${encodeURIComponent(sessionId)}`,
    );
  },

  getTeacherSessionDashboard(sessionId: string) {
    return authorizedJsonFetch<{ success: boolean; snapshot: TeacherSessionSnapshot }>(
      `/api/teacher/sessions/${encodeURIComponent(sessionId)}/dashboard`,
    );
  },

  updateTeacherSessionState(sessionId: string, state: TeacherSession["state"]) {
    return authorizedJsonFetch<{ success: boolean; session: TeacherSession }>(
      `/api/teacher/sessions/${encodeURIComponent(sessionId)}/state`,
      {
        method: "PUT",
        body: JSON.stringify({ state }),
      },
    );
  },

  regenerateJoinCode(sessionId: string) {
    return authorizedJsonFetch<{ success: boolean; joinCode: string }>(
      `/api/teacher/sessions/${encodeURIComponent(sessionId)}/regenerate-code`,
      { method: "POST" },
    );
  },

  updateSessionControls(sessionId: string, controls: Partial<SessionControls>) {
    return authorizedJsonFetch<{ success: boolean; session: TeacherSession }>(
      `/api/teacher/sessions/${encodeURIComponent(sessionId)}/controls`,
      {
        method: "PUT",
        body: JSON.stringify({ controls }),
      },
    );
  },

  updateSessionRoster(sessionId: string, studentIds: string[]) {
    return authorizedJsonFetch<{ success: boolean; session: TeacherSession }>(
      `/api/teacher/sessions/${encodeURIComponent(sessionId)}/roster`,
      {
        method: "PUT",
        body: JSON.stringify({ studentIds }),
      },
    );
  },

  updateSessionTasks(sessionId: string, taskIds: string[], activeTaskId?: string) {
    return authorizedJsonFetch<{ success: boolean; session: TeacherSession }>(
      `/api/teacher/sessions/${encodeURIComponent(sessionId)}/tasks`,
      {
        method: "PUT",
        body: JSON.stringify({ taskIds, activeTaskId }),
      },
    );
  },

  switchActiveTask(sessionId: string, taskId: string) {
    return authorizedJsonFetch<{ success: boolean; session: TeacherSession }>(
      `/api/teacher/sessions/${encodeURIComponent(sessionId)}/active-task`,
      {
        method: "POST",
        body: JSON.stringify({ taskId }),
      },
    );
  },

  broadcastMessage(sessionId: string, message: string | null) {
    return authorizedJsonFetch<{ success: boolean; broadcastMessage: string | null }>(
      `/api/teacher/sessions/${encodeURIComponent(sessionId)}/broadcast`,
      {
        method: "POST",
        body: JSON.stringify({ message }),
      },
    );
  },

  pinHint(sessionId: string, hint: string | null) {
    return authorizedJsonFetch<{ success: boolean; pinnedHint: string | null }>(
      `/api/teacher/sessions/${encodeURIComponent(sessionId)}/pinned-hint`,
      {
        method: "POST",
        body: JSON.stringify({ hint }),
      },
    );
  },

  resetStudentCode(sessionId: string, studentId: string, taskId: string) {
    return authorizedJsonFetch<{
      success: boolean;
      code: string;
      revision: number;
    }>(`/api/teacher/sessions/${encodeURIComponent(sessionId)}/reset-student-code`, {
      method: "POST",
      body: JSON.stringify({ studentId, taskId }),
    });
  },

  resolveHelpRequest(sessionId: string, studentId: string) {
    return authorizedJsonFetch<{ success: boolean }>(
      `/api/teacher/sessions/${encodeURIComponent(sessionId)}/help/resolve`,
      {
        method: "POST",
        body: JSON.stringify({ studentId }),
      },
    );
  },

  listTeacherStudents() {
    return authorizedJsonFetch<{ success: boolean; students: UserProfile[] }>(
      "/api/teacher/students",
    );
  },

  listTeacherTaskSets() {
    return authorizedJsonFetch<{ success: boolean; taskSets: TaskSetSummary[] }>(
      "/api/teacher/task-sets",
    );
  },

  importTeacherTaskSet(payload: { fileName: string; content: string }) {
    return authorizedJsonFetch<{
      success: boolean;
      count: number;
      taskSet: TaskSetSummary | null;
    }>("/api/teacher/task-sets/import", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  listTeacherTasks() {
    return authorizedJsonFetch<{ success: boolean; tasks: Task[] }>("/api/teacher/tasks");
  },

  listInterventions(payload: { sessionId: string; studentId?: string; taskId: string }) {
    const params = new URLSearchParams({
      sessionId: payload.sessionId,
      taskId: payload.taskId,
    });

    if (payload.studentId) {
      params.set("studentId", payload.studentId);
    }

    return authorizedJsonFetch<{
      success: boolean;
      interventions: EditorIntervention[];
    }>(`/api/interventions?${params.toString()}`);
  },

  createIntervention(payload: {
    sessionId: string;
    studentId: string;
    taskId: string;
    type: EditorIntervention["type"];
    mode: EditorIntervention["mode"];
    range: EditorIntervention["range"];
    content?: string;
    suggestedCode?: string;
    beforeExcerpt?: string;
    afterExcerpt?: string;
  }) {
    return authorizedJsonFetch<{ success: boolean; intervention: EditorIntervention }>(
      "/api/interventions",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },

  updateInterventionStatus(
    interventionId: string,
    status: EditorIntervention["status"],
    code?: string,
  ) {
    return authorizedJsonFetch<{ success: boolean }>(
      `/api/interventions/${encodeURIComponent(interventionId)}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status, code }),
      },
    );
  },
};
