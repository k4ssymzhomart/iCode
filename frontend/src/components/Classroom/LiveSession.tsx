import { type FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Terminal,
  Code,
  RotateCcw,
  Send,
  Zap,
  Eye,
  Edit3,
  AlertTriangle,
  Lightbulb,
  Info
} from "lucide-react";
import type { TeacherSessionData } from "@/features/classroom/sessionStore";
import CollaborativeEditor from "./CollaborativeEditor";

interface LiveSessionProps {
  sessionData: TeacherSessionData;
  onExit: () => void;
}

const LiveSession = ({ sessionData, onExit }: LiveSessionProps) => {
  const [activeTab, setActiveTab] = useState<"info" | "chat">("info");
  const [messages, setMessages] = useState([
    {
      sender: "System",
      text: `Session started with ${sessionData.studentName}`,
      time: "Now",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [sessionDuration, setSessionDuration] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setSessionDuration((current) => current + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSendMessage = (event?: FormEvent) => {
    event?.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setMessages((current) => [
      ...current,
      {
        sender: "You",
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setNewMessage("");

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          sender: sessionData.studentName,
          text: "Thanks, I’m trying that now.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1200);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fafafa] text-[#11110f] font-sans selection:bg-[#ccff00] selection:text-black">
      {/* Teacher Mode Slim Header */}
      <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b-2 border-[#11110f] bg-white px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="rounded-none border-2 border-[#11110f] bg-white p-1.5 transition hover:bg-[#ccff00]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2">
               <span className="flex h-3 w-3 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ccff00] opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-[#a3cc00] border border-[#11110f]"></span>
               </span>
               <span className="font-bold uppercase tracking-tight text-sm">Viewing: {sessionData.studentName}</span>
             </div>
             <span className="font-mono text-xs border-l-2 border-[#11110f] pl-3 py-1 font-bold">
               {formatTime(sessionDuration)}
             </span>
             <span className="bg-[#11110f] text-[#ccff00] px-2 py-0.5 text-xs font-bold uppercase tracking-wider ml-2">
               Teacher Mode
             </span>
          </div>
        </div>



        <div className="flex items-center gap-3">
          <button onClick={onExit} className="border-2 border-[#11110f] bg-red-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-600">
            End Session
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor Area (Takes up remaining space) */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-white">
          <CollaborativeEditor
            roomId={sessionData.roomId}
            sessionId={sessionData.sessionId}
            userId={`mentor-${sessionData.roomId}`}
            userName="Teacher"
            initialCode={sessionData.initialCode}
            role="teacher"
          />
        </div>

        {/* Static Brutalist Right Sidebar */}
        <aside className="flex w-96 shrink-0 flex-col border-l-2 border-[#11110f] bg-white">
          <div className="flex border-b-2 border-[#11110f]">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider border-r-2 border-[#11110f] transition-colors ${
                activeTab === "info"
                  ? "bg-[#ccff00] text-[#11110f]"
                  : "bg-white text-gray-400 hover:bg-gray-50 hover:text-[#11110f]"
              }`}
            >
              Context
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                activeTab === "chat"
                  ? "bg-[#ccff00] text-[#11110f]"
                  : "bg-white text-gray-400 hover:bg-gray-50 hover:text-[#11110f]"
              }`}
            >
              Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-[#fafafa]">
            {activeTab === "info" && (
              <div className="space-y-6">
                
                {/* Current Task */}
                <div className="border-2 border-[#11110f] bg-white p-4 relative shadow-[4px_4px_0_#ccff00]">
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#11110f]">
                    <Code className="h-4 w-4 text-[#ccff00]" />
                    Current Task
                  </h3>
                  <p className="text-sm font-bold text-[#11110f]">
                    {sessionData.task || "Free coding"}
                  </p>
                  <p className="mt-2 text-xs font-medium text-gray-500 italic bg-gray-50 border border-gray-200 p-2">
                    Objective: coach toward a correct solution without taking over the full task.
                  </p>
                </div>

                {/* Dashboard Stats */}
                {sessionData.stats && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#11110f] flex items-center gap-2">
                       <Info className="h-3 w-3" />
                       Student Profile
                    </h3>
                    <div className="border border-gray-300 bg-white grid grid-cols-2 divide-x divide-[#11110f] border-2 border-[#11110f]">
                      <div className="p-3">
                         <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Success</div>
                         <div className={`text-xl font-black ${sessionData.stats.successRate >= 80 ? "text-green-600" : "text-orange-600"}`}>
                           {sessionData.stats.successRate}%
                         </div>
                      </div>
                      <div className="p-3">
                         <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Strength</div>
                         <div className="text-sm font-bold text-green-600 pr-1 leading-snug truncate">
                           {sessionData.stats.strength}
                         </div>
                      </div>
                    </div>
                    <div className="border-2 border-[#11110f] bg-white p-3 shadow-[4px_4px_0_rgba(244,63,94,0.3)]">
                       <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">Struggling With</div>
                       <div className="text-sm font-bold text-rose-600">
                         {sessionData.stats.weakness}
                       </div>
                    </div>
                  </div>
                )}
                
                {/* Live Activity Feed (Mock) */}
                <div className="space-y-3">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-[#11110f] flex items-center gap-2">
                      <Terminal className="h-3 w-3" />
                      Live Feed
                   </h3>
                   <div className="border-2 border-[#11110f] bg-[#11110f] text-white p-3 font-mono text-xs">
                     <div className="flex items-center gap-2 text-[#ccff00] mb-2">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>SyntaxError: invalid syntax</span>
                     </div>
                     <div className="text-gray-400 mb-3 ml-5">line 14, in solve()</div>
                     <div className="border-t border-gray-700 pt-2 flex items-center justify-between">
                       <span className="text-gray-400">Status</span>
                       <span className="text-[#00ffff] animate-pulse">Typing...</span>
                     </div>
                   </div>
                </div>

                {/* AI Commands */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#11110f] flex items-center gap-2">
                     <Zap className="h-3 w-3 text-[#ccff00]" />
                     AI Actions
                  </h3>
                  
                  <button className="w-full flex items-center gap-3 border-2 border-[#11110f] bg-white p-2 text-left transition hover:bg-[#ccff00] group relative z-10 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#11110f]">
                    <div className="bg-[#11110f] text-[#ccff00] p-2 border-2 border-[#11110f] group-hover:bg-white group-hover:text-[#11110f] transition-colors">
                      <Lightbulb className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold uppercase tracking-tight">Send Hint</div>
                      <div className="text-[10px] text-gray-500 tracking-wide font-medium leading-tight">Small directional suggestion</div>
                    </div>
                  </button>
                  
                  <button className="w-full flex items-center gap-3 border-2 border-[#11110f] bg-white p-2 text-left transition hover:bg-[#ccff00] group relative z-10 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#11110f]">
                    <div className="bg-[#11110f] text-[#ccff00] p-2 border-2 border-[#11110f] group-hover:bg-white group-hover:text-[#11110f] transition-colors">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold uppercase tracking-tight">Highlight Issue</div>
                      <div className="text-[10px] text-gray-500 tracking-wide font-medium leading-tight">Flags problematic lines</div>
                    </div>
                  </button>
                  
                  <button className="w-full flex items-center gap-3 border-2 border-[#11110f] bg-white p-2 text-left transition hover:bg-[#ccff00] group relative z-10 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#11110f]">
                    <div className="bg-[#11110f] text-[#ccff00] p-2 border-2 border-[#11110f] group-hover:bg-white group-hover:text-[#11110f] transition-colors">
                      <Edit3 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold uppercase tracking-tight">Insert TODO</div>
                      <div className="text-[10px] text-gray-500 tracking-wide font-medium leading-tight">Adds # TODO note inline</div>
                    </div>
                  </button>
                  
                  <button className="w-full flex items-center gap-3 border-2 border-[#11110f] bg-white p-2 text-left transition hover:bg-[#ccff00] group relative z-10 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#11110f]">
                    <div className="bg-[#11110f] text-[#ccff00] p-2 border-2 border-[#11110f] group-hover:bg-white group-hover:text-[#11110f] transition-colors">
                      <RotateCcw className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold uppercase tracking-tight">Reset Code</div>
                      <div className="text-[10px] text-gray-500 tracking-wide font- medium leading-tight">Revert to base template</div>
                    </div>
                  </button>

                  <button className="w-full flex items-center gap-3 border-2 border-[#11110f] bg-white p-2 text-left transition hover:bg-black hover:text-white group relative z-10 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#ccff00]">
                    <div className="bg-[#ccff00] text-[#11110f] p-2 border-2 border-[#11110f] group-hover:bg-[#ccff00] transition-colors">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold uppercase tracking-tight">Mark Complete</div>
                      <div className="text-[10px] text-gray-400 group-hover:text-gray-300 tracking-wide font-medium leading-tight">Override completion status</div>
                    </div>
                  </button>

                </div>
              </div>
            )}

            {activeTab === "chat" && (
              <div className="flex h-full flex-col">
                <div className="mb-4 flex-1 space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={`${message.sender}-${index}`}
                      className={`flex flex-col ${
                        message.sender === "You" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] border-2 border-[#11110f] p-3 text-sm font-medium ${
                          message.sender === "You"
                            ? "bg-[#ccff00] text-[#11110f]"
                            : "bg-white text-[#11110f]"
                        }`}
                      >
                        {message.text}
                      </div>
                      <span className="mt-1 px-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        {message.sender === "You"
                          ? message.time
                          : `${message.sender} • ${message.time}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {activeTab === "chat" && (
            <div className="border-t-2 border-[#11110f] bg-white p-4 bg-gray-50">
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  placeholder="Type a message..."
                  className="w-full rounded-none border-2 border-[#11110f] bg-white py-3 pl-4 pr-12 text-sm font-bold text-[#11110f] focus:outline-none focus:ring-0 shadow-[4px_4px_0_#11110f] transition-all focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-[2px_2px_0_#11110f] placeholder:text-gray-400 placeholder:font-medium"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-none bg-[#11110f] p-2 text-[#ccff00] transition hover:bg-gray-800"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default LiveSession;
