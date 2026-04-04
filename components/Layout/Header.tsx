import React from 'react';
import { Home, BookOpen, Box, LogIn, Monitor } from 'lucide-react';
import logo from '../../logo.png';

interface HeaderProps {
  onNavigate?: (view: string) => void;
  currentView?: string;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView = 'home' }) => {
  const getButtonClass = (viewName: string) => {
    const isActive = currentView === viewName;
    return `flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
      isActive 
        ? 'bg-gray-100 text-black border-gray-200' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-black border-transparent hover:border-gray-200'
    }`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-4">
          <nav className="hidden min-w-0 items-center space-x-2 md:flex">
            <button 
              onClick={() => onNavigate?.('home')}
              className={getButtonClass('home')}
            >
              <Home size={18} />
              <span>Main</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-black transition-colors border border-transparent hover:border-gray-200">
              <BookOpen size={18} />
              <span>Education</span>
            </button>
            <button 
              onClick={() => onNavigate?.('classroom')}
              className={getButtonClass('classroom')}
            >
              <Monitor size={18} />
              <span>Classroom</span>
            </button>
          </nav>

          <div 
            className="flex items-center justify-center"
            onClick={() => onNavigate?.('home')}
          >
            <button className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm transition hover:border-slate-300 hover:shadow-md">
              <img src={logo} alt="iCode" className="h-10 w-auto object-contain" />
            </button>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button 
              onClick={() => onNavigate?.('utilities')}
              className={`hidden md:flex ${getButtonClass('utilities')}`}
            >
              <Box size={18} />
              <span>Utilities</span>
            </button>
            <button className="flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-medium text-black border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
              <LogIn size={18} />
              <span>Join Club</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
