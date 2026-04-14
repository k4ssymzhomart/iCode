import React, { Suspense, lazy, useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { appPaths } from "@/app/paths";
import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import { RouterProvider, type RouteName, useRoute, useNavigate } from "@/lib/router";
import fullLogo from "@/assets/full_logo.png";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";

const ClassroomModePage = lazy(() => import("@/pages/ClassroomModePage"));
const SmartCompilerPage = lazy(() => import("@/pages/SmartCompilerPage"));
const TeacherSessionPage = lazy(() => import("@/pages/TeacherSessionPage"));
const TeacherViewPage = lazy(() => import("@/pages/TeacherViewPage"));
const FeedbackPage = lazy(() => import("@/pages/FeedbackPage"));

// Removed convex

const pageTitles: Record<RouteName, string> = {
  home: "iCode",
  login: "Sign In | iCode",
  "smart-compiler": "Compiler | iCode",
  classroom: "Classroom Mode | iCode",
  teacher: "Teacher View | iCode",
  "teacher-session": "Teacher Session | iCode",
  "feedback": "Feedback | iCode",
  "not-found": "Page Not Found | iCode",
};

const routesWithFooter = new Set<RouteName>([]);
const routesWithoutHeader = new Set<RouteName>(["login", "teacher-session", "home", "teacher"]);

const RouteLoader = () => (
  <div className="flex flex-1 items-center justify-center px-4 py-16">
    <div className="inline-flex items-center gap-2 border-2 border-black bg-[#ade027] px-4 py-2 font-mono text-sm font-bold uppercase tracking-widest text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <span>LOADING</span>
      <span className="h-4 w-2 animate-pulse bg-black" style={{ animationDuration: '0.4s' }} />
    </div>
  </div>
);

const AuthLoader = ({ message = "Loading" }: { message?: string }) => (
  <div className="flex flex-1 flex-col items-center justify-center px-4 py-32 bg-transparent">
    <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-300">
      <img src={fullLogo} alt="iCode" className="h-14 w-auto drop-shadow-md" />
      <div className="inline-flex items-center gap-3 border-[3px] border-[#11110f] bg-[#ccff00] px-6 py-3 font-mono text-sm font-black uppercase tracking-widest text-[#11110f] shadow-[6px_6px_0_#11110f]">
        <span>{message}</span>
        <span className="h-5 w-2.5 animate-pulse bg-[#11110f]" style={{ animationDuration: '0.4s' }} />
      </div>
    </div>
  </div>
);

const RoleGuard = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { role, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if they lose auth (e.g. signed out)
      navigate("/login", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);
  
  if (isLoading) return <AuthLoader message="Authenticating" />;
  if (!isAuthenticated) return <AuthLoader message="Please Log In" />;
  
  if (role && !allowedRoles.includes(role)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 bg-transparent">
        <div className="border-[3px] border-[#11110f] bg-white p-8 shadow-[8px_8px_0_#11110f] max-w-md text-center">
          <h2 className="text-xl font-black uppercase tracking-tight text-rose-500 mb-2">Access Denied</h2>
          <p className="font-medium text-sm text-gray-600">Unauthorized. You must be a {allowedRoles.join(" or ")} to view this page.</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

const AppFrame = () => {
  const { isAuthenticated } = useAuth();
  const route = useRoute();

  useEffect(() => {
    document.title = pageTitles[route.name];
  }, [route.name]);
  
  // Home renders Header ONLY if authenticated (as student shell)
  const isMarketingHome = route.name === "home" && !isAuthenticated;
  const hideHeader = routesWithoutHeader.has(route.name) && !(!isMarketingHome && route.name === "home");

  return (
    <div className="min-h-screen bg-transparent">
      {!hideHeader && <Header />}
      <main className="flex min-h-screen flex-col">
        {route.name === "home" && <HomePage />}
        {route.name === "login" && <LoginPage />}
        <Suspense fallback={<RouteLoader />}>
          {route.name === "smart-compiler" && (
            <RoleGuard allowedRoles={["student"]}>
              <SmartCompilerPage />
            </RoleGuard>
          )}
          {route.name === "classroom" && (
            <RoleGuard allowedRoles={["student"]}>
              <ClassroomModePage />
            </RoleGuard>
          )}
          {route.name === "feedback" && (
            <RoleGuard allowedRoles={["student"]}>
              <FeedbackPage />
            </RoleGuard>
          )}
          {route.name === "teacher" && (
            <RoleGuard allowedRoles={["teacher"]}>
              <TeacherViewPage />
            </RoleGuard>
          )}
          {route.name === "teacher-session" && (
            <RoleGuard allowedRoles={["teacher"]}>
              <TeacherSessionPage
                sessionId={route.sessionId}
                studentId={route.studentId}
                taskId={route.taskId}
              />
            </RoleGuard>
          )}
        </Suspense>
        {route.name === "not-found" && <NotFoundPage />}
      </main>
      {routesWithFooter.has(route.name) && <Footer />}
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <RouterProvider>
      <AppFrame />
    </RouterProvider>
  </AuthProvider>
);

export default App;
