import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import React, { createContext, useContext, useState, useEffect } from 'react';

// ----------------------------------------------------------------------------
// MOCK IMPLEMENTATION FOR DEMO
// ----------------------------------------------------------------------------
// To prevent "No access to room" errors without a valid API key,
// we use a local state mock.
// ----------------------------------------------------------------------------
const USE_MOCK = true;

// --- Types ---
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
  };
};

// --- Real Implementation (Unused in Mock Mode) ---
const client = createClient({
  publicApiKey: "pk_dev_YOUR_PUBLIC_KEY_HERE", 
});

const {
  RoomProvider: RealRoomProvider,
  useOthers: useRealOthers,
  useStorage: useRealStorage,
  useMutation: useRealMutation,
  useMyPresence: useRealMyPresence,
} = createRoomContext<Presence, Storage, UserMeta>(client);

import { ClientSideSuspense as RealClientSideSuspense } from "@liveblocks/react";

// --- Mock Implementation ---
const MockContext = createContext<{ roomId: string } | null>(null);

// Global store to share state between "Teacher" and "Student" views in the same session
const globalStorage: Record<string, any> = {};
const globalListeners: Record<string, Set<() => void>> = {};

const triggerUpdate = (roomId: string) => {
  if (globalListeners[roomId]) {
    globalListeners[roomId].forEach(cb => cb());
  }
};

const MockRoomProvider = ({ id, initialStorage, children }: any) => {
  if (!globalStorage[id]) {
    globalStorage[id] = initialStorage || { code: "" };
  }
  return React.createElement(
    MockContext.Provider,
    { value: { roomId: id } },
    children
  );
};

const useMockStorage = (selector: (root: any) => any) => {
  const ctx = useContext(MockContext);
  const roomId = ctx?.roomId || "default";
  const [val, setVal] = useState(() => selector(globalStorage[roomId] || {}));

  useEffect(() => {
    const listener = () => setVal(selector(globalStorage[roomId] || {}));
    if (!globalListeners[roomId]) globalListeners[roomId] = new Set();
    globalListeners[roomId].add(listener);
    return () => { globalListeners[roomId]?.delete(listener); };
  }, [roomId, selector]);

  return val;
};

const useMockMutation = (callback: any, deps: any[]) => {
  const ctx = useContext(MockContext);
  const roomId = ctx?.roomId || "default";
  return (...args: any[]) => {
    const storageRoot = {
        set: (key: string, value: any) => {
            if (!globalStorage[roomId]) globalStorage[roomId] = {};
            globalStorage[roomId][key] = value;
            triggerUpdate(roomId);
        }
    };
    callback({ storage: storageRoot }, ...args);
  };
};

const useMockOthers = () => []; 
const useMockMyPresence = () => [{}, () => {}];

const MockClientSideSuspense = ({ fallback, children }: any) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
     const timer = setTimeout(() => setLoaded(true), 600); // Simulate connection
     return () => clearTimeout(timer);
  }, []);
  
  if (!loaded) return fallback;
  
  return typeof children === 'function' ? children() : children;
};

// --- Exports ---
export const RoomProvider = USE_MOCK ? MockRoomProvider : RealRoomProvider;
export const useOthers = USE_MOCK ? useMockOthers : useRealOthers;
export const useStorage = USE_MOCK ? useMockStorage : useRealStorage;
export const useMutation = USE_MOCK ? useMockMutation : useRealMutation;
export const useMyPresence = USE_MOCK ? useMockMyPresence : useRealMyPresence;
export const ClientSideSuspense = USE_MOCK ? MockClientSideSuspense : RealClientSideSuspense;