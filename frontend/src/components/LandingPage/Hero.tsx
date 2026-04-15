import { motion } from "framer-motion";
import React from "react";
import { Link } from "@/lib/router";
import { appPaths } from "@/app/paths";
import iconLogo from "@/assets/icon_logo.png";

const MITLogo = () => (
  <svg viewBox="0 0 100 50" className="h-10 w-auto fill-current">
    <path d="M10,10 h15 v30 h-15 z M30,10 h15 v10 h-15 z M30,25 h15 v15 h-15 z M50,10 h15 v30 h-15 z M70,10 h20 v10 h-20 z M70,25 h20 v15 h-20 z" fill="black" />
  </svg>
);

const StanfordLogo = () => (
  <span className="font-serif font-bold text-3xl tracking-tighter uppercase ml-4 text-black">Stanford</span>
);

const HarvardLogo = () => (
  <span className="font-serif font-black text-3xl tracking-widest uppercase ml-4 text-black">HARVARD</span>
);

const OxfordLogo = () => (
  <span className="font-serif font-medium text-3xl uppercase ml-4 text-black border-t-2 border-b-2 border-black py-1">OXFORD</span>
);

const CambridgeLogo = () => (
  <span className="font-serif italic font-bold text-3xl ml-4 text-black">Cambridge</span>
);

const PrincetonLogo = () => (
  <span className="font-serif bg-black text-white px-3 py-1 font-bold text-2xl tracking-widest uppercase ml-4">PRINCETON</span>
);

const logos = [MITLogo, StanfordLogo, HarvardLogo, OxfordLogo, CambridgeLogo, PrincetonLogo];

const Hero = () => {
  return (
    <section id="hero" className="px-4 pb-24 pt-16 sm:px-6 lg:px-8 bg-white min-h-[90vh] flex flex-col justify-center relative z-0 border-b border-[rgba(17,17,15,0.05)]">
      
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
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 15 }}
          className="mt-10 mb-8 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link to={appPaths.login}>
            <button className="rounded-none px-10 py-5 xl:px-12 xl:py-4 bg-[#ccff00] text-black font-semibold text-lg hover:brightness-[1.05] shadow-[0_4px_14px_rgba(204,255,0,0.39)] transition-all active:scale-95">
              Get Started
            </button>
          </Link>
          <a href="#pricing">
            <button className="rounded-none px-10 py-5 xl:px-12 xl:py-4 bg-white text-black font-semibold text-lg border-2 border-black shadow-[4px_4px_0_#11110f] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_#11110f] transition-all active:scale-95">
              For Teachers
            </button>
          </a>
        </motion.div>

        <div className="mt-20 w-full overflow-hidden relative py-8 before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-[100px] before:bg-gradient-to-r before:from-white before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-[100px] after:bg-gradient-to-l after:from-white after:to-transparent">
            <motion.div 
               animate={{ x: [0, -1000] }}
               transition={{ ease: "linear", duration: 15, repeat: Infinity }}
               className="flex gap-24 items-center w-max opacity-40 grayscale hover:grayscale-0 transition-all duration-700 hover:opacity-100"
            >
               {[...logos, ...logos, ...logos].map((Logo, i) => (
                  <div key={i} className="flex items-center justify-center min-w-[200px] opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                    <Logo />
                  </div>
               ))}
            </motion.div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
