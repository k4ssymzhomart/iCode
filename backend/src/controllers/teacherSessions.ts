import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  assertTeacherCanAccessStudentWorkspace,
  assertTeacherOwnsSession,
  assertUserRole,
  buildTeacherSession,
  buildTeacherSessionSnapshot,
  createSessionId,
  ensureTeacherLiveSessionUniqueness,
  generateJoinCode,
  getTaskSetTaskIds,
  getSessionTasks,
  listAssignableStudents,
  listTeacherSessions,
  loadTaskSetSummary,
  loadCodeWorkspace,
  loadSessionRecord,
  normalizeSessionControls,
  replaceSessionRoster,
  upsertCodeWorkspace,
  upsertSessionTasks,
  updateSessionStudentActivity,
  assertValidStateTransition,
  listTasks,
  HttpError,
} from "../lib/classroom";
import { sendControllerError } from "../lib/responses";
import { supabaseAdmin } from "../supabaseClient";

const resolveSessionId = (req: AuthenticatedRequest) => String(req.params.sessionId ?? "");

export const handleListTeacherSessions = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    await assertUserRole(userId, ["teacher"]);

    const sessions = await listTeacherSessions(userId);
    res.json({ success: true, sessions });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleCreateTeacherSession = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    await assertUserRole(teacherId, ["teacher"]);

    const {
      title,
      topic,
      description,
      taskSetId,
      studentIds,
      controls,
    }: {
      title?: string;
      topic?: string;
      description?: string;
      taskSetId?: string;
      studentIds?: string[];
      controls?: unknown;
    } = req.body;

    if (!title?.trim()) {
      throw new HttpError(400, "Session title is required.");
    }

    if (!topic?.trim()) {
      throw new HttpError(400, "Session topic is required.");
    }

    if (!taskSetId?.trim()) {
      throw new HttpError(400, "Task set selection is required.");
    }

    const normalizedStudentIds = Array.isArray(studentIds) ? studentIds.filter(Boolean) : [];
    if (normalizedStudentIds.length === 0) {
      throw new HttpError(400, "At least one student is required.");
    }

    const normalizedTaskSetId = taskSetId.trim();
    await loadTaskSetSummary(normalizedTaskSetId);
    const normalizedTaskIds = await getTaskSetTaskIds(normalizedTaskSetId);
    const sessionId = createSessionId();
    const normalizedControls = normalizeSessionControls(controls);
    const activeTaskId = normalizedTaskIds[0];

    const { data: insertedRows, error } = await supabaseAdmin
      .from("lab_sessions")
      .insert({
        id: sessionId,
        teacher_id: teacherId,
        title: title.trim(),
        topic: topic.trim(),
        description: typeof description === "string" ? description.trim() : "",
        join_code: null,
        task_set_id: normalizedTaskSetId,
        state: "draft",
        task_id: activeTaskId,
        active_task_id: activeTaskId,
        start_time: null,
        controls: normalizedControls,
        config: normalizedControls,
      })
      .select("*")
      .limit(1);

    if (error || !(insertedRows ?? []).length) {
      throw new HttpError(500, `Failed to create session: ${error?.message ?? "Unknown error"}`);
    }

    await upsertSessionTasks(sessionId, normalizedTaskIds, activeTaskId);
    await replaceSessionRoster(sessionId, normalizedStudentIds);

    const session = await buildTeacherSession(insertedRows![0]);
    res.status(201).json({ success: true, session });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleGetTeacherSessionDetail = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    const sessionId = resolveSessionId(req);
    await assertUserRole(teacherId, ["teacher"]);

    const sessionRow = await assertTeacherOwnsSession(teacherId, sessionId);
    const session = await buildTeacherSession(sessionRow);
    res.json({ success: true, session });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleGetTeacherSessionDashboard = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    const sessionId = resolveSessionId(req);
    await assertUserRole(teacherId, ["teacher"]);
    await assertTeacherOwnsSession(teacherId, sessionId);

    const snapshot = await buildTeacherSessionSnapshot(sessionId);
    res.json({ success: true, snapshot });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleUpdateTeacherSessionState = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    const sessionId = resolveSessionId(req);
    const nextState = String(req.body?.state ?? "");
    await assertUserRole(teacherId, ["teacher"]);

    const session = await assertTeacherOwnsSession(teacherId, sessionId);
    assertValidStateTransition(session.state, nextState as any);

    if (nextState === "live") {
      await ensureTeacherLiveSessionUniqueness(teacherId, sessionId);
    }

    const updates: Record<string, unknown> = { state: nextState };
    if (nextState === "live") {
      if (!session.join_code) {
        updates.join_code = await generateJoinCode();
      }
      if (!session.start_time) {
        updates.start_time = new Date().toISOString();
      }
    }
    if (nextState === "completed") {
      updates.end_time = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from("lab_sessions")
      .update(updates)
      .eq("id", sessionId);

    if (error) {
      throw new HttpError(500, `Failed to update session state: ${error.message}`);
    }

    const updated = await loadSessionRecord(sessionId);
    res.json({ success: true, session: await buildTeacherSession(updated) });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleRegenerateSessionCode = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    const sessionId = resolveSessionId(req);
    await assertUserRole(teacherId, ["teacher"]);

    const session = await assertTeacherOwnsSession(teacherId, sessionId);
    if (session.state === "completed") {
      throw new HttpError(400, "Completed sessions cannot regenerate join codes.");
    }

    const joinCode = await generateJoinCode();
    const { error } = await supabaseAdmin
      .from("lab_sessions")
      .update({ join_code: joinCode })
      .eq("id", sessionId);

    if (error) {
      throw new HttpError(500, `Failed to regenerate join code: ${error.message}`);
    }

    res.json({ success: true, joinCode });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleUpdateSessionControls = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    const sessionId = resolveSessionId(req);
    await assertUserRole(teacherId, ["teacher"]);
    await assertTeacherOwnsSession(teacherId, sessionId);

    const controls = normalizeSessionControls(req.body?.controls);
    const { error } = await supabaseAdmin
      .from("lab_sessions")
      .update({ controls, config: controls })
      .eq("id", sessionId);

    if (error) {
      throw new HttpError(500, `Failed to update session controls: ${error.message}`);
    }

    const updated = await loadSessionRecord(sessionId);
    res.json({ success: true, session: await buildTeacherSession(updated) });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleAssignSessionRoster = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    const sessionId = resolveSessionId(req);
    const studentIds = Array.isArray(req.body?.studentIds)
      ? req.body.studentIds.filter(Boolean)
      : [];

    await assertUserRole(teacherId, ["teacher"]);
    await assertTeacherOwnsSession(teacherId, sessionId);
    await replaceSessionRoster(sessionId, studentIds);

    const updated = await loadSessionRecord(sessionId);
    res.json({ success: true, session: await buildTeacherSession(updated) });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleAssignSessionTasks = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    const sessionId = resolveSessionId(req);
    const taskIds = Array.isArray(req.body?.taskIds) ? req.body.taskIds.filter(Boolean) : [];
    const requestedActiveTaskId = typeof req.body?.activeTaskId === "string" ? req.body.activeTaskId : undefined;

    await assertUserRole(teacherId, ["teacher"]);
    await assertTeacherOwnsSession(teacherId, sessionId);
    const activeTaskId = await upsertSessionTasks(sessionId, taskIds, requestedActiveTaskId);

    const { error } = await supabaseAdmin
      .from("lab_sessions")
      .update({ active_task_id: activeTaskId, task_id: activeTaskId, task_set_id: null })
      .eq("id", sessionId);

    if (error) {
      throw new HttpError(500, `Failed to save active task: ${error.message}`);
    }

    const updated = await loadSessionRecord(sessionId);
    res.json({ success: true, session: await buildTeacherSession(updated) });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleSwitchSessionActiveTask = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    const sessionId = resolveSessionId(req);
    const taskId = String(req.body?.taskId ?? "");
    await assertUserRole(teacherId, ["teacher"]);

    const session = await assertTeacherOwnsSession(teacherId, sessionId);
    const sessionTasks = await getSessionTasks(sessionId, session);
    if (!sessionTasks.some((task) => task.taskId === taskId)) {
      throw new HttpError(400, "Selected task is not assigned to this session.");
    }

    const { error: resetError } = await supabaseAdmin
      .from("session_tasks")
      .update({ is_active: false })
      .eq("session_id", sessionId);

    if (resetError) {
      throw new HttpError(500, `Failed to reset active task: ${resetError.message}`);
    }

    const { error: markError } = await supabaseAdmin
      .from("session_tasks")
      .update({ is_active: true })
      .eq("session_id", sessionId)
      .eq("task_id", taskId);

    if (markError) {
      throw new HttpError(500, `Failed to mark active task: ${markError.message}`);
    }

    const { error: sessionError } = await supabaseAdmin
      .from("lab_sessions")
      .update({ active_task_id: taskId, task_id: taskId })
      .eq("id", sessionId);

    if (sessionError) {
      throw new HttpError(500, `Failed to update session active task: ${sessionError.message}`);
    }

    const { error: studentError } = await supabaseAdmin
      .from("session_students")
      .update({ current_task_id: taskId })
      .eq("session_id", sessionId);

    if (studentError) {
      throw new HttpError(500, `Failed to sync student active task: ${studentError.message}`);
    }

    const updated = await loadSessionRecord(sessionId);
    res.json({ success: true, session: await buildTeacherSession(updated) });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleBroadcastSessionMessage = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    const sessionId = resolveSessionId(req);
    const message =
      typeof req.body?.message === "string" && req.body.message.trim()
        ? req.body.message.trim()
        : null;

    await assertUserRole(teacherId, ["teacher"]);
    await assertTeacherOwnsSession(teacherId, sessionId);

    const { error } = await supabaseAdmin
      .from("lab_sessions")
      .update({ broadcast_message: message })
      .eq("id", sessionId);

    if (error) {
      throw new HttpError(500, `Failed to update broadcast message: ${error.message}`);
    }

    res.json({ success: true, broadcastMessage: message });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handlePinSessionHint = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    const sessionId = resolveSessionId(req);
    const hint =
      typeof req.body?.hint === "string" && req.body.hint.trim()
        ? req.body.hint.trim()
        : null;

    await assertUserRole(teacherId, ["teacher"]);
    await assertTeacherOwnsSession(teacherId, sessionId);

    const { error } = await supabaseAdmin
      .from("lab_sessions")
      .update({ pinned_hint: hint })
      .eq("id", sessionId);

    if (error) {
      throw new HttpError(500, `Failed to update pinned hint: ${error.message}`);
    }

    res.json({ success: true, pinnedHint: hint });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleResetStudentCode = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    const sessionId = resolveSessionId(req);
    const studentId = String(req.body?.studentId ?? "");
    const taskId = String(req.body?.taskId ?? "");

    await assertUserRole(teacherId, ["teacher"]);
    await assertTeacherCanAccessStudentWorkspace(teacherId, sessionId, studentId, taskId);

    const sessionTasks = await getSessionTasks(sessionId);
    const task = sessionTasks.find((entry) => entry.taskId === taskId)?.task;
    if (!task) {
      throw new HttpError(404, "Task not found for reset.");
    }

    const previous = await loadCodeWorkspace(sessionId, taskId, studentId);
    const nextRevision = (previous?.revision ?? 0) + 1;
    await upsertCodeWorkspace({
      sessionId,
      taskId,
      studentId,
      code: task.initialCode,
      updatedBy: teacherId,
      updatedByRole: "teacher",
      revision: nextRevision,
    });

    const { error: interventionError } = await supabaseAdmin
      .from("editor_interventions")
      .insert({
        session_id: sessionId,
        task_id: taskId,
        student_id: studentId,
        teacher_id: teacherId,
        type: "direct_edit",
        status: "resolved",
        mode: "edit",
        range: {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 1,
        },
        content: "Teacher reset the workspace to the starter template.",
        before_excerpt: previous?.code_content ?? null,
        after_excerpt: task.initialCode,
        suggested_code: task.initialCode,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (interventionError) {
      throw new HttpError(500, `Failed to record reset intervention: ${interventionError.message}`);
    }

    res.json({ success: true, code: task.initialCode, revision: nextRevision });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleResolveHelpRequest = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    const sessionId = resolveSessionId(req);
    const studentId = String(req.body?.studentId ?? "");

    await assertUserRole(teacherId, ["teacher"]);
    await assertTeacherOwnsSession(teacherId, sessionId);

    const { data: pendingRequest, error: requestError } = await supabaseAdmin
      .from("help_requests")
      .select("*")
      .eq("session_id", sessionId)
      .eq("student_id", studentId)
      .in("status", ["pending", "active_intervention"])
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (requestError) {
      throw new HttpError(500, `Failed to load help request: ${requestError.message}`);
    }

    if (pendingRequest) {
      const { error: updateError } = await supabaseAdmin
        .from("help_requests")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", pendingRequest.id);

      if (updateError) {
        throw new HttpError(500, `Failed to resolve help request: ${updateError.message}`);
      }
    }

    await updateSessionStudentActivity(sessionId, studentId, {
      status: "resolved",
      helpStatus: "resolved",
      helpRequestedAt: null,
    });

    res.json({ success: true });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleListAssignableStudents = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    await assertUserRole(teacherId, ["teacher"]);
    const students = await listAssignableStudents();
    res.json({ success: true, students });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleListTeacherTasks = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    await assertUserRole(teacherId, ["teacher"]);
    const tasks = await listTasks();
    res.json({ success: true, tasks });
  } catch (error) {
    sendControllerError(res, error);
  }
};
