import { motion } from "framer-motion";
import { GraduationCap, Briefcase } from "lucide-react";
import React from "react";

const RoleSplitSection = () => {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8 bg-[#fdfcf9] border-t border-[rgba(17,17,15,0.05)] relative overflow-hidden">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col border-2 border-black bg-white p-10 lg:p-12 shadow-[12px_12px_0_#11110f]"
          >
             <div className="w-16 h-16 bg-black flex items-center justify-center mb-8">
                <Briefcase className="w-8 h-8 text-white" />
             </div>
             <h3 className="text-3xl font-bold text-black mb-4">For Teachers</h3>
             <p className="text-lg font-['Open_Sans'] text-[#666259] leading-relaxed mb-8">
               Manage multiple classes effortlessly. Identify struggling students instantly and intervene exactly when they need you. Don't waste time looking over shoulders; see everyone's editor from one dashboard.
             </p>
             <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm font-bold font-['Open_Sans'] border-l-2 border-[#ccff00] pl-3">No setup needed. Centralized JSON task distribution.</li>
                <li className="flex items-start gap-3 text-sm font-bold font-['Open_Sans'] border-l-2 border-[#ccff00] pl-3">Control runs, restrict AI hints, and keep them focused.</li>
                <li className="flex items-start gap-3 text-sm font-bold font-['Open_Sans'] border-l-2 border-[#ccff00] pl-3">Analytics dashboard to grade and review history.</li>
             </ul>
             <a href="#pricing">
                 <button className="self-start text-sm font-bold uppercase tracking-widest text-black underline underline-offset-4 hover:bg-[#ccff00] px-2 py-1 transition-colors">See Teacher Plans</button>
             </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col border-2 border-[rgba(17,17,15,0.1)] bg-white p-10 lg:p-12 hover:border-[#ccff00] transition-colors"
          >
             <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mb-8">
                <GraduationCap className="w-8 h-8 text-[#11110f]" />
             </div>
             <h3 className="text-3xl font-bold text-black mb-4">For Students</h3>
             <p className="text-lg font-['Open_Sans'] text-[#666259] leading-relaxed mb-8">
               Never get stuck for 20 minutes on a missing colon. Learn faster with an AI mentor that explains your errors in plain English and guides you toward the right logic.
             </p>
             <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm font-['Open_Sans'] border-l-2 border-gray-200 pl-3">Precise line numbers for exactly where things went wrong.</li>
                <li className="flex items-start gap-3 text-sm font-['Open_Sans'] border-l-2 border-gray-200 pl-3">Ask for a hint without spoiling the fun of solving it.</li>
                <li className="flex items-start gap-3 text-sm font-['Open_Sans'] border-l-2 border-gray-200 pl-3">Connect to real classrooms and ask your teacher directly.</li>
             </ul>
             <a href="#pricing">
                 <button className="self-start text-sm font-bold uppercase tracking-widest text-[#666259] underline hover:text-black underline-offset-4 px-2 py-1 transition-colors">Get Student Access</button>
             </a>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default RoleSplitSection;
