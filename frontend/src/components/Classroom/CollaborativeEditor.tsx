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
  TeacherInterventionMode,
} from "@shared/types";
import { classroomService } from "@/services/classroom";
import {
  buildEditorRoomId,
  ClientSideSuspense,
  EditorRoomProvider,
  type LiveblocksEditorRange,
  useEditorBroadcastEvent,
  useEditorEventListener,
  useEditorMutation,
  useEditorMyPresence,
  useEditorOthers,
  useEditorStatus,
  useEditorStorage,
} from "@/lib/liveblocks";

const starterCode = `import sys

def solve(data: str) -> str:
    # Write your logic here.
    return data.strip()

if __name__ == "__main__":
    print(solve(sys.stdin.read()))
`;

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
  language?: Task["language"];
  role?: "teacher" | "student";
  mode?: TeacherInterventionMode;
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

const WorkspaceLoader = forwardRef<CollaborativeEditorHandle, CollaborativeEditorProps>(
  function WorkspaceLoader(
    {
      sessionId,
      taskId,
      workspaceStudentId,
      currentUserId,
      userName,
      initialCode,
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
    const [workspaceCode, setWorkspaceCode] = useState(initialCode ?? starterCode);
    const [workspaceRevision, setWorkspaceRevision] = useState(0);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
      let cancelled = false;

      const loadWorkspace = async () => {
        setIsReady(false);
        try {
          const response = await classroomService.loadWorkspace({
            sessionId,
            taskId,
            studentId: role === "teacher" ? workspaceStudentId : undefined,
          });

          if (cancelled) {
            return;
          }

          const resolvedCode = response.code ?? initialCode ?? starterCode;
          setWorkspaceCode(resolvedCode);
          setWorkspaceRevision(response.revision ?? 0);
          onChange?.(resolvedCode);
        } catch (error) {
          console.error("[CollaborativeEditor] Failed to load workspace", error);
          if (!cancelled) {
            const fallbackCode = initialCode ?? starterCode;
            setWorkspaceCode(fallbackCode);
            setWorkspaceRevision(0);
            onChange?.(fallbackCode);
          }
        } finally {
          if (!cancelled) {
            setIsReady(true);
          }
        }
      };

      loadWorkspace();

      return () => {
        cancelled = true;
      };
    }, [initialCode, onChange, role, sessionId, taskId, workspaceStudentId]);

    if (!isReady) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#fafafa] text-[#11110f]">
          <Loader2 className="h-8 w-8 animate-spin text-[#ccff00]" />
          <span className="text-sm font-bold uppercase tracking-widest text-[#11110f]">
            Loading workspace...
          </span>
        </div>
      );
    }

    return (
      <EditorRoomProvider
        id={buildEditorRoomId(sessionId, workspaceStudentId, taskId)}
        initialPresence={{
          cursor: null,
          selection: null,
          mode: role === "teacher" ? mode ?? "view" : null,
          workspaceStudentId,
        }}
        initialStorage={{
          code: workspaceCode,
          revision: workspaceRevision,
          teacherJoinedMessage: null,
        }}
      >
        <ClientSideSuspense
          fallback={
            <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#fafafa] text-[#11110f]">
              <Loader2 className="h-8 w-8 animate-spin text-[#ccff00]" />
              <span className="text-sm font-bold uppercase tracking-widest text-[#11110f]">
                Connecting to task room...
              </span>
            </div>
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
  Omit<CollaborativeEditorProps, "initialCode">
>(function EditorInstance(
  {
    sessionId,
    taskId,
    workspaceStudentId,
    currentUserId,
    userName,
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
  const liveCode = useEditorStorage((root) => root.code);
  const liveRevision = useEditorStorage((root) => root.revision);
  const others = useEditorOthers();
  const editorStatus = useEditorStatus();
  const broadcast = useEditorBroadcastEvent();
  const [, updateMyPresence] = useEditorMyPresence();
  const updateCode = useEditorMutation(({ storage }, nextCode: string) => {
    storage.set("code", nextCode);
  }, []);
  const updateRevision = useEditorMutation(({ storage }, nextRevision: number) => {
    storage.set("revision", nextRevision);
  }, []);
  const updateTeacherJoinedMessage = useEditorMutation(
    ({ storage }, message: string | null) => {
      storage.set("teacherJoinedMessage", message);
    },
    [],
  );

  const [teacherNotice, setTeacherNotice] = useState<string | null>(null);
  const [interventions, setInterventions] = useState<EditorIntervention[]>([]);
  const [interventionsLoading, setInterventionsLoading] = useState(false);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const saveTimerRef = useRef<number | null>(null);
  const hasPendingLiveSyncRef = useRef(false);
  const isRoomConnectedRef = useRef(false);
  const [localCode, setLocalCode] = useState(liveCode ?? starterCode);
  const [localRevision, setLocalRevision] = useState(liveRevision ?? 0);

  const canWrite = role === "teacher" ? mode === "edit" && !readOnly : !readOnly;
  const isRoomConnected = editorStatus === "connected";
  const code = localCode;
  const revision = localRevision;
  const fileName =
    language === "javascript"
      ? "main.js"
      : language === "typescript"
        ? "main.ts"
        : "main.py";

  useEffect(() => {
    isRoomConnectedRef.current = isRoomConnected;
  }, [isRoomConnected]);

  useEffect(() => {
    if (typeof liveCode !== "string") {
      return;
    }

    if (hasPendingLiveSyncRef.current && liveCode !== localCode) {
      return;
    }

    setLocalCode(liveCode);
  }, [liveCode, localCode]);

  useEffect(() => {
    if (typeof liveRevision !== "number") {
      return;
    }

    if (hasPendingLiveSyncRef.current && liveRevision !== localRevision) {
      return;
    }

    setLocalRevision(liveRevision);
  }, [liveRevision, localRevision]);

  const runConnectedMutation = (
    label: string,
    mutate: () => void,
    options?: { pendingSync?: boolean },
  ) => {
    if (!isRoomConnectedRef.current) {
      if (options?.pendingSync) {
        hasPendingLiveSyncRef.current = true;
      }
      return;
    }

    try {
      mutate();
      if (options?.pendingSync) {
        hasPendingLiveSyncRef.current = false;
      }
    } catch (error) {
      console.warn(`[CollaborativeEditor] Skipped ${label} because the room is unavailable`, error);
      if (options?.pendingSync) {
        hasPendingLiveSyncRef.current = true;
      }
    }
  };

  useEffect(() => {
    if (!isRoomConnected || !hasPendingLiveSyncRef.current) {
      return;
    }

    runConnectedMutation(
      "workspace sync",
      () => {
        updateCode(localCode);
        updateRevision(localRevision);
      },
      { pendingSync: true },
    );
  }, [isRoomConnected, localCode, localRevision, updateCode, updateRevision]);

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
      getCode: () => code,
      getRevision: () => revision,
      refreshInterventions: loadInterventions,
      notifyInterventionsChanged: () => {
        runConnectedMutation("intervention broadcast", () => {
          broadcast({ type: "interventions-updated" });
        });
        void loadInterventions();
      },
      replaceCode: (nextCode: string) => {
        setLocalCode(nextCode);
        onChange?.(nextCode);
        onSnippetChange?.(nextCode);
        runConnectedMutation("code update", () => {
          updateCode(nextCode);
        }, { pendingSync: true });
        persistWorkspace(nextCode);
      },
    }),
    [broadcast, code, onChange, onSnippetChange, revision],
  );

  useEffect(() => {
    loadInterventions();
  }, [sessionId, taskId, workspaceStudentId, role]);

  useEffect(() => {
    if (role !== "teacher" || !announceTeacherPresence) {
      return;
    }

    const message = `Teacher joined in ${mode ?? "view"} mode`;
    setTeacherNotice(message);
    runConnectedMutation("teacher presence sync", () => {
      updateTeacherJoinedMessage(message);
    });
    onTeacherPresenceChange?.(message);
    runConnectedMutation("teacher joined broadcast", () => {
      broadcast({
        type: "teacher-joined",
        teacherName: userName,
        mode: mode ?? "view",
      });
    });
  }, [
    announceTeacherPresence,
    broadcast,
    mode,
    onTeacherPresenceChange,
    role,
    updateTeacherJoinedMessage,
    userName,
  ]);

  useEditorEventListener(({ event }) => {
    if (event.type === "teacher-joined") {
      const message = `${event.teacherName} joined in ${event.mode} mode`;
      setTeacherNotice(message);
      onTeacherPresenceChange?.(message);
      return;
    }

    if (event.type === "teacher-mode") {
      const message = `Teacher switched to ${event.mode} mode`;
      setTeacherNotice(message);
      onTeacherPresenceChange?.(message);
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

  useEffect(
    () => () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    },
    [],
  );

  const persistWorkspace = (nextCode: string) => {
    if (!canWrite) {
      return;
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const response = await classroomService.saveWorkspace({
          sessionId,
          taskId,
          studentId: role === "teacher" ? workspaceStudentId : undefined,
          code: nextCode,
        });

        setLocalRevision(response.revision);
        runConnectedMutation(
          "revision sync",
          () => {
            updateRevision(response.revision);
            broadcast({ type: "code-saved", revision: response.revision });
          },
          { pendingSync: true },
        );
      } catch (error) {
        console.error("[CollaborativeEditor] Failed to save workspace", error);
      }
    }, 900);
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

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
  };

  const handleLocalChange = (value?: string) => {
    const nextCode = value ?? "";
    setLocalCode(nextCode);
    onChange?.(nextCode);
    onSnippetChange?.(nextCode);
    runConnectedMutation("code update", () => {
      updateCode(nextCode);
    }, { pendingSync: true });
    persistWorkspace(nextCode);
  };

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

      if (status === "accepted" && acceptedCode) {
        setLocalCode(acceptedCode);
        onChange?.(acceptedCode);
        onSnippetChange?.(acceptedCode);
        runConnectedMutation("accepted suggestion sync", () => {
          updateCode(acceptedCode);
        }, { pendingSync: true });
        persistWorkspace(acceptedCode);
      }

      runConnectedMutation("intervention refresh broadcast", () => {
        broadcast({ type: "interventions-updated" });
      });
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
          language={language}
          value={code}
          onChange={handleLocalChange}
          onMount={handleEditorMount}
          theme="vs"
          options={{
            readOnly: role === "teacher" ? mode !== "edit" || readOnly : readOnly,
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
