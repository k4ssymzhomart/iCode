import React, { useRef, useState } from "react";
import type { TaskSetSummary } from "@shared/types";
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  FileJson,
  Layers3,
  UploadCloud,
} from "lucide-react";

interface MaterialsManagerProps {
  taskSets: TaskSetSummary[];
  onImport: (payload: { fileName: string; content: string }) => Promise<void>;
}

const MaterialsManager: React.FC<MaterialsManagerProps> = ({ taskSets, onImport }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".json")) {
      setStatus("error");
      setMessage("Please upload a valid .json file.");
      return;
    }

    setFile(selectedFile);
    setStatus("idle");
    setMessage("");
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      processFile(event.dataTransfer.files[0]);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (event.target.files && event.target.files[0]) {
      processFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      return;
    }

    setStatus("uploading");
    try {
      const content = await file.text();
      await onImport({
        fileName: file.name,
        content,
      });
      setStatus("success");
      setMessage(`Imported ${file.name} successfully.`);
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Import failed.");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-8 bg-[#fafafa] p-8">
      <div>
        <h2 className="mb-2 text-2xl font-black uppercase tracking-tight text-[#11110f]">
          Course Materials
        </h2>
        <p className="text-sm font-medium text-gray-500">
          Import classroom task sets as JSON and make them available for draft session creation.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="bg-white border-[3px] border-[#11110f] shadow-[8px_8px_0_#ccff00] p-8 relative">
          <h3 className="text-lg font-bold mb-2 uppercase tracking-tight">Import Task Set</h3>
          <p className="text-sm font-medium text-gray-500 mb-6">
            Upload a `.json` file that matches the classroom task-set format. The backend will parse,
            validate, and save it before making it available in Sessions.
          </p>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-[3px] border-dashed p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragActive
                ? "border-[#ccff00] bg-[#ccff00]/10"
                : "border-[#11110f] bg-[#fafafa] hover:bg-gray-50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleChange}
            />

            {!file ? (
              <>
                <UploadCloud className="w-12 h-12 text-[#11110f] mb-4 opacity-50" />
                <p className="font-bold text-[#11110f] uppercase tracking-widest text-sm mb-2">
                  Drag & Drop JSON file
                </p>
                <p className="text-xs font-semibold text-gray-500">or click to browse</p>
              </>
            ) : (
              <>
                <FileJson className="w-12 h-12 text-[#11110f] mb-4" />
                <p className="font-black text-[#11110f] text-base mb-1 truncate max-w-sm">
                  {file.name}
                </p>
                <p className="text-xs font-bold text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </>
            )}
          </div>

          {status === "error" ? (
            <div className="mt-6 flex items-center gap-3 bg-red-100 border-[3px] border-red-500 p-4 font-bold text-red-700 text-sm shadow-[4px_4px_0_rgba(239,68,68,1)]">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {message}
            </div>
          ) : null}

          {status === "success" ? (
            <div className="mt-6 flex items-center gap-3 bg-[#ccff00] border-[3px] border-[#11110f] p-4 font-black uppercase text-[#11110f] text-sm shadow-[4px_4px_0_#11110f]">
              <CheckCircle className="w-5 h-5 flex-shrink-0 fill-[#11110f] text-[#ccff00]" />
              {message}
            </div>
          ) : null}

          <div className="mt-8 flex justify-end">
            <button
              disabled={!file || status === "uploading"}
              onClick={() => void handleUpload()}
              className="px-8 py-3 bg-[#11110f] hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-sm transition-transform hover:-translate-y-0.5 active:translate-y-1 shadow-[4px_4px_0_#ccff00] border-2 border-[#11110f]"
            >
              {status === "uploading" ? "Uploading..." : "Import Task Set"}
            </button>
          </div>
        </div>

        <div className="border-[3px] border-[#11110f] bg-white p-6 shadow-[8px_8px_0_#11110f]">
          <div className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-[#11110f]">
            <Layers3 className="h-4 w-4 text-[#ccff00]" />
            Available Task Sets
          </div>

          <div className="space-y-3">
            {taskSets.map((taskSet) => (
              <div
                key={taskSet.id}
                className="border-2 border-[#11110f] bg-[#fafafa] p-4 shadow-[3px_3px_0_#11110f]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black uppercase tracking-tight text-[#11110f]">
                      {taskSet.title}
                    </div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                      {taskSet.topic}
                    </div>
                  </div>
                  <span className="border-2 border-[#11110f] px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#11110f]">
                    {taskSet.sourceType === "json_import" ? "JSON" : "Legacy"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                  <span className="inline-flex items-center gap-1 border-2 border-[#11110f] px-2 py-1 text-[#11110f]">
                    <BookOpen className="h-3 w-3" />
                    {taskSet.taskCount} Tasks
                  </span>
                  <span className="inline-flex items-center gap-1 border-2 border-[#11110f] px-2 py-1 text-[#11110f]">
                    <FileJson className="h-3 w-3" />
                    {taskSet.language}
                  </span>
                </div>
                <div className="mt-3 text-xs font-medium text-gray-600">
                  {taskSet.description || "No description."}
                </div>
              </div>
            ))}

            {taskSets.length === 0 ? (
              <div className="border-2 border-dashed border-[#11110f] bg-[#fafafa] p-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                No task sets imported yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialsManager;
