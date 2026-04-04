import React from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Star } from 'lucide-react';

const CommunityHub: React.FC = () => {
  const techStack = ['React', 'Next.js', 'C++', 'HTML', 'CSS', 'JavaScript', 'Python'];

  return (
    <div className="space-y-16">
      
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-black">Community in Numbers</h2>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-100">
        <div>
          <div className="text-4xl font-bold text-black mb-2">50</div>
          <div className="text-sm text-gray-500">Active Participants</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-black mb-2">10</div>
          <div className="text-sm text-gray-500">Projects Done</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-black mb-2">4</div>
          <div className="text-sm text-gray-500">Mentors</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-black mb-2">12</div>
          <div className="text-sm text-gray-500">Learning Resources</div>
        </div>
      </div>

      {/* Tech Stack Filter */}
      <div className="flex flex-wrap justify-center gap-3">
        {techStack.map((tech) => (
          <button
            key={tech}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:text-black hover:border-gray-400 bg-white hover:bg-gray-50 transition-all"
          >
            <Star size={14} className="text-gray-400" />
            {tech}
          </button>
        ))}
      </div>

      {/* Split Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* New Projects Slider */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between h-64">
          <div>
            <h3 className="text-xl font-bold text-black mb-2">New Projects</h3>
            <p className="text-gray-500 text-sm">See the latest work from the community</p>
          </div>
          
          <div className="flex items-center justify-between mt-auto">
             <div className="flex gap-2">
                {/* Visual representation of content here could go here */}
                <span className="text-xs font-mono text-gray-400">Project_01.tsx</span>
             </div>
             <div className="flex gap-2">
               <button className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 text-black transition-colors">
                 <ChevronLeft size={20} />
               </button>
               <button className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 text-black transition-colors">
                 <ChevronRight size={20} />
               </button>
             </div>
          </div>
        </div>

        {/* Live Discussions */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between h-64 hover:bg-gray-50/50 transition-colors cursor-pointer group">
          <div>
            <h3 className="text-xl font-bold text-black mb-2">Live Discussions</h3>
            <p className="text-gray-500 text-sm max-w-xs">
              Join weekly meetups and daily chats with other developers.
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-black group-hover:bg-black group-hover:text-white transition-colors">
             <MessageCircle size={28} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default CommunityHub;