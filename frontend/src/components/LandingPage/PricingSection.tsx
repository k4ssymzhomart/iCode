import { motion } from "framer-motion";
import { Check } from "lucide-react";

const PricingSection = () => {
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8 bg-white border-t border-[rgba(17,17,15,0.05)] pb-32">
      <div className="mx-auto max-w-[1320px] text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="md:max-w-2xl mx-auto"
        >
          <h2 className="text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.04em] text-[#11110f] sm:text-[3.5rem] lg:text-[4rem]">
            Buy once, use continuously.
          </h2>
          <p className="mt-6 text-lg font-['Open_Sans'] text-[#666259]">
            iCode is built for students, teachers, and schools. Simple pricing, immediate value.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-16 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto text-left"
        >
          {/* Student Card */}
          <div className="rounded-none border-2 border-[rgba(17,17,15,0.1)] bg-white p-8 flex flex-col hover:-translate-y-1 transition-transform">
            <h3 className="text-xl font-semibold mb-2">Student</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-[2.5rem] font-bold tracking-tight text-black">$3</span>
              <span className="text-sm font-medium text-gray-500">/month</span>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {[
                "Access to smart compiler",
                "Run + Explain + Hint",
                "Correct with explanations",
                "Session history",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-['Open_Sans'] text-gray-700">
                  <Check className="h-4 w-4 shrink-0 text-black" />
                  {item}
                </li>
              ))}
            </ul>
            <button className="w-full py-4 px-6 rounded-none border-2 border-[rgba(17,17,15,0.1)] text-black font-semibold bg-white hover:bg-gray-50 transition-colors">
              Get iCode
            </button>
            <p className="mt-4 text-xs font-mono text-center text-gray-400">No long-term commitment</p>
          </div>

          {/* Classroom Card */}
          <div className="relative rounded-none border-2 border-[#ccff00] bg-white p-8 flex flex-col shadow-none hover:-translate-y-1 transition-transform">
            <div className="absolute -top-12 -right-8 text-gray-400 font-['Caveat',cursive] text-lg transform rotate-12 flex flex-col items-center z-10">
              <span>Scale your teaching</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-1 translate-x-[-10px] scale-y-[-1] scale-x-[-1] opacity-50">
                <path d="M5 12C5 12 11 4 19 4M19 4L15 8M19 4L14 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <h3 className="text-xl font-semibold mb-2">Classroom</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-[2.5rem] font-bold tracking-tight text-black">$25</span>
              <span className="text-sm font-medium text-gray-500">/month</span>
            </div>
            <ul className="space-y-3 flex-1 mb-8">
              {[
                "Up to 30 students",
                "Classroom Mode",
                "Live student monitoring",
                "Help signals",
                "Analytics dashboard",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-['Open_Sans'] text-gray-700">
                  <Check className="h-4 w-4 shrink-0 text-black" />
                  {item}
                </li>
              ))}
              <li className="flex items-center gap-3 text-sm font-['Open_Sans']">
                  <Check className="h-4 w-4 shrink-0 text-black" />
                  <span className="bg-black text-white px-1.5 py-0.5 rounded-none text-xs font-bold">Scale your teaching efficiently</span>
              </li>
            </ul>
            <button className="w-full py-4 px-6 rounded-none text-black font-semibold bg-[#ccff00] border-2 border-[#ccff00] hover:bg-transparent transition-all shadow-none">
              Get iCode
            </button>
            <p className="mt-4 text-xs font-mono text-center text-gray-400">Scale your teaching efficiently</p>
          </div>
        </motion.div>
        
        <div className="mt-8 max-w-4xl mx-auto rounded-none border-2 border-[rgba(17,17,15,0.08)] p-6 md:p-8 bg-gray-50 text-left relative overflow-hidden">
            <h4 className="text-lg font-semibold text-black mb-2">Need help integrating into your school?</h4>
            <p className="text-sm text-gray-600 mb-4 max-w-2xl leading-relaxed">
              We support onboarding, teacher training, and pilot launches.
            </p>
            <button className="px-4 py-2 bg-white border-2 border-[rgba(17,17,15,0.1)] text-sm font-medium rounded-none hover:bg-gray-100 transition-colors">
              Get in contact
            </button>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
