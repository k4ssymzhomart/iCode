import { motion } from "framer-motion";
import iconLogo from "@/assets/icon_logo.png";
import { Link } from "@/lib/router";
import { appPaths } from "@/app/paths";

const BottomCTA = () => {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8 bg-white mb-8">
      <div className="mx-auto max-w-[1320px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-black rounded-none px-4 py-24 flex flex-col items-center text-center relative overflow-hidden shadow-[16px_16px_0_#ccff00] border-[4px] border-[#ccff00]"
        >
          <div className="w-20 h-20 mx-auto mb-8 flex items-center justify-center bg-[#ccff00]">
             <img src={iconLogo} alt="iCode Icon" className="w-[70%] h-[70%] object-contain filter invert" style={{ filter: 'brightness(0)' }} />
          </div>

          <h2 className="max-w-3xl text-[2.5rem] font-black leading-[1.1] tracking-[-0.04em] text-white sm:text-[3.5rem] lg:text-[4.5rem] uppercase">
            Stop guessing.<br/>Start <span className="text-[#ccff00]">understanding.</span>
          </h2>
          
          <p className="mt-8 max-w-xl text-lg font-['Open_Sans'] text-gray-300 font-medium">
            iCode helps students learn faster and teachers teach smarter. Join the next generation of computer science classrooms.
          </p>

          <div className="mt-12 relative flex gap-6 z-10">
            <Link to={appPaths.login}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-none px-10 py-5 bg-[#ccff00] text-black font-black text-xl hover:bg-white transition-colors border-[3px] border-transparent uppercase tracking-widest shadow-[6px_6px_0_white] hover:shadow-none translate-y-[-6px] hover:translate-y-0 translate-x-[-6px] hover:translate-x-0"
              >
                Start For Free
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BottomCTA;
