import React, { useEffect, useState, useRef } from 'react';
import Editor, { OnMount } from "@monaco-editor/react";
import { RoomProvider, useStorage, useMutation as useLiveblocksMutation, useOthers, useMyPresence, ClientSideSuspense } from '../../liveblocks.config';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader2, Hand, Users as UsersIcon, Check, Lock, Unlock, Eye } from 'lucide-react';

// The Inner Editor Component
const EditorInstance = ({ roomId, studentId, isTeacher }: { roomId: string, studentId: string, isTeacher: boolean }) => {
  const code = useStorage((root) => root.code);
  const others = useOthers();
  const [myPresence, updateMyPresence] = useMyPresence();
  
  // Liveblocks: Sync Code
  const updateCode = useLiveblocksMutation(({ storage }, newCode) => {
    storage.set("code", newCode);
  }, []);

  // Convex: Hand Raising (Only for students)
  const raiseHand = useMutation(api.classroom.raiseHand);
  const [isHandRaised, setIsHandRaised] = useState(false);

  const toggleHand = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    raiseHand({ roomId, raised: newState });
  };

  // Cursor Sync
  const handleEditorMount: OnMount = (editor, monaco) => {
    editor.onDidChangeCursorPosition((e) => {
      updateMyPresence({ cursor: { x: e.position.lineNumber, y: e.position.column } });
    });
  };

  // Cursors of others
  const cursors = others.map(user => {
    if (!user.presence?.cursor) return null;
    return {
      name: user.info?.name,
      color: user.info?.role === 'teacher' ? '#ef4444' : '#3b82f6',
      x: user.presence.cursor.x,
      y: user.presence.cursor.y
    };
  }).filter(Boolean);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className={`flex items-center justify-between px-4 py-2 border-b border-gray-100 ${isTeacher ? 'bg-slate-50' : 'bg-white'}`}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-black flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500 font-mono">Python</span>
            Main.py
          </span>
          
          {/* Presence Indicators */}
          <div className="flex items-center -space-x-2">
             {others.map((user, i) => (
               <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600" title={user.info?.name}>
                  {user.info?.name?.charAt(0)}
               </div>
             ))}
             {others.length > 0 && (
               <div className="pl-3 text-xs text-gray-400">
                 {others.length} active
               </div>
             )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTeacher ? (
             <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center gap-1">
                   <Eye size={12} /> Teacher Mode
                </span>
             </div>
          ) : (
            <button 
              onClick={toggleHand}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isHandRaised 
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Hand size={14} className={isHandRaised ? 'fill-yellow-800' : ''} />
              <span>{isHandRaised ? 'Hand Raised' : 'Ask for Help'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-grow relative">
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={(value) => updateCode(value || "")}
          onMount={handleEditorMount}
          theme="light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'JetBrains Mono, monospace',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16 },
            readOnly: false // Both can edit in this collaborative mode
          }}
        />
        
        {/* Mock Cursors Overlay (Simplified for Demo) */}
        {/* In a real app, use Monaco Decorations for cursors */}
      </div>
    </div>
  );
};

interface CollaborativeEditorProps {
  studentId: string;
  userName: string;
  initialCode?: string;
  role?: 'teacher' | 'student';
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({ studentId, userName, initialCode, role = 'student' }) => {
  const roomId = `room-${studentId}`;
  const isTeacher = role === 'teacher';
  
  // Register with Convex on mount
  const joinClassroom = useMutation(api.classroom.joinClassroom);
  useEffect(() => {
    // Only join convex if not teacher (or handle teacher logic separately)
    // For now, we just track presence
    if (!isTeacher) {
       joinClassroom({ name: userName, roomId, role: 'student' });
    }
  }, [userName, roomId, isTeacher]);

  return (
    <RoomProvider 
      id={roomId} 
      initialPresence={{ cursor: null, selection: null }}
      initialStorage={{ 
        code: initialCode || "# Write your Python code here...\n\ndef main():\n    print('Hello World')\n" 
      }}
      initialUserMeta={{ id: isTeacher ? 'teacher' : studentId, info: { name: userName, role } }}
    >
      <ClientSideSuspense fallback={
        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
          <Loader2 className="animate-spin w-8 h-8"/>
          <span className="text-sm">Connecting to Virtual Lab...</span>
        </div>
      }>
        {() => <EditorInstance roomId={roomId} studentId={studentId} isTeacher={isTeacher} />}
      </ClientSideSuspense>
    </RoomProvider>
  );
};

export default CollaborativeEditor;