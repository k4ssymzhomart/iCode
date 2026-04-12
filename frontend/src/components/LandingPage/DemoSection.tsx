import { motion } from "framer-motion";
import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";

const DemoSection = () => {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8 bg-white border-t border-[rgba(17,17,15,0.05)]">
      <div className="mx-auto max-w-[1320px] text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className="text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.04em] text-[#11110f] sm:text-[3.5rem] lg:text-[4.5rem]">
            Start coding in seconds.
          </h2>
          <p className="mt-6 text-lg font-['Open_Sans'] text-[#666259]">
            Open the editor, run your code, understand the error — no setup required.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-16 relative mx-auto max-w-5xl"
        >
          <HeroVideoDialog
            animationStyle="from-center"
            videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
            thumbnailSrc="https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=3540&auto=format&fit=crop"
            thumbnailAlt="Demo Video"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default DemoSection;
