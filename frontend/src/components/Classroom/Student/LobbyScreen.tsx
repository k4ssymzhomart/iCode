import React, { useState } from "react";
import { AvatarOption, avatarOptions } from "./mockData";
import { User, LogIn, Hash } from "lucide-react";

interface LobbyScreenProps {
  onJoin: (nickname: string, sessionCode: string, avatarId: string) => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ onJoin }) => {
  const [sessionCode, setSessionCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCode.trim() || sessionCode.trim().length !== 5) {
      setError("Please enter a 5-digit session code.");
      return;
    }
    if (!nickname.trim()) {
      setError("Please enter a nickname.");
      return;
    }
    if (!selectedAvatarId) {
      setError("Please select an avatar.");
      return;
    }
    setError(null);
    onJoin(nickname.trim(), sessionCode.trim(), selectedAvatarId);
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
            <label className="text-xs font-bold uppercase tracking-widest text-[#11110f] flex items-center gap-2">
              <Hash className="h-4 w-4 text-[#ccff00] fill-[#11110f]" />
              Session Code
            </label>
            <input
              type="text"
              maxLength={5}
              placeholder="12345"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full border-2 border-[#11110f] bg-[#fafafa] px-4 py-3 text-2xl font-mono text-center tracking-widest text-[#11110f] focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:bg-white transition-all placeholder:text-gray-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#11110f] flex items-center gap-2">
              <User className="h-4 w-4" />
              Nickname
            </label>
            <input
              type="text"
              placeholder="Your Name"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full border-2 border-[#11110f] bg-[#fafafa] px-4 py-3 text-lg font-medium text-[#11110f] focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:bg-white transition-all placeholder:text-gray-300"
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#11110f] flex justify-center">
              Pick your Avatar
            </label>
            <div className="grid grid-cols-6 gap-3">
              {avatarOptions.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatarId(avatar.id)}
                  className={`relative aspect-square flex items-center justify-center border-2 transition-all ${
                    selectedAvatarId === avatar.id
                      ? "border-[#11110f] scale-110 shadow-[4px_4px_0_rgba(17,17,15,1)] z-10"
                      : "border-transparent hover:border-gray-300 hover:scale-105"
                  }`}
                >
                  <div className={`w-full h-full ${avatar.color} border-2 border-[#11110f] opacity-90`} style={{
                    borderRadius: avatar.shape === 'circle' ? '50%' : 
                                 avatar.shape === 'triangle' ? '0' : // simplified triangle
                                 avatar.shape === 'square' ? '0' : '20%',
                    clipPath: avatar.shape === 'triangle' ? 'polygon(50% 10%, 0% 100%, 100% 100%)' :
                              avatar.shape === 'hexagon' ? 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' : 'none'
                  }} />
                  {selectedAvatarId === avatar.id && (
                    <div className="absolute -bottom-2 -nav-right-2 w-4 h-4 bg-white border border-[#11110f] rounded-full flex items-center justify-center">
                       <div className="w-2 h-2 bg-[#11110f] rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
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
