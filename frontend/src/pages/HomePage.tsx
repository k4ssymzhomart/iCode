import { useAuth } from "@/lib/auth-context";
import { appPaths } from "@/app/paths";
import { useNavigate } from "@/lib/router";
import { useEffect } from "react";
import StudentDashboard from "@/components/Classroom/Student/StudentDashboard";
import fullLogo from "@/assets/full_logo.png";

import TopBar from "@/components/LandingPage/TopBar";
import Hero from "@/components/LandingPage/Hero";
import ProblemSection from "@/components/LandingPage/ProblemSection";
import DemoSection from "@/components/LandingPage/DemoSection";
import SolutionSection from "@/components/LandingPage/SolutionSection";
import HowItWorksSection from "@/components/LandingPage/HowItWorksSection";
import RoleSplitSection from "@/components/LandingPage/RoleSplitSection";
import PricingSection from "@/components/LandingPage/PricingSection";
import BottomCTA from "@/components/LandingPage/BottomCTA";
import Footer from "@/components/LandingPage/Footer";

const RouteLoader = () => (
  <div className="flex flex-1 min-h-screen flex-col items-center justify-center px-4 py-32 bg-white">
    <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-300">
      <img src={fullLogo} alt="iCode" className="h-14 w-auto drop-shadow-md" />
      <div className="inline-flex items-center gap-3 border-[3px] border-[#11110f] bg-[#ccff00] px-6 py-3 font-mono text-sm font-black uppercase tracking-widest text-[#11110f] shadow-[6px_6px_0_#11110f]">
        <span>Loading</span>
        <span className="h-5 w-2.5 animate-pulse bg-[#11110f]" style={{ animationDuration: '0.4s' }} />
      </div>
    </div>
  </div>
);

const HomePage = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
     if (!isLoading && isAuthenticated && role === "teacher") {
        navigate(appPaths.teacher, { replace: true });
     }
  }, [isLoading, isAuthenticated, role, navigate]);

  if (isLoading) {
    return <RouteLoader />;
  }

  if (isAuthenticated && role === "student") {
     return (
        <div className="flex flex-col min-h-screen pt-[73px]">
           <StudentDashboard />
        </div>
     );
  }

  if (isAuthenticated && role === "teacher") {
    return null; // Let the effect redirect
  }

  return (
    <div className="bg-white min-h-screen font-sans">
      <TopBar />
      <Hero />
      <DemoSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <RoleSplitSection />
      <PricingSection />
      <BottomCTA />
      <Footer />
    </div>
  );
};

export default HomePage;
