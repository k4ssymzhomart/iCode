import { randomUUID } from "node:crypto";
import {
  EditorIntervention,
  HelpRequest,
  ResolvedHelpResponse,
  SessionControls,
  SessionStudent,
  SessionState,
  SessionTask,
  StudentOverview,
  Task,
  TeacherHelpNote,
  TaskSetDetail,
  TaskSetSourceType,
  TaskSetSummary,
  UserRole,
  TeacherSession,
  TeacherSessionSnapshot,
} from "../../../shared/types";
import { supabaseAdmin } from "../supabaseClient";

type AppState = "unauthorized" | "not_found" | "forbidden";

export class HttpError extends Error {
  status: number;
  appState?: AppState;

  constructor(status: number, message: string, appState?: AppState) {
    super(message);
    this.status = status;
    this.appState = appState;
  }
}

export const getUserRole = async (userId: string): Promise<UserRole> => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, `Failed to load user role: ${error.message}`);
  }

  if (!data?.role) {
    throw new HttpError(401, "Profile not found.", "unauthorized");
  }

  return data.role;
};

export const assertUserRole = async (userId: string, allowedRoles: UserRole[]) => {
  const role = await getUserRole(userId);
  if (!allowedRoles.includes(role)) {
    throw new HttpError(403, "You are not allowed to perform this action.", "forbidden");
  }
  return role;
};

export const defaultSessionControls: SessionControls = {
  allowRun: true,
  runLimit: -1,
  correctionLimit: -1,
  allowHint: true,
  allowExplain: true,
  allowCorrect: true,
};

const allowedTransitions: Record<SessionState, SessionState[]> = {
  draft: ["live"],
  live: ["paused", "completed"],
  paused: ["live", "completed"],
  completed: [],
};

const validSessionStates = new Set<SessionState>([
  "draft",
  "live",
  "paused",
  "completed",
]);

const validStudentStatuses = new Set<SessionStudent["status"]>([
  "offline",
  "joined",
  "active",
  "idle",
  "help",
  "resolved",
  "completed",
]);

const validHelpStatuses = new Set<SessionStudent["helpStatus"]>([
  "none",
  "requested",
  "active",
  "resolved",
]);

const validInterventionTypes = new Set<EditorIntervention["type"]>([
  "comment",
  "highlight",
  "suggestion",
  "direct_edit",
]);

const validInterventionStatuses = new Set<EditorIntervention["status"]>([
  "open",
  "accepted",
  "rejected",
  "resolved",
]);

const validInterventionModes = new Set<EditorIntervention["mode"]>([
  "view",
  "suggest",
  "edit",
]);

const validTaskDifficulty = new Set<NonNullable<Task["difficulty"]>>([
  "Easy",
  "Medium",
  "Hard",
]);

const validTaskLanguages = new Set<Task["language"]>([
  "python",
  "javascript",
  "typescript",
]);

const validTaskSetSourceTypes = new Set<TaskSetSourceType>([
  "json_import",
  "legacy_single_task",
]);

const HELP_RESPONSE_INTERVENTION_PREFIX = "__icode_help_response__:";

const toSessionState = (value: unknown): SessionState => {
  if (typeof value === "string" && validSessionStates.has(value as SessionState)) {
    return value as SessionState;
  }

  if (value === "active") {
    return "live";
  }

  if (value === "lobby") {
    return "draft";
  }

  return "draft";
};

const toStudentStatus = (value: unknown): SessionStudent["status"] => {
  if (typeof value === "string" && validStudentStatuses.has(value as SessionStudent["status"])) {
    return value as SessionStudent["status"];
  }

  return "offline";
};

const toHelpStatus = (value: unknown): SessionStudent["helpStatus"] => {
  if (typeof value === "string" && validHelpStatuses.has(value as SessionStudent["helpStatus"])) {
    return value as SessionStudent["helpStatus"];
  }

  return "none";
};

const toTaskDifficulty = (value: unknown): Task["difficulty"] | undefined => {
  if (typeof value === "string" && validTaskDifficulty.has(value as NonNullable<Task["difficulty"]>)) {
    return value as Task["difficulty"];
  }

  return undefined;
};

export const toTaskLanguage = (value: unknown): Task["language"] => {
  if (typeof value === "string" && validTaskLanguages.has(value as Task["language"])) {
    return value as Task["language"];
  }

  return "python";
};

const toTaskSetSourceType = (value: unknown): TaskSetSourceType => {
  if (
    typeof value === "string" &&
    validTaskSetSourceTypes.has(value as TaskSetSourceType)
  ) {
    return value as TaskSetSourceType;
  }

  return "json_import";
};

