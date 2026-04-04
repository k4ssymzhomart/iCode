import React from 'react';
import { TableProperties, Code2, Terminal, ChevronRight } from 'lucide-react';

interface UtilitiesPageProps {
  onNavigate?: (view: string) => void;
}

const UtilitiesPage: React.FC<UtilitiesPageProps> = ({ onNavigate }) => {
  const utilities = [
    {
      title: "Trace Tables",
      description: "Create your trace table and export to PDF in a few clicks!",
      icon: <TableProperties className="w-6 h-6" />,
      action: 'trace-tables'
    },
    {
      title: "Web Development Editor",
      description: "Work on a code editor that supports HTML, CSS, JS & PHP & MarkDown. Save your projects and share with friends!",
      icon: <Code2 className="w-6 h-6" />,
      action: 'web-editor'
    },
    {
      title: "Smart Compiler",
      description: "Write and run Python in a real editor with clean output, stdin support, and short debugging explanations.",
      icon: <Terminal className="w-6 h-6" />,
      action: 'python-editor'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-black tracking-tight">Utilities:</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {utilities.map((util, index) => (
          <div 
            key={index} 
            className="bg-white p-8 rounded-xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col h-full"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-50 rounded-lg text-black">
                {util.icon}
              </div>
              <h3 className="text-xl font-bold text-black">{util.title}</h3>
            </div>
            
            <p className="text-gray-500 mb-8 flex-grow leading-relaxed">
              {util.description}
            </p>

            <button 
              onClick={() => onNavigate?.(util.action)}
              className="group w-full py-4 bg-[#1a1a1a] text-white rounded-lg font-medium hover:bg-black transition-colors flex items-center justify-center"
            >
              <span>Try now!</span>
              <ChevronRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UtilitiesPage;
