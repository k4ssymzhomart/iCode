import fullLogo from "@/assets/full_logo.png";
import { AuthSection } from "../Layout/AuthSection";

const TopBar = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[rgba(17,17,15,0.05)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1320px] flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <img src={fullLogo} alt="iCode Logo" className="h-8 w-auto object-contain" />
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-[#11110f]/70 hover:text-[#11110f] transition-colors">
            Features
          </a>
          <a href="/smart-compiler" className="text-sm font-medium text-[#11110f]/70 hover:text-[#11110f] transition-colors">
            Smart Compiler
          </a>
          <a href="/classroom" className="text-sm font-medium text-[#11110f]/70 hover:text-[#11110f] transition-colors">
            Classroom Mode
          </a>
          <a href="/teacher" className="text-sm font-medium text-[#11110f]/70 hover:text-[#11110f] transition-colors">
            Teacher View
          </a>
          <a href="/this-is-not-found" className="text-sm font-medium text-[#11110f]/70 hover:text-[#11110f] transition-colors">
            404 Page
          </a>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-6">
           <AuthSection />
        </div>

      </div>
    </header>
  );
};

export default TopBar;
