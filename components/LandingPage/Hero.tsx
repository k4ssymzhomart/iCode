import React from 'react';
import { Sparkles } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 text-center">
        
        <div className="inline-flex items-center justify-center space-x-2 mb-8 animate-fade-in-up">
          <Sparkles className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-500">Learn to code starting today</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-black mb-6 leading-[1.1]">
          Programming <br className="hidden md:block" /> is simple
        </h1>
        
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Projects, resources, and a mentor for everyone. <br className="hidden md:block" />
          Start your journey with us today.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="w-full sm:w-auto px-8 py-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
            Read Resources
          </button>
          <button className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-900 rounded-full font-medium hover:bg-gray-200 transition-all border border-transparent">
            Join into club
          </button>
        </div>

      </div>
    </section>
  );
};

export default Hero;