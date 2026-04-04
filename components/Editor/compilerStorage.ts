import type { CompilerHistoryEntry } from "../../lib/compiler/types";

const storageKey = "icode.smart-compiler.v3";

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

const readState = (): CompilerWorkspaceState => {
  if (!canUseStorage()) {
    return createDefaultState();
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
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

const writeState = (state: CompilerWorkspaceState) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(state));
};

const withState = <T>(updater: (state: CompilerWorkspaceState) => T) => {
  const state = readState();
  const result = updater(state);
  writeState(state);
  return result;
};

export const loadCompilerDraft = () => readState().draft;

export const saveCompilerDraft = (code: string) =>
  withState((state) => {
    const updatedAt = new Date().toISOString();
    state.draft = { code, updatedAt };
    return updatedAt;
  });

export const clearCompilerDraft = () =>
  withState((state) => {
    delete state.draft;
  });

export const loadCompilerStdin = () => readState().stdin;

export const saveCompilerStdin = (stdin: string) =>
  withState((state) => {
    state.stdin = stdin;
  });

export const loadCompilerHistory = () => readState().history;

export const appendCompilerHistory = (entry: CompilerHistoryEntry) =>
  withState((state) => {
    state.history = [entry, ...state.history].slice(0, 16);
  });
