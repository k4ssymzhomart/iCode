import { useState } from "react";
import { Menu, X } from "lucide-react";
import fullLogo from "@/assets/full_logo.png";
import { AuthSection } from "../Layout/AuthSection";

const navLinks = [
  { label: "Problem", href: "#problem" },
  { label: "Demo", href: "#demo" },
  { label: "Solution", href: "#solution" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

const TopBar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-black px-4 py-3 sm:px-6 lg:px-8 relative overflow-visible shadow-[0_4px_0_rgba(17,17,15,0.05)]">
      <div className="mx-auto max-w-[1320px] flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <img src={fullLogo} alt="iCode Logo" className="h-8 w-auto object-contain" />
        </div>

        {/* Center: Navigation Links (desktop) */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-xs font-bold uppercase tracking-widest text-[#11110f]/60 hover:text-black transition-colors px-2 py-1 border-b-2 border-transparent hover:border-[#ccff00]">
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
           <div className="hidden md:block">
             <AuthSection />
           </div>
           <button
             type="button"
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             className="md:hidden inline-flex items-center text-[#11110f] transition-transform hover:scale-110 active:scale-95"
             aria-label="Menu"
           >
             {isMobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
           </button>
        </div>

      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 w-full bg-white border-b-2 border-[#11110f] md:hidden flex flex-col p-4 gap-3 z-[100] shadow-[0_8px_16px_rgba(0,0,0,0.15)]">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-left px-4 py-3 text-sm font-bold uppercase tracking-widest text-[#11110f] border-b border-gray-100 hover:bg-[#ccff00] hover:pl-6 transition-all"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-gray-100 flex justify-center">
            <AuthSection />
          </div>
        </div>
      )}
    </header>
  );
};

export default TopBar;
