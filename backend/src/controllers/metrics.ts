import { Response } from "express";
import { StudentMetric } from "../../../shared/types";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  assertTeacherOwnsSession,
  assertUserRole,
  buildTeacherSessionSnapshot,
  HttpError,
  loadSessionRecord,
  normalizeSessionControls,
} from "../lib/classroom";
import { sendControllerError } from "../lib/responses";
import { supabaseAdmin } from "../supabaseClient";

export const handleLeaderboard = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    const sessionId = String(req.query.sessionId ?? "");
    const taskId = String(req.query.taskId ?? "");

    if (!sessionId || !taskId) {
      throw new HttpError(400, "sessionId and taskId are required.");
    }

    await assertUserRole(teacherId, ["teacher"]);
    await assertTeacherOwnsSession(teacherId, sessionId);

    const { data, error } = await supabaseAdmin
      .from("student_metrics")
      .select(`
        id,
        session_id,
        task_id,
        student_id,
        run_attempts,
        corrections_used,
        hints_used,
        explain_used,
        total_time_seconds,
        completed,
        completed_at,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq("session_id", sessionId)
      .eq("task_id", taskId);

    if (error) {
      throw new HttpError(500, `Failed to load leaderboard: ${error.message}`);
    }

    const leaderboard: StudentMetric[] = (data ?? []).map((row: any) => ({
      id: row.id,
      sessionId: row.session_id,
      taskId: row.task_id,
      studentId: row.student_id,
      runAttempts: row.run_attempts,
      correctionsUsed: row.corrections_used,
      hintsUsed: row.hints_used,
      explainUsed: row.explain_used,
      totalTimeSeconds: row.total_time_seconds,
      completed: row.completed,
      completedAt: row.completed_at ?? undefined,
      profile: row.profiles
        ? {
            fullName: row.profiles.full_name,
            avatarUrl: row.profiles.avatar_url ?? undefined,
          }
        : undefined,
    }));

    res.json({ success: true, leaderboard });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleGetHelpRequests = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    const sessionId = String(req.query.sessionId ?? "");
    if (!sessionId) {
      throw new HttpError(400, "sessionId is required.");
    }

    await assertUserRole(teacherId, ["teacher"]);
    await assertTeacherOwnsSession(teacherId, sessionId);

    const snapshot = await buildTeacherSessionSnapshot(sessionId);
    res.json({ success: true, requests: snapshot.helpRequests });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleUpdateSessionControl = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const teacherId = req.user!.id;
    const sessionId = String(req.body?.sessionId ?? "");
    const nextState = typeof req.body?.state === "string" ? req.body.state : undefined;
    const controls = req.body?.config ?? req.body?.controls;

    if (!sessionId) {
      throw new HttpError(400, "sessionId is required.");
    }

    await assertUserRole(teacherId, ["teacher"]);
    await assertTeacherOwnsSession(teacherId, sessionId);

    const updates: Record<string, unknown> = {};
    if (nextState) {
      updates.state = nextState;
    }
    if (controls !== undefined) {
      const normalizedControls = normalizeSessionControls(controls);
      updates.controls = normalizedControls;
      updates.config = normalizedControls;
    }

    const { error } = await supabaseAdmin
      .from("lab_sessions")
      .update(updates)
      .eq("id", sessionId);

    if (error) {
      throw new HttpError(500, `Failed to update session control: ${error.message}`);
    }

    const updated = await loadSessionRecord(sessionId);
    res.json({ success: true, session: updated });
  } catch (error) {
    sendControllerError(res, error);
  }
};
