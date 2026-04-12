import { useEffect, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Hand, Loader2 } from "lucide-react";
import {
  ClientSideSuspense,
  RoomProvider,
  useMutation as useLiveblocksMutation,
  useMyPresence,
  useOthers,
  useStorage,
} from "@/lib/liveblocks";
import { supabase } from "@/lib/supabase";

const starterCode = `import sys

def solve(data: str) -> str:
    # Write your logic here.
    return data.strip()

if __name__ == "__main__":
    print(solve(sys.stdin.read()))
`;

const EditorInstance = ({
  roomId,
  sessionId,
  isTeacher,
  onChange,
}: {
  roomId: string; // The Liveblocks Room (editor_{sessionId}_{studentId})
  sessionId: string; // The parent session
  isTeacher: boolean;
  onChange?: (code: string) => void;
}) => {
  const code = useStorage((root) => root.code);

  const others = useOthers();
  const [, updateMyPresence] = useMyPresence();
  const updateCode = useLiveblocksMutation(({ storage }, nextCode: string) => {
    storage.set("code", nextCode);
    onChange?.(nextCode);
  }, [onChange]);
  const [isHandRaised, setIsHandRaised] = useState(false);

  useEffect(() => {
     // Trigger initial sync of code to parent layer
     if (code && onChange) {
        onChange(code);
     }
  }, [code, onChange]);

  const handleEditorMount: OnMount = (editor) => {
    editor.onDidChangeCursorPosition((event) => {
      updateMyPresence({
        cursor: { x: event.position.lineNumber, y: event.position.column },
      });
    });
  };

  const toggleHand = async () => {
    if (isHandRaised) return; // For now, only toggle on. Pending/resolved handled server side.
    setIsHandRaised(true);
    
    // Auth Token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    fetch("/api/help/request", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ sessionId })
    }).catch(console.error);
  };

  return (
    <div className="flex h-full flex-col bg-white relative">
      <div
        className={`flex items-center justify-between border-b-2 border-[#11110f] px-4 py-3 shrink-0 ${
          isTeacher ? "bg-white" : "bg-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-bold text-[#11110f] uppercase tracking-wider">
            <span className="rounded-none bg-[#ccff00] border-2 border-[#11110f] px-2 py-0.5 font-bold text-xs text-[#11110f]">
              PYTHON
            </span>
            main.py
          </span>

          <div className="flex items-center -space-x-2 border-l-2 border-[#11110f] pl-3 ml-3">
            {others.map((user, index) => (
              <div
                key={`${user.info?.name}-${index}`}
                className="flex h-7 w-7 items-center justify-center rounded-none border-2 border-[#11110f] bg-[#fafafa] text-xs font-bold text-[#11110f] z-10"
                title={user.info?.name}
              >
                <img src={user.info?.avatar || "https://api.dicebear.com/7.x/shapes/svg?seed="+user.info?.name} alt="avatar" className="w-full h-full object-cover" />
              </div>
            ))}
            {others.length > 0 && (
              <div className="pl-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                {others.length} viewing
              </div>
            )}
          </div>
        </div>

        {!isTeacher && (
          <button
            onClick={toggleHand}
            disabled={isHandRaised}
            className={`inline-flex items-center gap-2 rounded-none px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
              isHandRaised
                ? "border-2 border-[#11110f] bg-[#ccff00] text-[#11110f] shadow-[2px_2px_0_#11110f] opacity-80 cursor-not-allowed"
                : "border-2 border-[#11110f] bg-white text-[#11110f] hover:bg-gray-100 shadow-[2px_2px_0_#11110f] translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0 hover:shadow-none"
            }`}
          >
            <Hand className={`h-4 w-4 ${isHandRaised ? "fill-[#11110f] text-[#11110f]" : "text-[#11110f]"}`} />
            {isHandRaised ? "Help Requested" : "Ask for Help"}
          </button>
        )}
      </div>

      <div className="flex-1 relative">
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={(value) => updateCode(value ?? "")}
          onMount={handleEditorMount}
          theme="vs"
          options={{
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
          }}
        />
      </div>
    </div>
  );
};

export interface CollaborativeEditorProps {
  roomId: string; // Internal editor room ID mapping
  sessionId: string; // The primary lab session ID
  userId: string;
  userName: string;
  initialCode?: string;
  role?: "teacher" | "student";
  onChange?: (code: string) => void;
}

const CollaborativeEditor = ({
  roomId,
  sessionId,
  userId,
  userName,
  initialCode,
  role = "student",
  onChange,
}: CollaborativeEditorProps) => {
  const isTeacher = role === "teacher";

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{ cursor: null, selection: null }}
      initialStorage={{ code: initialCode ?? starterCode }}
      initialUserMeta={{ id: userId, info: { name: userName, role } }}
    >
      <ClientSideSuspense
        fallback={
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#fafafa] text-[#11110f]">
            <Loader2 className="h-8 w-8 animate-spin text-[#ccff00]" />
            <span className="text-sm font-bold uppercase tracking-widest text-[#11110f]">Connecting to virtual lab...</span>
          </div>
        }
      >
        {() => <EditorInstance roomId={roomId} sessionId={sessionId} isTeacher={isTeacher} onChange={onChange} />}
      </ClientSideSuspense>
    </RoomProvider>
  );
};

export default CollaborativeEditor;
