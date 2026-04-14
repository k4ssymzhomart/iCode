import type { SessionStudent } from "@shared/types";
import { AlertTriangle, CheckCircle2, Clock, MonitorPlay } from "lucide-react";

const statusMeta = {
  active: {
    label: "Coding",
    icon: <MonitorPlay className="h-3 w-3" />,
    color: "bg-sky-100 border-sky-300",
  },
  idle: {
    label: "Idle",
    icon: <Clock className="h-3 w-3" />,
    color: "bg-gray-100 border-gray-300",
  },
  help: {
    label: "Needs Help",
    icon: <AlertTriangle className="h-3 w-3 text-rose-600" />,
    color: "bg-rose-100 border-rose-300",
  },
  resolved: {
    label: "Resolved",
    icon: <CheckCircle2 className="h-3 w-3 text-[#11110f]" />,
    color: "bg-[#ccff00] border-[#11110f]",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3 w-3 text-[#11110f]" />,
    color: "bg-[#ccff00] border-[#11110f]",
  },
  joined: {
    label: "Joined",
    icon: <MonitorPlay className="h-3 w-3" />,
    color: "bg-sky-100 border-sky-300",
  },
  offline: {
    label: "Offline",
    icon: <Clock className="h-3 w-3" />,
    color: "bg-gray-100 border-gray-300",
  },
} as const;

const formatTime = (value?: string | null) => {
  if (!value) {
    return "Waiting";
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const ClassmatesPanel = ({ students }: { students: SessionStudent[] }) => {
  if (students.length === 0) {
    return (
      <div className="border-2 border-dashed border-[#11110f] bg-white p-8 text-center text-sm font-bold uppercase tracking-widest text-gray-400">
        No classmates have joined this session yet.
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-1 gap-4 pb-12 font-sans md:grid-cols-2 lg:grid-cols-4">
      {students.map((student) => {
        const meta = statusMeta[student.status] ?? statusMeta.offline;

        return (
          <div
            key={student.studentId}
            className="flex flex-col border-2 border-[#11110f] bg-white p-4 shadow-[4px_4px_0_#11110f] transition-transform hover:-translate-y-1"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#11110f] bg-[#ccff00] font-black uppercase text-[#11110f]">
                {(student.profile?.fullName ?? "S").slice(0, 1)}
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-wide text-[#11110f]">
                  {student.profile?.fullName ?? "Student"}
                </h4>
                <div
                  className={`mt-1.5 inline-flex items-center gap-1 border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#11110f] ${meta.color}`}
                >
                  {meta.icon}
                  {meta.label}
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-2 border-t-2 border-gray-100 pt-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#666259]">
                <span>Task</span>
                <span className="font-mono text-[#11110f]">
                  {student.currentTaskId ? student.currentTaskId.slice(0, 6) : "--"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-[#666259]">
                <span>Activity</span>
                <span className="font-mono text-[#11110f]">
                  {formatTime(student.lastActivityAt ?? student.joinedAt)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ClassmatesPanel;
