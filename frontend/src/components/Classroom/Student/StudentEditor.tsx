import React from "react";
import Editor from "@monaco-editor/react";
import { Code2 } from "lucide-react";

interface StudentEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
}

const StudentEditor: React.FC<StudentEditorProps> = ({ code, onChange }) => {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#fafafa] border-b-2 border-[#11110f] shrink-0">
        <div className="flex items-center gap-3">
          <Code2 className="h-4 w-4 text-[#11110f]" />
          <span className="font-bold text-sm tracking-widest uppercase text-[#11110f]">main.py</span>
        </div>
        <div className="bg-[#ccff00] text-[#11110f] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border border-[#11110f]">
          Python
        </div>
      </div>

      <div className="flex-1 relative">
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={onChange}
          theme="vs" // Always white for clean UI
          loading={<div className="p-4 font-mono text-sm font-bold animate-pulse text-[#11110f]">Loading Editor...</div>}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            lineHeight: 26,
            fontFamily: "'Consolas', 'Courier New', monospace",
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 24, bottom: 24 },
            wordWrap: "on",
            renderLineHighlight: "none",
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              useShadows: false,
              verticalHasArrows: false,
              horizontalHasArrows: false,
            }
          }}
        />
      </div>
    </div>
  );
};

export default StudentEditor;
