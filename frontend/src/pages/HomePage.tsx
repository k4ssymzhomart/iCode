import { useAuth } from "@/lib/auth-context";
import { appPaths } from "@/app/paths";
import { useNavigate } from "@/lib/router";
import { useEffect } from "react";
import StudentDashboard from "@/components/Classroom/Student/StudentDashboard";

import TopBar from "@/components/LandingPage/TopBar";
import Hero from "@/components/LandingPage/Hero";
import DemoSection from "@/components/LandingPage/DemoSection";
import FeaturesGrid from "@/components/LandingPage/FeaturesGrid";
import PricingSection from "@/components/LandingPage/PricingSection";
import BottomCTA from "@/components/LandingPage/BottomCTA";
import Footer from "@/components/LandingPage/Footer";

const RouteLoader = () => (
  <div className="flex flex-1 min-h-screen items-center justify-center bg-white">
    <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-sm">
      Loading page...
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
      <FeaturesGrid />
      <PricingSection />
      <BottomCTA />
      <Footer />
    </div>
  );
};

export default HomePage;
