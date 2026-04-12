import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../supabaseClient";
import { StudentMetric } from "../../../shared/types";

export const handleLeaderboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, taskId } = req.query;

    if (!sessionId || !taskId) {
      res.status(400).json({ error: "sessionId and taskId are required" });
      return;
    }

    const userId = req.user!.id;
    const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", userId).single();
    if (profile?.role !== "teacher") {
      res.status(403).json({ error: "Forbidden: Leaderboard is teacher-only" });
      return;
    }

    const { data: metrics, error } = await supabaseAdmin
      .from("student_metrics")
      .select(`
        id, session_id, task_id, student_id, run_attempts, corrections_used, hints_used, explain_used, total_time_seconds, completed, completed_at,
        profiles ( full_name, avatar_url )
      `)
      .eq("session_id", sessionId)
      .eq("task_id", taskId);

    if (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard", details: error.message });
      return;
    }

    // Map to shared type
    const payload: StudentMetric[] = (metrics || []).map(m => ({
      id: m.id,
      sessionId: m.session_id,
      taskId: m.task_id,
      studentId: m.student_id,
      runAttempts: m.run_attempts,
      correctionsUsed: m.corrections_used,
      hintsUsed: m.hints_used,
      explainUsed: m.explain_used,
      totalTimeSeconds: m.total_time_seconds,
      completed: m.completed,
      completedAt: m.completed_at,
      profile: m.profiles ? {
        fullName: (m.profiles as any).full_name,
        avatarUrl: (m.profiles as any).avatar_url
      } : undefined
    }));

    res.json({ success: true, leaderboard: payload });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleGetHelpRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { sessionId } = req.query;

    // Must be Teacher
    const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", userId).single();
    if (profile?.role !== "teacher") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { data: requests, error } = await supabaseAdmin
      .from("help_requests")
      .select(`
        id, session_id, student_id, status, requested_at,
        profiles ( full_name )
      `)
      .eq("session_id", sessionId)
      .eq("status", "pending")
      .order("requested_at", { ascending: true });

    if (error) {
      res.status(500).json({ error: "Query failed", details: error.message });
      return;
    }

    res.json({ success: true, requests });
  } catch(e) {
    res.status(500).json({ error: "Interval server error" });
  }
};

export const handleUpdateSessionControl = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { sessionId, config, state } = req.body;

    // Must be Teacher
    const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", userId).single();
    if (profile?.role !== "teacher") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const updates: any = {};
    if (config !== undefined) updates.config = config;
    if (state !== undefined) updates.state = state;

    const { error } = await supabaseAdmin
      .from("lab_sessions")
      .update(updates)
      .eq("id", sessionId)
      .eq("classrooms.teacher_id", userId); // Ensure ownership

    if (error) {
      res.status(500).json({ error: "Update failed", details: error.message });
      return;
    }

    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: "Interval server error" });
  }
};
