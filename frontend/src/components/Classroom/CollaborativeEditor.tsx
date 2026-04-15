import {
  Component,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { AlertTriangle, Loader2, MessageSquare, Wand2 } from "lucide-react";
import type {
  EditorIntervention,
  EditorRange,
  Task,
  TeacherFocusMode,
} from "@shared/types";
import { classroomService } from "@/services/classroom";
import {
  buildEditorRoomId,
  ClientSideSuspense,
  EditorRoomProvider,
  type LiveblocksEditorRange,
  useEditorBroadcastEvent,
  useEditorEventListener,
  useEditorMyPresence,
  useEditorOthers,
  useEditorStatus,
  useEditorRoom,
} from "@/lib/liveblocks";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { MonacoBinding } from "y-monaco";
import type { Awareness as MonacoAwareness } from "y-protocols/awareness";
import ClassroomLoader from "./Student/ClassroomLoader";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class EditorErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || "Connection failed" };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[CollaborativeEditor] Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#fafafa] p-6 text-center">
          <div className="border-2 border-[#11110f] bg-white p-6 shadow-[4px_4px_0_#11110f] max-w-sm w-full">
            <div className="mb-3 flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <span className="text-sm font-black uppercase tracking-wider text-[#11110f]">
                Connection Error
              </span>
            </div>
            <p className="mb-4 text-xs font-medium text-gray-500">
              Failed to connect to the collaborative editing session. Please make sure the session is active and try again.
            </p>
            <p className="mb-4 break-all text-[10px] font-mono text-gray-400">
              {this.state.errorMessage}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, errorMessage: "" })}
              className="w-full border-2 border-[#11110f] bg-[#ccff00] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#11110f] shadow-[2px_2px_0_#11110f] transition-colors hover:bg-[#bdf300]"
            >
              Retry Connection
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export interface CollaborativeEditorHandle {
  getSelectedRange: () => EditorRange;
  getCode: () => string;
  getRevision: () => number;
  refreshInterventions: () => Promise<void>;
  notifyInterventionsChanged: () => void;
  replaceCode: (code: string) => void;
}

export interface CollaborativeEditorProps {
  sessionId: string;
  taskId: string;
  workspaceStudentId: string;
  currentUserId: string;
  userName: string;
  initialCode?: string;
  workspaceCode?: string;
  language?: Task["language"];
  role?: "teacher" | "student";
  mode?: TeacherFocusMode;
  readOnly?: boolean;
  onChange?: (code: string) => void;
  onSnippetChange?: (code: string) => void;
  onTeacherPresenceChange?: (message: string | null) => void;
  showInterventionTray?: boolean;
  announceTeacherPresence?: boolean;
}

const buildDefaultRange = (): EditorRange => ({
  startLineNumber: 1,
  startColumn: 1,
  endLineNumber: 1,
  endColumn: 1,
});

const decorationClasses: Record<EditorIntervention["type"], string> = {
  comment: "icode-intervention-comment",
  highlight: "icode-intervention-highlight",
  suggestion: "icode-intervention-suggestion",
  direct_edit: "icode-intervention-direct-edit",
};

const toMonacoAwareness = (
  provider: LiveblocksYjsProvider,
): MonacoAwareness => {
  const awareness = provider.awareness as unknown as MonacoAwareness & {
    clientID?: number;
  };

  if (awareness.clientID === undefined) {
    awareness.clientID = provider.getYDoc().clientID;
  }

  return awareness;
};

type WorkspaceBootstrap = {
  code: string;
  revision: number;
};

const workspaceBootstrapCache = new Map<string, WorkspaceBootstrap>();
const workspaceBootstrapPromiseCache = new Map<string, Promise<WorkspaceBootstrap>>();

const primeWorkspaceBootstrap = (
  roomKey: string,
  snapshot: Pick<WorkspaceBootstrap, "code"> & Partial<WorkspaceBootstrap>,
) => {
  const current = workspaceBootstrapCache.get(roomKey);
  workspaceBootstrapCache.set(roomKey, {
    code: snapshot.code,
    revision: snapshot.revision ?? current?.revision ?? 0,
  });
};

