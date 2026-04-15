import fullLogoWhite from "@/assets/full_logo_white.png";
import { Instagram, Linkedin } from "lucide-react";

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Demo", href: "#demo" },
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQs", href: "#faqs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Support", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="bg-[#11110f] border-t-4 border-[#ccff00] pt-20 pb-12 text-sm text-white">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-4">
          
          <div className="flex flex-col items-start pt-2">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight mb-6 bg-transparent hover:border-[#ccff00] transition-colors">
              <img src={fullLogoWhite} alt="iCode Logo" className="h-12 w-auto object-contain" />
            </div>
            <p className="font-mono text-gray-400 text-xs max-w-[220px] leading-relaxed mb-8">
              Empowering students to understand code, not just write it.
            </p>
            <p className="font-['Open_Sans'] mt-auto text-gray-500 text-xs font-bold uppercase tracking-widest">
              ©{new Date().getFullYear()} iCode
            </p>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-12">
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h4 className="font-bold text-[#ccff00] mb-6 uppercase tracking-widest text-xs">{section.title}</h4>
                <ul className="space-y-4 font-medium">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-gray-300 hover:text-white hover:underline underline-offset-4 decoration-[#ccff00] transition-all">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>
        
        <div className="mt-20 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-4 ml-auto">
               <span className="w-12 h-12 bg-white/5 hover:bg-[#ccff00] transition-colors flex items-center justify-center cursor-pointer text-white hover:text-black font-bold">
                 <Instagram size={20} />
               </span>
               <span className="w-12 h-12 bg-white/5 hover:bg-[#ccff00] transition-colors flex items-center justify-center cursor-pointer text-white hover:text-black font-bold">
                 <Linkedin size={20} />
               </span>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
