import { motion } from "framer-motion";
import React from "react";
import iconLogo from "@/assets/icon_logo.png";

const topFeatures = [
  {
    icon: "⚔️",
    title: "Built for real classrooms",
    description: "Designed for students and teachers where time and attention are limited"
  },
  {
    icon: "🧱",
    title: "Learn by understanding",
    description: "No copy-paste solutions — students fix and understand their own code"
  },
  {
    icon: "⚡",
    title: "Instant error clarity",
    description: "Short, precise explanations with line numbers and actionable fixes"
  },
  {
    icon: "😎",
    title: "Teacher in the loop",
    description: "Classroom Mode shows who is stuck and who needs help in real time"
  }
];

const Hero = () => {
  return (
    <section className="px-4 pb-24 pt-16 sm:px-6 lg:px-8 bg-white min-h-[90vh] flex flex-col justify-center relative z-0 border-b border-[rgba(17,17,15,0.05)]">
      
      <div className="mx-auto max-w-[1320px] w-full text-center relative z-10 flex flex-col items-center">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mb-2"
        >
          <div className="w-32 h-32 mx-auto mb-0 flex items-center justify-center">
             <img src={iconLogo} alt="iCode Icon" className="w-full h-full object-contain" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="max-w-3xl text-[3rem] font-semibold leading-[1.05] tracking-[-0.05em] text-[#11110f] sm:text-[4rem] lg:text-[4.75rem]"
        >
          Learn coding<br/>without getting stuck.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-6 max-w-[550px] font-['Open_Sans'] text-lg leading-7 text-[#666259]"
        >
          Stop wasting time on confusing errors.<br/>iCode is an AI-powered smart compiler that helps students understand and fix mistakes instantly.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 15 }}
          className="mt-10 mb-8"
        >
          <button className="rounded-none px-10 py-5 xl:px-12 xl:py-4 bg-[#ccff00] text-black font-semibold text-lg hover:brightness-[1.05] shadow-[0_4px_14px_rgba(204,255,0,0.39)] transition-all">
            Get iCode
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="mt-20 w-full max-w-6xl relative"
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-left relative z-10 w-full">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute -top-24 left-1/2 lg:left-[60%] hidden lg:flex text-gray-500 font-['Caveat',cursive] text-lg transform -rotate-6 flex-col items-start translate-x-[20px]"
            >
              <span className="translate-y-2">Try it now</span>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-1 -translate-x-[20px] translate-y-3 scale-y-[-1] opacity-50">
                <path d="M5 12C5 12 11 4 19 4M19 4L15 8M19 4L14 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>

            {topFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                whileHover={{ y: -5 }}
                className="rounded-none border border-[rgba(17,17,15,0.08)] bg-white p-6 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-default w-full"
              >
                <div className="mb-4 text-2xl">{feature.icon}</div>
                <div className="font-semibold text-sm text-[#11110f] mb-2">{feature.title}</div>
                <div className="text-[#666259] text-xs font-['Open_Sans'] leading-relaxed">
                  {feature.description}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Logos carousel placeholder */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-20 flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700 w-full overflow-hidden"
        >
            <div className="font-serif text-xl font-bold tracking-widest text-slate-800">FEELIST</div>
            <div className="font-sans text-xl tracking-[0.3em] uppercase text-slate-800">NIS</div>
            <div className="font-sans text-xl font-bold uppercase text-slate-800">RFMSH</div>
            <div className="font-sans text-sm font-bold uppercase leading-tight text-slate-800 border-2 border-slate-800 px-2 py-0.5">Coding<br/>Clubs</div>
            <div className="font-sans text-xs font-bold uppercase leading-tight text-left text-slate-800 border-l-[3px] border-slate-800 pl-2">Ed<br/>Centers</div>
            <div className="font-serif text-xl tracking-tighter italic font-light text-slate-800">Students</div>
            <div className="font-sans text-xl font-semibold text-slate-800">Teachers</div>
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
