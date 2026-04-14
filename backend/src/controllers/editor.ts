import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  assertStudentInSession,
  assertStudentCanAccessWorkspace,
  assertTeacherCanAccessStudentWorkspace,
  assertUserRole,
  buildOverviewSnippet,
  getSessionTasks,
  loadCodeWorkspace,
  loadSessionRecord,
  upsertCodeWorkspace,
  updateSessionStudentActivity,
  HttpError,
} from "../lib/classroom";
import { sendControllerError } from "../lib/responses";
import { supabaseAdmin } from "../supabaseClient";

export const handleSaveCode = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const {
      sessionId,
      taskId,
      studentId,
      code,
      revision,
    }: {
      sessionId?: string;
      taskId?: string;
      studentId?: string;
      code?: string;
      revision?: number;
    } = req.body;

    if (!sessionId || !taskId || typeof code !== "string") {
      throw new HttpError(400, "sessionId, taskId, and code are required.");
    }

    const role = await assertUserRole(userId, ["teacher", "student", "admin"]);
    const targetStudentId = role === "teacher" ? studentId : userId;
    if (!targetStudentId) {
      throw new HttpError(400, "studentId is required for teacher saves.");
    }

    if (role === "teacher") {
      await assertTeacherCanAccessStudentWorkspace(
        userId,
        sessionId,
        targetStudentId,
        taskId,
      );
    } else {
      await assertStudentCanAccessWorkspace(userId, sessionId, taskId);
    }

    const existingWorkspace = await loadCodeWorkspace(sessionId, taskId, targetStudentId);
    const nextRevision =
      typeof revision === "number" && Number.isFinite(revision)
        ? revision
        : (existingWorkspace?.revision ?? 0) + 1;

    await upsertCodeWorkspace({
      sessionId,
      taskId,
      studentId: targetStudentId,
      code,
      updatedBy: userId,
      updatedByRole: role,
      revision: nextRevision,
    });

    await updateSessionStudentActivity(sessionId, targetStudentId, {
      currentTaskId: taskId,
      overviewSnippet: buildOverviewSnippet(code),
      status: role === "student" ? "active" : undefined,
    });

    res.json({
      success: true,
      revision: nextRevision,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleLoadCode = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const sessionId = String(req.query.sessionId ?? "");
    const taskId = String(req.query.taskId ?? "");
    const requestedStudentId =
      typeof req.query.studentId === "string" ? req.query.studentId : undefined;

    if (!sessionId || !taskId) {
      throw new HttpError(400, "sessionId and taskId are required.");
    }

    const role = await assertUserRole(userId, ["teacher", "student", "admin"]);
    const targetStudentId = role === "teacher" ? requestedStudentId : userId;
    if (!targetStudentId) {
      throw new HttpError(400, "studentId is required for teacher code access.");
    }

    if (role === "teacher") {
      await assertTeacherCanAccessStudentWorkspace(
        userId,
        sessionId,
        targetStudentId,
        taskId,
      );
    } else {
      await assertStudentCanAccessWorkspace(userId, sessionId, taskId);
    }

    const workspace = await loadCodeWorkspace(sessionId, taskId, targetStudentId);
    if (workspace) {
      res.json({
        success: true,
        code: workspace.code_content,
        updatedAt: workspace.updated_at,
        revision: workspace.revision ?? 1,
        updatedByRole: workspace.updated_by_role ?? undefined,
      });
      return;
    }

    const session = await loadSessionRecord(sessionId);
    const taskEntry = (await getSessionTasks(sessionId, session)).find(
      (entry) => entry.taskId === taskId,
    );

    res.json({
      success: true,
      code: taskEntry?.task.initialCode ?? null,
      updatedAt: null,
      revision: 0,
      updatedByRole: null,
    });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleHelpRequest = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const sessionId = String(req.body?.sessionId ?? "");
    const taskId = typeof req.body?.taskId === "string" ? req.body.taskId : undefined;

    if (!sessionId) {
      throw new HttpError(400, "sessionId is required.");
    }

    await assertUserRole(userId, ["student"]);
    const { session, membership } = await assertStudentInSession(userId, sessionId);
    const resolvedTaskId =
      taskId ??
      membership.current_task_id ??
      session.active_task_id ??
      session.task_id ??
      null;

    if (resolvedTaskId) {
      await assertStudentCanAccessWorkspace(userId, sessionId, resolvedTaskId);
    }

    const { data: pendingRequest, error: pendingError } = await supabaseAdmin
      .from("help_requests")
      .select("id")
      .eq("session_id", sessionId)
      .eq("student_id", userId)
      .in("status", ["pending", "active_intervention"])
      .limit(1)
      .maybeSingle();

    if (pendingError) {
      throw new HttpError(500, `Failed to inspect existing help queue: ${pendingError.message}`);
    }

    if (!pendingRequest) {
      const { error: insertError } = await supabaseAdmin
        .from("help_requests")
        .insert({
          session_id: sessionId,
          student_id: userId,
          task_id: resolvedTaskId,
          status: "pending",
        });

      if (insertError) {
        throw new HttpError(500, `Failed to request help: ${insertError.message}`);
      }
    }

    await updateSessionStudentActivity(sessionId, userId, {
      status: "help",
      helpStatus: "requested",
      helpRequestedAt: new Date().toISOString(),
      currentTaskId: resolvedTaskId ?? undefined,
    });

    res.json({ success: true });
  } catch (error) {
    sendControllerError(res, error);
  }
};
