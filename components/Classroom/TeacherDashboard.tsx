import React, { useState, useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { RoomProvider, useStorage, ClientSideSuspense } from '../../liveblocks.config';
import { 
  Monitor, 
  Hand, 
  User, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  BrainCircuit, 
  Code2,
  Search,
  Filter,
  X,
  BookOpen,
  MessageSquare,
  History
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

// --- Mock Data Generators ---

const MOCK_NAMES = [
  "Alex Chen", "Sarah Miller", "Jordan Smith", "Emily Zhang", 
  "Michael Johnson", "Jessica Davis", "David Wilson", "Emma Taylor",
  "Ryan Martinez", "Olivia Anderson", "Daniel Thomas", "Sophia White"
];

const TASKS = [
  { id: 'loops', name: 'For Loops Intro', code: 'for i in range(10):\n    print(i)' },
  { id: 'vars', name: 'Variables 101', code: 'x = 5\ny = 10\nprint(x + y)' },
  { id: 'func', name: 'Functions', code: 'def greet(name):\n    return "Hello " + name' },
  { id: 'cond', name: 'Conditionals', code: 'if x > 5:\n    print("Big")\nelse:\n    print("Small")' },
];

const STYLES = ['Visual', 'Auditory', 'Kinesthetic', 'Reading'];
const STRENGTHS = ['Logic', 'Syntax', 'Debugging', 'Creativity'];
const WEAKNESSES = ['Recursion', 'Async', 'Types', 'Memory'];

const generateMockStudents = (count: number) => {
  return Array.from({ length: count }).map((_, i) => {
    const task = TASKS[Math.floor(Math.random() * TASKS.length)];
    const successRate = 60 + Math.floor(Math.random() * 40); // 60-100
    const isStruggling = successRate < 75;
    
    return {
      _id: `mock-${i}`,
      name: MOCK_NAMES[i % MOCK_NAMES.length],
      status: Math.random() > 0.2 ? 'online' : 'offline',
      isHandRaised: Math.random() > 0.8,
      roomId: `room-mock-${i}`,
      // Enhanced Mock Fields
      successRate,
      currentTask: task.name,
      mockCode: task.code,
      learningStyle: STYLES[Math.floor(Math.random() * STYLES.length)],
      strength: STRENGTHS[Math.floor(Math.random() * STRENGTHS.length)],
      weakness: WEAKNESSES[Math.floor(Math.random() * WEAKNESSES.length)],
      focusTime: 10 + Math.floor(Math.random() * 50), // minutes
      lastActive: '2m ago',
      history: Array.from({length: 5}).map((_, j) => ({
        day: `Day ${j+1}`,
        score: Math.max(0, Math.min(100, successRate + (Math.random() * 20 - 10)))
      }))
    };
  });
};

// --- Components ---

const CodePreviewMock = ({ code }: { code: string }) => (
  <pre className="text-[10px] leading-4 font-mono text-gray-500 pointer-events-none p-3 h-full overflow-hidden bg-gray-50/50">
    {code}
  </pre>
);

// Real Code Preview (keeps existing functionality if needed)
const CodePreviewLive = () => {
  const code = useStorage((root) => root.code);
  const previewLines = (code || "").split('\n').slice(0, 8).join('\n');
  return (
    <pre className="text-[10px] leading-4 font-mono text-gray-500 pointer-events-none p-3 h-full overflow-hidden bg-gray-50/50">
      {previewLines}
      {previewLines.length < (code || "").length && "..."}
    </pre>
  );
};

interface StudentCardProps {
  student: any;
  onClick: () => void;
  isMock?: boolean;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onClick, isMock }) => {
  return (
    <div 
      onClick={onClick}
      className={`group relative bg-white border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${
        student.isHandRaised ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200 hover:border-black'
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b flex justify-between items-start ${
        student.isHandRaised ? 'bg-yellow-50/50' : 'bg-gray-50/30'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="font-bold text-sm text-gray-900">{student.name}</span>
             {student.status === 'online' && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            <span>{student.currentTask || 'Idle'}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
           {student.isHandRaised && (
             <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full animate-pulse">
               <Hand size={10} /> HELP
             </span>
           )}
           <div className={`text-xs font-bold ${
             student.successRate >= 90 ? 'text-green-600' : 
             student.successRate >= 75 ? 'text-blue-600' : 'text-orange-600'
           }`}>
             {student.successRate}% Avg
           </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 border-b border-gray-100 divide-x divide-gray-100 bg-white">
        <div className="p-2 text-center">
          <div className="text-[10px] text-gray-400 uppercase">Style</div>
          <div className="text-xs font-medium text-gray-700">{student.learningStyle}</div>
        </div>
        <div className="p-2 text-center">
          <div className="text-[10px] text-gray-400 uppercase">Focus</div>
          <div className="text-xs font-medium text-gray-700">{student.focusTime}m</div>
        </div>
        <div className="p-2 text-center">
          <div className="text-[10px] text-gray-400 uppercase">Weakness</div>
          <div className="text-xs font-medium text-red-500">{student.weakness}</div>
        </div>
      </div>

      {/* Code Preview Area */}
      <div className="h-32 bg-gray-50 relative group-hover:bg-white transition-colors">
        {isMock ? (
          <CodePreviewMock code={student.mockCode} />
        ) : (
          <RoomProvider id={student.roomId} initialPresence={{ cursor: null, selection: null }}>
            <ClientSideSuspense fallback={<div className="h-full w-full bg-gray-100 animate-pulse" />}>
               {() => <CodePreviewLive />}
            </ClientSideSuspense>
          </RoomProvider>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
           <button className="bg-black text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
              View Details
           </button>
        </div>
      </div>
    </div>
  );
};

const StudentDetailModal = ({ student, onClose, onJoin }: { student: any, onClose: () => void, onJoin: () => void }) => {
  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg">
                {student.name.charAt(0)}
             </div>
             <div>
               <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
               <p className="text-sm text-gray-500 flex items-center gap-2">
                 {student.status === 'online' ? <span className="w-2 h-2 bg-green-500 rounded-full"/> : <span className="w-2 h-2 bg-gray-300 rounded-full"/>}
                 {student.status === 'online' ? 'Online Now' : 'Offline'} • {student.currentTask}
               </p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Left Column: Stats & Insights */}
           <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BrainCircuit size={16} /> Cognitive Profile
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                   <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Learning Style</span>
                      <span className="text-sm font-bold text-black bg-white px-2 py-1 rounded border border-gray-200">{student.learningStyle}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Top Strength</span>
                      <span className="text-sm font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">{student.strength}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Area to Improve</span>
                      <span className="text-sm font-bold text-red-700 bg-red-50 px-2 py-1 rounded border border-red-100">{student.weakness}</span>
                   </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                   <History size={16} /> Recent Progress
                </h3>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={student.history || []}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                       <XAxis dataKey="day" hide />
                       <YAxis domain={[0, 100]} hide />
                       <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                       <Line type="monotone" dataKey="score" stroke="#000" strokeWidth={2} dot={{r: 3}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
           </div>

           {/* Right Column: Actions & Recommendations */}
           <div className="space-y-6">
              <div>
                 <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BookOpen size={16} /> Recommended Actions
                 </h3>
                 <div className="space-y-2">
                    <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex items-start gap-3">
                       <div className="p-1.5 bg-blue-100 text-blue-700 rounded mt-0.5">
                          <Code2 size={14} />
                       </div>
                       <div>
                          <div className="text-sm font-bold text-gray-900">Assign "Recursion Practice"</div>
                          <div className="text-xs text-gray-500">Based on recent struggles with {student.weakness}</div>
                       </div>
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors flex items-start gap-3">
                       <div className="p-1.5 bg-purple-100 text-purple-700 rounded mt-0.5">
                          <MessageSquare size={14} />
                       </div>
                       <div>
                          <div className="text-sm font-bold text-gray-900">Schedule 1:1 Review</div>
                          <div className="text-xs text-gray-500">Discuss progress on {student.currentTask}</div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="pt-4 mt-auto">
                 <button 
                   onClick={onJoin}
                   className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                 >
                    <Monitor size={18} />
                    Join Live Session
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

interface TeacherDashboardProps {
  onJoinRoom: (roomId: string, studentData: any) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onJoinRoom }) => {
  // Try to get real students, fallback to mock if empty or for demo
  const realStudents = useQuery(api.classroom.getClassroomState);
  
  // Memoize mock data so it doesn't regenerate on re-renders
  const mockStudents = useMemo(() => generateMockStudents(8), []);
  
  // Combine or select data source. For this demo request, we prioritize showing the mock data 
  // if real data is sparse, to demonstrate the "comprehend and contemplate" features.
  const students = (realStudents && realStudents.length > 0) ? realStudents : mockStudents;
  const isMock = students === mockStudents;
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // --- Derived Stats for Charts ---
  const averageSuccess = Math.round(students.reduce((acc: number, s: any) => acc + (s.successRate || 0), 0) / students.length);
  const activeCount = students.filter((s: any) => s.status === 'online').length;
  const helpCount = students.filter((s: any) => s.isHandRaised).length;

  const styleData = students.reduce((acc: any[], s: any) => {
    const existing = acc.find(i => i.name === s.learningStyle);
    if (existing) existing.value++;
    else acc.push({ name: s.learningStyle, value: 1 });
    return acc;
  }, []);

  const performanceData = [
    { name: '90-100%', value: students.filter((s: any) => s.successRate >= 90).length, color: '#22c55e' },
    { name: '75-89%', value: students.filter((s: any) => s.successRate >= 75 && s.successRate < 90).length, color: '#3b82f6' },
    { name: '< 75%', value: students.filter((s: any) => s.successRate < 75).length, color: '#f97316' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50/50 min-h-screen font-sans">
      
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <Monitor className="text-black" />
              Classroom Command
            </h1>
            <p className="text-gray-500 mt-1">
              Real-time insights for {students.length} active students • {isMock ? 'Simulation Mode' : 'Live Mode'}
            </p>
          </div>
          
          <div className="flex gap-3">
             <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <TrendingUp size={16} className="text-green-700" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Class Avg</div>
                  <div className="text-lg font-bold text-gray-900">{averageSuccess}%</div>
                </div>
             </div>
             <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <User size={16} className="text-blue-700" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Active</div>
                  <div className="text-lg font-bold text-gray-900">{activeCount}/{students.length}</div>
                </div>
             </div>
             <div className={`bg-white px-4 py-2 rounded-xl border shadow-sm flex items-center gap-3 ${helpCount > 0 ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'}`}>
                <div className={`p-1.5 rounded-lg ${helpCount > 0 ? 'bg-yellow-200' : 'bg-gray-100'}`}>
                  <Hand size={16} className={helpCount > 0 ? 'text-yellow-800' : 'text-gray-500'} />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Requests</div>
                  <div className="text-lg font-bold text-gray-900">{helpCount}</div>
                </div>
             </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Learning Styles Chart */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BrainCircuit size={16} className="text-purple-500"/> Learning Styles
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={styleData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                  <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500"/> Performance
            </h3>
            <div className="h-40 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={performanceData}
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="ml-4 space-y-2">
                 {performanceData.map((d, i) => (
                   <div key={i} className="flex items-center gap-2 text-xs">
                     <div className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}} />
                     <span className="text-gray-600">{d.name}</span>
                     <span className="font-bold text-gray-900">({d.value})</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>

          {/* Engagement/Activity (Mock Area Chart) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Code2 size={16} className="text-blue-500"/> Code Activity
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  {time: '10:00', activity: 20}, {time: '10:10', activity: 45},
                  {time: '10:20', activity: 30}, {time: '10:30', activity: 80},
                  {time: '10:40', activity: 55}, {time: '10:50', activity: 90},
                ]}>
                  <defs>
                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="activity" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorActivity)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2">
         <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 w-64"
            />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Filter size={14} /> Filter
         </button>
         <div className="h-6 w-px bg-gray-200 mx-2" />
         <button className="px-3 py-1.5 bg-black text-white text-xs font-medium rounded-md">All Students</button>
         <button className="px-3 py-1.5 text-gray-500 hover:text-black text-xs font-medium rounded-md">Needs Help</button>
         <button className="px-3 py-1.5 text-gray-500 hover:text-black text-xs font-medium rounded-md">High Performers</button>
      </div>

      {/* Student Grid */}
      {students.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
           <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-4" />
           <p className="text-gray-500">Waiting for students to join...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {students.map((student: any) => (
            <StudentCard 
              key={student._id} 
              student={student} 
              onClick={() => setSelectedStudent(student)}
              isMock={isMock}
            />
          ))}
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)}
          onJoin={() => {
            onJoinRoom(selectedStudent.roomId, selectedStudent);
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;