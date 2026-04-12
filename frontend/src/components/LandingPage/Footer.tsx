import fullLogo from "@/assets/full_logo.png";

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
    <footer className="bg-[#e9e9e9] border-t border-[rgba(17,17,15,0.05)] pt-16 pb-24 text-sm">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          
          <div className="flex flex-col items-start pt-2">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight mb-4">
              <img src={fullLogo} alt="iCode Logo" className="h-20 w-auto object-contain -ml-2" />
            </div>
            <p className="font-['Open_Sans'] mt-auto text-[#666259] text-xs max-w-[200px]">
              ©{new Date().getFullYear()} iCode
            </p>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold text-gray-500 mb-4">{section.title}</h4>
                <ul className="space-y-3 font-medium">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-[#11110f] hover:text-[#555]">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
