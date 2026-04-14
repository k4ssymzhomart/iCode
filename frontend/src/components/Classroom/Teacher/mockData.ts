import { useState, useEffect } from "react";

export type StudentStatus = "coding" | "stuck" | "needs-help" | "solved" | "offline";

export interface StudentData {
  id: string;
  name: string;
  avatarUrl?: string;
  avatarSrc?: string;
  avatarColor: string;
  avatarShape: string;
  status: StudentStatus;
  currentTask: string;
  timeSpent: number; // in seconds
  attempts: number;
  correctionsUsed: number;
  mockCode: string;
  lastError: string | null;
  helpRequestedAt: Date | null;
  successRate: number;
  currentTaskId?: string;
  currentCodeSnippet?: string;
  pendingInterventionCount?: number;
  lastActivityAt?: string;
}

const mockNames = [
  "Alex Chen", "Sarah Miller", "Jordan Smith", "Emily Zhang", 
  "Michael Johnson", "Jessica Davis", "David Wilson", "Emma Taylor", 
  "Ryan Martinez", "Olivia Anderson", "Daniel Thomas", "Sophia White"
];

const colors = ["bg-[#ccff00]", "bg-purple-500", "bg-rose-500", "bg-cyan-400", "bg-orange-500", "bg-blue-500"];
const shapes = ["circle", "square", "triangle"];

const snippet = `def solve(s: str) -> str:
    vowels = set('aeiouAEIOU')
    chars = list(s)
    l, r = 0, len(chars) - 1
    
    while l < r:
        if chars[l] not in vowels:
            l += 1
            continue
        if chars[r] not in vowels:
            r -= 1
            continue
            
        # Swap logic
        chars[l], chars[r] = chars[r], chars[l]
        l += 1
        r -= 1
        
    return "".join(chars)
`;

export const generateInitialStudents = (count: number): StudentData[] => {
  return Array.from({ length: count }).map((_, index) => {
    const isError = Math.random() > 0.6;
    const statusRand = Math.random();
    let status: StudentStatus = "coding";
    if (statusRand > 0.85) status = "solved";
    else if (statusRand > 0.7) status = "needs-help";
    else if (statusRand > 0.5) status = "stuck";

    return {
      id: `stu-${index}`,
      name: mockNames[index % mockNames.length],
      avatarColor: colors[index % colors.length],
      avatarShape: shapes[index % shapes.length],
      status,
      currentTask: "Reverse the Vowels",
      timeSpent: Math.floor(Math.random() * 600),
      attempts: Math.floor(Math.random() * 5),
      correctionsUsed: Math.floor(Math.random() * 2),
      mockCode: snippet,
      lastError: isError ? "IndexError: string index out of range at line 6" : null,
      helpRequestedAt: status === "needs-help" ? new Date(Date.now() - Math.floor(Math.random() * 120000)) : null,
      successRate: 50 + Math.floor(Math.random() * 50),
    };
  });
};

export const useMockClassroom = (studentCount = 12) => {
  const [students, setStudents] = useState<StudentData[]>([]);

  useEffect(() => {
    setStudents(generateInitialStudents(studentCount));
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStudents(prev => {
        return prev.map(student => {
          let newStatus = student.status;
          let newHelpTime = student.helpRequestedAt;
          
          // Randomly change status
          if (student.status === "coding" && Math.random() > 0.95) {
            newStatus = "stuck";
          } else if (student.status === "stuck" && Math.random() > 0.9) {
            newStatus = "needs-help";
            newHelpTime = new Date();
          } else if (student.status === "needs-help" && Math.random() > 0.98) {
             // Occasionally resolve themselves
             newStatus = "coding";
             newHelpTime = null;
          }

          return {
            ...student,
            timeSpent: student.status !== "solved" ? student.timeSpent + 5 : student.timeSpent,
            status: newStatus,
            helpRequestedAt: newHelpTime,
          };
        });
      });
    }, 5000); // Every 5s
    
    return () => clearInterval(interval);
  }, [studentCount]);

  const updateStudentStatus = (id: string, status: StudentStatus) => {
     setStudents(prev => prev.map(s => s.id === id ? { ...s, status, helpRequestedAt: status === "needs-help" ? new Date() : null } : s));
  };

  return { students, updateStudentStatus };
};
