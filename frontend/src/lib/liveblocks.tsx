import { createClient } from "@liveblocks/client";
import {
  ClientSideSuspense,
  createRoomContext,
} from "@liveblocks/react";
import type {
  HelpStatus,
  ResolvedHelpResponse,
  SessionStudentStatus,
  TeacherFocusMode,
} from "@shared/types";
import { supabase } from "./supabase";

export type SessionRoomPresence = {
  currentTaskId: string | null;
  status: SessionStudentStatus | null;
  workspaceStudentId: string | null;
  mode: TeacherFocusMode | null;
};

export type LiveblocksEditorRange = {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
};

export type SessionRoomStorage = {
  activeTaskId: string | null;
  broadcastMessage: string | null;
  pinnedHint: string | null;
  snippets: Record<string, string>;
  studentStatuses: Record<string, SessionStudentStatus>;
  helpStatuses: Record<string, HelpStatus>;
};

export type SessionRoomEvent =
  | {
      type: "student-activity";
      studentId: string;
      currentTaskId?: string;
      status?: SessionStudentStatus;
      snippet?: string;
      helpStatus?: HelpStatus;
      helpRequestedAt?: string | null;
    }
  | {
      type: "help-requested";
      studentId: string;
      taskId?: string;
      requestedAt: string;
    }
  | {
      type: "help-resolved";
      studentId: string;
      taskId: string;
      resolvedAt: string;
      response: ResolvedHelpResponse;
    }
  | {
      type: "broadcast-message";
      message: string | null;
    }
  | {
      type: "pinned-hint";
      hint: string | null;
    }
  | {
      type: "active-task";
      taskId: string;
    }
  | {
      type: "teacher-focus";
      studentId: string;
      taskId: string;
      mode: TeacherFocusMode;
    };

export type EditorRoomPresence = {
  cursor: { lineNumber: number; column: number } | null;
  selection: LiveblocksEditorRange | null;
  mode: TeacherFocusMode | null;
  workspaceStudentId: string | null;
};

export type EditorRoomStorage = {
  code: string;
  revision: number;
  teacherJoinedMessage: string | null;
};

export type EditorRoomEvent =
  | {
      type: "teacher-joined";
      teacherName: string;
      mode: TeacherFocusMode;
    }
  | {
      type: "teacher-mode";
      mode: TeacherFocusMode;
    }
  | {
      type: "interventions-updated";
    }
  | {
      type: "code-saved";
      revision: number;
    };

type UserMeta = {
  id: string;
  info: {
    name: string;
    role: "teacher" | "student" | "admin";
    avatar?: string;
  };
};

export const buildSessionRoomId = (sessionId: string) => `session:${encodeURIComponent(sessionId)}`;
export const buildEditorRoomId = (
  sessionId: string,
  workspaceStudentId: string,
  taskId: string,
) =>
  `editor:${encodeURIComponent(sessionId)}:${encodeURIComponent(workspaceStudentId)}:${encodeURIComponent(taskId)}`;

const client = createClient({
  authEndpoint: async (room) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("Authentication required to join the room.");
    }

    const response = await fetch("/api/liveblocks-auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ room }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Liveblocks auth failed (${response.status})`);
    }

    return await response.json();
  },
});

const sessionContext = createRoomContext<
  SessionRoomPresence,
  SessionRoomStorage,
  UserMeta,
  SessionRoomEvent
>(client);

const editorContext = createRoomContext<
  EditorRoomPresence,
  EditorRoomStorage,
  UserMeta,
  EditorRoomEvent
>(client);

export const SessionRoomProvider = sessionContext.RoomProvider;
export const useSessionRoom = sessionContext.useRoom;
export const useSessionOthers = sessionContext.useOthers;
export const useSessionStorage = sessionContext.useStorage;
export const useSessionMutation = sessionContext.useMutation;
export const useSessionMyPresence = sessionContext.useMyPresence;
export const useSessionBroadcastEvent = sessionContext.useBroadcastEvent;
export const useSessionEventListener = sessionContext.useEventListener;
export const useSessionStatus = sessionContext.useStatus;

export const EditorRoomProvider = editorContext.RoomProvider;
export const useEditorRoom = editorContext.useRoom;
export const useEditorOthers = editorContext.useOthers;
export const useEditorStorage = editorContext.useStorage;
export const useEditorMutation = editorContext.useMutation;
export const useEditorMyPresence = editorContext.useMyPresence;
export const useEditorBroadcastEvent = editorContext.useBroadcastEvent;
export const useEditorEventListener = editorContext.useEventListener;
export const useEditorStatus = editorContext.useStatus;

// Backward-compatible aliases for the editor room hooks.
export const RoomProvider = EditorRoomProvider;
export const useOthers = useEditorOthers;
export const useStorage = useEditorStorage;
export const useMutation = useEditorMutation;
export const useMyPresence = useEditorMyPresence;

export { ClientSideSuspense };
