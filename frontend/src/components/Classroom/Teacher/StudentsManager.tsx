import React, { useState } from "react";
import { StudentData } from "./mockData";
import { Users, UserPlus, UserMinus, Search, RefreshCw, Key, X } from "lucide-react";

interface StudentsManagerProps {
  students: StudentData[];
}

const StudentsManager: React.FC<StudentsManagerProps> = ({ students }) => {
  const [search, setSearch] = useState("");
  const [localStudents, setLocalStudents] = useState<StudentData[]>(students);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");

  const handleAddStudent = () => {
     if (!newStudentName.trim()) return;
     const newId = `stu_${Math.random().toString(36).substring(2, 6)}`;
     const newStudent: StudentData = {
        id: newId,
        name: newStudentName,
        status: 'offline',
        currentTask: '-',
        successRate: 0,
        timeSpent: 0,
        attempts: 0,
        correctionsUsed: 0,
        avatarColor: 'bg-gray-200',
        avatarShape: 'circle',
        mockCode: '',
        lastError: null,
        helpRequestedAt: null,
     };
     setLocalStudents([newStudent, ...localStudents]);
     setNewStudentName("");
     setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
     setLocalStudents(localStudents.filter(s => s.id !== id));
  };

  const filteredStudents = localStudents.filter(s => 
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#fafafa] overflow-hidden font-sans">
      
      {/* Header */}
      <div className="p-6 border-b-2 border-[#11110f] bg-white shrink-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-[#11110f] flex items-center gap-2">
               <Users className="w-6 h-6 text-[#11110f]" />
               Class Member Management
            </h2>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">
               Manage roster, access, and lab enrollment
            </p>
         </div>

         <div className="flex gap-2">
            <button onClick={() => setShowAddModal(true)} className="bg-[#ccff00] border-2 border-[#11110f] text-[#11110f] px-4 py-2 font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-[#bdf300] shadow-[2px_2px_0_#11110f]">
               <UserPlus className="w-4 h-4" /> Add Student
            </button>
            <button className="bg-white border-2 border-[#11110f] text-[#11110f] px-4 py-2 font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-gray-50 shadow-[2px_2px_0_#11110f]">
               <RefreshCw className="w-4 h-4" /> Sync Roster
            </button>
         </div>
      </div>

      {/* Roster Controls */}
      <div className="p-4 bg-gray-100 border-b-2 border-[#11110f] shrink-0">
         <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border-2 border-[#11110f] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00]"
            />
         </div>
      </div>

      {/* Roster Table */}
      <div className="flex-1 overflow-auto bg-white relative">
         <table className="w-full text-left border-collapse border-b-2 border-t-2 border-[#11110f]">
            <colgroup>
               <col className="w-2/5" />
               <col className="w-1/4" />
               <col className="w-1/4" />
               <col className="w-[10%]" />
            </colgroup>
            <thead className="bg-[#11110f] text-white uppercase text-[10px] tracking-widest sticky top-0 z-20 outline outline-2 outline-[#11110f] outline-offset-[-2px]">
               <tr>
                  <th className="p-3 border-x-2 border-[#11110f]">Name</th>
                  <th className="p-3 border-x-2 border-[#11110f]">System ID</th>
                  <th className="p-3 border-x-2 border-[#11110f]">Status</th>
                  <th className="p-3 border-x-2 border-[#11110f] text-right">Actions</th>
               </tr>
            </thead>
            <tbody>
               {filteredStudents.map(student => (
                 <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50 group transition-colors">
                    <td className="p-3 border-x-2 border-[#11110f]">
                       <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 ${student.avatarColor} border-2 border-[#11110f]`} style={{
                            borderRadius: student.avatarShape === 'circle' ? '50%' : student.avatarShape === 'triangle' ? '0' : '20%',
                         }} />
                         <span className="font-bold text-sm text-[#11110f]">{student.name}</span>
                       </div>
                    </td>
                    <td className="p-3 border-x-2 border-[#11110f] font-mono text-xs text-gray-500 font-bold">
                       {student.id.toUpperCase()}
                    </td>
                    <td className="p-3 border-x-2 border-[#11110f]">
                       <span className={`text-[10px] uppercase font-black px-2 py-0.5 border-2 ${
                         student.status !== 'offline' ? 'bg-[#ccff00] border-[#11110f] text-[#11110f]' : 'bg-gray-200 border-gray-400 text-gray-500'
                       }`}>
                          {student.status !== 'offline' ? 'Active in Lab' : 'Offline'}
                       </span>
                    </td>
                    <td className="p-3 border-x-2 border-[#11110f] text-right space-x-2">
                       <button className="p-1.5 border-2 border-transparent text-[#11110f] hover:bg-gray-200 hover:border-[#11110f] transition-all inline-flex" title="Reset Password">
                          <Key className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleDelete(student.id)} className="p-1.5 border-2 border-transparent text-rose-600 hover:bg-rose-100 hover:border-rose-600 transition-all inline-flex" title="Remove from Roster">
                          <UserMinus className="w-4 h-4" />
                       </button>
                    </td>
                 </tr>
               ))}
               {filteredStudents.length === 0 && (
                 <tr>
                    <td colSpan={4} className="p-8 text-center text-sm font-bold text-gray-400 uppercase tracking-widest border-x-2 border-[#11110f]">
                       No matching students found
                    </td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>

      {showAddModal && (
        <div className="absolute inset-0 z-50 bg-[#11110f]/50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white border-4 border-[#11110f] shadow-[8px_8px_0_#ccff00] w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-black uppercase tracking-widest text-[#11110f]">Add Student</h3>
                 <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100">
                    <X className="w-6 h-6" />
                 </button>
              </div>
              <div className="space-y-4">
                 <div>
                    <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">Student Name</label>
                    <input autoFocus type="text" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddStudent()} className="w-full border-2 border-[#11110f] px-4 py-3 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#ccff00] outline-none transition-shadow" placeholder="Enter full name..." />
                 </div>
                 <button onClick={handleAddStudent} className="w-full bg-[#11110f] text-[#ccff00] font-black uppercase tracking-widest py-3 hover:bg-[#222] transition-colors">
                    Enroll Student
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default StudentsManager;
