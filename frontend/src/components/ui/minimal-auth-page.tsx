import React from "react";
import { ChevronLeft, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Particles } from "@/components/ui/particles";
import { cn } from "@/lib/utils";
import fullLogo from "@/assets/full_logo.png";

type MinimalAuthPageProps = {
  onGoogleContinue?: () => void | Promise<void>;
  onGithubContinue?: () => void | Promise<void>;
  onEmailSignIn?: (email: string, password: string) => void | Promise<void>;
  onEmailSignUp?: (email: string, password: string) => void | Promise<void>;
  isGoogleLoading?: boolean;
  statusMessage?: string | null;
  errorMessage?: string | null;
  role: "student" | "teacher";
  onRoleChange: (role: "student" | "teacher") => void;
};

export function MinimalAuthPage({
  onGoogleContinue,
  onGithubContinue,
  onEmailSignIn,
  onEmailSignUp,
  isGoogleLoading = false,
  statusMessage,
  errorMessage,
  role,
  onRoleChange,
}: MinimalAuthPageProps) {
  const [email, setEmail] = React.useState("admin@gmail.com");
  const [password, setPassword] = React.useState("123123");
  const feedbackMessage = errorMessage ?? statusMessage;

  return (
    <div className="relative w-full bg-white md:h-screen md:overflow-hidden">
      <Particles
        color="#666666"
        quantity={120}
        ease={20}
        className="absolute inset-0"
      />
      <div aria-hidden className="absolute inset-0 isolate -z-10 contain-strict">
        <div className="absolute left-0 top-0 h-[80rem] w-[35rem] -translate-y-[21.875rem] -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,rgba(17,17,15,0.06)_0,hsla(0,0%,55%,0.02)_50%,rgba(17,17,15,0.01)_80%)]" />
        <div className="absolute left-0 top-0 h-[80rem] w-[15rem] -rotate-45 translate-x-[5%] -translate-y-[50%] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(17,17,15,0.04)_0,rgba(17,17,15,0.01)_80%,transparent_100%)]" />
        <div className="absolute left-0 top-0 h-[80rem] w-[15rem] -translate-y-[21.875rem] -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(17,17,15,0.04)_0,rgba(17,17,15,0.01)_80%,transparent_100%)]" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4">
        <a
          href="/"
          className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-none border-2 border-[rgba(17,17,15,0.1)] bg-white/80 backdrop-blur-sm px-3 py-2 text-sm font-medium text-[#11110f] hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="size-4" />
          Home
        </a>

        <div className="mx-auto w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src={fullLogo} alt="iCode" className="h-12 w-auto object-contain" />
          </div>

          {/* Heading */}
          <div className="flex flex-col space-y-2">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#11110f]">
              Sign In or Join Now!
            </h1>
            <p className="text-base font-['Open_Sans'] text-[#666259]">
              Select your role, then continue with Google.
            </p>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onRoleChange("student")}
              className={cn(
                "w-full inline-flex items-center justify-center rounded-none border-[3px] border-[#11110f] px-4 py-2.5 text-sm font-semibold transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_rgba(0,0,0,0.1)]",
                role === "student"
                  ? "bg-[#ccff00] text-[#11110f] shadow-[4px_4px_0px_#11110f] hover:shadow-[6px_6px_0px_#11110f]"
                  : "bg-white text-[#666259] hover:bg-gray-50"
              )}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => onRoleChange("teacher")}
              className={cn(
                "w-full inline-flex items-center justify-center rounded-none border-[3px] border-[#11110f] px-4 py-2.5 text-sm font-semibold transition-all shadow-[4px_4px_0px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_rgba(0,0,0,0.1)]",
                role === "teacher"
                  ? "bg-[#ccff00] text-[#11110f] shadow-[4px_4px_0px_#11110f] hover:shadow-[6px_6px_0px_#11110f]"
                  : "bg-white text-[#666259] hover:bg-gray-50"
              )}
            >
              Teacher
            </button>
          </div>

          {/* Auth Buttons / Forms */}
          {role === "teacher" ? (
            <form className="space-y-3 pt-2" onSubmit={(e) => {
              e.preventDefault();
              onEmailSignIn?.(email, password);
            }}>
              <input
                type="email"
                placeholder="Teacher Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-none border-[3px] border-[#11110f] px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ccff00] transition-all bg-white text-[#11110f]"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-none border-[3px] border-[#11110f] px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ccff00] transition-all bg-white text-[#11110f]"
                required
              />
              <button
                type="submit"
                disabled={isGoogleLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-none border-[3px] border-[#11110f] bg-[#11110f] px-6 py-3.5 text-sm font-semibold text-white shadow-[4px_4px_0px_#ccff00] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#ccff00] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isGoogleLoading ? "Connecting..." : "Sign In"}
              </button>
            </form>
          ) : (
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={onGoogleContinue}
                disabled={isGoogleLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-none border-[3px] border-[#11110f] bg-[#11110f] px-6 py-3.5 text-sm font-semibold text-white shadow-[4px_4px_0px_#ccff00] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#ccff00] disabled:opacity-50 disabled:pointer-events-none"
              >
                <GoogleIcon className="size-4" />
                {isGoogleLoading ? "Connecting..." : "Continue with Google"}
              </button>
              <button
                type="button"
                onClick={onGithubContinue}
                className="w-full inline-flex items-center justify-center gap-2 rounded-none border-[3px] border-[#11110f] bg-white px-6 py-3.5 text-sm font-semibold text-[#11110f] shadow-[4px_4px_0px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_rgba(0,0,0,0.15)]"
              >
                <Github strokeWidth={2.5} className="size-4" />
                Continue with GitHub
              </button>
            </div>
          )}

          {/* Feedback */}
          {feedbackMessage ? (
            <p
              className={cn(
                "text-sm font-['Open_Sans'] mt-2 font-medium",
                errorMessage ? "text-red-500" : "text-[#ccff00]",
              )}
            >
              {feedbackMessage}
            </p>
          ) : null}

          {/* Legal */}
          <p className="mt-8 text-sm font-['Open_Sans'] text-[#666259]">
            By clicking continue, you agree to our{" "}
            <a
              href="#"
              className="text-[#11110f] underline decoration-[#ccff00] decoration-2 underline-offset-4 transition hover:text-[#ccff00]"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-[#11110f] underline decoration-[#ccff00] decoration-2 underline-offset-4 transition hover:text-[#ccff00]"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

const GoogleIcon = (props: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <g>
      <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
    </g>
  </svg>
);
