import React from 'react';
import { Users, FileText, Layers, CheckCircle2, Circle } from 'lucide-react';

const StatsGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      {/* Card 1: Activity (Top Left) */}
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
        <h3 className="text-sm font-medium text-gray-500 mb-6">This Month</h3>
        <div className="flex justify-between items-end">
          <div className="text-center">
            <span className="block text-4xl font-bold text-black mb-1">10</span>
            <span className="text-sm text-gray-500">Lectures</span>
          </div>
          <div className="text-center">
            <span className="block text-4xl font-bold text-black mb-1">0</span>
            <span className="text-sm text-gray-500">Articles</span>
          </div>
          <div className="text-center">
            <span className="block text-4xl font-bold text-black mb-1">0</span>
            <span className="text-sm text-gray-500">Posts</span>
          </div>
        </div>
      </div>

      {/* Card 3: Articles (Top Middle - Swapped visual position for logic flow in code, but grid handles it) */}
      {/* Visual Design Logic: The prompt asks for specific cards. Let's place them nicely. */}
      
      {/* Card 2: Mentorship */}
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow flex flex-col justify-between h-full">
        <div className="mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-black" />
          </div>
          <h3 className="text-xl font-bold text-black mb-2">Mentorship</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Connect with experienced developers and grow your skills through direct guidance.
          </p>
        </div>
      </div>

      {/* Card 5: Our Path - Timeline (Right Column - Spans 2 rows on large screens) */}
      <div className="lg:row-span-2 bg-white p-8 rounded-xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
        <h3 className="text-lg font-bold text-black mb-6">Our Path</h3>
        <div className="space-y-8 relative">
          {/* Vertical Line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gray-100"></div>

          <div className="relative flex items-start gap-4">
            <div className="relative z-10 w-4 h-4 rounded-full bg-black mt-1.5 ring-4 ring-white"></div>
            <div>
              <h4 className="font-semibold text-black">Path starts here</h4>
              <p className="text-sm text-gray-500 mt-1">Everything begins with an idea.</p>
            </div>
          </div>

          <div className="relative flex items-start gap-4">
            <div className="relative z-10 w-4 h-4 rounded-full bg-gray-300 mt-1.5 ring-4 ring-white"></div>
            <div>
              <h4 className="font-semibold text-black">First concept</h4>
              <p className="text-sm text-gray-500 mt-1">When inspiration meets planning.</p>
            </div>
          </div>

          <div className="relative flex items-start gap-4">
            <div className="relative z-10 w-4 h-4 rounded-full bg-gray-300 mt-1.5 ring-4 ring-white"></div>
            <div>
              <h4 className="font-semibold text-black">Getting serious</h4>
              <p className="text-sm text-gray-500 mt-1">The next big step in development.</p>
            </div>
          </div>
          
           <div className="relative flex items-start gap-4 opacity-50">
            <div className="relative z-10 w-4 h-4 rounded-full bg-gray-100 mt-1.5 ring-4 ring-white"></div>
            <div>
              <h4 className="font-semibold text-gray-400">Launch</h4>
              <p className="text-sm text-gray-400 mt-1">Releasing to the world.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Articles */}
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow flex flex-col justify-between h-full">
        <div className="mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <FileText className="w-5 h-5 text-black" />
          </div>
          <h3 className="text-xl font-bold text-black mb-2">Articles</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Find all categories, guides, insights and much more to read.
          </p>
        </div>
      </div>

      {/* Card 4: Projects */}
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow flex flex-col justify-between h-full">
        <div className="mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <Layers className="w-5 h-5 text-black" />
          </div>
          <h3 className="text-xl font-bold text-black mb-2">Projects</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Latest, fresh projects from our active developer community.
          </p>
        </div>
      </div>

    </div>
  );
};

export default StatsGrid;