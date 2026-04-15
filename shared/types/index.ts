// Core Entities
export type UserRole = "student" | "teacher" | "admin";

export interface UserProfile {
  id: string; // Maps to Firebase UID
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

// Classroom & Sessions
export interface Classroom {
  id: string; // UUID
  teacherId: string; // Foreign key to UserProfile
  name: string;
  joinCode: string;
  activeTaskId?: string;
  createdAt: string;
}

export type SessionState = "draft" | "live" | "paused" | "completed";
export type SessionStudentStatus =
  | "offline"
  | "joined"
  | "active"
  | "idle"
  | "help"
  | "resolved"
  | "completed";
export type HelpRequestStatus = "pending" | "active_intervention" | "resolved";
export type HelpStatus = "none" | "requested" | "active" | "resolved";
export type TeacherFocusMode = "view" | "edit";
export type TeacherInterventionMode = "view" | "suggest" | "edit";
export type EditorInterventionType =
  | "comment"
  | "highlight"
  | "suggestion"
  | "direct_edit";
export type EditorInterventionStatus =
  | "open"
  | "accepted"
  | "rejected"
  | "resolved";

export interface SessionControls {
  allowRun: boolean;
  runLimit: number;
  correctionLimit: number;
  allowHint: boolean;
  allowExplain: boolean;
  allowCorrect: boolean;
}

export type SessionConfig = SessionControls;

export interface LabSession {
  id: string; // Maps to Liveblocks Room ID
  classroomId: string; // Foreign key
  teacherId?: string;
  title?: string;
  topic?: string;
  description?: string;
  joinCode?: string;
  taskSetId?: string;
  taskId: string;
  activeTaskId?: string;
  state: SessionState;
  controls?: SessionControls;
  broadcastMessage?: string | null;
  pinnedHint?: string | null;
  startTime?: string;
  endTime?: string;
}

export interface StudentMetric {
  id: string;
  sessionId: string;
  taskId: string;
  studentId: string;
  runAttempts: number;
  correctionsUsed: number;
  hintsUsed: number;
  explainUsed: number;
  totalTimeSeconds: number;
  completed: boolean;
  completedAt?: string;
  // Included profile mapping for leaderboard rendering
  profile?: {
    fullName: string;
    avatarUrl?: string;
  };
}

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface LogicStep {
  id: string;
  title: string;
  description: string;
}

// Tasks
export interface Task {
  id: string;
  title: string;
  description: string;
  initialCode: string;
  testCases: TestCase[];
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string[];
  language: "python" | "javascript" | "typescript";
  difficulty?: "Easy" | "Medium" | "Hard";
  logicSteps?: LogicStep[];
}

export type TaskSetSourceType = "json_import" | "legacy_single_task";

export interface TaskSetSummary {
  id: string;
  title: string;
  topic: string;
  description: string;
  language: Task["language"];
  taskCount: number;
  sourceType: TaskSetSourceType;
}

export interface TaskSetDetail extends TaskSetSummary {
  tasks: Task[];
}

export interface SessionTask {
  id: string;
  sessionId: string;
  taskId: string;
  position: number;
  isActive: boolean;
  task: Task;
}

export interface SessionStudent {
  sessionId: string;
  studentId: string;
  status: SessionStudentStatus;
  helpStatus: HelpStatus;
  joinedAt?: string;
  lastActivityAt?: string;
  currentTaskId?: string;
  overviewSnippet?: string;
  helpRequestedAt?: string | null;
  profile?: {
    fullName: string;
    avatarUrl?: string;
  };
}

export interface TeacherSession {
  id: string;
  teacherId: string;
  classroomId?: string;
  title: string;
  topic: string;
  description?: string;
  joinCode: string;
  taskSetId?: string;
  state: SessionState;
  activeTaskId?: string;
  controls: SessionControls;
  broadcastMessage?: string | null;
  pinnedHint?: string | null;
  createdAt: string;
  startTime?: string;
  endTime?: string;
  taskSet: SessionTask[];
  roster?: SessionStudent[];
}

export interface StudentOverview extends SessionStudent {
  currentTaskTitle?: string;
  runAttempts: number;
  correctionsUsed: number;
  hintsUsed: number;
  explainUsed: number;
  totalTimeSeconds: number;
  completed: boolean;
  completedAt?: string;
  successRate: number;
  currentCodeSnippet: string;
  pendingInterventionCount: number;
  lastError?: string | null;
}

export interface EditorRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface EditorIntervention {
  id: string;
  sessionId: string;
  taskId: string;
  studentId: string;
  teacherId: string;
  type: EditorInterventionType;
  status: EditorInterventionStatus;
  mode: TeacherInterventionMode;
  range: EditorRange;
  content?: string;
  suggestedCode?: string;
  beforeExcerpt?: string;
  afterExcerpt?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

// Teacher Intervention & Help
export interface HelpRequest {
  id: string;
  sessionId: string;
  studentId: string;
  taskId?: string;
  status: HelpRequestStatus;
  requestedAt: string;
  resolvedAt?: string;
}

export type TeacherHelpNote = {
  id: string;
  sender: "teacher";
  text: string;
  createdAt: string;
};

export type ResolvedHelpResponse = {
  requestId: string;
  taskId: string;
  resolvedAt: string;
  notes: TeacherHelpNote[];
};

// API Contracts
export interface JoinSessionRequest {
  joinCode: string;
  studentName: string;
  avatarId?: string;
}

export interface JoinSessionResponse {
  success: boolean;
  sessionId?: string;
  session?: TeacherSession;
  task?: Task;
  activeTask?: Task;
  tasks?: SessionTask[];
  membership?: SessionStudent;
  resolvedHelpResponsesByTask?: Record<string, ResolvedHelpResponse | undefined>;
  config?: SessionControls;
  error?: string;
  appState?: "unauthorized" | "not_found" | "forbidden";
}

export interface RunCodeRequest {
  sessionId?: string;
  code: string;
  language: string;
  taskId: string;
}

export interface RunCodeResponse {
  success: boolean;
  output: string;
  passedCount: number;
  totalCount: number;
  suggestions?: string[];
  error?: string;
}

export interface TeacherSessionSnapshot {
  session: TeacherSession;
  students: StudentOverview[];
  helpRequests: HelpRequest[];
}
