import React, { useState, useMemo } from "react";
import { StudentData } from "./mockData";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, AreaChart, Area } from "recharts";
import { LayoutDashboard, Activity, BrainCircuit, Calendar, Users, Filter } from "lucide-react";

interface AnalyticsViewProps {
  students: StudentData[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ students }) => {

  const [timeline, setTimeline] = useState<"Days" | "Weeks" | "Months">("Days");
  const [selectedClass, setSelectedClass] = useState<string>("All Classes");
  const [isClassDropdownOpen, setClassDropdownOpen] = useState(false);
  const classOptions = ["All Classes", "11-A (Advanced)", "11-B (Core)", "12-A (Core)", "10-C (Beginner)"];

  const { performanceData, distributionData } = useMemo(() => {
     let top = students.filter(s => s.successRate >= 80).length;
     let avg = students.filter(s => s.successRate >= 60 && s.successRate < 80).length;
     let review = students.filter(s => s.successRate < 60).length;

     let d10 = students.filter(s => s.timeSpent < 600).length;
     let d15 = students.filter(s => s.timeSpent >= 600 && s.timeSpent < 900).length;
     let d20 = students.filter(s => s.timeSpent >= 900 && s.timeSpent < 1200).length;
     let d25 = students.filter(s => s.timeSpent >= 1200).length;

     // Simulate historical scale based on selections to visibly change graphs
     const mult = timeline === "Days" ? 1 : timeline === "Weeks" ? 4 : 12;
     const classMult = selectedClass === "All Classes" ? 1 : 0.25;
     const vary = () => 0.8 + Math.random() * 0.4;
     
     if (timeline !== "Days" || selectedClass !== "All Classes") {
       top = Math.max(1, Math.floor(top * mult * classMult * vary()));
       avg = Math.max(1, Math.floor(avg * mult * classMult * vary()));
       review = Math.max(1, Math.floor(review * mult * classMult * vary()));

       d10 = Math.max(1, Math.floor(d10 * mult * classMult * vary()));
       d15 = Math.max(1, Math.floor(d15 * mult * classMult * vary()));
       d20 = Math.max(1, Math.floor(d20 * mult * classMult * vary()));
       d25 = Math.max(1, Math.floor(d25 * mult * classMult * vary()));
     }

     return {
       performanceData: [
         { name: "Top Performers (>80%)", value: top, color: "#ccff00" },
         { name: "Average (60-79%)", value: avg, color: "#3b82f6" },
         { name: "Needs Review (<60%)", value: review, color: "#f43f5e" },
       ],
       distributionData: [
         { label: "10m", count: d10 },
         { label: "15m", count: d15 },
         { label: "20m", count: d20 },
         { label: "25m+", count: d25 },
       ]
     };
  }, [students, timeline, selectedClass]);

  // Custom Tooltips for brutalist design
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#11110f] border-2 border-white p-3 shadow-[4px_4px_0_#ccff00] rounded-none">
          <p className="text-white font-black uppercase tracking-widest text-xs mb-1">{payload[0].name}</p>
          <p className="text-[#ccff00] font-mono text-xl font-black">{payload[0].value} <span className="text-[10px] text-gray-400">Students</span></p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#ccff00] border-2 border-[#11110f] p-3 shadow-[4px_4px_0_#11110f] rounded-none">
          <p className="text-[#11110f] font-black uppercase tracking-widest text-xs mb-1">{label}</p>
          <p className="text-[#11110f] font-mono text-xl font-black">{payload[0].value} <span className="text-[10px] opacity-70">Students</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-[#fafafa] overflow-y-auto p-6 font-sans selection:bg-[#ccff00] selection:text-[#11110f]">
      
      {/* Header & Controls */}
      <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-[#11110f] flex items-center gap-2">
               <LayoutDashboard className="w-6 h-6 text-[#ccff00]" />
               Session Analytics
            </h2>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">
               Historical & real-time telemetry
            </p>
         </div>

         <div className="flex flex-wrap gap-3">
            {/* Custom Class Dropdown */}
            <div className="relative">
               <div 
                 onClick={() => setClassDropdownOpen(!isClassDropdownOpen)}
                 className="flex items-center border-2 border-[#11110f] bg-white cursor-pointer shadow-[2px_2px_0_#11110f] group select-none h-full"
               >
                  <div className="pl-3 pr-2 py-2 bg-[#11110f] text-white flex items-center h-full">
                     <span className="text-[10px] uppercase font-black tracking-widest">Class</span>
                  </div>
                  <div className="px-4 py-2 font-bold text-xs uppercase min-w-[140px] text-[#11110f] flex justify-between items-center group-hover:bg-[#ccff00] transition-colors h-full">
                     {selectedClass}
                     <span className="text-[10px] ml-2">▼</span>
                  </div>
               </div>
               
               {isClassDropdownOpen && (
                 <div className="absolute top-[110%] left-0 w-full bg-white border-2 border-[#11110f] shadow-[4px_4px_0_#11110f] z-20 flex flex-col">
                    {classOptions.map(opt => (
                       <button
                         key={opt}
                         onClick={() => {
                            setSelectedClass(opt);
                            setClassDropdownOpen(false);
                         }}
                         className="px-4 py-3 text-xs font-bold uppercase text-left hover:bg-[#11110f] hover:text-[#ccff00] transition-colors border-b-2 border-gray-100 last:border-b-0"
                       >
                          {opt}
                       </button>
                    ))}
                 </div>
               )}
            </div>

            {/* Timeline Filter */}
            <div className="border-2 border-[#11110f] bg-white flex shadow-[2px_2px_0_#11110f]">
               {(["Days", "Weeks", "Months"] as const).map(t => (
                  <button 
                     key={t}
                     onClick={() => setTimeline(t)}
                     className={`px-4 py-2 font-black uppercase text-[10px] tracking-widest border-r-2 border-[#11110f] last:border-r-0 transition-colors ${
                        timeline === t ? "bg-[#ccff00] text-[#11110f]" : "text-gray-400 hover:bg-gray-100"
                     }`}
                  >
                     {t}
                  </button>
               ))}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
         
        {/* Performance Distribution Chart */}
        <div className="bg-white border-2 border-[#11110f] shadow-[8px_8px_0_#11110f] p-6">
           <h3 className="font-black text-[#11110f] tracking-widest uppercase text-sm mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500" /> Success Rate Distribution
           </h3>
           <div className="h-64 flex items-center relative">
              <ResponsiveContainer width={200} height={200} className="shrink-0 mr-4">
                 <PieChart>
                    <Pie 
                      data={performanceData} 
                      dataKey="value" 
                      nameKey="name"
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={90} 
                      stroke="#11110f" 
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                       {performanceData.map((e, index) => (
                          <Cell key={index} fill={e.color} />
                       ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                 </PieChart>
              </ResponsiveContainer>
              <div className="shrink-0 flex flex-col justify-center space-y-4">
                 {performanceData.map(e => (
                   <div key={e.name} className="flex flex-col">
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 border-2 border-[#11110f]" style={{ backgroundColor: e.color }} />
                         <span className="text-[10px] font-black uppercase text-gray-600 truncate">{e.name}</span>
                      </div>
                      <span className="text-xl font-black font-mono ml-5">{e.value}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Time Spent Breakdown */}
        <div className="bg-white border-2 border-[#11110f] shadow-[8px_8px_0_#11110f] p-6">
           <h3 className="font-black text-[#11110f] tracking-widest uppercase text-sm mb-6 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#ccff00]" /> Time on Task
           </h3>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={distributionData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#11110f" strokeOpacity={0.15} />
                    <XAxis dataKey="label" axisLine={{ stroke: '#11110f', strokeWidth: 2 }} tickLine={false} tick={{ fontSize: 10, fill: "#11110f", fontWeight: "900" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#11110f", fontWeight: "900" }} />
                    <Tooltip cursor={{ fill: "rgba(17,17,15,0.05)" }} content={<CustomBarTooltip />} />
                    <Bar dataKey="count" fill="#11110f" barSize={40} stroke="#11110f" strokeWidth={2}>
                       <LabelList dataKey="count" position="top" fill="#11110f" fontSize={12} fontWeight={900} />
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

      </div>

    </div>
  );
};

export default AnalyticsView;
