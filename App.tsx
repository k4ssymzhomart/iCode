import React, { useState } from 'react';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import Header from './components/Layout/Header';
import Hero from './components/LandingPage/Hero';
import StatsGrid from './components/LandingPage/StatsGrid';
import CommunityHub from './components/LandingPage/CommunityHub';
import Footer from './components/Layout/Footer';
import UtilitiesPage from './components/Utilities/UtilitiesPage';
import SmartCompiler from './components/Editor/SmartCompiler';
import TeacherDashboard from './components/Classroom/TeacherDashboard';
import CollaborativeEditor from './components/Classroom/CollaborativeEditor';
import LiveSession from './components/Classroom/LiveSession';
import { ArrowLeft } from 'lucide-react';

// Use a placeholder URL directly to ensure browser compatibility
const convex = new ConvexReactClient("https://humorous-wombat-123.convex.cloud");

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('home');
  
  // Session State
  const [activeSession, setActiveSession] = useState<{
    roomId: string;
    studentName: string;
    initialCode?: string;
    task?: string;
    stats?: {
      successRate: number;
      weakness: string;
      strength: string;
    };
  } | null>(null);

  const handleJoinRoom = (roomId: string, studentData: any) => {
    setActiveSession({
      roomId,
      studentName: studentData.name || 'Student',
      initialCode: studentData.mockCode,
      task: studentData.currentTask,
      stats: {
        successRate: studentData.successRate || 0,
        weakness: studentData.weakness || 'None',
        strength: studentData.strength || 'None'
      }
    });
    setCurrentView('active-session');
  };

  // Mock Identity for Demo
  // In a real app, you'd use Clerk/Auth0
  const [userId] = useState(() => `user-${Math.floor(Math.random() * 1000)}`);

  return (
    <ConvexProvider client={convex}>
      <div className="min-h-screen flex flex-col bg-white">
        {/* Navigation Header - Hide in active session for immersion */}
        {currentView !== 'active-session' && (
          <Header onNavigate={setCurrentView} currentView={currentView} />
        )}

        {/* Main Content Area */}
        <main className="flex-grow">
          {currentView === 'home' && (
            <>
              <Hero />
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <StatsGrid />
              </section>
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <CommunityHub />
              </section>
            </>
          )}

          {currentView === 'utilities' && (
            <UtilitiesPage onNavigate={setCurrentView} />
          )}

          {currentView === 'python-editor' && (
            <SmartCompiler />
          )}

          {/* Teacher View: The Dashboard */}
          {currentView === 'classroom' && (
            <TeacherDashboard onJoinRoom={handleJoinRoom} />
          )}

          {/* Teacher Intervening in a Student Session - Full Page View */}
          {currentView === 'active-session' && activeSession && (
            <LiveSession 
              sessionData={activeSession} 
              onExit={() => setCurrentView('classroom')} 
            />
          )}

          {/* Student View (Simulated) - Access via hidden/debug or separate route in real app */}
          {currentView === 'student-demo' && (
             <div className="h-[calc(100vh-80px)]">
                <CollaborativeEditor studentId={userId} userName={`Student ${userId}`} />
             </div>
          )}
        </main>

        {/* Call to Action Footer (Hide on specific views) */}
        {!['python-editor', 'active-session', 'classroom', 'student-demo'].includes(currentView) && <Footer />}
        
        {/* Demo Toggle for Reviewer */}
        {currentView === 'home' && (
           <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-xl shadow-2xl z-50 text-xs">
              <p className="mb-2 font-bold">Demo Controls</p>
              <div className="flex gap-2">
                 <button onClick={() => setCurrentView('student-demo')} className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700">Simulate Student</button>
                 <button onClick={() => setCurrentView('classroom')} className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700">Teacher Dashboard</button>
              </div>
           </div>
        )}
      </div>
    </ConvexProvider>
  );
};

export default App;