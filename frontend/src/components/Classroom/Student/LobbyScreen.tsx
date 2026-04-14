import React, { useState } from "react";
import { LogIn, Hash } from "lucide-react";

interface LobbyScreenProps {
  onJoin: (sessionCode: string) => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ onJoin }) => {
  const [sessionCode, setSessionCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCode.trim() || sessionCode.trim().length !== 5) {
      setError("Please enter a 5-digit session code.");
      return;
    }
    setError(null);
    onJoin(sessionCode.trim());
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[#fafafa] px-4 py-12 sm:px-6 lg:px-8 font-sans selection:bg-[#ccff00] selection:text-black">
      <div className="w-full max-w-md bg-white border border-[#11110f] shadow-[8px_8px_0_#11110f] p-8 relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#ccff00] border-2 border-[#11110f] shadow-[4px_4px_0_#11110f] flex items-center justify-center mb-6">
            <LogIn className="h-8 w-8 text-[#11110f] translate-x-[2px]" />
          </div>
          <h2 className="text-3xl font-black uppercase text-[#11110f] tracking-tight">Join Lab</h2>
          <p className="text-sm font-semibold text-[#666259] mt-2 uppercase tracking-widest">
            Enter Session Info
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold p-3 mb-6 flex justify-center text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="classroom-session-code"
              className="text-xs font-bold uppercase tracking-widest text-[#11110f] flex items-center gap-2"
            >
              <Hash className="h-4 w-4 text-[#ccff00] fill-[#11110f]" />
              Session Code
            </label>
            <input
              id="classroom-session-code"
              name="sessionCode"
              type="text"
              maxLength={5}
              placeholder="12345"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.replace(/\D/g, ""))}
              className="w-full border-2 border-[#11110f] bg-[#fafafa] px-4 py-3 text-2xl font-mono text-center tracking-widest text-[#11110f] focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:bg-white transition-all placeholder:text-gray-300"
            />
          </div>



          <button
            type="submit"
            className="w-full mt-8 bg-[#ccff00] border-2 border-[#11110f] py-4 text-base font-black uppercase tracking-[0.2em] text-[#11110f] transition-all hover:bg-[#bdf300] hover:translate-y-[2px] shadow-[4px_4px_0_#11110f] hover:shadow-[2px_2px_0_#11110f]"
          >
            Enter Lab Environment
          </button>
        </form>
      </div>
    </div>
  );
};

export default LobbyScreen;
