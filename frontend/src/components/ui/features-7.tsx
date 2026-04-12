import { Cpu, Lock, Sparkles, Zap } from 'lucide-react'
import { motion } from "framer-motion"

export function Features() {
    return (
        <section className="overflow-hidden px-4 py-24 sm:px-6 lg:px-8 bg-white border-t border-[rgba(17,17,15,0.05)] relative z-10">
            <div className="mx-auto max-w-[1320px] space-y-8 md:space-y-12">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative z-10 md:max-w-3xl mx-auto text-center"
                >
                    <h2 className="text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.04em] text-[#11110f] sm:text-[3.5rem] lg:text-[4rem]">
                        Built for real learning environments
                    </h2>
                    <p className="mt-6 text-lg font-['Open_Sans'] text-[#666259]">
                        Empower students to think independently and teachers to manage classrooms efficiently.
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    className="relative -mx-4 rounded-none p-3 md:mx-auto lg:col-span-3 max-w-5xl"
                >
                    <div className="[perspective:800px]">
                        <div className="[transform:skewY(-2deg)skewX(-2deg)rotateX(6deg)] shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-none overflow-hidden">
                            <div className="aspect-[88/36] relative bg-[#f7f7f7]">
                                <div className="[background-image:radial-gradient(var(--tw-gradient-stops,at_75%_25%))] to-white z-1 absolute inset-0 from-transparent to-75%"></div>
                                <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2672&auto=format&fit=crop" className="absolute inset-0 z-10 object-cover object-center w-full h-full opacity-90 mix-blend-multiply" alt="Student workflow illustration" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                    className="relative mx-auto grid max-w-5xl grid-cols-2 gap-x-6 gap-y-10 sm:gap-8 lg:grid-cols-4 pt-10"
                >
                    <div className="space-y-4 hover:scale-105 transition-transform cursor-default">
                        <div className="flex flex-col gap-3">
                            <div className="bg-gray-50 p-2 w-fit rounded-none"><Zap className="size-5 text-black" /></div>
                            <h3 className="text-base font-semibold text-[#11110f]">Fast</h3>
                        </div>
                        <p className="font-['Open_Sans'] text-sm leading-relaxed text-[#666259]">Instant feedback loop: write → run → understand → fix</p>
                    </div>
                    <div className="space-y-4 hover:scale-105 transition-transform cursor-default">
                        <div className="flex flex-col gap-3">
                            <div className="bg-gray-50 p-2 w-fit rounded-none"><Cpu className="size-5 text-black" /></div>
                            <h3 className="text-base font-semibold text-[#11110f]">Powerful</h3>
                        </div>
                        <p className="font-['Open_Sans'] text-sm leading-relaxed text-[#666259]">Combines compiler precision with AI explanations</p>
                    </div>
                    <div className="space-y-4 hover:scale-105 transition-transform cursor-default">
                        <div className="flex flex-col gap-3">
                            <div className="bg-gray-50 p-2 w-fit rounded-none"><Lock className="size-5 text-black" /></div>
                            <h3 className="text-base font-semibold text-[#11110f]">Classroom-ready</h3>
                        </div>
                        <p className="font-['Open_Sans'] text-sm leading-relaxed text-[#666259]">Built for 12–30 student environments with limited teacher time</p>
                    </div>
                    <div className="space-y-4 hover:scale-105 transition-transform cursor-default">
                        <div className="flex flex-col gap-3">
                            <div className="bg-gray-50 p-2 w-fit rounded-none"><Sparkles className="size-5 text-black" /></div>
                            <h3 className="text-base font-semibold text-[#11110f]">AI-assisted</h3>
                        </div>
                        <p className="font-['Open_Sans'] text-sm leading-relaxed text-[#666259]">Guides thinking without giving away answers</p>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