const toInterventionType = (value: unknown): EditorIntervention["type"] => {
  if (typeof value === "string" && validInterventionTypes.has(value as EditorIntervention["type"])) {
    return value as EditorIntervention["type"];
  }

  return "comment";
};

const toInterventionStatus = (value: unknown): EditorIntervention["status"] => {
  if (typeof value === "string" && validInterventionStatuses.has(value as EditorIntervention["status"])) {
    return value as EditorIntervention["status"];
  }

  return "open";
};

const toInterventionMode = (value: unknown): EditorIntervention["mode"] => {
  if (typeof value === "string" && validInterventionModes.has(value as EditorIntervention["mode"])) {
    return value as EditorIntervention["mode"];
  }

  return "view";
};

export const normalizeSessionControls = (value: unknown): SessionControls => {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  const numberOrDefault = (field: string, fallback: number) => {
    const nextValue = source[field];
    return typeof nextValue === "number" && Number.isFinite(nextValue) ? nextValue : fallback;
  };

  return {
    allowRun: source.allowRun !== false,
    runLimit: numberOrDefault("runLimit", -1),
    correctionLimit: numberOrDefault("correctionLimit", -1),
    allowHint: source.allowHint !== false,
    allowExplain: source.allowExplain !== false,
    allowCorrect: source.allowCorrect !== false,
  };
};

export const buildOverviewSnippet = (code: string, maxLength = 180) =>
  code
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, maxLength)
    .trim();

const mapTaskRow = (row: any): Task => ({
  id: row.id,
  title: row.title,
  description: row.description,
  initialCode: row.initial_code,
  testCases: Array.isArray(row.test_cases) ? row.test_cases : [],
  inputFormat: row.input_format ?? undefined,
  outputFormat: row.output_format ?? undefined,
  constraints: Array.isArray(row.constraints) ? row.constraints : [],
  language: toTaskLanguage(row.language),
  difficulty: toTaskDifficulty(row.difficulty),
  logicSteps: Array.isArray(row.logic_steps) ? row.logic_steps : [],
});

const mapTaskSetSummaryRow = (row: any): TaskSetSummary => ({
  id: row.id,
  title: row.title,
  topic: row.topic,
  description: row.description ?? "",
  language: toTaskLanguage(row.language),
  taskCount: Array.isArray(row.task_set_tasks)
    ? row.task_set_tasks.length
    : Number(row.task_count ?? 0),
  sourceType: toTaskSetSourceType(row.source_type),
});

const mapSessionStudentRow = (row: any): SessionStudent => ({
  sessionId: row.session_id,
  studentId: row.student_id,
  status: toStudentStatus(row.status),
  helpStatus: toHelpStatus(row.help_status),
  joinedAt: row.joined_at ?? undefined,
  lastActivityAt: row.last_activity_at ?? undefined,
  currentTaskId: row.current_task_id ?? undefined,
  overviewSnippet: row.overview_snippet ?? undefined,
  helpRequestedAt: row.help_requested_at ?? undefined,
  profile: row.profiles
    ? {
        fullName: row.profiles.full_name,
        avatarUrl: row.profiles.avatar_url ?? undefined,
      }
    : undefined,
});

const mapInterventionRow = (row: any): EditorIntervention => ({
  id: row.id,
  sessionId: row.session_id,
  taskId: row.task_id,
  studentId: row.student_id,
  teacherId: row.teacher_id,
  type: toInterventionType(row.type),
  status: toInterventionStatus(row.status),
  mode: toInterventionMode(row.mode),
  range: row.range ?? {
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: 1,
    endColumn: 1,
  },
  content: row.content ?? undefined,
  suggestedCode: row.suggested_code ?? undefined,
  beforeExcerpt: row.before_excerpt ?? undefined,
  afterExcerpt: row.after_excerpt ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  resolvedAt: row.resolved_at ?? undefined,
});

const mapHelpRequestRow = (row: any): HelpRequest => ({
  id: row.id,
  sessionId: row.session_id,
  studentId: row.student_id,
  taskId: row.task_id ?? undefined,
  status: row.status,
  requestedAt: row.requested_at,
  resolvedAt: row.resolved_at ?? undefined,
});

const normalizeTeacherHelpNotes = (value: unknown): TeacherHelpNote[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const note = entry as Record<string, unknown>;
    const text = typeof note.text === "string" ? note.text.trim() : "";
    if (!text) {
      return [];
    }

    return [
      {
        id:
          typeof note.id === "string" && note.id.trim()
            ? note.id
            : randomUUID(),
        sender: "teacher",
        text,
        createdAt:
          typeof note.createdAt === "string" && note.createdAt.trim()
            ? note.createdAt
            : new Date().toISOString(),
      } satisfies TeacherHelpNote,
    ];
  });
};

export const toTeacherHelpNotes = (value: unknown) => normalizeTeacherHelpNotes(value);

