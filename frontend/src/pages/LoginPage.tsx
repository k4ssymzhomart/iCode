import { useState, useEffect } from "react";
import { appPaths } from "@/app/paths";
import { MinimalAuthPage } from "@/components/ui/minimal-auth-page";
import { hasSupabaseConfig } from "@/lib/supabase";
import { useNavigate } from "@/lib/router";
import { authService } from "@/services/auth";
import { UserRole } from "../../../shared/types";
import { useAuth } from "@/lib/auth-context";

const getAuthErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Google sign-in could not be completed. Please try again.";
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { profile, isLoading } = useAuth();
  
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("student");

  // Automatically redirect if already logged in (e.g. returning from OAuth redirect)
  useEffect(() => {
    if (!isLoading && profile) {
      if (profile.role === "teacher") {
        navigate(appPaths.teacher, { replace: true });
      } else {
        navigate(appPaths.classroom, { replace: true });
      }
    }
  }, [profile, isLoading, navigate]);

  const handleGoogleContinue = async () => {
    if (!hasSupabaseConfig) {
      setStatusMessage(null);
      setErrorMessage(
        "Supabase is not configured yet. Add the Supabase URL and Anon Key to the root .env file and reload the app.",
      );
      return;
    }

    try {
      setIsGoogleLoading(true);
      setErrorMessage(null);
      setStatusMessage("Redirecting to Google sign-in...");
      
      // signInWithGoogle natively causes window.location redirect via Supabase OAuth
      await authService.signInWithGoogle(role);
      
      // Code beyond here rarely executes due to page-unload, but just in case
    } catch (error) {
      setStatusMessage(null);
      setIsGoogleLoading(false);
      setErrorMessage(getAuthErrorMessage(error));
    }
  };

  const handleGithubContinue = () => {
    setStatusMessage(null);
    setErrorMessage(
      "GitHub sign-in can be connected next after the GitHub provider is enabled in Supabase.",
    );
  };

  return (
    <MinimalAuthPage
      role={role as "student" | "teacher"}
      onRoleChange={(r) => setRole(r)}
      onGoogleContinue={handleGoogleContinue}
      onGithubContinue={handleGithubContinue}
      isGoogleLoading={isGoogleLoading || isLoading}
      statusMessage={statusMessage}
      errorMessage={errorMessage}
    />
  );
};

export default LoginPage;

