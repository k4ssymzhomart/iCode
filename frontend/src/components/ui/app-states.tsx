import React from "react";
import { AlertCircle, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Centered Loading State matching brutalist aesthetic
 */
export const LoadingState = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="size-10 animate-spin text-[#11110f]" />
      <div className="font-['Outfit'] text-sm font-semibold uppercase tracking-widest text-[#11110f]">
        {message}
      </div>
    </div>
  </div>
);

/**
 * Strong Brutalist Error Boundary State
 */
export const ErrorState = ({ 
  title = "System Error", 
  message, 
  onRetry 
}: { 
  title?: string;
  message?: string;
  onRetry?: () => void;
}) => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-[#11110f] p-4 text-white">
    <div className="w-full max-w-md border-4 border-red-500 bg-white p-6 shadow-[8px_8px_0px_#ccff00]">
      <div className="flex items-center gap-3 border-b-2 border-[#11110f] pb-4">
        <AlertCircle className="size-8 text-red-500" />
        <h2 className="font-['Outfit'] text-2xl font-bold uppercase tracking-tight text-[#11110f]">{title}</h2>
      </div>
      <div className="mt-4 font-['Open_Sans'] text-base text-[#11110f]">
        {message || "An unexpected error occurred in the application flow."}
      </div>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 w-full border-2 border-[#11110f] bg-[#11110f] py-3 text-sm font-bold uppercase tracking-widest text-[#ccff00] transition-colors hover:bg-white hover:text-[#11110f]"
        >
          Acknowledge & Retry
        </button>
      )}
    </div>
  </div>
);

/**
 * Disconnected/Reconnecting State (Useful for Liveblocks)
 */
export const DisconnectedState = () => (
  <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 border-2 border-[#11110f] bg-red-50 px-4 py-3 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
    <WifiOff className="size-5 text-red-500" />
    <span className="font-['Open_Sans'] text-sm font-semibold text-[#11110f]">
      Reconnecting to Session...
    </span>
  </div>
);