const encodeLegacyHelpResponseNotes = (notes: TeacherHelpNote[]) =>
  `${HELP_RESPONSE_INTERVENTION_PREFIX}${JSON.stringify(notes)}`;

const decodeLegacyHelpResponseNotes = (value: unknown) => {
  if (typeof value !== "string" || !value.startsWith(HELP_RESPONSE_INTERVENTION_PREFIX)) {
    return [];
  }

  try {
    return normalizeTeacherHelpNotes(
      JSON.parse(value.slice(HELP_RESPONSE_INTERVENTION_PREFIX.length)),
    );
  } catch {
    return [];
  }
};

export const isMissingHelpResponseColumnsError = (error: { message?: string; details?: string; hint?: string } | null | undefined) => {
  const text = [error?.message, error?.details, error?.hint].filter(Boolean).join(" ");
  return /resolution_notes|resolved_by_teacher_id/i.test(text);
};

export const toResolvedHelpResponse = (row: any): ResolvedHelpResponse | null => {
  if (!row?.id || !row?.task_id || !row?.resolved_at) {
    return null;
  }

  return {
    requestId: row.id,
    taskId: row.task_id,
    resolvedAt: row.resolved_at,
    notes: normalizeTeacherHelpNotes(row.resolution_notes),
  };
};

const toLegacyResolvedHelpResponse = (row: any): ResolvedHelpResponse | null => {
  if (!row?.id || !row?.task_id || !row?.resolved_at) {
    return null;
  }

  return {
    requestId: row.id,
    taskId: row.task_id,
    resolvedAt: row.resolved_at,
    notes: decodeLegacyHelpResponseNotes(row.content),
  };
};

const mapSessionRow = (
  row: any,
  taskSet: SessionTask[],
  roster: SessionStudent[] = [],
): TeacherSession => ({
  id: row.id,
  teacherId: row.teacher_id,
  classroomId: row.classroom_id ?? undefined,
  title: row.title || row.topic || "Untitled Session",
  topic: row.topic || "Untitled Session",
  description: row.description ?? "",
  joinCode: row.join_code || "",
  taskSetId: row.task_set_id ?? undefined,
  state: toSessionState(row.state),
  activeTaskId: row.active_task_id ?? row.task_id ?? undefined,
  controls: normalizeSessionControls(row.controls ?? row.config),
  broadcastMessage: row.broadcast_message ?? null,
  pinnedHint: row.pinned_hint ?? null,
  createdAt: row.created_at ?? row.start_time ?? new Date().toISOString(),
  startTime: row.start_time ?? undefined,
  endTime: row.end_time ?? undefined,
  taskSet,
  roster,
});

const fetchTasksByIds = async (taskIds: string[]) => {
  if (taskIds.length === 0) {
    return new Map<string, Task>();
  }

  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .in("id", taskIds);

  if (error) {
    throw new HttpError(500, `Failed to load tasks: ${error.message}`);
  }

  const tasks = new Map<string, Task>();
  for (const row of data ?? []) {
    tasks.set(row.id, mapTaskRow(row));
  }

  return tasks;
};

export const listTaskSets = async (): Promise<TaskSetSummary[]> => {
  const { data, error } = await supabaseAdmin
    .from("task_sets")
    .select(`
      id,
      title,
      topic,
      description,
      language,
      source_type,
      created_at,
      task_set_tasks (
        task_id
      )
    `)
    .order("created_at", { ascending: false })
    .order("title", { ascending: true });

  if (error) {
    throw new HttpError(500, `Failed to list task sets: ${error.message}`);
  }

  return (data ?? []).map(mapTaskSetSummaryRow);
};

export const loadTaskSetSummary = async (taskSetId: string): Promise<TaskSetSummary> => {
  const { data, error } = await supabaseAdmin
    .from("task_sets")
    .select(`
      id,
      title,
      topic,
      description,
      language,
      source_type,
      task_set_tasks (
        task_id
      )
    `)
    .eq("id", taskSetId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, `Failed to load task set: ${error.message}`);
  }

  if (!data) {
    throw new HttpError(404, "Task set not found.", "not_found");
  }

  return mapTaskSetSummaryRow(data);
};

export const getTaskSetTaskIds = async (taskSetId: string): Promise<string[]> => {
  const { data, error } = await supabaseAdmin
    .from("task_set_tasks")
    .select("task_id, position")
    .eq("task_set_id", taskSetId)
    .order("position", { ascending: true });

  if (error) {
    throw new HttpError(500, `Failed to load task set tasks: ${error.message}`);
  }

  const taskIds = (data ?? []).map((row) => row.task_id).filter(Boolean);
  if (taskIds.length === 0) {
    throw new HttpError(400, "Selected task set does not contain any tasks.");
  }

  return taskIds;
};

