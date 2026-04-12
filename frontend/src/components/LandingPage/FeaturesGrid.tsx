import { motion } from "framer-motion";
import { Zap, Brain, Lightbulb, CheckCircle, Users, History, Globe } from "lucide-react";
import React from "react";

const features = [
  {
    icon: <Zap className="w-6 h-6 text-black" />,
    title: "Smart Compiler",
    description: "Clear error messages with line numbers and fix suggestions"
  },
  {
    icon: <Brain className="w-6 h-6 text-black" />,
    title: "AI Explain",
    description: "Simple explanations for syntax and logic errors"
  },
  {
    icon: <Lightbulb className="w-6 h-6 text-black" />,
    title: "Hint System",
    description: "Guidance without revealing full solutions"
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-black" />,
    title: "Correct Mode",
    description: "Auto-fix with inline comments explaining changes"
  },
  {
    icon: <Users className="w-6 h-6 text-black" />,
    title: "Classroom Mode",
    description: "Real-time dashboard of student progress and struggles"
  },
  {
    icon: <History className="w-6 h-6 text-black" />,
    title: "Session History",
    description: "Track attempts and learning progression"
  },
  {
    icon: <Globe className="w-6 h-6 text-black" />,
    title: "Multi-language support",
    description: "Python and expanding to other OOP languages"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 15 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 20 }
  }
};

const FeaturesGrid = () => {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8 bg-white border-t border-[rgba(17,17,15,0.05)] relative z-10">
      <div className="mx-auto max-w-[1320px]">
        <div className="text-center md:max-w-3xl md:mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.04em] text-[#11110f] sm:text-[3.5rem] lg:text-[4rem]"
          >
            Save <span className="bg-[#ccff00]">hours of</span><br/>
            <span className="bg-[#ccff00]">learning friction.</span>
          </motion.h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ scale: 1.03, y: -5 }}
              className="rounded-none border border-[rgba(17,17,15,0.08)] bg-white p-6 shadow-none hover:shadow-xl transition-all flex flex-col items-start text-left group cursor-pointer"
            >
               <span className="mb-4 p-3 bg-gray-50 rounded-none group-hover:bg-green-50 transition-colors duration-300">{feature.icon}</span>
               <h3 className="text-lg font-semibold text-[#11110f] group-hover:text-black transition-colors">{feature.title}</h3>
               <p className="mt-2 text-sm text-[#666259] leading-relaxed font-['Open_Sans'] text-left">
                 {feature.description}
               </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
