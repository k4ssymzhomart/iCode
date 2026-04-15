import fullLogo from "@/assets/full_logo.png";
import iconLogo from "@/assets/icon_logo.png";
import { cn } from "@/lib/utils";

interface ClassroomLoaderProps {
  message: string;
  compact?: boolean;
}

const ClassroomLoader = ({ message, compact = false }: ClassroomLoaderProps) => {
  if (compact) {
    return (
      <div className="flex w-full h-full min-h-[280px] flex-col bg-white p-4">
        <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-100">
           <div className="h-4 w-32 bg-gray-200 animate-pulse"></div>
           <div className="h-4 w-12 bg-gray-200 animate-pulse"></div>
        </div>
        <div className="space-y-3 flex-1 overflow-hidden">
           <div className="h-4 w-full bg-gray-100 animate-pulse"></div>
           <div className="h-4 w-11/12 bg-gray-100 animate-pulse"></div>
           <div className="h-4 w-4/5 bg-gray-100 animate-pulse"></div>
           <div className="h-4 w-full bg-gray-100 animate-pulse"></div>
           <div className="h-4 w-3/4 bg-gray-100 animate-pulse"></div>
        </div>
        <div className="mt-auto pt-4 flex items-center gap-3">
           <div className="h-4 w-4 rounded-full bg-[#ccff00] animate-bounce"></div>
           <span className="text-xs font-bold uppercase tracking-widest text-[#11110f]">{message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center bg-black overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(204,255,0,0.1),_transparent_60%)]" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        <div className="mb-12 relative flex items-center justify-center w-24 h-24 bg-[#ccff00] border-[4px] border-[#ccff00] shadow-[0_0_40px_rgba(204,255,0,0.4)]">
           <img
             src={iconLogo}
             alt="iCode"
             className="relative h-14 w-14 object-contain filter invert"
             style={{ filter: 'brightness(0)' }}
           />
        </div>

        <div className="w-full flex-col flex items-center">
          <div className="text-[#ccff00] text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-center">
            {message}
          </div>
          
          <div className="w-full h-1 bg-[#11110f] relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-[#ccff00] animate-[loadingBar_1.5s_ease-out_infinite]" 
                 style={{ 
                   animationName: 'loadingBar', 
                   animationDuration: '1.2s', 
                   animationTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)', 
                   animationIterationCount: 'infinite' 
                 }}>
            </div>
            <style>
              {`
                @keyframes loadingBar {
                  0% { width: 0%; left: 0%; }
                  50% { width: 100%; left: 0%; }
                  100% { width: 100%; left: 100%; }
                }
              `}
            </style>
          </div>
          
          <div className="mt-8 text-gray-500 font-mono text-xs text-center flex flex-col gap-1">
            <span>Initializing secure namespace...</span>
            <span className="animate-pulse text-gray-400">Syncing liveblocks runtime...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassroomLoader;