export const loadTaskSetDetail = async (taskSetId: string): Promise<TaskSetDetail> => {
  const [summary, taskIds] = await Promise.all([
    loadTaskSetSummary(taskSetId),
    getTaskSetTaskIds(taskSetId),
  ]);

  const taskMap = await fetchTasksByIds(taskIds);
  const tasks = taskIds
    .map((taskId) => taskMap.get(taskId))
    .filter((task): task is Task => Boolean(task));

  if (tasks.length !== taskIds.length) {
    throw new HttpError(500, "Task set references one or more missing tasks.");
  }

  return {
    ...summary,
    tasks,
  };
};

export const createSessionId = () => `session_${randomUUID()}`;

export const generateJoinCode = async () => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const joinCode = Math.floor(10000 + Math.random() * 90000).toString();
    const { data, error } = await supabaseAdmin
      .from("lab_sessions")
      .select("id")
      .eq("join_code", joinCode)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new HttpError(500, `Failed to validate join code uniqueness: ${error.message}`);
    }

    if (!data) {
      return joinCode;
    }
  }

  throw new HttpError(500, "Unable to allocate a unique join code.");
};

export const assertValidStateTransition = (currentState: SessionState, nextState: SessionState) => {
  if (currentState === nextState) {
    return;
  }

  if (!allowedTransitions[currentState].includes(nextState)) {
    throw new HttpError(
      400,
      `Invalid session transition: ${currentState} -> ${nextState}.`,
    );
  }
};

export const loadSessionRecord = async (sessionId: string) => {
  const { data, error } = await supabaseAdmin
    .from("lab_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, `Failed to load session: ${error.message}`);
  }

  if (!data) {
    throw new HttpError(404, "Session not found.", "not_found");
  }

  return data;
};

export const getTeacherLiveSessionRecord = async (teacherId: string) => {
  const { data, error } = await supabaseAdmin
    .from("lab_sessions")
    .select("*")
    .eq("teacher_id", teacherId)
    .eq("state", "live")
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, `Failed to load live session: ${error.message}`);
  }

  return data;
};

export const getSessionTasks = async (sessionId: string, sessionRow?: any): Promise<SessionTask[]> => {
  const { data: rows, error } = await supabaseAdmin
    .from("session_tasks")
    .select("*")
    .eq("session_id", sessionId)
    .order("position", { ascending: true });

  if (error) {
    throw new HttpError(500, `Failed to load session tasks: ${error.message}`);
  }

  const sessionTaskRows = rows ?? [];
  const fallbackTaskIds: string[] = [];
  if (sessionTaskRows.length === 0 && sessionRow) {
    const activeTaskId = sessionRow.active_task_id ?? sessionRow.task_id;
    if (activeTaskId) {
      fallbackTaskIds.push(activeTaskId);
    }
    if (sessionRow.task_id && sessionRow.task_id !== activeTaskId) {
      fallbackTaskIds.push(sessionRow.task_id);
    }
  }

  const taskIds =
    sessionTaskRows.length > 0
      ? sessionTaskRows.map((row) => row.task_id)
      : Array.from(new Set(fallbackTaskIds));

  const taskMap = await fetchTasksByIds(taskIds);
  if (sessionTaskRows.length > 0) {
    return sessionTaskRows
      .map((row) => {
        const task = taskMap.get(row.task_id);
        if (!task) {
          return null;
        }

        return {
          id: row.id,
          sessionId: row.session_id,
          taskId: row.task_id,
          position: row.position ?? 0,
          isActive: Boolean(row.is_active),
          task,
        } satisfies SessionTask;
      })
      .filter((value): value is SessionTask => Boolean(value));
  }

  return taskIds
    .map((taskId, index) => {
      const task = taskMap.get(taskId);
      if (!task) {
        return null;
      }

      return {
        id: `legacy-${sessionId}-${taskId}`,
        sessionId,
        taskId,
        position: index,
        isActive: taskId === (sessionRow?.active_task_id ?? sessionRow?.task_id ?? taskId),
        task,
      } satisfies SessionTask;
    })
    .filter((value): value is SessionTask => Boolean(value));
};

export const assertTaskBelongsToSession = async (
  sessionId: string,
  taskId: string,
  sessionRow?: any,
) => {
  const tasks = await getSessionTasks(sessionId, sessionRow);
  const match = tasks.find((task) => task.taskId === taskId);

  if (!match) {
    throw new HttpError(403, "Task does not belong to this session.", "forbidden");
  }

  return match;
};

