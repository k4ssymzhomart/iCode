import { motion } from "framer-motion";
import React from "react";

const ProblemSection = () => {
  return (
    <section id="problem" className="px-4 py-24 sm:px-6 lg:px-8 bg-[#fdfcf9] border-t border-[rgba(17,17,15,0.05)] relative overflow-hidden">
      <div className="mx-auto max-w-[1320px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-6 border-[2px] border-[#11110f] bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-[#11110f] shadow-[4px_4px_0_#11110f]">
            <span>The Reality</span>
          </div>
          <h2 className="text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.04em] text-[#11110f] sm:text-[3.5rem]">
            Classrooms are bottlenecked.
          </h2>
          <p className="mt-6 text-lg font-['Open_Sans'] text-[#666259]">
            When students get stuck, learning stops. They wait for the teacher to debug their code, wasting valuable classroom time on confusing compiler errors.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-16">
          <motion.div
            initial={{ opacity: 0, x: -50, rotate: -2 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            whileHover={{ scale: 1.02 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
            className="flex flex-col border-2 border-[rgba(17,17,15,0.1)] bg-white p-8 relative shadow-none hover:shadow-xl transition-all"
          >
            <h3 className="text-[#666259] text-lg font-['Open_Sans'] mb-4 font-semibold uppercase tracking-wider text-sm">Students Stuck</h3>
            <div className="text-[4rem] font-bold text-[#11110f] leading-none mb-2">7/10</div>
            <p className="text-[#11110f] font-medium text-xl">students get stuck on syntax errors</p>
            <p className="text-[#666259] font-['Open_Sans'] text-sm mt-4">
              Without immediate feedback, frustration builds up and confidence drops. The modern computer science classroom requires too much manual intervention.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50, rotate: 2 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            whileHover={{ scale: 1.02 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.4, type: "spring" }}
            className="flex flex-col border-[4px] border-[#11110f] bg-white p-8 relative shadow-[12px_12px_0_#ccff00] hover:translate-x-1 hover:-translate-y-1 transition-all"
          >
             <h3 className="text-[#666259] text-lg font-['Open_Sans'] mb-4 font-semibold uppercase tracking-wider text-sm">Time to resolve</h3>
             <div className="flex items-end gap-4 mb-4">
               <div>
                  <div className="text-xl font-bold text-[#666259] line-through decoration-2 decoration-red-500">15-27 min</div>
                  <div className="text-xs font-mono text-[#666259]">Without iCode</div>
               </div>
               <div>
                  <div className="text-[3.5rem] font-bold text-[#11110f] leading-none">6-9 min</div>
                  <div className="text-xs font-mono text-[#11110f] font-bold">With iCode</div>
               </div>
             </div>
             <p className="text-[#11110f] font-['Open_Sans'] text-sm mt-6">
               By turning the compiler into an intelligent mentor, students fix their own code faster, and teachers can focus on teaching concepts instead of debugging syntax.
             </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
