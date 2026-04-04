import React, { useEffect, useState } from 'react';
import { RoomProvider, useStorage, useMutation, useOthers, ClientSideSuspense } from '../../liveblocks.config';
import { Loader2, Users as UsersIcon } from 'lucide-react';

// Mock Monaco Editor for this snippet (In production use @monaco-editor/react)
const CodeEditor = () => {
  const code = useStorage((root) => root.code);
  const updateCode = useMutation(({ storage }, newCode) => {
    storage.set("code", newCode);
  }, []);

  const others = useOthers();

  // If teacher is present, show a badge
  const teacherPresent = others.some(user => user.info?.role === 'teacher');

  return (
    <div className="h-full flex flex-col">
      {teacherPresent && (
        <div className="bg-black text-white text-xs px-3 py-1 flex items-center justify-center gap-2">
          <UsersIcon size={12} />
          <span>Mentor is watching</span>
        </div>
      )}
      <textarea
        className="w-full h-full bg-gray-50 p-4 font-mono text-sm resize-none focus:outline-none"
        value={code || ""}
        onChange={(e) => updateCode(e.target.value)}
        placeholder="# Start coding here..."
      />
    </div>
  );
};

interface StudentEditorProps {
  studentId: string;
  userName: string;
}

const StudentEditor: React.FC<StudentEditorProps> = ({ studentId, userName }) => {
  const roomId = `room-${studentId}`;

  return (
    <RoomProvider 
      id={roomId} 
      initialPresence={{ cursor: null, selection: null }}
      initialStorage={{ code: "# Welcome to your workspace" }}
    >
      <ClientSideSuspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin"/></div>}>
        {() => (
          <div className="flex flex-col h-full bg-white border-r border-gray-200">
             <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                <span className="font-bold text-sm">Workspace: {roomId}</span>
                <span className="text-xs text-gray-500">Connected</span>
             </div>
             <div className="flex-grow">
               <CodeEditor />
             </div>
          </div>
        )}
      </ClientSideSuspense>
    </RoomProvider>
  );
};

export default StudentEditor;