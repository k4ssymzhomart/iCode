import {
  ArrowRight,
  GraduationCap,
  LayoutGrid,
  Menu,
  Monitor,
  TerminalSquare,
} from "lucide-react";
import { appPaths, preNavItems, studentNavItems, teacherNavItems } from "@/app/paths";
import fullLogo from "@/assets/full_logo.png";
import { Link, useRoute } from "@/lib/router";
import { useState, useEffect } from "react";

import { AuthSection } from "./AuthSection";

const navIcons = {
  [appPaths.home]: LayoutGrid,
  [appPaths.compiler]: TerminalSquare,
  [appPaths.classroom]: Monitor,
  [appPaths.teacher]: GraduationCap,
};

const Header = () => {
  const [isHidden, setIsHidden] = useState(false);
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

  let activeNavItems = preNavItems;
  if (route.pathname.startsWith('/teacher') || route.pathname.startsWith('/classroom')) {
    activeNavItems = teacherNavItems;
  } else if (route.pathname.startsWith('/smart-compiler') || route.pathname.startsWith('/labs') || route.pathname.startsWith('/profile') || route.pathname.startsWith('/exam')) {
    activeNavItems = studentNavItems;
  }

  if (isHidden) return null;

  return (
    <header className="relative w-full z-50 bg-white/90 backdrop-blur-md border-b border-[rgba(17,17,15,0.05)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1320px] flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <Link to={appPaths.home}>
            <img src={fullLogo} alt="iCode" className="h-8 w-auto object-contain" />
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-8 relative">
          {activeNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <div key={item.href} className="relative group">
                <Link
                  to={item.href}
                  className={`text-sm font-medium transition-colors ${
                    active 
                      ? "text-[#11110f]" 
                      : "text-[#11110f]/60 hover:text-[#11110f]"
                  }`}
                >
                  {item.label}
                </Link>
                {item.href === appPaths.classroom && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 bg-[#11110f] text-white text-xs font-bold p-3 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-[4px_4px_0_#ccff00]">
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#11110f] rotate-45" />
                    💡 Tip: For the best lab experience, press <span className="bg-[#ccff00] text-[#11110f] px-1 ml-1 rounded-sm">F11</span> to go Full Screen.
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
             className="xl:hidden inline-flex items-center text-[#11110f]"
             aria-label="Menu"
           >
             <Menu className="h-6 w-6" />
           </button>
        </div>

      </div>
    </header>
  );
};

export default Header;
