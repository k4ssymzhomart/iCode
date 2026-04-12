import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { Liveblocks } from "@liveblocks/node";
import { supabaseAdmin } from "../supabaseClient";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

export const handleLiveblocksAuth = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { room } = req.body;

    if (!room) {
      res.status(400).json({ error: "Room ID is required" });
      return;
    }

    let parsedSessionId = room;
    let requiredStudentId: string | null = null;
    const isEditor = room.startsWith("editor_");
    const isPresence = room.startsWith("room_");

    if (isEditor) {
      const parts = room.split("_");
      // format: editor_${sessionId}_${studentId}
      parsedSessionId = parts[1];
      requiredStudentId = parts[2];
    } else if (isPresence) {
      const parts = room.split("_");
      // format: room_${sessionId}
      parsedSessionId = parts[1];
    }

    // Identify user profile to determine permissions
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role, full_name, avatar_url")
      .eq("id", userId)
      .single();

    if (!profile) {
      res.status(403).json({ error: "Profile not found" });
      return;
    }

    // Lookup session to verify it exists and to check teacher ownership
    const { data: sessionData } = await supabaseAdmin
      .from("lab_sessions")
      .select("id, classroom_id, classrooms(teacher_id)")
      .eq("id", parsedSessionId)
      .single();

    if (!sessionData) {
      res.status(404).json({ error: "Room/Session not found or invalid format" });
      return;
    }

    if (profile.role === "teacher") {
      // Teacher can only join rooms belonging to their classrooms
      if ((sessionData.classrooms as any).teacher_id !== userId) {
        res.status(403).json({ error: "Not authorized to manage this session" });
        return;
      }
    } else {
      // If student joins an "editor_" room, the studentId must be their own userId!
      if (isEditor && requiredStudentId !== userId) {
         res.status(403).json({ error: "Students can only access their own private editor room" });
         return;
      }
    }

    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: profile.full_name,
        role: profile.role,
        avatar: profile.avatar_url,
      },
    });

    session.allow(room, session.FULL_ACCESS);

    const { status, body } = await session.authorize();
    
    res.status(status).send(body);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
