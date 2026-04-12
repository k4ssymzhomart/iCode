import React, { Suspense, lazy, useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { appPaths } from "@/app/paths";
import Footer from "@/components/Layout/Footer";
import Header from "@/components/Layout/Header";
import { RouterProvider, type RouteName, useRoute } from "@/lib/router";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";

const ClassroomModePage = lazy(() => import("@/pages/ClassroomModePage"));
const SmartCompilerPage = lazy(() => import("@/pages/SmartCompilerPage"));
const TeacherSessionPage = lazy(() => import("@/pages/TeacherSessionPage"));
const TeacherViewPage = lazy(() => import("@/pages/TeacherViewPage"));

// Removed convex

const pageTitles: Record<RouteName, string> = {
  home: "iCode",
  login: "Sign In | iCode",
  "smart-compiler": "Smart Compiler | iCode",
  classroom: "Classroom Mode | iCode",
  teacher: "Teacher View | iCode",
  "teacher-session": "Teacher Session | iCode",
  "not-found": "Page Not Found | iCode",
};

const routesWithFooter = new Set<RouteName>([]);
const routesWithoutHeader = new Set<RouteName>(["login", "teacher-session", "home", "teacher"]);

const RouteLoader = () => (
  <div className="flex flex-1 items-center justify-center px-4 py-16">
    <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm">
      Loading page...
    </div>
  </div>
);

const RoleGuard = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { role, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <RouteLoader />;
  if (!isAuthenticated) return <div className="flex flex-1 items-center justify-center font-['Open_Sans']">Please Log In</div>;
  
  if (role && !allowedRoles.includes(role)) {
    return <div className="flex flex-1 items-center justify-center font-['Open_Sans'] text-red-500">Unauthorized. You must be a {allowedRoles.join(" or ")} to view this page.</div>;
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
          {route.name === "teacher" && (
            <RoleGuard allowedRoles={["teacher"]}>
              <TeacherViewPage />
            </RoleGuard>
          )}
          {route.name === "teacher-session" && (
            <RoleGuard allowedRoles={["teacher"]}>
              <TeacherSessionPage roomId={route.roomId} />
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