export const getSessionRoster = async (sessionId: string): Promise<SessionStudent[]> => {
  const { data, error } = await supabaseAdmin
    .from("session_students")
    .select(`
      session_id,
      student_id,
      status,
      help_status,
      joined_at,
      last_activity_at,
      current_task_id,
      overview_snippet,
      help_requested_at,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .eq("session_id", sessionId)
    .order("joined_at", { ascending: true });

  if (error) {
    throw new HttpError(500, `Failed to load session roster: ${error.message}`);
  }

  return (data ?? []).map(mapSessionStudentRow);
};

export const assertTeacherOwnsSession = async (teacherId: string, sessionId: string) => {
  const session = await loadSessionRecord(sessionId);

  if (!session.teacher_id || session.teacher_id !== teacherId) {
    throw new HttpError(403, "You do not own this session.", "forbidden");
  }

  return session;
};

export const assertStudentInSession = async (studentId: string, sessionId: string) => {
  const session = await loadSessionRecord(sessionId);
  const { data, error } = await supabaseAdmin
    .from("session_students")
    .select("*")
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, `Failed to load session membership: ${error.message}`);
  }

  if (!data) {
    throw new HttpError(403, "You do not belong to this session.", "forbidden");
  }

  return { session, membership: data };
};

export const assertTeacherCanAccessStudentWorkspace = async (
  teacherId: string,
  sessionId: string,
  studentId: string,
  taskId: string,
) => {
  const session = await assertTeacherOwnsSession(teacherId, sessionId);

  const { data: membership, error } = await supabaseAdmin
    .from("session_students")
    .select("*")
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, `Failed to validate student workspace access: ${error.message}`);
  }

  if (!membership) {
    throw new HttpError(403, "Student does not belong to this session.", "forbidden");
  }

  await assertTaskBelongsToSession(sessionId, taskId, session);
  return { session, membership };
};

export const assertStudentCanAccessWorkspace = async (
  studentId: string,
  sessionId: string,
  taskId: string,
) => {
  const { session, membership } = await assertStudentInSession(studentId, sessionId);
  await assertTaskBelongsToSession(sessionId, taskId, session);
  return { session, membership };
};

export const ensureTeacherLiveSessionUniqueness = async (
  teacherId: string,
  nextSessionId: string,
) => {
  const { data, error } = await supabaseAdmin
    .from("lab_sessions")
    .select("id")
    .eq("teacher_id", teacherId)
    .eq("state", "live")
    .neq("id", nextSessionId);

  if (error) {
    throw new HttpError(500, `Failed to verify live session uniqueness: ${error.message}`);
  }

  if ((data ?? []).length > 0) {
    throw new HttpError(409, "Only one live session is allowed per teacher.");
  }
};

export const upsertSessionTasks = async (
  sessionId: string,
  taskIds: string[],
  activeTaskId?: string,
) => {
  const uniqueTaskIds = Array.from(new Set(taskIds));
  const taskMap = await fetchTasksByIds(uniqueTaskIds);

  if (taskMap.size !== uniqueTaskIds.length) {
    throw new HttpError(400, "One or more tasks are invalid.");
  }

  if (uniqueTaskIds.length === 0) {
    throw new HttpError(400, "At least one task is required.");
  }

  const resolvedActiveTaskId =
    activeTaskId && uniqueTaskIds.includes(activeTaskId) ? activeTaskId : uniqueTaskIds[0];

  const { error: deleteError } = await supabaseAdmin
    .from("session_tasks")
    .delete()
    .eq("session_id", sessionId);

  if (deleteError) {
    throw new HttpError(500, `Failed to replace session tasks: ${deleteError.message}`);
  }

  const rows = uniqueTaskIds.map((taskId, index) => ({
    session_id: sessionId,
    task_id: taskId,
    position: index,
    is_active: taskId === resolvedActiveTaskId,
  }));

  const { error: insertError } = await supabaseAdmin
    .from("session_tasks")
    .insert(rows);

  if (insertError) {
    throw new HttpError(500, `Failed to save session tasks: ${insertError.message}`);
  }

  return resolvedActiveTaskId;
};

export const replaceSessionRoster = async (sessionId: string, studentIds: string[]) => {
  const uniqueStudentIds = Array.from(new Set(studentIds));
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "student")
    .in("id", uniqueStudentIds);

  if (profileError) {
    throw new HttpError(500, `Failed to validate session roster: ${profileError.message}`);
  }

  if ((profiles ?? []).length !== uniqueStudentIds.length) {
    throw new HttpError(400, "One or more student ids are invalid.");
  }

  const { error: deleteError } = await supabaseAdmin
    .from("session_students")
    .delete()
    .eq("session_id", sessionId);

  if (deleteError) {
    throw new HttpError(500, `Failed to replace session roster: ${deleteError.message}`);
  }

  if (uniqueStudentIds.length === 0) {
    return;
  }

  const rows = uniqueStudentIds.map((studentId) => ({
    session_id: sessionId,
    student_id: studentId,
    status: "offline",
    help_status: "none",
  }));

  const { error: insertError } = await supabaseAdmin
    .from("session_students")
    .insert(rows);

  if (insertError) {
    throw new HttpError(500, `Failed to save session roster: ${insertError.message}`);
  }
};

export const buildTeacherSession = async (sessionRow: any) => {
  const [taskSet, roster] = await Promise.all([
    getSessionTasks(sessionRow.id, sessionRow),
    getSessionRoster(sessionRow.id),
  ]);

  return mapSessionRow(sessionRow, taskSet, roster);
};

export const buildTeacherSessionSnapshot = async (
  sessionId: string,
): Promise<TeacherSessionSnapshot> => {
  const sessionRow = await loadSessionRecord(sessionId);
  const [taskSet, roster, helpRows, interventionRows, metricRows, codeRows] = await Promise.all([
    getSessionTasks(sessionId, sessionRow),
    getSessionRoster(sessionId),
    supabaseAdmin
      .from("help_requests")
      .select("*")
      .eq("session_id", sessionId)
      .in("status", ["pending", "active_intervention"])
      .order("requested_at", { ascending: true }),
    supabaseAdmin
      .from("editor_interventions")
      .select("*")
      .eq("session_id", sessionId)
      .in("status", ["open"])
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("student_metrics")
      .select("*")
      .eq("session_id", sessionId),
    supabaseAdmin
      .from("code_files")
      .select("student_id, task_id, code_content")
      .eq("session_id", sessionId),
  ]);

  if (helpRows.error) {
    throw new HttpError(500, `Failed to load help requests: ${helpRows.error.message}`);
  }
  if (interventionRows.error) {
    throw new HttpError(500, `Failed to load interventions: ${interventionRows.error.message}`);
  }
  if (metricRows.error) {
    throw new HttpError(500, `Failed to load student metrics: ${metricRows.error.message}`);
  }
  if (codeRows.error) {
    throw new HttpError(500, `Failed to load code snapshots: ${codeRows.error.message}`);
  }

  const activeTaskId =
    sessionRow.active_task_id ??
    taskSet.find((task) => task.isActive)?.taskId ??
    sessionRow.task_id ??
    undefined;

  const helpByStudent = new Map<string, HelpRequest>();
  for (const row of helpRows.data ?? []) {
    helpByStudent.set(row.student_id, mapHelpRequestRow(row));
  }

  const openInterventionsByWorkspace = new Map<string, number>();
  for (const row of interventionRows.data ?? []) {
    const workspaceKey = `${row.student_id}:${row.task_id}`;
    openInterventionsByWorkspace.set(
      workspaceKey,
      (openInterventionsByWorkspace.get(workspaceKey) ?? 0) + 1,
    );
  }

  const metricsByWorkspace = new Map<string, any>();
  for (const row of metricRows.data ?? []) {
    metricsByWorkspace.set(`${row.student_id}:${row.task_id}`, row);
  }

  const codeByWorkspace = new Map<string, string>();
  for (const row of codeRows.data ?? []) {
    codeByWorkspace.set(`${row.student_id}:${row.task_id}`, row.code_content ?? "");
  }

  const tasksById = new Map(taskSet.map((task) => [task.taskId, task.task]));
  const session = mapSessionRow(sessionRow, taskSet, roster);
  const students: StudentOverview[] = roster.map((student) => {
    const helpRequest = helpByStudent.get(student.studentId);
    const currentTaskId = student.currentTaskId ?? activeTaskId;
    const currentTask = currentTaskId ? tasksById.get(currentTaskId) : undefined;
    const workspaceKey = currentTaskId ? `${student.studentId}:${currentTaskId}` : null;
    const metric = workspaceKey ? metricsByWorkspace.get(workspaceKey) : undefined;
    const snippet =
      student.overviewSnippet ||
      buildOverviewSnippet(workspaceKey ? codeByWorkspace.get(workspaceKey) ?? "" : "");

    const runAttempts = metric?.run_attempts ?? 0;
    const correctionsUsed = metric?.corrections_used ?? 0;
    const hintsUsed = metric?.hints_used ?? 0;
    const explainUsed = metric?.explain_used ?? 0;
    const completed = Boolean(metric?.completed);
    const successRate = completed
      ? 100
      : Math.max(0, 100 - correctionsUsed * 12 - runAttempts * 4 - hintsUsed * 6 - explainUsed * 4);

    return {
      ...student,
      status:
        helpRequest && student.status !== "completed"
          ? "help"
          : student.status,
      helpStatus: helpRequest ? "requested" : student.helpStatus,
      helpRequestedAt: helpRequest?.requestedAt ?? student.helpRequestedAt ?? null,
      currentTaskId,
      currentTaskTitle: currentTask?.title,
      runAttempts,
      correctionsUsed,
      hintsUsed,
      explainUsed,
      totalTimeSeconds: metric?.total_time_seconds ?? 0,
      completed,
      completedAt: metric?.completed_at ?? undefined,
      successRate,
      currentCodeSnippet: snippet,
      pendingInterventionCount: workspaceKey
        ? openInterventionsByWorkspace.get(workspaceKey) ?? 0
        : 0,
      lastError: null,
    };
  });

  return {
    session,
    students,
    helpRequests: Array.from(helpByStudent.values()),
  };
};

export const listResolvedHelpResponsesByTask = async (
  sessionId: string,
  studentId: string,
): Promise<Record<string, ResolvedHelpResponse | undefined>> => {
  const { data, error } = await supabaseAdmin
    .from("help_requests")
    .select("id, task_id, resolved_at, resolution_notes")
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .eq("status", "resolved")
    .not("task_id", "is", null)
    .order("resolved_at", { ascending: false });

  if (error) {
    if (isMissingHelpResponseColumnsError(error)) {
      return listLegacyResolvedHelpResponsesByTask(sessionId, studentId);
    }
    throw new HttpError(500, `Failed to load resolved help responses: ${error.message}`);
  }

  const responsesByTask: Record<string, ResolvedHelpResponse | undefined> = {};

  for (const row of data ?? []) {
    if (responsesByTask[row.task_id]) {
      continue;
    }

    const response = toResolvedHelpResponse(row);
    if (response) {
      responsesByTask[row.task_id] = response;
    }
  }

  return responsesByTask;
};

export const listLegacyResolvedHelpResponsesByTask = async (
  sessionId: string,
  studentId: string,
): Promise<Record<string, ResolvedHelpResponse | undefined>> => {
  const { data, error } = await supabaseAdmin
    .from("editor_interventions")
    .select("id, task_id, resolved_at, content")
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .eq("type", "comment")
    .eq("status", "resolved")
    .like("content", `${HELP_RESPONSE_INTERVENTION_PREFIX}%`)
    .order("resolved_at", { ascending: false });

  if (error) {
    throw new HttpError(500, `Failed to load legacy help responses: ${error.message}`);
  }

  const responsesByTask: Record<string, ResolvedHelpResponse | undefined> = {};

  for (const row of data ?? []) {
    if (responsesByTask[row.task_id]) {
      continue;
    }

    const response = toLegacyResolvedHelpResponse(row);
    if (response) {
      responsesByTask[row.task_id] = response;
    }
  }

  return responsesByTask;
};

export const upsertLegacyResolvedHelpResponse = async (payload: {
  sessionId: string;
  taskId: string;
  studentId: string;
  teacherId: string;
  requestId: string;
  resolvedAt: string;
  notes: TeacherHelpNote[];
}) => {
  const { data: existingRows, error: existingError } = await supabaseAdmin
    .from("editor_interventions")
    .select("id")
    .eq("session_id", payload.sessionId)
    .eq("task_id", payload.taskId)
    .eq("student_id", payload.studentId)
    .eq("teacher_id", payload.teacherId)
    .eq("type", "comment")
    .eq("status", "resolved")
    .like("content", `${HELP_RESPONSE_INTERVENTION_PREFIX}%`)
    .order("resolved_at", { ascending: false })
    .limit(1);

  if (existingError) {
    throw new HttpError(500, `Failed to inspect legacy help response storage: ${existingError.message}`);
  }

  const encodedContent = encodeLegacyHelpResponseNotes(payload.notes);

  if ((existingRows ?? []).length > 0) {
    const { error: updateError } = await supabaseAdmin
      .from("editor_interventions")
      .update({
        content: encodedContent,
        resolved_at: payload.resolvedAt,
        updated_at: payload.resolvedAt,
      })
      .eq("id", existingRows![0].id);

    if (updateError) {
      throw new HttpError(500, `Failed to update legacy help response storage: ${updateError.message}`);
    }

    return;
  }

  const { error: insertError } = await supabaseAdmin
    .from("editor_interventions")
    .insert({
      id: payload.requestId,
      session_id: payload.sessionId,
      task_id: payload.taskId,
      student_id: payload.studentId,
      teacher_id: payload.teacherId,
      type: "comment",
      status: "resolved",
      mode: "view",
      range: {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1,
      },
      content: encodedContent,
      created_at: payload.resolvedAt,
      updated_at: payload.resolvedAt,
      resolved_at: payload.resolvedAt,
    });

  if (insertError) {
    throw new HttpError(500, `Failed to insert legacy help response storage: ${insertError.message}`);
  }
};

export const listTeacherSessions = async (teacherId: string) => {
  const { data, error } = await supabaseAdmin
    .from("lab_sessions")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("start_time", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new HttpError(500, `Failed to list sessions: ${error.message}`);
  }

  return Promise.all((data ?? []).map((row) => buildTeacherSession(row)));
};

export const listAssignableStudents = async () => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, avatar_url, created_at")
    .eq("role", "student")
    .order("full_name", { ascending: true });

  if (error) {
    throw new HttpError(500, `Failed to list students: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: "student" as const,
    avatarUrl: row.avatar_url ?? undefined,
    createdAt: row.created_at,
  }));
};

