import React, { useState, useEffect, useRef } from "react";
import { Monitor, Server, Settings, PieChart, Users, FolderUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "@/lib/router";
import { appPaths } from "@/app/paths";
import fullLogoWhite from "@/assets/full_logo_white.png";
import iconLogoWhite from "@/assets/icon_logo_white.png";

interface TeacherSidebarProps {
  isCollapsed?: boolean;
  activeView: string;
  onToggle: () => void;
}

const TeacherSidebar: React.FC<TeacherSidebarProps> = ({ isCollapsed = false, activeView, onToggle }) => {
  const navigate = useNavigate();
  
  const [glitching, setGlitching] = useState(false);
  const [displayCollapsed, setDisplayCollapsed] = useState(isCollapsed);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
       isFirstRender.current = false;
       return;
    }
    
    setGlitching(true);
    
    // Quick noise burst frame then swap
    const mid = setTimeout(() => {
       setDisplayCollapsed(isCollapsed);
       setPixelSeed(Math.random());
    }, 40);

    // End animation
    const end = setTimeout(() => {
       setGlitching(false);
    }, 100);

    return () => { clearTimeout(mid); clearTimeout(end); };
  }, [isCollapsed]);

  const pixels = Array.from({length: 256});
  const [pixelSeed, setPixelSeed] = useState(0);

  const items = [
    { id: "lab", label: "Active Lab", icon: Monitor, path: appPaths.teacher },
    { id: "analytics", label: "Analytics", icon: PieChart, path: appPaths.teacherAnalytics },
    { id: "materials", label: "Materials", icon: FolderUp, path: appPaths.teacherMaterials },
    { id: "sessions", label: "Past Sessions", icon: Server, path: appPaths.teacherSessions },
    { id: "students", label: "Students", icon: Users, path: appPaths.teacherStudents },
    { id: "settings", label: "Settings", icon: Settings, path: appPaths.teacherSettings },
  ];

  return (
    <div className={`flex flex-col bg-[#11110f] border-r-2 border-[#11110f] transition-all duration-300 relative ${isCollapsed ? 'w-16' : 'w-64'}`}>
      
      <div className="h-16 flex items-center justify-center border-b-2 border-gray-800 bg-[#11110f] shrink-0 px-4 relative overflow-hidden">
         
         {!glitching && (
            <img 
              src={displayCollapsed ? iconLogoWhite : fullLogoWhite} 
              alt="iCode" 
              className={`z-10 ${displayCollapsed ? 'w-8 h-8' : 'h-9 w-auto'} object-contain hover:opacity-80`} 
            />
         )}

         {glitching && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
               <div className="relative w-8 h-8 flex flex-wrap content-start">
                 {pixels.map((_, i) => {
                    // Use a seeded pseudo-random so it looks like digital noise
                    const isVisible = (Math.sin(pixelSeed * 1000 + i * 10) * 1000) % 1 > 0.5;
                    return (
                      <div 
                        key={i} 
                        className="bg-white"
                        style={{
                           width: "2px",
                           height: "2px",
                           visibility: isVisible ? 'visible' : 'hidden'
                        }}
                      />
                    )
                 })}
               </div>
            </div>
         )}
      </div>

      <nav className="flex-1 overflow-y-auto flex flex-col w-full border-t-2 border-transparent">
        {items.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex items-center w-full px-6 py-4 outline-none transition-colors border-b-2 border-gray-800 ${
                isActive 
                  ? "bg-[#ccff00] text-[#11110f] font-black" 
                  : "bg-[#11110f] text-gray-400 hover:bg-white hover:text-[#11110f] font-bold"
              } ${isCollapsed ? 'justify-center px-0' : 'justify-start'}`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
              {!isCollapsed && (
                <span className="ml-4 uppercase tracking-widest text-xs whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="mt-auto border-t-2 border-gray-800">
         <button 
           onClick={onToggle} 
           className="w-full flex items-center justify-center p-4 bg-[#11110f] hover:bg-[#ccff00] hover:text-[#11110f] text-gray-400 transition-colors group outline-none"
         >
           {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
         </button>
      </div>
      
    </div>
  );
};

export default TeacherSidebar;
