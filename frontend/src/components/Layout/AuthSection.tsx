import { useAuth } from "@/lib/auth-context";
import { Link } from "@/lib/router";
import { appPaths } from "@/app/paths";
import { authService } from "@/services/auth";
import { LogOut, User } from "lucide-react";

export const AuthSection = () => {
  const { isAuthenticated, profile, isLoading } = useAuth();

  const handleLogout = async () => {
    await authService.signOut();
    window.location.href = appPaths.home;
  };

  if (isLoading) {
     return <div className="animate-pulse w-24 h-8 bg-gray-200 rounded-none"></div>;
  }

  if (isAuthenticated && profile) {
    return (
      <div className="flex items-center gap-4 border-2 border-[#11110f] bg-white px-2 py-1 shadow-[2px_2px_0_#11110f]">
        <div className="flex items-center gap-2 px-2">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.fullName} className="w-6 h-6 object-cover border border-[#11110f] rounded-full" />
          ) : (
            <div className="w-6 h-6 bg-[#ccff00] border border-[#11110f] rounded-full flex items-center justify-center">
               <User className="w-3 h-3 text-[#11110f]" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-tight text-[#11110f] leading-none mb-0.5">{profile.fullName}</span>
             <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 leading-none">{profile.role}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="border-l-2 border-[#11110f] p-2 hover:bg-rose-50 hover:text-rose-600 transition-colors group"
          title="Log out"
        >
          <LogOut className="w-4 h-4 text-gray-400 group-hover:text-rose-600" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <Link
        to={appPaths.login}
        className="hidden text-sm font-medium text-[#11110f]/70 hover:text-[#11110f] transition-colors md:block"
      >
        Sign In
      </Link>
      <Link
        to={appPaths.login}
        className="bg-[#11110f] text-white px-5 py-2.5 rounded-none font-semibold text-sm hover:bg-[#11110f]/80 transition-colors"
      >
        Get Started
      </Link>
    </div>
  );
};
