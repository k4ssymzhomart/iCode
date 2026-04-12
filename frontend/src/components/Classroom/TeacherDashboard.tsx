import React, { useState } from "react";
import TeacherSidebar from "./Teacher/TeacherSidebar";
import TopStrip from "./Teacher/TopStrip";
import ClassroomGrid from "./Teacher/ClassroomGrid";
import HelpAndStatsRail from "./Teacher/HelpAndStatsRail";
import AnalyticsView from "./Teacher/AnalyticsView";
import StudentDetailPanel from "./Teacher/StudentDetailPanel";
import StudentsManager from "./Teacher/StudentsManager";
import { useLiveClassroom } from "@/features/classroom/hooks";
import { MonitorPlay } from "lucide-react";
import { useRoute } from "@/lib/router";

interface TeacherDashboardProps {
  onJoinRoom?: (session: any) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onJoinRoom }) => {
  const route = useRoute();
  const activeView = route.name === "teacher" ? route.view : "lab";
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Load simulator hook (Live)
  const { students, sessionInfo } = useLiveClassroom();

  const activeCount = students.filter(s => s.status === 'coding').length;
  const stuckCount = students.filter(s => s.status === 'stuck').length;
  const helpCount = students.filter(s => s.status === 'needs-help').length;
  
  // Avg time in seconds
  const totalTime = students.reduce((acc, curr) => acc + curr.timeSpent, 0);
  const avgTimeRaw = totalTime / students.length;
  const avgTime = `${Math.floor(avgTimeRaw / 60)}m ${Math.floor(avgTimeRaw % 60)}s`;

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const handleIntervene = (type: string, id: string) => {
     if (type === "fix" || type === "hint") {
        // Here we'd call an API to send a Liveblocks notification or update help request state.
        // For now, it will organically clear if they ask again.
     }
     if (type === "join" && onJoinRoom && sessionInfo) {
        onJoinRoom({ 
           roomId: `editor_${sessionInfo.session.id}_${id}`,
           sessionId: sessionInfo.session.id,
           studentName: students.find(s => s.id === id)?.name || "Student"
        });
     }
  };

  return (
    <div className="flex w-full h-screen bg-white overflow-hidden selection:bg-[#ccff00] selection:text-[#11110f]">
       
       <TeacherSidebar 
         isCollapsed={isSidebarCollapsed} 
         activeView={activeView}
         onToggle={() => setSidebarCollapsed(!isSidebarCollapsed)}
       />
       
       <div className="flex-1 flex flex-col min-w-0 relative">
          <TopStrip 
            sessionCode="X4K9P"
            topic="Reverse the Vowels"
            totalStudents={students.length}
            activeCount={activeCount}
            stuckCount={stuckCount}
            helpCount={helpCount}
            avgTime={avgTime}
          />
          
          <div className="flex-1 overflow-hidden relative flex">
             {activeView === "lab" && (
                <>
                  <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    <ClassroomGrid students={students} onSelectStudent={(s) => setSelectedStudentId(s.id)} />
                  </div>
                  <HelpAndStatsRail 
                    students={students} 
                    onSelectStudent={(id) => setSelectedStudentId(id)} 
                    isCollapsed={isRightRailCollapsed}
                    onToggle={() => setRightRailCollapsed(!isRightRailCollapsed)}
                  />
                </>
             )}

             {activeView === "analytics" && (
                <div className="flex-1 overflow-hidden">
                   <AnalyticsView students={students} />
                </div>
             )}

             {activeView === "students" && (
                <div className="flex-1 overflow-hidden">
                   <StudentsManager students={students} />
                </div>
             )}

             {activeView === "materials" && (
                <div className="flex-1 flex flex-col p-8 bg-[#fafafa]">
                   <h2 className="text-2xl font-black uppercase tracking-tight text-[#11110f] mb-4">Course Materials</h2>
                   <div className="flex-1 border-2 border-dashed border-gray-300 flex items-center justify-center p-12 text-center text-gray-500 font-bold uppercase tracking-widest bg-white">
                      Materials Submission & Upload System
                   </div>
                </div>
             )}

             {activeView !== "lab" && activeView !== "analytics" && activeView !== "students" && activeView !== "materials" && (
                <div className="flex-1 flex items-center justify-center p-8 bg-[#fafafa]">
                   <div className="border-2 border-dashed border-gray-300 p-12 text-center text-gray-500 font-bold uppercase tracking-widest flex flex-col items-center bg-white">
                     <MonitorPlay className="w-8 h-8 text-gray-300 mb-4" />
                     {activeView} module coming soon
                   </div>
                </div>
             )}

             {/* Student Detail Flyout Overlay */}
             {selectedStudent && (
               <StudentDetailPanel 
                 student={selectedStudent} 
                 onClose={() => setSelectedStudentId(null)}
                 onIntervene={handleIntervene}
               />
             )}
          </div>
       </div>

    </div>
  );
};

export default TeacherDashboard;