export const listTasks = async () => {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .order("title", { ascending: true });

  if (error) {
    throw new HttpError(500, `Failed to list tasks: ${error.message}`);
  }

  return (data ?? []).map(mapTaskRow);
};

export const updateSessionStudentActivity = async (
  sessionId: string,
  studentId: string,
  patch: {
    status?: SessionStudent["status"];
    helpStatus?: SessionStudent["helpStatus"];
    currentTaskId?: string;
    overviewSnippet?: string;
    helpRequestedAt?: string | null;
  },
) => {
  const updates: Record<string, unknown> = {
    last_activity_at: new Date().toISOString(),
  };

  if (patch.status) {
    updates.status = patch.status;
  }

  if (patch.helpStatus) {
    updates.help_status = patch.helpStatus;
  }

  if (patch.currentTaskId !== undefined) {
    updates.current_task_id = patch.currentTaskId;
  }

  if (patch.overviewSnippet !== undefined) {
    updates.overview_snippet = patch.overviewSnippet;
  }

  if (patch.helpRequestedAt !== undefined) {
    updates.help_requested_at = patch.helpRequestedAt;
  }

  const { error } = await supabaseAdmin
    .from("session_students")
    .update(updates)
    .eq("session_id", sessionId)
    .eq("student_id", studentId);

  if (error) {
    throw new HttpError(500, `Failed to update student activity: ${error.message}`);
  }
};

