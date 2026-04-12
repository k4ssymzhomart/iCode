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

export type SessionState = "lobby" | "active" | "completed";

export interface SessionConfig {
  runLimit: number;
  correctionLimit: number;
  allowHint: boolean;
  allowExplain: boolean;
  allowCorrect: boolean;
}

export interface LabSession {
  id: string; // Maps to Liveblocks Room ID
  classroomId: string; // Foreign key
  taskId: string;
  state: SessionState;
  config?: SessionConfig;
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

// Tasks
export interface Task {
  id: string;
  title: string;
  description: string;
  initialCode: string;
  testCases: TestCase[];
  language: "python" | "javascript" | "typescript";
}

// Teacher Intervention & Help
export interface HelpRequest {
  id: string;
  sessionId: string;
  studentId: string;
  status: "pending" | "resolved" | "active_intervention";
  requestedAt: string;
}

// API Contracts
export interface JoinSessionRequest {
  joinCode: string;
  studentName: string;
  avatarId?: string;
}

export interface JoinSessionResponse {
  success: boolean;
  sessionId?: string;
  task?: Task;
  config?: SessionConfig;
  error?: string;
  appState?: "unauthorized" | "not_found";
}

export interface RunCodeRequest {
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
