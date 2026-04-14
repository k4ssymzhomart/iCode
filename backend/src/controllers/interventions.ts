import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  assertStudentCanAccessWorkspace,
  assertTeacherCanAccessStudentWorkspace,
  assertUserRole,
  HttpError,
  listInterventions,
  loadCodeWorkspace,
  loadInterventionById,
  upsertCodeWorkspace,
  updateSessionStudentActivity,
} from "../lib/classroom";
import { sendControllerError } from "../lib/responses";
import { supabaseAdmin } from "../supabaseClient";

export const handleListInterventions = async (
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

    const role = await assertUserRole(userId, ["teacher", "student"]);
    const studentId = role === "teacher" ? requestedStudentId : userId;
    if (!studentId) {
      throw new HttpError(400, "studentId is required for teacher intervention access.");
    }

    if (role === "teacher") {
      await assertTeacherCanAccessStudentWorkspace(userId, sessionId, studentId, taskId);
    } else {
      await assertStudentCanAccessWorkspace(userId, sessionId, taskId);
    }

    const interventions = await listInterventions(sessionId, studentId, taskId);
    res.json({ success: true, interventions });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleCreateIntervention = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    await assertUserRole(teacherId, ["teacher"]);

    const {
      sessionId,
      studentId,
      taskId,
      type,
      mode,
      range,
      content,
      suggestedCode,
      beforeExcerpt,
      afterExcerpt,
    }: {
      sessionId?: string;
      studentId?: string;
      taskId?: string;
      type?: string;
      mode?: string;
      range?: unknown;
      content?: string;
      suggestedCode?: string;
      beforeExcerpt?: string;
      afterExcerpt?: string;
    } = req.body;

    if (!sessionId || !studentId || !taskId || !type || !range) {
      throw new HttpError(
        400,
        "sessionId, studentId, taskId, type, and range are required.",
      );
    }

    await assertTeacherCanAccessStudentWorkspace(teacherId, sessionId, studentId, taskId);
    const isDirectEdit = type === "direct_edit";

    const { data, error } = await supabaseAdmin
      .from("editor_interventions")
      .insert({
        session_id: sessionId,
        student_id: studentId,
        task_id: taskId,
        teacher_id: teacherId,
        type,
        mode: mode ?? (isDirectEdit ? "edit" : type === "suggestion" ? "suggest" : "view"),
        status: isDirectEdit ? "resolved" : "open",
        range,
        content: content ?? null,
        suggested_code: suggestedCode ?? null,
        before_excerpt: beforeExcerpt ?? null,
        after_excerpt: afterExcerpt ?? null,
        resolved_at: isDirectEdit ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .limit(1);

    if (error || !(data ?? []).length) {
      throw new HttpError(
        500,
        `Failed to create intervention: ${error?.message ?? "Unknown error"}`,
      );
    }

    res.status(201).json({ success: true, intervention: data![0] });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleUpdateInterventionStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const interventionId = String(req.params.interventionId ?? "");
    const nextStatus = String(req.body?.status ?? "");
    const nextCode = typeof req.body?.code === "string" ? req.body.code : undefined;

    if (!interventionId || !nextStatus) {
      throw new HttpError(400, "interventionId and status are required.");
    }

    const role = await assertUserRole(userId, ["teacher", "student"]);
    const intervention = await loadInterventionById(interventionId);

    if (role === "teacher") {
      await assertTeacherCanAccessStudentWorkspace(
        userId,
        intervention.session_id,
        intervention.student_id,
        intervention.task_id,
      );
    } else {
      if (intervention.student_id !== userId) {
        throw new HttpError(403, "You cannot update this intervention.");
      }
      await assertStudentCanAccessWorkspace(
        userId,
        intervention.session_id,
        intervention.task_id,
      );
    }

    if (nextStatus === "accepted" && intervention.type === "suggestion") {
      const workspace = await loadCodeWorkspace(
        intervention.session_id,
        intervention.task_id,
        intervention.student_id,
      );
      const acceptedCode = nextCode ?? intervention.suggested_code;

      if (!acceptedCode) {
        throw new HttpError(400, "Suggestion acceptance requires code content.");
      }

      await upsertCodeWorkspace({
        sessionId: intervention.session_id,
        taskId: intervention.task_id,
        studentId: intervention.student_id,
        code: acceptedCode,
        updatedBy: userId,
        updatedByRole: role,
        revision: (workspace?.revision ?? 0) + 1,
      });

      await updateSessionStudentActivity(intervention.session_id, intervention.student_id, {
        overviewSnippet: acceptedCode,
      });
    }

    const { error } = await supabaseAdmin
      .from("editor_interventions")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
        resolved_at:
          nextStatus === "resolved" || nextStatus === "accepted" || nextStatus === "rejected"
            ? new Date().toISOString()
            : null,
      })
      .eq("id", interventionId);

    if (error) {
      throw new HttpError(500, `Failed to update intervention: ${error.message}`);
    }

    res.json({ success: true });
  } catch (error) {
    sendControllerError(res, error);
  }
};
