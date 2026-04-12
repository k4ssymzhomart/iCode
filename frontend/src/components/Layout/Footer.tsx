import { ArrowUpRight, GraduationCap, Monitor, TerminalSquare } from "lucide-react";
import { appPaths } from "@/app/paths";
import logo from "@/assets/logo.png";
import { Link } from "@/lib/router";

const Footer = () => (
  <footer className="px-4 pb-10 pt-20 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-[1320px]">
      <div className="landing-shell overflow-hidden rounded-[40px] px-6 py-8 sm:px-10 sm:py-10">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full bg-white px-3 py-2">
              <img src={logo} alt="iCode" className="h-10 w-auto object-contain" />
              <div>
                <div className="text-sm font-semibold text-[#11110f]">iCode</div>
                <div className="text-xs text-[#6d695f]">
                  Where classroom workflows meet live coding tools.
                </div>
              </div>
            </div>

            <p className="mt-6 max-w-md text-sm leading-7 text-[#666259]">
              The landing page now speaks the same premium SaaS language as the
              reference while still routing straight into Smart Compiler,
              Classroom Mode, and Teacher View.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={appPaths.compiler}
                className="inline-flex items-center gap-2 rounded-full bg-[#11110f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#20201d]"
              >
                Launch Smart Compiler
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to={appPaths.teacher}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#11110f] transition hover:bg-[#f7f3eb]"
              >
                Teacher View
              </Link>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-[#11110f]">Pages</div>
            <div className="mt-4 space-y-3 text-sm text-[#666259]">
              <div><Link to={appPaths.home} className="transition hover:text-[#11110f]">Home</Link></div>

              <div><Link to={appPaths.teacher} className="transition hover:text-[#11110f]">Teacher View</Link></div>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-[#11110f]">Workspaces</div>
            <div className="mt-4 space-y-4 text-sm text-[#666259]">
              <Link to={appPaths.compiler} className="flex items-center gap-2 transition hover:text-[#11110f]">
                <TerminalSquare className="h-4 w-4" />
                Smart Compiler
              </Link>
              <Link to={appPaths.classroom} className="flex items-center gap-2 transition hover:text-[#11110f]">
                <Monitor className="h-4 w-4" />
                Classroom Mode
              </Link>
              <Link to={appPaths.teacher} className="flex items-center gap-2 transition hover:text-[#11110f]">
                <GraduationCap className="h-4 w-4" />
                Teacher Sessions
              </Link>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-[#11110f]">Support</div>
            <p className="mt-4 text-sm leading-7 text-[#666259]">
              Keep the marketing surface polished while the product pages stay
              focused on actual teaching and coding work.
            </p>
            <div className="mt-4 rounded-[28px] bg-[#11110f] px-5 py-5 text-white">
              <div className="text-xs uppercase tracking-[0.18em] text-white/60">
                Design Refresh
              </div>
              <div className="mt-2 text-xl font-semibold">Reference-inspired landing</div>
              <div className="mt-2 text-sm leading-6 text-white/70">
                Fonts, shapes, card rhythm, and section pacing were rebuilt
                without removing the iCode app flows.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-[rgba(17,17,15,0.08)] pt-6 text-sm text-[#7d786f] sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {new Date().getFullYear()} iCode</span>
          <span>Smart Compiler, Classroom Mode, and Teacher View remain available on their own routes.</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
