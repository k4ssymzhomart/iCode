export const appPaths = {
  home: "/",
  login: "/login",
  compiler: "/smart-compiler",
  classroom: "/classroom",
  teacher: "/teacher",
  teacherAnalytics: "/teacher/analytics",
  teacherMaterials: "/teacher/materials",
  teacherStudents: "/teacher/students",
  teacherSessions: "/teacher/sessions",
  teacherSettings: "/teacher/settings",
  teacherSession: (roomId: string) =>
    `/teacher/session/${encodeURIComponent(roomId)}`,
} as const;

export const preNavItems = [
  { label: "Home", href: appPaths.home },
  { label: "Compiler", href: appPaths.compiler },
  { label: "Classroom", href: appPaths.classroom },
  { label: "Teacher", href: appPaths.teacher },
  { label: "404", href: "/this-is-not-found" },
];

export const studentNavItems = [
  { label: "Compiler", href: appPaths.compiler },
  { label: "Lab Section", href: "/labs" },
  { label: "Profile", href: "/profile" },
  { label: "Secure Exam", href: "/exam" },
];

export const teacherNavItems = [
  { label: "Tasks Rush", href: "/teacher/tasks" },
  { label: "Classroom", href: appPaths.classroom },
  { label: "Profile", href: "/teacher/profile" },
  { label: "Manage Classroom", href: appPaths.teacher },
  { label: "Materials", href: "/teacher/materials" },
  { label: "Compiler", href: "/teacher/compiler" },
];
