import { motion } from "framer-motion";
import { Zap, Users, Code } from "lucide-react";
import React from "react";

const SolutionSection = () => {
  return (
    <section id="solution" className="px-4 py-24 sm:px-6 lg:px-8 bg-white border-t border-[rgba(17,17,15,0.05)] relative z-10 overflow-hidden">
      <div className="mx-auto max-w-[1320px]">
        
        <div className="flex flex-col md:flex-row gap-16 items-center">
            
            <motion.div 
               initial={{ opacity: 0, x: -30 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.6, ease: "easeOut" }}
               className="flex-1 md:pr-12"
            >
               <div className="inline-flex items-center gap-2 mb-8 border-[2px] border-[#11110f] bg-[#ccff00] px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-[#11110f] shadow-[4px_4px_0_#11110f]">
                 <span>The Solution</span>
               </div>
               <h2 className="text-[3rem] font-black leading-[1.05] tracking-tight text-[#11110f] sm:text-[4rem] mb-8 uppercase">
                 An ecosystem built for <br/><span className="text-[#ccff00] bg-black px-4 py-1 leading-[1.3] inline-block mt-2 transform -rotate-1">learning.</span>
               </h2>
               <p className="text-xl font-['Open_Sans'] text-black/80 font-medium leading-relaxed mb-12 border-l-4 border-[#ccff00] pl-6 py-2">
                 iCode replaces confusing error logs with a comprehensive suite of tools designed exclusively for computer science education.
               </p>
               
               <div className="space-y-8">
                  <div className="flex items-start gap-4">
                     <div className="flex-shrink-0 w-12 h-12 bg-gray-50 border border-[rgba(17,17,15,0.1)] flex items-center justify-center">
                        <Code className="w-5 h-5 text-black" />
                     </div>
                     <div>
                        <h4 className="text-xl font-bold text-black mb-2">Smart Compiler as a Mentor</h4>
                        <p className="text-[#666259] font-['Open_Sans'] text-sm leading-relaxed">
                           Instead of generic syntax errors, the iCode compiler explains exactly what went wrong and hints at how to fix it, teaching students to think like engineers.
                        </p>
                     </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                     <div className="flex-shrink-0 w-12 h-12 bg-[#ccff00] border border-[rgba(17,17,15,0.1)] flex items-center justify-center">
                        <Users className="w-5 h-5 text-black" />
                     </div>
                     <div>
                        <h4 className="text-xl font-bold text-black mb-2">Classroom Mode</h4>
                        <p className="text-[#666259] font-['Open_Sans'] text-sm leading-relaxed">
                           A unified session where teachers manage tasks, set strict sandbox limits, and oversee entire classes in one seamless environment.
                        </p>
                     </div>
                  </div>

                  <div className="flex items-start gap-4">
                     <div className="flex-shrink-0 w-12 h-12 bg-gray-50 border border-[rgba(17,17,15,0.1)] flex items-center justify-center">
                        <Zap className="w-5 h-5 text-black" />
                     </div>
                     <div>
                        <h4 className="text-xl font-bold text-black mb-2">Real-time Teacher Support</h4>
                        <p className="text-[#666259] font-['Open_Sans'] text-sm leading-relaxed">
                           Teachers have x-ray vision into every student's code. Jump into a student's editor in real time to leave comments, draw boxes, or apply direct fixes.
                        </p>
                     </div>
                  </div>
               </div>
            </motion.div>
            
            <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.6, delay: 0.2 }}
               className="flex-1 w-full relative"
            >
               {/* Abstract representation of the solution layout */}
               <div className="w-full aspect-square md:aspect-[4/3] bg-[#f6f4ef] border border-[rgba(17,17,15,0.1)] shadow-2xl relative p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-[rgba(17,17,15,0.1)] pb-4">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full border border-black bg-white"></div>
                        <div className="w-3 h-3 rounded-full border border-black bg-white"></div>
                        <div className="w-3 h-3 rounded-full border border-black bg-white"></div>
                     </div>
                     <div className="font-mono text-xs font-bold text-gray-400">CLASSROOM DASHBOARD</div>
                  </div>
                  
                  <div className="flex-1 mt-4 flex gap-4 h-full">
                     {/* Left Sidebar Skeleton */}
                     <div className="w-1/3 flex flex-col gap-3">
                        <div className="h-8 w-full bg-white border border-[rgba(17,17,15,0.1)] shadow-sm"></div>
                        <div className="h-8 w-full bg-[#ccff00] border border-black shadow-[2px_2px_0_#000]"></div>
                        <div className="h-8 w-full bg-white border border-[rgba(17,17,15,0.1)] shadow-sm"></div>
                        <div className="h-8 w-full bg-white border border-[rgba(17,17,15,0.1)] shadow-sm"></div>
                     </div>
                     
                     {/* Main Editor Skeleton */}
                     <div className="w-2/3 h-full bg-black flex flex-col p-4 shadow-lg">
                        <div className="h-4 w-1/2 bg-gray-800 mb-2"></div>
                        <div className="h-4 w-3/4 bg-gray-800 mb-2"></div>
                        <div className="h-4 w-1/4 bg-gray-800 mb-6"></div>
                        
                        <div className="mt-auto h-1/3 w-full bg-[#ccff00] bg-opacity-20 border-l-4 border-[#ccff00] p-3">
                           <div className="w-1/3 h-3 bg-[#ccff00] mb-2 opacity-80"></div>
                           <div className="w-2/3 h-2 bg-white opacity-60 mb-2"></div>
                           <div className="w-1/2 h-2 bg-white opacity-60"></div>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>

        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
