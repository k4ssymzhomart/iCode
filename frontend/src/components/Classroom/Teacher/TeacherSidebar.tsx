import React from "react";
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
        <img 
          src={isCollapsed ? iconLogoWhite : fullLogoWhite} 
          alt="iCode" 
          className={`z-10 ${isCollapsed ? 'w-8 h-8' : 'h-9 w-auto'} object-contain hover:opacity-80`} 
        />
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
