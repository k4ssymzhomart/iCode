import { createClient } from "@liveblocks/client";
import {
  ClientSideSuspense as RealClientSideSuspense,
  createRoomContext,
} from "@liveblocks/react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const useMockMode = false;

type Presence = {
  cursor: { x: number; y: number } | null;
  selection: { start: number; end: number } | null;
};

type Storage = {
  code: string;
};

type UserMeta = {
  id: string;
  info: {
    name: string;
    role: "teacher" | "student";
    avatar?: string;
  };
};

const client = createClient({
  authEndpoint: async (room) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error("Authentication required to join the room.");
    }

    const response = await fetch("/api/liveblocks-auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ room }),
    });
    
    return await response.json();
  },
});

const {
  RoomProvider: RealRoomProvider,
  useOthers: useRealOthers,
  useStorage: useRealStorage,
  useMutation: useRealMutation,
  useMyPresence: useRealMyPresence,
} = createRoomContext<Presence, Storage, UserMeta>(client);

const MockContext = createContext<{ roomId: string } | null>(null);
const mockStorage: Record<string, Storage> = {};
const listeners: Record<string, Set<() => void>> = {};

const triggerUpdate = (roomId: string) => {
  listeners[roomId]?.forEach((listener) => listener());
};

const MockRoomProvider = ({
  id,
  initialStorage,
  initialPresence: _initialPresence,
  initialUserMeta: _initialUserMeta,
  children,
}: {
  id: string;
  initialStorage?: Storage;
  initialPresence?: Presence;
  initialUserMeta?: UserMeta;
  children: React.ReactNode;
}) => {
  if (!mockStorage[id]) {
    mockStorage[id] = initialStorage ?? { code: "" };
  }

  return (
    <MockContext.Provider value={{ roomId: id }}>{children}</MockContext.Provider>
  );
};

const useMockStorage = <T,>(selector: (root: Storage) => T) => {
  const context = useContext(MockContext);
  const roomId = context?.roomId ?? "default";
  const [value, setValue] = useState(() =>
    selector(mockStorage[roomId] ?? { code: "" }),
  );

  useEffect(() => {
    const listener = () => setValue(selector(mockStorage[roomId] ?? { code: "" }));
    listeners[roomId] = listeners[roomId] ?? new Set();
    listeners[roomId].add(listener);
    return () => {
      listeners[roomId]?.delete(listener);
    };
  }, [roomId, selector]);

  return value;
};

const useMockMutation = <TArgs extends unknown[]>(
  callback: (
    helpers: { storage: { set: (key: keyof Storage, value: string) => void } },
    ...args: TArgs
  ) => void,
  _deps: unknown[],
) => {
  const context = useContext(MockContext);
  const roomId = context?.roomId ?? "default";

  return (...args: TArgs) => {
    callback(
      {
        storage: {
          set: (key, value) => {
            mockStorage[roomId] = mockStorage[roomId] ?? { code: "" };
            mockStorage[roomId][key] = value;
            triggerUpdate(roomId);
          },
        },
      },
      ...args,
    );
  };
};

const useMockOthers = (): Array<{
  info?: UserMeta["info"];
  presence?: Presence;
}> => [];

const useMockMyPresence = (): readonly [
  Presence,
  (_presence: Partial<Presence>) => void,
] => [{ cursor: null, selection: null }, () => undefined];

const MockClientSideSuspense = ({
  fallback,
  children,
}: {
  fallback: React.ReactNode;
  children: React.ReactNode | (() => React.ReactNode);
}) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), 400);
    return () => window.clearTimeout(timer);
  }, []);

  if (!loaded) {
    return <>{fallback}</>;
  }

  return <>{typeof children === "function" ? children() : children}</>;
};

export const RoomProvider = useMockMode ? MockRoomProvider : RealRoomProvider;
export const useOthers = useMockMode ? useMockOthers : useRealOthers;
export const useStorage = useMockMode ? useMockStorage : useRealStorage;
export const useMutation = useMockMode ? useMockMutation : useRealMutation;
export const useMyPresence = useMockMode ? useMockMyPresence : useRealMyPresence;
export const ClientSideSuspense = useMockMode
  ? MockClientSideSuspense
  : RealClientSideSuspense;
