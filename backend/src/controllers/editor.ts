import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { supabaseAdmin } from "../supabaseClient";

export const handleSaveCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { sessionId, taskId, code } = req.body;

    if (!sessionId || !taskId || code === undefined) {
      res.status(400).json({ error: "sessionId, taskId, and code are required" });
      return;
    }

    const { error } = await supabaseAdmin
      .from("code_files")
      .upsert({
        session_id: sessionId,
        task_id: taskId,
        student_id: userId,
        code_content: code,
        updated_at: new Date().toISOString()
      }, { onConflict: "session_id, task_id, student_id" });

    if (error) {
      res.status(500).json({ error: "Failed to save code", details: error.message });
      return;
    }

    res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleLoadCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { sessionId, taskId, studentId } = req.query;

    if (!sessionId || !taskId) {
      res.status(400).json({ error: "sessionId and taskId are required" });
      return;
    }

    // Identify requester role
    const { data: requester } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!requester) {
      res.status(401).json({ error: "Profile not found" });
      return;
    }

    // Determine target student ID to query
    let targetStudentId = userId;
    if (requester.role === "teacher") {
      if (!studentId) {
        res.status(400).json({ error: "studentId query parameter is required for teachers" });
        return;
      }
      targetStudentId = studentId as string;
      
      // Optionally verify the teacher actually owns the classroom for this session
      const { data: sessionData } = await supabaseAdmin
        .from("lab_sessions")
        .select("classroom_id, classrooms(teacher_id)")
        .eq("id", sessionId)
        .single();
        
      if (!sessionData || (sessionData.classrooms as any).teacher_id !== userId) {
         res.status(403).json({ error: "Not authorized to view this session's code" });
         return;
      }
    } else {
      // If student tries to pass another studentId, reject
      if (studentId && studentId !== userId) {
        res.status(403).json({ error: "Students can only access their own code" });
        return;
      }
    }

    const { data: codeFile, error } = await supabaseAdmin
      .from("code_files")
      .select("code_content, updated_at")
      .eq("session_id", sessionId)
      .eq("task_id", taskId)
      .eq("student_id", targetStudentId)
      .single();

    if (error && error.code !== "PGRST116") {
      res.status(500).json({ error: "Failed to load code", details: error.message });
      return;
    }

    if (!codeFile) {
      res.json({ success: true, code: null });
      return;
    }

    res.json({ success: true, code: codeFile.code_content, updatedAt: codeFile.updated_at });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleHelpRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: "sessionId is required" });
      return;
    }

    const { error } = await supabaseAdmin
      .from("help_requests")
      .insert({
        session_id: sessionId,
        student_id: userId,
        status: "pending"
      });

    if (error) {
      res.status(500).json({ error: "Failed to request help", details: error.message });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
