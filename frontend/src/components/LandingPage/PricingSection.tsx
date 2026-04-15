import { motion } from "framer-motion";
import { Check } from "lucide-react";

const PricingSection = () => {
  return (
    <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8 bg-white border-t border-[rgba(17,17,15,0.05)] pb-32">
      <div className="mx-auto max-w-[1320px] text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="md:max-w-2xl mx-auto"
        >
          <h2 className="text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.04em] text-[#11110f] sm:text-[3.5rem] lg:text-[4rem]">
            Choose your plan.
          </h2>
          <p className="mt-6 text-lg font-['Open_Sans'] text-[#666259]">
            Simple pricing for both students and schools. Start coding instantly.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-16 grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto text-left"
        >
          {/* iGo Card */}
          <div className="rounded-none border-2 border-[rgba(17,17,15,0.1)] bg-white p-8 flex flex-col hover:-translate-y-1 transition-transform">
            <h3 className="text-xl font-semibold mb-2">iGo</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-[2.5rem] font-bold tracking-tight text-black">$4.90</span>
              <span className="text-sm font-medium text-gray-500">/month</span>
            </div>
            <ul className="space-y-4 flex-1 mb-8">
              {[
                "Доступ ко всем ООП языкам",
                "Classroom session mode",
                "Live real-time code sync с учителем в классе",
                "Расширенная аналитика: leaderboard, corrections, runs",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-['Open_Sans'] text-gray-700">
                  <Check className="h-4 w-4 shrink-0 text-black mt-0.5" />
                  <span className="leading-tight">{item}</span>
                </li>
              ))}
            </ul>
            <button className="w-full py-4 px-6 rounded-none border-2 border-black shadow-[4px_4px_0_#11110f] text-black font-semibold bg-white hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_#11110f] transition-all">
              Get iGo
            </button>
          </div>

          {/* iPro Card */}
          <div className="relative rounded-none border-2 border-[#ccff00] bg-white p-8 flex flex-col shadow-none hover:-translate-y-1 transition-transform z-10 scale-[1.02]">
            <div className="absolute top-0 right-0 bg-[#ccff00] text-black text-xs font-bold px-3 py-1 uppercase tracking-wider">
              Popular
            </div>
            <h3 className="text-xl font-semibold mb-2">iPro</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-[2.5rem] font-bold tracking-tight text-black">$9.90</span>
              <span className="text-sm font-medium text-gray-500">/month</span>
            </div>
            <ul className="space-y-4 flex-1 mb-8">
              {[
                "Доступ к Smart Compiler для Python",
                "Бесконечное выполнение и исправление кода",
                "Возможность исправлять специфичную линию кода",
                "Персонализированные рекомендации (синтаксис/логика)",
                "Доступ к Новым фитчам",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-['Open_Sans'] text-gray-900 font-medium">
                  <Check className="h-4 w-4 shrink-0 text-black mt-0.5" />
                  <span className="leading-tight">{item}</span>
                </li>
              ))}
            </ul>
            <button className="w-full py-4 px-6 rounded-none text-black font-semibold bg-[#ccff00] border-2 border-[#ccff00] hover:bg-transparent transition-all shadow-[4px_4px_0_#11110f] hover:shadow-none translate-y-[-4px] hover:translate-y-0 translate-x-[-4px] hover:translate-x-0">
              Get iPro
            </button>
          </div>

          {/* Teacher Plan Card */}
          <div className="rounded-none border-2 border-black bg-white p-8 flex flex-col hover:-translate-y-1 transition-transform relative">
            <h3 className="text-xl font-semibold mb-2 text-black">iTeach</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-[2.5rem] font-bold tracking-tight text-black">$24.90</span>
              <span className="text-sm font-medium text-gray-500">/month</span>
            </div>
            <ul className="space-y-4 flex-1 mb-8">
              {[
                "Неограниченное кол-во Classroom sessions",
                "Загрузка собственных задач / JSON task sets",
                "Real-time наблюдение и вмешательство в редактор (правки/комментарии)",
                "Full-access аналитика и leaderboard",
                "Управление: limits, hints, explains",
                "История изменений и журнал действий",
                "Поддерживает <20 студентов для Classroom",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-['Open_Sans'] text-gray-700">
                  <Check className="h-4 w-4 shrink-0 text-black mt-0.5" />
                  <span className="leading-tight">{item}</span>
                </li>
              ))}
            </ul>
            <button className="w-full py-4 px-6 rounded-none text-white font-semibold bg-black border-2 border-black hover:bg-gray-800 transition-colors shadow-[4px_4px_0_#11110f] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0_#11110f]">
              Get iTeach
            </button>
          </div>
        </motion.div>
        
        <div className="mt-16 max-w-4xl mx-auto rounded-none border-[3px] border-[#11110f] bg-[#ccff00] p-8 md:p-12 text-left relative overflow-hidden shadow-[12px_12px_0_#11110f] flex flex-col md:flex-row items-center justify-between gap-8 hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0_#11110f] transition-all">
            <div className="flex-1">
               <h4 className="text-2xl font-black uppercase tracking-tight text-black mb-2">Need help integrating into your school?</h4>
               <p className="text-base font-['Open_Sans'] text-black/80 max-w-xl leading-relaxed font-semibold">
                 We support onboarding, teacher training, and pilot launches for larger groups. Get a custom pipeline tailored to your institution.
               </p>
            </div>
            <button className="px-8 py-4 bg-black text-[#ccff00] font-bold text-lg rounded-none hover:bg-gray-900 transition-colors shrink-0 uppercase tracking-widest border-2 border-black">
              Contact Sales
            </button>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
