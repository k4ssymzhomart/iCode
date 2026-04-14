import { Response } from "express";
import { Liveblocks } from "@liveblocks/node";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  assertStudentCanAccessWorkspace,
  assertStudentInSession,
  assertTeacherCanAccessStudentWorkspace,
  assertTeacherOwnsSession,
  assertUserRole,
  HttpError,
} from "../lib/classroom";
import { sendControllerError } from "../lib/responses";
import { supabaseAdmin } from "../supabaseClient";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

const decodeRoomPart = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const parseRoom = (room: string) => {
  if (room.startsWith("session:")) {
    return { kind: "session" as const, sessionId: decodeRoomPart(room.slice("session:".length)) };
  }

  if (room.startsWith("session_")) {
    const sessionId = room.slice("session_".length);
    return { kind: "session" as const, sessionId };
  }

  if (room.startsWith("editor:")) {
    const parts = room.split(":");
    if (parts.length >= 4) {
      const [, sessionId, studentId, ...taskParts] = parts;
      const taskId = taskParts.join(":");
      return {
        kind: "editor" as const,
        sessionId: decodeRoomPart(sessionId),
        studentId: decodeRoomPart(studentId),
        taskId: decodeRoomPart(taskId),
      };
    }
  }

  if (room.startsWith("editor_")) {
    const prefixedSessionMatch = room.match(/^editor_(session_[^_]+)_([^_]+)_(.+)$/u);
    if (prefixedSessionMatch) {
      const [, sessionId, studentId, taskId] = prefixedSessionMatch;
      return { kind: "editor" as const, sessionId, studentId, taskId };
    }

    const parts = room.split("_");
    if (parts.length >= 4) {
      const [, sessionId, studentId, ...taskParts] = parts;
      const taskId = taskParts.join("_");
      return { kind: "editor" as const, sessionId, studentId, taskId };
    }
  }

  throw new HttpError(400, "Invalid Liveblocks room id.");
};

export const handleLiveblocksAuth = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const room = String(req.body?.room ?? "");
    if (!room) {
      throw new HttpError(400, "Room id is required.");
    }

    const parsedRoom = parseRoom(room);
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, full_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      throw new HttpError(500, `Failed to load profile: ${profileError.message}`);
    }

    if (!profile) {
      throw new HttpError(401, "Profile not found.", "unauthorized");
    }

    const role = await assertUserRole(userId, ["teacher", "student", "admin"]);

    if (parsedRoom.kind === "session") {
      if (role === "teacher") {
        await assertTeacherOwnsSession(userId, parsedRoom.sessionId);
      } else {
        await assertStudentInSession(userId, parsedRoom.sessionId);
      }
    } else {
      if (role === "teacher") {
        await assertTeacherCanAccessStudentWorkspace(
          userId,
          parsedRoom.sessionId,
          parsedRoom.studentId,
          parsedRoom.taskId,
        );
      } else {
        if (parsedRoom.studentId !== userId) {
          throw new HttpError(
            403,
            "Students can only access their own task workspace.",
            "forbidden",
          );
        }
        await assertStudentCanAccessWorkspace(
          userId,
          parsedRoom.sessionId,
          parsedRoom.taskId,
        );
      }
    }

    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: profile.full_name,
        role,
        avatar: profile.avatar_url ?? undefined,
      },
    });

    session.allow(room, session.FULL_ACCESS);
    const { status, body } = await session.authorize();
    res.status(status).send(body);
  } catch (error) {
    sendControllerError(res, error);
  }
};
