import { motion } from "framer-motion";

const DemoSection = () => {
  return (
    <section id="demo" className="px-4 py-24 sm:px-6 lg:px-8 bg-[#fdfcf9] border-t border-[rgba(17,17,15,0.05)] overflow-hidden">
      <div className="mx-auto max-w-[1320px] text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 mb-6 border-[2px] border-[#11110f] bg-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-[#ccff00] shadow-[4px_4px_0_#ccff00]">
            <span>See it in action</span>
          </div>
          <h2 className="text-[2.5rem] font-black leading-[1.1] tracking-tighter text-[#11110f] sm:text-[3.5rem] lg:text-[4.5rem] uppercase">
            Start coding in seconds.
          </h2>
          <p className="mt-6 text-xl font-['Open_Sans'] text-black/60 font-medium max-w-2xl mx-auto">
            Open the editor, run your code, understand the error — no setup required.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-16 relative mx-auto max-w-5xl border-[4px] border-black bg-white p-2 shadow-[16px_16px_0_#ccff00] hover:shadow-[8px_8px_0_#ccff00] hover:translate-x-2 hover:translate-y-2 transition-all duration-300"
        >
          <div className="border-2 border-[rgba(17,17,15,0.1)] relative w-full aspect-video bg-black flex items-center justify-center">
            <iframe
              className="w-full h-full object-cover pointer-events-none"
              src="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb&autoplay=1&mute=1&loop=1&playlist=qh3NGpYRG3I&controls=0&showinfo=0&rel=0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DemoSection;
