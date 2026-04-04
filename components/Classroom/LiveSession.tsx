import React, { useState, useEffect, useRef } from 'react';
import CollaborativeEditor from './CollaborativeEditor';
import { 
  ArrowLeft, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  RotateCcw,
  Send,
  Video,
  Mic,
  MoreVertical,
  X,
  ChevronRight,
  ChevronLeft,
  Code,
  Terminal
} from 'lucide-react';

interface LiveSessionProps {
  sessionData: {
    roomId: string;
    studentName: string;
    initialCode?: string;
    task?: string;
    stats?: {
      successRate: number;
      weakness: string;
      strength: string;
    };
  };
  onExit: () => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ sessionData, onExit }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'info'>('info');
  const [messages, setMessages] = useState<{sender: string, text: string, time: string}[]>([
    { sender: 'System', text: `Session started with ${sessionData.studentName}`, time: 'Now' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionDuration, setSessionDuration] = useState(0);

  // Session Timer
  useEffect(() => {
    const timer = setInterval(() => setSessionDuration(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    
    setMessages(prev => [...prev, {
      sender: 'You',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setNewMessage('');
    
    // Mock student response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: sessionData.studentName,
        text: "Thanks! I'm checking that now.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onExit}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
              Live Session: {sessionData.studentName}
            </h1>
            <span className="text-xs text-gray-500 font-mono">
              {sessionData.roomId} • {formatTime(sessionDuration)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button className="p-2 hover:bg-white rounded-md shadow-sm transition-all text-gray-600">
                 <Video size={18} />
              </button>
              <button className="p-2 hover:bg-white rounded-md shadow-sm transition-all text-gray-600">
                 <Mic size={18} />
              </button>
           </div>
           
           <button className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
             End Session
           </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* Editor Area */}
        <div className="flex-grow flex flex-col relative">
           <CollaborativeEditor 
             studentId={sessionData.roomId.replace('room-', '')} 
             userName="Mentor" 
             initialCode={sessionData.initialCode}
             role="teacher"
           />
        </div>

        {/* Sidebar Toggle (Mobile/Desktop) */}
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-white border border-gray-200 p-1 rounded-l-md shadow-md transition-transform ${isSidebarOpen ? 'mr-80' : 'mr-0'}`}
        >
          {isSidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Right Sidebar */}
        <div className={`w-80 bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full hidden'}`}>
           
           {/* Tabs */}
           <div className="flex border-b border-gray-200">
              <button 
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'info' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Context
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'chat' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Chat
              </button>
           </div>

           {/* Tab Content */}
           <div className="flex-grow overflow-y-auto p-4">
              {activeTab === 'info' && (
                <div className="space-y-6">
                   {/* Current Task */}
                   <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Code size={14} /> Current Task
                      </h3>
                      <p className="text-sm font-medium text-gray-900">{sessionData.task || 'Free Coding'}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Objective: Implement the logic correctly without syntax errors.
                      </p>
                   </div>

                   {/* Student Stats */}
                   {sessionData.stats && (
                     <div className="space-y-3">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Student Profile</h3>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                           <span className="text-sm text-gray-600">Success Rate</span>
                           <span className={`text-sm font-bold ${sessionData.stats.successRate >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                             {sessionData.stats.successRate}%
                           </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                           <span className="text-sm text-gray-600">Weakness</span>
                           <span className="text-sm font-bold text-red-600">{sessionData.stats.weakness}</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                           <span className="text-sm text-gray-600">Strength</span>
                           <span className="text-sm font-bold text-green-600">{sessionData.stats.strength}</span>
                        </div>
                     </div>
                   )}

                   {/* Quick Actions */}
                   <div className="space-y-3">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Actions</h3>
                      
                      <button className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group">
                         <div className="p-2 bg-yellow-100 text-yellow-700 rounded-md group-hover:bg-yellow-200">
                            <Zap size={16} />
                         </div>
                         <div>
                            <div className="text-sm font-medium text-gray-900">Send Hint</div>
                            <div className="text-xs text-gray-500">Suggest a syntax fix</div>
                         </div>
                      </button>

                      <button className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group">
                         <div className="p-2 bg-blue-100 text-blue-700 rounded-md group-hover:bg-blue-200">
                            <RotateCcw size={16} />
                         </div>
                         <div>
                            <div className="text-sm font-medium text-gray-900">Reset Code</div>
                            <div className="text-xs text-gray-500">Revert to starter template</div>
                         </div>
                      </button>

                      <button className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left group">
                         <div className="p-2 bg-green-100 text-green-700 rounded-md group-hover:bg-green-200">
                            <CheckCircle size={16} />
                         </div>
                         <div>
                            <div className="text-sm font-medium text-gray-900">Mark Complete</div>
                            <div className="text-xs text-gray-500">Approve solution</div>
                         </div>
                      </button>
                   </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="h-full flex flex-col">
                   <div className="flex-grow space-y-4 mb-4">
                      {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                           <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                             msg.sender === 'You' 
                               ? 'bg-black text-white rounded-tr-none' 
                               : 'bg-gray-100 text-gray-800 rounded-tl-none'
                           }`}>
                              {msg.text}
                           </div>
                           <span className="text-[10px] text-gray-400 mt-1 px-1">
                              {msg.sender === 'You' ? '' : msg.sender + ' • '} {msg.time}
                           </span>
                        </div>
                      ))}
                   </div>
                </div>
              )}
           </div>

           {/* Chat Input (Always visible if chat tab, or fixed at bottom) */}
           {activeTab === 'chat' && (
             <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="relative">
                   <input 
                     type="text" 
                     value={newMessage}
                     onChange={(e) => setNewMessage(e.target.value)}
                     placeholder="Type a message..."
                     className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                   />
                   <button 
                     type="submit"
                     className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                   >
                      <Send size={14} />
                   </button>
                </form>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default LiveSession;
