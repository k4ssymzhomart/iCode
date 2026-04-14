import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { StudentData } from "@/components/Classroom/Teacher/mockData";

export const useLiveClassroom = () => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    let interval: number;

    const fetchDashboard = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 1. Fetch active session info
        const resClassroom = await fetch("/api/classroom/active", {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });
        
        if (!resClassroom.ok) return;
        const dataClassroom = await resClassroom.json();
        
        if (!dataClassroom.success || !dataClassroom.session) {
           return; // No active session
        }
        
        setSessionInfo(dataClassroom);
        const activeSessionId = dataClassroom.session.id;
        const taskId = dataClassroom.session.taskId;

        // 2. Fetch Leaderboard and Help Requests
        const [resLeaderboard, resHelp] = await Promise.all([
          fetch(`/api/leaderboard?sessionId=${activeSessionId}&taskId=${taskId}`, { headers: { "Authorization": `Bearer ${session.access_token}` }}),
          fetch(`/api/help/requests?sessionId=${activeSessionId}`, { headers: { "Authorization": `Bearer ${session.access_token}` }})
        ]);

        if (!resLeaderboard.ok || !resHelp.ok) return;
        
        const [leaderboard, help] = await Promise.all([resLeaderboard.json(), resHelp.json()]);

        if (leaderboard.success && help.success) {
           // Map to StudentData for UI
           const mappedStudents: StudentData[] = leaderboard.leaderboard.map((m: any) => {
              const hasHelpRequest = (help.requests || []).some((r: any) => r.student_id === m.studentId && r.status === "pending");
              
              return {
                 id: m.studentId,
                 name: m.profile?.fullName || "Student",
                 avatarUrl: m.profile?.avatarUrl || undefined,
                 status: m.completed ? 'solved' : (hasHelpRequest ? 'needs-help' : ((m.runAttempts || 0) > 5 && (m.correctionsUsed || 0) > 2 ? 'stuck' : 'coding')),
                 currentTask: dataClassroom.session.task,
                 successRate: Math.max(0, 100 - ((m.correctionsUsed || 0) * 10) - ((m.runAttempts || 0) * 2)),
                 timeSpent: m.totalTimeSeconds || 0,
                 attempts: m.runAttempts || 0,
                 correctionsUsed: m.correctionsUsed || 0,
                 avatarColor: "bg-[#ccff00]",
                 avatarShape: "circle",
                 mockCode: "",
                 lastError: null,
                 helpRequestedAt: hasHelpRequest ? new Date() : null,
              } as StudentData;
           });
           
           setStudents(mappedStudents);
        }
      } catch (err) {
        console.error("[useLiveClassroom] Dashboard poll error:", err);
      }
    };

    fetchDashboard();
    interval = window.setInterval(fetchDashboard, 3000); // Poll every 3 seconds

    return () => window.clearInterval(interval);
  }, []);

  return { students, sessionInfo };
};
