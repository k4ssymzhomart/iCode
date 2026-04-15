export const appPaths = {
  home: "/",
  login: "/login",
  compiler: "/smart-compiler",
  classroom: "/classroom",
  feedback: "/feedback",
  teacher: "/teacher",
  teacherAnalytics: "/teacher/analytics",
  teacherMaterials: "/teacher/materials",
  teacherStudents: "/teacher/students",
  teacherSessions: "/teacher/sessions",
  teacherSettings: "/teacher/settings",
  teacherSession: (sessionId: string, studentId: string, taskId: string) =>
    `/teacher/session/${encodeURIComponent(sessionId)}/${encodeURIComponent(studentId)}/${encodeURIComponent(taskId)}`,
} as const;

export const preNavItems = [
  { label: "Home", href: appPaths.home },
  { label: "Classroom", href: appPaths.classroom },
  { label: "Compiler", href: appPaths.compiler },
];

export const studentNavItems = [
  { label: "Home", href: appPaths.home },
  { label: "Classroom", href: appPaths.classroom },
  { label: "Compiler", href: appPaths.compiler },
  { label: "Feedback", href: appPaths.feedback },
];

export const teacherNavItems = [
  { label: "Active Lab", href: appPaths.teacher },
  { label: "Sessions", href: appPaths.teacherSessions },
  { label: "Students", href: appPaths.teacherStudents },
  { label: "Materials", href: appPaths.teacherMaterials },
  { label: "Settings", href: appPaths.teacherSettings },
];
