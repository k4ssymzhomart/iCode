import { Response } from "express";
import { JoinSessionRequest, JoinSessionResponse } from "../../../shared/types";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  assertStudentInSession,
  assertTaskBelongsToSession,
  assertUserRole,
  buildTeacherSession,
  buildTeacherSessionSnapshot,
  buildOverviewSnippet,
  getSessionTasks,
  getTeacherLiveSessionRecord,
  listResolvedHelpResponsesByTask,
  loadSessionRecord,
  normalizeSessionControls,
  updateSessionStudentActivity,
} from "../lib/classroom";
import { sendControllerError } from "../lib/responses";
import { supabaseAdmin } from "../supabaseClient";

export const handleJoinClassroom = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const body: JoinSessionRequest = req.body;

    await assertUserRole(userId, ["student"]);

    if (!body.joinCode || !/^\d{5}$/.test(body.joinCode)) {
      res.status(400).json({
        success: false,
        error: "A valid 5-digit join code is required.",
      });
      return;
    }

    const { data: sessionRow, error: sessionError } = await supabaseAdmin
      .from("lab_sessions")
      .select("*")
      .eq("join_code", body.joinCode)
      .maybeSingle();

    if (sessionError) {
      throw sessionError;
    }

    if (!sessionRow) {
      res.status(404).json({
        success: false,
        appState: "not_found",
        error: "No live session matches that code.",
      });
      return;
    }

    if (sessionRow.state !== "live") {
      res.status(403).json({
        success: false,
        appState: "forbidden",
        error: "Only live sessions can be joined.",
      });
      return;
    }

    const { membership } = await assertStudentInSession(userId, sessionRow.id);
    const tasks = await getSessionTasks(sessionRow.id, sessionRow);
    const activeTaskId =
      sessionRow.active_task_id ??
      tasks.find((task) => task.isActive)?.taskId ??
      sessionRow.task_id;
    const studentTaskId =
      membership.current_task_id && tasks.some((task) => task.taskId === membership.current_task_id)
        ? membership.current_task_id
        : activeTaskId;
    const activeTask = studentTaskId
      ? tasks.find((task) => task.taskId === studentTaskId)?.task
      : undefined;

    if (!studentTaskId || !activeTask) {
      res.status(409).json({
        success: false,
        error: "This session does not have an active task yet.",
      });
      return;
    }

    await updateSessionStudentActivity(sessionRow.id, userId, {
      status: "active",
      currentTaskId: studentTaskId,
      overviewSnippet: membership.overview_snippet ?? buildOverviewSnippet(activeTask.initialCode),
    });

    await supabaseAdmin.from("student_metrics").upsert(
      {
        session_id: sessionRow.id,
        task_id: studentTaskId,
        student_id: userId,
      },
      { onConflict: "session_id, task_id, student_id" },
    );

    const session = await buildTeacherSession({
      ...sessionRow,
      active_task_id: activeTaskId,
    });
    const resolvedHelpResponsesByTask = await listResolvedHelpResponsesByTask(
      sessionRow.id,
      userId,
    );

    const response: JoinSessionResponse = {
      success: true,
      sessionId: session.id,
      session,
      task: activeTask,
      activeTask,
      tasks,
      membership: {
        sessionId: session.id,
        studentId: userId,
        status: "active",
        helpStatus: membership.help_status ?? "none",
        joinedAt: membership.joined_at ?? new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        currentTaskId: studentTaskId,
        overviewSnippet:
          membership.overview_snippet ?? buildOverviewSnippet(activeTask.initialCode),
      },
      resolvedHelpResponsesByTask,
      config: normalizeSessionControls(sessionRow.controls ?? sessionRow.config),
    };

    res.json(response);
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleGetTeacherActiveSession = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    await assertUserRole(userId, ["teacher"]);

    const sessionRow = await getTeacherLiveSessionRecord(userId);
    if (!sessionRow) {
      res.json({ success: true, snapshot: null });
      return;
    }

    const snapshot = await buildTeacherSessionSnapshot(sessionRow.id);
    res.json({ success: true, snapshot });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleSessionActivity = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    await assertUserRole(userId, ["student"]);

    const {
      sessionId,
      taskId,
      status,
      overviewSnippet,
    }: {
      sessionId?: string;
      taskId?: string;
      status?: "joined" | "active" | "idle" | "help" | "resolved" | "completed";
      overviewSnippet?: string;
    } = req.body;

    if (!sessionId || !taskId) {
      res.status(400).json({
        success: false,
        error: "sessionId and taskId are required.",
      });
      return;
    }

    const { session } = await assertStudentInSession(userId, sessionId);
    await assertTaskBelongsToSession(sessionId, taskId, session);

    await updateSessionStudentActivity(sessionId, userId, {
      status: status ?? "active",
      currentTaskId: taskId,
      overviewSnippet:
        typeof overviewSnippet === "string"
          ? buildOverviewSnippet(overviewSnippet)
          : undefined,
    });

    res.json({ success: true });
  } catch (error) {
    sendControllerError(res, error);
  }
};

export const handleGetStudentSessionSnapshot = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const sessionId = String(req.query.sessionId ?? "");

    if (!sessionId) {
      res.status(400).json({ success: false, error: "sessionId is required." });
      return;
    }

    const { membership } = await assertStudentInSession(userId, sessionId);
    const session = await loadSessionRecord(sessionId);
    const taskSet = await getSessionTasks(sessionId, session);
    const resolvedHelpResponsesByTask = await listResolvedHelpResponsesByTask(
      sessionId,
      userId,
    );
    const preferredTaskId =
      membership.current_task_id && taskSet.some((task) => task.taskId === membership.current_task_id)
        ? membership.current_task_id
        : session.active_task_id ?? session.task_id;
    const activeTask =
      taskSet.find((task) => task.taskId === preferredTaskId) ??
      taskSet.find((task) => task.isActive) ??
      taskSet[0];

    res.json({
      success: true,
      session: await buildTeacherSession(session),
      tasks: taskSet,
      activeTask: activeTask?.task ?? null,
      membership: {
        sessionId,
        studentId: userId,
        status: membership.status,
        helpStatus: membership.help_status ?? "none",
        joinedAt: membership.joined_at ?? undefined,
        lastActivityAt: membership.last_activity_at ?? undefined,
        currentTaskId: activeTask?.taskId ?? membership.current_task_id ?? undefined,
        overviewSnippet: membership.overview_snippet ?? undefined,
        helpRequestedAt: membership.help_requested_at ?? undefined,
      },
      resolvedHelpResponsesByTask,
    });
  } catch (error) {
    sendControllerError(res, error);
  }
};
