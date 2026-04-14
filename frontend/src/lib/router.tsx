import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { appPaths } from "@/app/paths";

export type RouteName =
  | "home"
  | "login"
  | "smart-compiler"
  | "classroom"
  | "teacher"
  | "teacher-session"
  | "feedback"
  | "not-found";

type TeacherSubView = "lab" | "analytics" | "students" | "sessions" | "settings" | "materials";

type RouteMatch =
  | { name: "home"; pathname: string }
  | { name: "login"; pathname: string }
  | { name: "smart-compiler"; pathname: string }
  | { name: "classroom"; pathname: string }
  | { name: "feedback"; pathname: string }
  | { name: "teacher"; pathname: string; view: TeacherSubView }
  | {
      name: "teacher-session";
      pathname: string;
      sessionId: string;
      studentId: string;
      taskId: string;
    }
  | { name: "not-found"; pathname: string };

type RouterContextValue = {
  route: RouteMatch;
  navigate: (to: string, options?: { replace?: boolean }) => void;
};

const RouterContext = createContext<RouterContextValue | null>(null);

const normalizePath = (pathname: string) => {
  const withoutTrailingSlash = pathname.replace(/\/+$/, "");
  return withoutTrailingSlash || "/";
};

const resolveRoute = (pathname: string): RouteMatch => {
  const path = normalizePath(pathname);

  if (path === appPaths.home) {
    return { name: "home", pathname: path };
  }

  if (path === appPaths.login) {
    return { name: "login", pathname: path };
  }

  if (path === appPaths.compiler) {
    return { name: "smart-compiler", pathname: path };
  }

  if (path === appPaths.classroom) {
    return { name: "classroom", pathname: path };
  }

  if (path === (appPaths as any).feedback) {
    return { name: "feedback", pathname: path };
  }

  if (path === appPaths.teacher) {
    return { name: "teacher", pathname: path, view: "lab" };
  }
  if (path === appPaths.teacherAnalytics) {
    return { name: "teacher", pathname: path, view: "analytics" };
  }
  if (path === appPaths.teacherMaterials) {
    return { name: "teacher", pathname: path, view: "materials" };
  }
  if (path === appPaths.teacherStudents) {
    return { name: "teacher", pathname: path, view: "students" };
  }
  if (path === appPaths.teacherSessions) {
    return { name: "teacher", pathname: path, view: "sessions" };
  }
  if (path === appPaths.teacherSettings) {
    return { name: "teacher", pathname: path, view: "settings" };
  }

  const sessionPrefix = "/teacher/session/";
  if (path.startsWith(sessionPrefix)) {
    const parts = path.slice(sessionPrefix.length).split("/").map(decodeURIComponent);
    if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
      return {
        name: "teacher-session",
        pathname: path,
        sessionId: parts[0],
        studentId: parts[1],
        taskId: parts.slice(2).join("/"),
      };
    }
  }

  return { name: "not-found", pathname: path };
};

const getCurrentPath = () =>
  typeof window === "undefined" ? appPaths.home : window.location.pathname;

export const RouterProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [route, setRoute] = useState<RouteMatch>(() =>
    resolveRoute(getCurrentPath()),
  );

  useEffect(() => {
    const syncRoute = () => {
      setRoute(resolveRoute(getCurrentPath()));
    };

    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  const value: RouterContextValue = {
    route,
    navigate: (to, options) => {
      const nextPath = normalizePath(to);
      const method = options?.replace ? "replaceState" : "pushState";
      if (nextPath === normalizePath(window.location.pathname)) {
        return;
      }

      window.history[method]({}, "", nextPath);
      setRoute(resolveRoute(nextPath));
    },
  };

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
};

export const useRoute = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRoute must be used inside RouterProvider.");
  }

  return context.route;
};

export const useNavigate = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useNavigate must be used inside RouterProvider.");
  }

  return context.navigate;
};

export const Link = ({
  to,
  replace,
  onClick,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  replace?: boolean;
}) => {
  const navigate = useNavigate();

  return (
    <a
      {...props}
      href={to}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          props.target === "_blank"
        ) {
          return;
        }

        event.preventDefault();
        navigate(to, { replace });
      }}
    />
  );
};