export const upsertCodeWorkspace = async (payload: {
  sessionId: string;
  taskId: string;
  studentId: string;
  code: string;
  updatedBy?: string;
  updatedByRole?: "teacher" | "student" | "admin";
  revision?: number;
}) => {
  const { error } = await supabaseAdmin
    .from("code_files")
    .upsert(
      {
        session_id: payload.sessionId,
        task_id: payload.taskId,
        student_id: payload.studentId,
        code_content: payload.code,
        updated_by: payload.updatedBy ?? null,
        updated_by_role: payload.updatedByRole ?? null,
        revision: payload.revision ?? 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id, task_id, student_id" },
    );

  if (error) {
    throw new HttpError(500, `Failed to save code workspace: ${error.message}`);
  }
};

export const loadCodeWorkspace = async (
  sessionId: string,
  taskId: string,
  studentId: string,
) => {
  const { data, error } = await supabaseAdmin
    .from("code_files")
    .select("*")
    .eq("session_id", sessionId)
    .eq("task_id", taskId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, `Failed to load code workspace: ${error.message}`);
  }

  return data;
};

export const incrementStudentMetric = async (
  sessionId: string,
  taskId: string,
  studentId: string,
  metricField: "run_attempts" | "corrections_used" | "hints_used" | "explain_used",
) => {
  const { data, error } = await supabaseAdmin
    .from("student_metrics")
    .select("*")
    .eq("session_id", sessionId)
    .eq("task_id", taskId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, `Failed to read student metric: ${error.message}`);
  }

  const nextValue = (data?.[metricField] ?? 0) + 1;
  const payload = {
    session_id: sessionId,
    task_id: taskId,
    student_id: studentId,
    [metricField]: nextValue,
  };

  const { error: upsertError } = await supabaseAdmin
    .from("student_metrics")
    .upsert(payload, { onConflict: "session_id, task_id, student_id" });

  if (upsertError) {
    throw new HttpError(500, `Failed to update student metric: ${upsertError.message}`);
  }
};

export const listInterventions = async (
  sessionId: string,
  studentId: string,
  taskId: string,
) => {
  const { data, error } = await supabaseAdmin
    .from("editor_interventions")
    .select("*")
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new HttpError(500, `Failed to load interventions: ${error.message}`);
  }

  return (data ?? []).map(mapInterventionRow);
};

export const loadInterventionById = async (interventionId: string) => {
  const { data, error } = await supabaseAdmin
    .from("editor_interventions")
    .select("*")
    .eq("id", interventionId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, `Failed to load intervention: ${error.message}`);
  }

  if (!data) {
    throw new HttpError(404, "Intervention not found.", "not_found");
  }

  return data;
};
