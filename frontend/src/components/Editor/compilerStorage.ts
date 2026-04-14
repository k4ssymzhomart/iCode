import type { CompilerHistoryEntry } from "@shared/compiler";

const storageKey = (userId?: string) => `icode.smart-compiler.v3.${userId || 'guest'}`;

type StoredDraft = {
  code: string;
  updatedAt: string;
};

type CompilerWorkspaceState = {
  draft?: StoredDraft;
  stdin: string;
  history: CompilerHistoryEntry[];
};

const createDefaultState = (): CompilerWorkspaceState => ({
  stdin: "",
  history: [],
});

const canUseStorage = () => typeof window !== "undefined";

const readState = (userId?: string): CompilerWorkspaceState => {
  if (!canUseStorage()) {
    return createDefaultState();
  }

  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) {
      return createDefaultState();
    }

    const parsed = JSON.parse(raw) as Partial<CompilerWorkspaceState>;
    return {
      ...createDefaultState(),
      ...parsed,
      history: parsed.history ?? [],
    };
  } catch {
    return createDefaultState();
  }
};

const writeState = (state: CompilerWorkspaceState, userId?: string) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(storageKey(userId), JSON.stringify(state));
};

const withState = <T>(updater: (state: CompilerWorkspaceState) => T, userId?: string) => {
  const state = readState(userId);
  const result = updater(state);
  writeState(state, userId);
  return result;
};

export const loadCompilerDraft = (userId?: string) => readState(userId).draft;

export const saveCompilerDraft = (code: string, userId?: string) =>
  withState((state) => {
    const updatedAt = new Date().toISOString();
    state.draft = { code, updatedAt };
    return updatedAt;
  }, userId);

export const clearCompilerDraft = (userId?: string) =>
  withState((state) => {
    delete state.draft;
  }, userId);

export const loadCompilerStdin = (userId?: string) => readState(userId).stdin;

export const saveCompilerStdin = (stdin: string, userId?: string) =>
  withState((state) => {
    state.stdin = stdin;
  }, userId);

export const loadCompilerHistory = (userId?: string) => readState(userId).history;

export const appendCompilerHistory = (entry: CompilerHistoryEntry, userId?: string) =>
  withState((state) => {
    state.history = [entry, ...state.history].slice(0, 16);
  }, userId);