const resolveWorkspaceBootstrap = async ({
  roomKey,
  sessionId,
  taskId,
  workspaceStudentId,
  role,
  fallbackCode,
}: {
  roomKey: string;
  sessionId: string;
  taskId: string;
  workspaceStudentId: string;
  role: "teacher" | "student";
  fallbackCode?: string;
}) => {
  const cached = workspaceBootstrapCache.get(roomKey);
  if (cached) {
    return cached;
  }

  const pending = workspaceBootstrapPromiseCache.get(roomKey);
  if (pending) {
    return pending;
  }

  const bootstrapPromise = classroomService
    .loadWorkspace({
      sessionId,
      taskId,
      studentId: role === "teacher" ? workspaceStudentId : undefined,
    })
    .then((response) => {
      const snapshot = {
        code: response.code ?? fallbackCode ?? "",
        revision: response.revision ?? 0,
      };
      workspaceBootstrapCache.set(roomKey, snapshot);
      return snapshot;
    })
    .catch((error) => {
      const snapshot = {
        code: fallbackCode ?? "",
        revision: 0,
      };
      workspaceBootstrapCache.set(roomKey, snapshot);
      throw Object.assign(error instanceof Error ? error : new Error("Failed to load workspace"), {
        snapshot,
      });
    })
    .finally(() => {
      workspaceBootstrapPromiseCache.delete(roomKey);
    });

  workspaceBootstrapPromiseCache.set(roomKey, bootstrapPromise);
  return bootstrapPromise;
};

const WorkspaceLoader = forwardRef<CollaborativeEditorHandle, CollaborativeEditorProps>(
  function WorkspaceLoader(
    {
      sessionId,
      taskId,
      workspaceStudentId,
      currentUserId,
      userName,
      initialCode,
      workspaceCode,
      language = "python",
      role = "student",
      mode = role === "teacher" ? "view" : undefined,
      readOnly,
      onChange,
      onSnippetChange,
      onTeacherPresenceChange,
      showInterventionTray = role === "student",
      announceTeacherPresence = false,
    },
    ref,
  ) {
    const roomKey = `${sessionId}:${workspaceStudentId}:${taskId}`;
    const [workspaceBootstrap, setWorkspaceBootstrap] = useState<{
      roomKey: string;
      snapshot: WorkspaceBootstrap;
    } | null>(() => {
      const cached = workspaceBootstrapCache.get(roomKey);
      return cached ? { roomKey, snapshot: cached } : null;
    });
    const contextRef = useRef({ initialCode, workspaceCode, onChange });
    useEffect(() => {
      contextRef.current = { initialCode, workspaceCode, onChange };
    }, [initialCode, onChange, workspaceCode]);

    useEffect(() => {
      let cancelled = false;
      const cached = workspaceBootstrapCache.get(roomKey);

      if (cached) {
        setWorkspaceBootstrap({ roomKey, snapshot: cached });
        contextRef.current.onChange?.(cached.code);
        return () => {
          cancelled = true;
        };
      }

      setWorkspaceBootstrap(null);

      void resolveWorkspaceBootstrap({
        roomKey,
        sessionId,
        taskId,
        workspaceStudentId,
        role,
        fallbackCode: contextRef.current.workspaceCode ?? contextRef.current.initialCode,
      })
        .then((snapshot) => {
          if (cancelled) {
            return;
          }

          setWorkspaceBootstrap({ roomKey, snapshot });
          contextRef.current.onChange?.(snapshot.code);
        })
        .catch((error: Error & { snapshot?: WorkspaceBootstrap }) => {
          console.error("[CollaborativeEditor] Failed to load workspace", error);

          if (cancelled) {
            return;
          }

          const fallbackSnapshot = error.snapshot ?? {
            code: contextRef.current.workspaceCode ?? contextRef.current.initialCode ?? "",
            revision: 0,
          };
          primeWorkspaceBootstrap(roomKey, fallbackSnapshot);
          setWorkspaceBootstrap({ roomKey, snapshot: fallbackSnapshot });
          contextRef.current.onChange?.(fallbackSnapshot.code);
        });

      return () => {
        cancelled = true;
      };
    }, [roomKey, role, sessionId, taskId, workspaceStudentId]);

    if (!workspaceBootstrap || workspaceBootstrap.roomKey !== roomKey) {
      return (
        role === "student" ? (
          <ClassroomLoader compact message="Loading workspace..." />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#fafafa] text-[#11110f]">
            <Loader2 className="h-8 w-8 animate-spin text-[#ccff00]" />
            <span className="text-sm font-bold uppercase tracking-widest text-[#11110f]">
              Loading workspace...
            </span>
          </div>
        )
      );
    }

    return (
      <EditorRoomProvider
        key={roomKey}
        id={buildEditorRoomId(sessionId, workspaceStudentId, taskId)}
        initialPresence={{
          cursor: null,
          selection: null,
          mode: role === "teacher" ? mode ?? "view" : null,
          workspaceStudentId,
        }}
        initialStorage={{
          code: "",
          revision: workspaceBootstrap.snapshot.revision,
          teacherJoinedMessage: null,
        }}
      >
        <ClientSideSuspense
          fallback={
            role === "student" ? (
              <ClassroomLoader compact message="Connecting to task room..." />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#fafafa] text-[#11110f]">
                <Loader2 className="h-8 w-8 animate-spin text-[#ccff00]" />
                <span className="text-sm font-bold uppercase tracking-widest text-[#11110f]">
                  Connecting to task room...
                </span>
              </div>
            )
          }
        >
          {() => (
            <EditorInstance
              ref={ref}
              sessionId={sessionId}
              taskId={taskId}
              workspaceStudentId={workspaceStudentId}
              currentUserId={currentUserId}
              userName={userName}
              initialCode={initialCode}
              workspaceCode={workspaceBootstrap.snapshot.code}
              language={language}
              role={role}
              mode={mode}
              readOnly={readOnly}
              onChange={onChange}
              onSnippetChange={onSnippetChange}
              onTeacherPresenceChange={onTeacherPresenceChange}
              showInterventionTray={showInterventionTray}
              announceTeacherPresence={announceTeacherPresence}
            />
          )}
        </ClientSideSuspense>
      </EditorRoomProvider>
    );
  },
);

