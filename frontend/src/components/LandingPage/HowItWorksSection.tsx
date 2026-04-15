import { motion } from "framer-motion";
import React from "react";

const steps = [
  {
    num: "01",
    title: "Teacher creates session",
    desc: "Launch a secure classroom link and set the task or JSON task sets."
  },
  {
    num: "02",
    title: "Students join by code",
    desc: "Students enter the 6-digit classroom code without complex onboarding."
  },
  {
    num: "03",
    title: "Students code",
    desc: "Students write code with the Smart Compiler mentoring them through pure syntax errors."
  },
  {
    num: "04",
    title: "Teacher helps in real time",
    desc: "Monitor progress, view active errors, and intervene directly when a student is stuck."
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="px-4 py-24 sm:px-6 lg:px-8 bg-black text-white relative border-t border-[rgba(255,255,255,0.05)] text-center">
      <div className="mx-auto max-w-[1320px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-20"
        >
          <h2 className="text-[3rem] font-black leading-[1.1] tracking-tighter text-white sm:text-[4.5rem] uppercase">
            How it works
          </h2>
          <p className="mt-6 text-xl text-gray-300 font-['Open_Sans'] max-w-2xl mx-auto font-medium">
            A frictionless workflow designed to maximize actual coding time.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8 md:gap-4 relative max-w-6xl mx-auto">
           {/* Connecting line for desktop */}
           <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gray-800 z-0"></div>
           
           {steps.map((step, idx) => (
             <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.1 * idx }}
                className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left group"
             >
                <div className="w-24 h-24 bg-[#ccff00] border-[4px] border-[#11110f] rounded-none flex items-center justify-center text-[2.5rem] font-black text-[#11110f] mb-6 shadow-[8px_8px_0_#11110f] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform relative z-10">
                   {step.num}
                </div>
                <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter text-white bg-black px-2 py-1 inline-block border-2 border-transparent group-hover:border-[#ccff00] transition-colors">{step.title}</h3>
                <p className="text-base font-['Open_Sans'] text-gray-400 leading-relaxed max-w-[250px] font-medium mt-2 border-l-4 border-[#11110f] pl-4 group-hover:border-[#ccff00] transition-colors">
                   {step.desc}
                </p>
             </motion.div>
           ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
