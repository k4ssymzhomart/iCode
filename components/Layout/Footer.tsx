import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-24 bg-white flex flex-col items-center justify-center text-center border-t border-gray-100/50">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
          Ready to start your path?
        </h2>
        <p className="text-gray-500 mb-8 text-lg">
          Join our community today and elevate your skills to the next level.
        </p>
        <button className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-black rounded-full hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
          <span>Start Now</span>
          <ArrowUpRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
      
      <div className="mt-16 text-sm text-gray-400">
        &copy; {new Date().getFullYear()} iCode. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;