import {
  GraduationCap,
  LayoutGrid,
  Menu,
  Monitor,
  TerminalSquare,
  X,
} from "lucide-react";
import { appPaths, preNavItems, studentNavItems, teacherNavItems } from "@/app/paths";
import fullLogo from "@/assets/full_logo.png";
import { Link, useRoute } from "@/lib/router";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

import { AuthSection } from "./AuthSection";

const navIcons = {
  [appPaths.home]: LayoutGrid,
  [appPaths.compiler]: TerminalSquare,
  [appPaths.classroom]: Monitor,
  [appPaths.teacher]: GraduationCap,
};

const Header = () => {
  const [isHidden, setIsHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const route = useRoute();

  useEffect(() => {
    const handleToggleHeader = (e: any) => {
      setIsHidden(e.detail);
    };
    window.addEventListener('toggle-header', handleToggleHeader);
    return () => window.removeEventListener('toggle-header', handleToggleHeader);
  }, []);

  const isActive = (href: string) =>
    route.pathname === href ||
    (href === appPaths.teacher && route.name === "teacher-session");

  const { role } = useAuth();

  let activeNavItems: Array<{ label: string; href: string }> = preNavItems;
  if (role === "teacher") {
    activeNavItems = teacherNavItems;
  } else if (role === "student") {
    activeNavItems = studentNavItems;
  }

  if (isHidden) return null;

  return (
    <header className="relative w-full z-50 bg-white border-b-[3px] border-[#11110f] px-4 py-3 sm:px-6 lg:px-8 shadow-[0_4px_0_rgba(17,17,15,0.1)]">
      <div className="mx-auto max-w-[1320px] flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <Link to={appPaths.home}>
            <img src={fullLogo} alt="iCode" className="h-8 w-auto object-contain" />
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-4 relative">
          {activeNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <div key={item.href} className="relative group">
                <Link
                  to={item.href}
                  className={cn(
                    "relative inline-flex items-center justify-center px-5 py-2 text-sm font-bold uppercase tracking-wider transition-all",
                    active 
                      ? "bg-[#ccff00] text-[#11110f] border-[3px] border-[#11110f] shadow-[4px_4px_0_#11110f] -translate-y-0.5" 
                      : "bg-white text-[#11110f] border-[3px] border-transparent hover:border-[#11110f] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#11110f]"
                  )}
                >
                  {item.label}
                </Link>
                {item.href === appPaths.classroom && (
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 w-56 bg-[#11110f] text-white text-xs font-bold p-3 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-[4px_4px_0_#ccff00] border-2 border-[#11110f]">
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#11110f] border-t-2 border-l-2 border-[#11110f] rotate-45" />
                    💡 Tip: For the best lab experience, press <span className="bg-[#ccff00] text-[#11110f] px-1.5 py-0.5 ml-1 border border-[#11110f] shadow-[2px_2px_0_white]">F11</span> to go Full Screen.
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-6">
           <AuthSection />
           <button
             type="button"
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             className="xl:hidden inline-flex items-center text-[#11110f] transition-transform hover:scale-110 active:scale-95"
             aria-label="Menu"
           >
             {isMobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
           </button>
        </div>

      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-[100%] left-0 w-full bg-[#fafafa] border-b-[3px] border-[#11110f] xl:hidden flex flex-col p-4 gap-3 z-40 shadow-[0_4px_0_rgba(17,17,15,0.1)] animate-in slide-in-from-top-2">
          {activeNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "block w-full text-center px-4 py-3 text-base font-black uppercase tracking-wider transition-all",
                  active 
                    ? "bg-[#ccff00] text-[#11110f] border-2 border-[#11110f] shadow-[4px_4px_0_#11110f]" 
                    : "bg-white text-[#11110f] border-2 border-[#11110f] hover:bg-gray-50 shadow-[2px_2px_0_#11110f] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#11110f]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default Header;
