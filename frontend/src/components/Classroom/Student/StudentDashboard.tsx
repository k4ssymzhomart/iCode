import React from "react";
import { Link } from "@/lib/router";
import { appPaths } from "@/app/paths";
import { Play, Code2, Monitor, GraduationCap } from "lucide-react";

const StudentDashboard = () => {
  return (
    <div className="flex-1 bg-[#f6f4ef] font-sans selection:bg-[#ccff00] selection:text-black min-h-screen flex flex-col">
       <div className="max-w-[1000px] w-full mx-auto px-6 py-12 flex-1 flex flex-col">
          <div className="flex items-center gap-4 mb-12">
             <div className="w-16 h-16 bg-[#ccff00] border-4 border-[#11110f] shadow-[4px_4px_0_#11110f] flex items-center justify-center">
                <Code2 className="w-8 h-8 text-[#11110f]" />
             </div>
             <div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-[#11110f]">Student Portal</h1>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Access Labs & Compilers</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Join Lab Card */}
             <div className="bg-white border-2 border-[#11110f] shadow-[6px_6px_0_#11110f] p-8 flex flex-col items-start transition-transform hover:-translate-y-1 hover:shadow-[8px_8px_0_#ccff00]">
                <div className="w-12 h-12 bg-[#11110f] flex items-center justify-center mb-6">
                   <Monitor className="w-6 h-6 text-[#ccff00]" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-widest text-[#11110f] mb-3">Classroom Mode</h2>
                <p className="text-sm font-medium text-gray-600 mb-8 w-full">
                   Join a live instructor-led session. Enter your join code to sync to the real-time virtual lab environment.
                </p>
                <div className="mt-auto hidden sm:block w-full"></div>
                <Link to={appPaths.classroom} className="bg-[#ccff00] border-2 border-[#11110f] text-[#11110f] font-black uppercase tracking-widest px-6 py-3 shadow-[2px_2px_0_#11110f] hover:bg-[#bdf300] hover:-translate-y-0.5 transition-all text-sm w-full text-center">
                   Enter Join Code
                </Link>
             </div>

             {/* Smart Compiler Card */}
             <div className="bg-white border-2 border-[#11110f] shadow-[6px_6px_0_#11110f] p-8 flex flex-col items-start transition-transform hover:-translate-y-1 hover:shadow-[8px_8px_0_#11110f]">
                <div className="w-12 h-12 border-2 border-[#11110f] flex items-center justify-center mb-6">
                   <Play className="w-6 h-6 text-[#11110f] fill-[#11110f]" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-widest text-[#11110f] mb-3">Smart Compiler</h2>
                <p className="text-sm font-medium text-gray-600 mb-8 w-full">
                   Practice independently. Write code, run tests, and use AI features to explain errors and improve your logic.
                </p>
                <div className="mt-auto hidden sm:block w-full"></div>
                <Link to={appPaths.compiler} className="bg-white border-2 border-[#11110f] text-[#11110f] font-black uppercase tracking-widest px-6 py-3 shadow-[2px_2px_0_#11110f] hover:bg-gray-50 hover:-translate-y-0.5 transition-all text-sm w-full text-center">
                   Open Sandbox
                </Link>
             </div>

             {/* Secure Exam Card */}
             <div className="bg-white border-2 border-[#11110f] shadow-[6px_6px_0_#11110f] p-8 flex flex-col items-start transition-transform hover:-translate-y-1 hover:shadow-[8px_8px_0_#11110f]">
                <div className="w-12 h-12 border-2 border-[#11110f] flex items-center justify-center mb-6 opacity-60">
                   <Code2 className="w-6 h-6 text-[#11110f]" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-widest text-[#11110f] mb-3 opacity-60">Secure Exam</h2>
                <p className="text-sm font-medium text-gray-600 mb-8 w-full opacity-60">
                   Take your proctored exams securely with browser execution isolation and behavior tracking.
                </p>
                <div className="mt-auto hidden sm:block w-full"></div>
                <button className="bg-gray-100 border-2 border-gray-300 text-gray-400 font-black uppercase tracking-widest px-6 py-3 cursor-not-allowed transition-all text-sm w-full text-center">
                   Coming Soon
                </button>
             </div>

             {/* Profile Dashboard Card */}
             <div className="bg-white border-2 border-[#11110f] shadow-[6px_6px_0_#11110f] p-8 flex flex-col items-start transition-transform hover:-translate-y-1 hover:shadow-[8px_8px_0_#11110f]">
                <div className="w-12 h-12 border-2 border-[#11110f] flex items-center justify-center mb-6">
                   <GraduationCap className="w-6 h-6 text-[#11110f]" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-widest text-[#11110f] mb-3">My Profile & Stats</h2>
                <p className="text-sm font-medium text-gray-600 mb-8 w-full">
                   View your performance analytics, recent lab activity, leaderboard ranking, and compiler usage.
                </p>
                <div className="mt-auto hidden sm:block w-full"></div>
                <button className="bg-white border-2 border-[#11110f] text-[#11110f] font-black uppercase tracking-widest px-6 py-3 shadow-[2px_2px_0_#11110f] hover:bg-gray-50 hover:-translate-y-0.5 transition-all text-sm w-full text-center">
                   View Profile
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default StudentDashboard;
