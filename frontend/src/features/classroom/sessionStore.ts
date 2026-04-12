export interface TeacherSessionData {
  roomId: string;
  sessionId: string;
  studentName: string;
  initialCode?: string;
  task?: string;
  stats?: {
    successRate: number;
    weakness: string;
    strength: string;
  };
}

const storageKey = "icode.teacher-session.v1";

const readSessions = (): Record<string, TeacherSessionData> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Record<string, TeacherSessionData>) : {};
  } catch {
    return {};
  }
};

const writeSessions = (sessions: Record<string, TeacherSessionData>) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(storageKey, JSON.stringify(sessions));
};

export const saveTeacherSession = (session: TeacherSessionData) => {
  const sessions = readSessions();
  sessions[session.roomId] = session;
  writeSessions(sessions);
};

export const loadTeacherSession = (roomId: string) =>
  readSessions()[roomId] ?? null;

export const buildFallbackTeacherSession = (
  roomId: string,
): TeacherSessionData => ({
  roomId,
  sessionId: roomId.split('_')[1] || roomId,
  studentName: "Student",
  task: "Review current progress and guide the next step.",
  stats: {
    successRate: 72,
    weakness: "Tracing logic",
    strength: "Persistence",
  },
});