const EditorInstance = forwardRef<
  CollaborativeEditorHandle,
  CollaborativeEditorProps
>(function EditorInstance(
  {
    sessionId,
    taskId,
    workspaceStudentId,
    currentUserId,
    userName,
    initialCode,
    workspaceCode,
    language = "python",
    role = "student",
    mode = role === "teacher" ? "view" : undefined,
    readOnly,
    onChange,
    onSnippetChange,
    onTeacherPresenceChange,
    showInterventionTray = role === "student",
    announceTeacherPresence = false,
  },
  ref,
) {
  const room = useEditorRoom();
  const others = useEditorOthers();
  const editorStatus = useEditorStatus();
  const broadcast = useEditorBroadcastEvent();
  const [, updateMyPresence] = useEditorMyPresence();
  const roomKey = `${sessionId}:${workspaceStudentId}:${taskId}`;
  const canWrite = role === "teacher" ? mode === "edit" && !readOnly : !readOnly;
  const isEditorReadOnly =
    role === "teacher" ? mode !== "edit" || Boolean(readOnly) : Boolean(readOnly);

  const [teacherNotice, setTeacherNotice] = useState<string | null>(null);
  const [interventions, setInterventions] = useState<EditorIntervention[]>([]);
  const [interventionsLoading, setInterventionsLoading] = useState(false);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const saveTimerRef = useRef<number | null>(null);
  const isRoomConnectedRef = useRef(false);
  const latestCodeRef = useRef(workspaceCode ?? initialCode ?? "");
  const persistContextRef = useRef({
    canWrite,
    sessionId,
    taskId,
    workspaceStudentId,
    role,
  });
  
  const yDocRef = useRef<Y.Doc | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const providerRef = useRef<LiveblocksYjsProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const announcedTeacherModeRef = useRef<TeacherFocusMode | null>(null);

  const callbacksRef = useRef({ onChange, onSnippetChange, onTeacherPresenceChange });
  useEffect(() => {
    callbacksRef.current = { onChange, onSnippetChange, onTeacherPresenceChange };
  }, [onChange, onSnippetChange, onTeacherPresenceChange]);
  const isRoomConnected = editorStatus === "connected";
  const fileName =
    language === "javascript"
      ? "main.js"
      : language === "typescript"
        ? "main.ts"
        : "main.py";
  const modelPath = `${buildEditorRoomId(sessionId, workspaceStudentId, taskId)}/${fileName}`;

  useEffect(() => {
    isRoomConnectedRef.current = isRoomConnected;
  }, [isRoomConnected]);

  useEffect(() => {
    latestCodeRef.current = workspaceCode ?? initialCode ?? "";
  }, [initialCode, workspaceCode]);

  useEffect(() => {
    persistContextRef.current = {
      canWrite,
      sessionId,
      taskId,
      workspaceStudentId,
      role,
    };
  }, [canWrite, role, sessionId, taskId, workspaceStudentId]);

  useEffect(() => {
    editorRef.current?.updateOptions({
      readOnly: isEditorReadOnly,
    });
  }, [isEditorReadOnly]);

  const loadInterventions = async () => {
    setInterventionsLoading(true);
    try {
      const response = await classroomService.listInterventions({
        sessionId,
        taskId,
        studentId: role === "teacher" ? workspaceStudentId : undefined,
      });
      setInterventions(response.interventions);
    } catch (error) {
      console.error("[CollaborativeEditor] Failed to load interventions", error);
    } finally {
      setInterventionsLoading(false);
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      getSelectedRange: () => {
        const selection = editorRef.current?.getSelection();
        if (!selection) {
          return buildDefaultRange();
        }

        return {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn,
        };
      },
      getCode: () => yTextRef.current?.toString() ?? "",
      getRevision: () => 0,
      refreshInterventions: loadInterventions,
      notifyInterventionsChanged: () => {
        if (isRoomConnectedRef.current) {
           broadcast({ type: "interventions-updated" });
        }
        void loadInterventions();
      },
      replaceCode: (nextCode: string) => {
        if (yTextRef.current) {
           yTextRef.current.delete(0, yTextRef.current.length);
           yTextRef.current.insert(0, nextCode);
        }
        latestCodeRef.current = nextCode;
        primeWorkspaceBootstrap(roomKey, { code: nextCode });
        callbacksRef.current.onChange?.(nextCode);
        callbacksRef.current.onSnippetChange?.(nextCode);
        persistWorkspace(nextCode);
      },
    }),
    [broadcast],
  );

  useEffect(() => {
    loadInterventions();
  }, [sessionId, taskId, workspaceStudentId, role]);

  useEffect(() => {
    if (role !== "teacher" || !announceTeacherPresence) {
      return;
    }

    const nextMode = mode ?? "view";
    const previousMode = announcedTeacherModeRef.current;
    const message =
      previousMode === null
        ? `Teacher joined in ${nextMode} mode`
        : `Teacher switched to ${nextMode} mode`;

    setTeacherNotice(message);
    callbacksRef.current.onTeacherPresenceChange?.(message);

    if (isRoomConnectedRef.current) {
      if (previousMode === null) {
        broadcast({
          type: "teacher-joined",
          teacherName: userName,
          mode: nextMode,
        });
      } else {
        broadcast({
          type: "teacher-mode",
          mode: nextMode,
        });
      }
    }

    announcedTeacherModeRef.current = nextMode;
  }, [
    announceTeacherPresence,
    broadcast,
    mode,
    role,
    userName,
  ]);

  useEffect(
    () => () => {
      announcedTeacherModeRef.current = null;
      callbacksRef.current.onTeacherPresenceChange?.(null);
    },
    [],
  );

  useEditorEventListener(({ event }) => {
    if (event.type === "teacher-joined") {
      const message = `${event.teacherName} joined in ${event.mode} mode`;
      setTeacherNotice(message);
      callbacksRef.current.onTeacherPresenceChange?.(message);
      return;
    }

    if (event.type === "teacher-mode") {
      const message = `Teacher switched to ${event.mode} mode`;
      setTeacherNotice(message);
      callbacksRef.current.onTeacherPresenceChange?.(message);
      return;
    }

    if (event.type === "interventions-updated") {
      void loadInterventions();
    }
  });

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) {
      return;
    }

    const nextDecorations = interventions
      .filter((intervention) => intervention.status === "open" || intervention.type === "direct_edit")
      .map((intervention) => ({
        range: new monacoRef.current!.Range(
          intervention.range.startLineNumber,
          intervention.range.startColumn,
          intervention.range.endLineNumber,
          intervention.range.endColumn,
        ),
        options: {
          isWholeLine: intervention.type !== "comment",
          className: decorationClasses[intervention.type],
          glyphMarginClassName:
            intervention.type === "comment"
              ? "icode-intervention-glyph"
              : undefined,
          hoverMessage: {
            value:
              intervention.content ||
              (intervention.type === "suggestion"
                ? "Teacher suggested a change here."
                : "Teacher marked this area."),
          },
        },
      }));

    decorationIdsRef.current = editorRef.current.deltaDecorations(
      decorationIdsRef.current,
      nextDecorations,
    );
  }, [interventions]);

  const saveWorkspaceNow = async (nextCode: string) => {
    if (!persistContextRef.current.canWrite) {
      return;
    }

    const response = await classroomService.saveWorkspace({
      sessionId: persistContextRef.current.sessionId,
      taskId: persistContextRef.current.taskId,
      studentId:
        persistContextRef.current.role === "teacher"
          ? persistContextRef.current.workspaceStudentId
          : undefined,
      code: nextCode,
    });

    primeWorkspaceBootstrap(roomKey, {
      code: nextCode,
      revision: response.revision,
    });
  };

  const persistWorkspace = (nextCode: string) => {
    if (!canWrite) {
      return;
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(async () => {
      try {
        await saveWorkspaceNow(nextCode);
      } catch (error) {
        console.error("[CollaborativeEditor] Failed to save workspace", error);
      }
    }, 900);
  };

  const initYjs = (editor: MonacoEditor.IStandaloneCodeEditor) => {
    if (!room || yDocRef.current) return;

    yDocRef.current = new Y.Doc();
    yTextRef.current = yDocRef.current.getText("monaco");

    providerRef.current = new LiveblocksYjsProvider(room, yDocRef.current);

    let isInitialized = false;
    const seedCode = workspaceCode ?? initialCode ?? "";

    providerRef.current.on("sync", (isSynced: boolean) => {
      if (isSynced && yTextRef.current && !isInitialized) {
        isInitialized = true;

        if (yTextRef.current.length === 0 && seedCode.length > 0) {
          yTextRef.current.insert(0, seedCode);
        }

        const syncedCode = yTextRef.current.toString();
        latestCodeRef.current = syncedCode;
        primeWorkspaceBootstrap(roomKey, {
          code: syncedCode,
        });
        callbacksRef.current.onChange?.(syncedCode);
      }
    });

    bindingRef.current = new MonacoBinding(
      yTextRef.current,
      editor.getModel()!,
      new Set([editor]),
      toMonacoAwareness(providerRef.current)
    );
    
    // Configure Yjs Awareness for teacher
    providerRef.current.awareness.setLocalStateField("user", {
        name: userName,
        color: role === "teacher" ? "#ccff00" : "#3b82f6",
        colorLight: role === "teacher" ? "rgba(204, 255, 0, 0.2)" : "rgba(59, 130, 246, 0.2)"
    });
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    initYjs(editor);

    editor.onDidChangeCursorPosition((event) => {
      if (!isRoomConnectedRef.current) {
        return;
      }

      try {
        updateMyPresence({
          cursor: {
            lineNumber: event.position.lineNumber,
            column: event.position.column,
          },
        });

        const selection = editor.getSelection();
        if (selection) {
          updateMyPresence({
            selection: {
              startLineNumber: selection.startLineNumber,
              startColumn: selection.startColumn,
              endLineNumber: selection.endLineNumber,
              endColumn: selection.endColumn,
            } satisfies LiveblocksEditorRange,
          });
        }
      } catch (error) {
        console.warn("[CollaborativeEditor] Failed to sync presence", error);
      }
    });
    
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      latestCodeRef.current = value;
      primeWorkspaceBootstrap(roomKey, { code: value });
      callbacksRef.current.onChange?.(value);

      if (!persistContextRef.current.canWrite || !editor.hasTextFocus()) {
        return;
      }

      callbacksRef.current.onSnippetChange?.(value);
      persistWorkspace(value);
    });
  };

  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        if (persistContextRef.current.canWrite) {
          void saveWorkspaceNow(latestCodeRef.current).catch((error) => {
            console.error("[CollaborativeEditor] Failed to flush workspace on unmount", error);
          });
        }
      }
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (yDocRef.current) {
        yDocRef.current.destroy();
        yDocRef.current = null;
      }
      yTextRef.current = null;
      editorRef.current = null;
      monacoRef.current = null;
    };
  }, []);

  const handleSuggestionStatus = async (
    intervention: EditorIntervention,
    status: "accepted" | "rejected",
  ) => {
    try {
      const acceptedCode = status === "accepted" ? intervention.suggestedCode : undefined;
      await classroomService.updateInterventionStatus(
        intervention.id,
        status,
        acceptedCode,
      );

      if (status === "accepted" && acceptedCode && yTextRef.current) {
        yTextRef.current.delete(0, yTextRef.current.length);
        yTextRef.current.insert(0, acceptedCode);
        latestCodeRef.current = acceptedCode;
        primeWorkspaceBootstrap(roomKey, { code: acceptedCode });
        callbacksRef.current.onChange?.(acceptedCode);
        callbacksRef.current.onSnippetChange?.(acceptedCode);
        persistWorkspace(acceptedCode);
      }

      if (isRoomConnectedRef.current) {
        broadcast({ type: "interventions-updated" });
      }
      await loadInterventions();
    } catch (error) {
      console.error("[CollaborativeEditor] Failed to update intervention", error);
    }
  };

  const openInterventions = useMemo(
    () => interventions.filter((intervention) => intervention.status === "open"),
    [interventions],
  );

  return (
    <div className="relative flex h-full flex-col bg-white">
      <div className="shrink-0 border-b-2 border-[#11110f] bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#11110f]">
              <span className="rounded-none border-2 border-[#11110f] bg-[#ccff00] px-2 py-0.5 text-xs font-bold text-[#11110f]">
                {language.toUpperCase()}
              </span>
              {fileName}
            </span>

            <div className="ml-3 flex items-center border-l-2 border-[#11110f] pl-3">
              {others.map((user, index) => (
                <div
                  key={`${user.connectionId}-${index}`}
                  className="z-10 -ml-2 flex h-7 w-7 items-center justify-center overflow-hidden rounded-none border-2 border-[#11110f] bg-[#fafafa] text-xs font-bold text-[#11110f]"
                  title={user.info?.name}
                >
                  {user.info?.avatar ? (
                    <img
                      src={user.info.avatar}
                      alt={user.info?.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{user.info?.name?.slice(0, 1) ?? "?"}</span>
                  )}
                </div>
              ))}
              {others.length > 0 && (
                <div className="pl-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                  {others.length} viewing
                </div>
              )}
            </div>
          </div>

          {role === "teacher" && mode ? (
            <span className="border-2 border-[#11110f] bg-[#11110f] px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#ccff00]">
              {mode}
            </span>
          ) : null}
        </div>
      </div>

      {teacherNotice ? (
        <div className="border-b-2 border-[#11110f] bg-[#ccff00] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#11110f]">
          {teacherNotice}
        </div>
      ) : null}

      {showInterventionTray && (openInterventions.length > 0 || interventionsLoading) ? (
        <div className="max-h-40 shrink-0 overflow-y-auto border-b-2 border-[#11110f] bg-[#fafafa] px-4 py-3">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#11110f]">
            <MessageSquare className="h-4 w-4" />
            Teacher Interventions
          </div>

          <div className="space-y-2">
            {interventionsLoading ? (
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Loading interventions...
              </div>
            ) : (
              openInterventions.map((intervention) => (
                <div
                  key={intervention.id}
                  className="border-2 border-[#11110f] bg-white p-3 shadow-[2px_2px_0_#11110f]"
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]">
                      {intervention.type.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Lines {intervention.range.startLineNumber}-{intervention.range.endLineNumber}
                    </span>
                  </div>
                  {intervention.content ? (
                    <p className="text-xs font-medium text-[#11110f]">
                      {intervention.content}
                    </p>
                  ) : null}
                  {intervention.type === "suggestion" && intervention.suggestedCode ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => void handleSuggestionStatus(intervention, "accepted")}
                        className="inline-flex items-center gap-2 border-2 border-[#11110f] bg-[#ccff00] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]"
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        Accept
                      </button>
                      <button
                        onClick={() => void handleSuggestionStatus(intervention, "rejected")}
                        className="border-2 border-[#11110f] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]"
                      >
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      <div className="flex-1">
        <Editor
          height="100%"
          path={modelPath}
          language={language}
          onMount={handleEditorMount}
          theme="vs"
          options={{
            readOnly: isEditorReadOnly,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbersMinChars: 4,
            scrollBeyondLastLine: true,
            automaticLayout: true,
            smoothScrolling: true,
            padding: { top: 16 },
            renderLineHighlight: "all",
            roundedSelection: false,
            overviewRulerBorder: false,
            cursorBlinking: "solid",
            glyphMargin: true,
          }}
        />
      </div>
    </div>
  );
});

const CollaborativeEditor = forwardRef<CollaborativeEditorHandle, CollaborativeEditorProps>(
  function CollaborativeEditor(props, ref) {
    return (
      <EditorErrorBoundary>
        <WorkspaceLoader ref={ref} {...props} />
      </EditorErrorBoundary>
    );
  },
);

export default CollaborativeEditor;
