import { appPaths } from "@/app/paths";
import { Link } from "@/lib/router";
import { motion } from "framer-motion";

const NotFoundPage = () => (
  <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 bg-white relative overflow-hidden">
    {/* Grid Background Effect */}
    <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center">
      <div 
        className="w-full h-full" 
        style={{ backgroundImage: 'linear-gradient(#11110f 1px, transparent 1px), linear-gradient(90deg, #11110f 1px, transparent 1px)', backgroundSize: '4rem 4rem' }}
      ></div>
    </div>

    <div className="relative z-10 max-w-2xl w-full text-center flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
         <span className="inline-block border-2 border-[#11110f] bg-[#ccff00] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#11110f] rounded-none mb-8 shadow-[4px_4px_0px_0px_rgba(17,17,15,1)]">
           404 • Not Ready
         </span>
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        className="text-[3.5rem] font-semibold leading-[1.05] tracking-[-0.05em] text-[#11110f] sm:text-[5rem]"
      >
        Feature not <br className="hidden sm:block" />
        quite ready yet.
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="mt-6 max-w-[500px] font-['Open_Sans'] text-lg leading-7 text-[#666259]"
      >
        We are building something awesome here, but it is taking a bit longer than expected. Check back soon.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 15 }}
        className="mt-12"
      >
        <Link
          to={appPaths.home}
          className="inline-block rounded-none px-10 py-4 xl:px-12 bg-[#ccff00] text-[#11110f] font-semibold text-lg hover:brightness-[1.05] shadow-[0_4px_14px_rgba(204,255,0,0.39)] transition-all"
        >
          Return Home
        </Link>
      </motion.div>
    </div>
  </section>
);

export default NotFoundPage;
