import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../supabaseClient";
import { JoinSessionRequest, JoinSessionResponse, LabSession, Task } from "../../../shared/types";

export const handleJoinClassroom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const body: JoinSessionRequest = req.body;

    if (!body.joinCode) {
      res.status(400).json({ success: false, error: "Join code is required" });
      return;
    }

    // Lookup classroom
    const { data: classroom, error: classroomError } = await supabaseAdmin
      .from("classrooms")
      .select("*")
      .eq("join_code", body.joinCode)
      .single();

    if (classroomError || !classroom) {
      res.status(404).json({ success: false, appState: "not_found", error: "Classroom not found" });
      return;
    }

    // Verify user profile exists
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profile) {
      res.status(401).json({ success: false, appState: "unauthorized", error: "Profile not found" });
      return;
    }

    // Prevent teachers from accidentally joining as students through this endpoint (unless intended)
    if (profile.role === "teacher" && classroom.teacher_id !== userId) {
      // Teachers can visit their own classroom or we allow them to test
    }

    // Find the active session for this classroom
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("lab_sessions")
      .select("*")
      .eq("classroom_id", classroom.id)
      .eq("state", "active")
      .order("start_time", { ascending: false })
      .limit(1)
      .single();

    if (sessionError && sessionError.code !== "PGRST116") {
      res.status(500).json({ success: false, error: "Failed to query sessions" });
      return;
    }

    if (!session) {
      res.json({ success: false, appState: "unauthorized", error: "No active session found for this classroom" });
      return;
    }

    // Fetch Task strictly
    const { data: taskData, error: taskError } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("id", session.task_id)
      .single();

    if (taskError || !taskData) {
      res.status(500).json({ success: false, error: "Failed to load task for session" });
      return;
    }

    const task: Task = {
      id: taskData.id,
      title: taskData.title,
      description: taskData.description,
      initialCode: taskData.initial_code,
      testCases: taskData.test_cases,
      language: taskData.language as any,
    };

    const response: JoinSessionResponse = {
      success: true,
      sessionId: session.id,
      task: task,
      config: session.config,
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const handleGetTeacherActiveSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Verify teacher
    const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", userId).single();
    if (profile?.role !== "teacher") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Get teacher's first classroom (since we haven't built classroom multi-management UI)
    const { data: classroom } = await supabaseAdmin.from("classrooms").select("*").eq("teacher_id", userId).limit(1).single();
    if (!classroom) {
      res.json({ success: true, session: null });
      return;
    }

    // Get active session
    const { data: session } = await supabaseAdmin
      .from("lab_sessions")
      .select("*, tasks(id, title)")
      .eq("classroom_id", classroom.id)
      .eq("state", "active")
      .order("start_time", { ascending: false })
      .limit(1)
      .single();

    if (!session) {
      res.json({ success: true, session: null, classroom });
      return;
    }

    res.json({ 
      success: true, 
      classroom,
      session: {
         id: session.id,
         state: session.state,
         config: session.config,
         task: session.tasks ? (session.tasks as any).title : "Unknown Task",
         taskId: session.task_id,
      }
    });

  } catch(e) {
    res.status(500).json({ error: "Server error" });
  }
};
