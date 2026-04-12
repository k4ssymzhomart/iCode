import { motion } from "framer-motion";
import iconLogo from "@/assets/icon_logo.png";

const BottomCTA = () => {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8 bg-white mb-8">
      <div className="mx-auto max-w-[1320px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-[#ccff00] rounded-none px-4 py-20 flex flex-col items-center text-center relative overflow-hidden shadow-none border-2 border-transparent"
        >
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
             <img src={iconLogo} alt="iCode Icon" className="w-full h-full object-contain" />
          </div>

          <h2 className="max-w-2xl text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.04em] text-[#11110f] sm:text-[3rem] lg:text-[4rem]">
            Stop guessing. Start understanding.
          </h2>
          
          <p className="mt-6 max-w-xl text-lg font-['Open_Sans'] text-[#11110f]/80">
            iCode helps students learn faster and teachers teach smarter.
          </p>

          <div className="mt-10 relative">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-none px-8 py-4 bg-black text-white font-semibold text-lg hover:brightness-110 transition-all shadow-none"
            >
              Get iCode
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BottomCTA;
