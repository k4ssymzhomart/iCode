import { useEffect, useState } from "react";
import type { StudentOverview, TeacherSession } from "@shared/types";
import LiveSession from "@/components/Classroom/LiveSession";
import { LoadingState, ErrorState } from "@/components/ui/app-states";
import { appPaths } from "@/app/paths";
import { useNavigate } from "@/lib/router";
import { buildSessionRoomId, SessionRoomProvider } from "@/lib/liveblocks";
import { classroomService } from "@/services/classroom";

const TeacherSessionPage = ({
  sessionId,
  studentId,
  taskId,
}: {
  sessionId: string;
  studentId: string;
  taskId: string;
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState<TeacherSession | null>(null);
  const [student, setStudent] = useState<StudentOverview | null>(null);

  const loadFocusSession = async () => {
    setIsLoading(true);
    try {
      const response = await classroomService.getTeacherSessionDashboard(sessionId);
      const nextStudent = response.snapshot.students.find(
        (entry) => entry.studentId === studentId,
      );

      setSession(response.snapshot.session);
      setStudent(
        nextStudent
          ? {
              ...nextStudent,
              currentTaskId: taskId || nextStudent.currentTaskId,
            }
          : null,
      );
      setErrorMessage(nextStudent ? "" : "Student could not be found in this session.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load teacher focus mode.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadFocusSession();
  }, [sessionId, studentId, taskId]);

  if (isLoading) {
    return <LoadingState message="Loading Focus Mode..." />;
  }

  if (!session || !student) {
    return (
      <ErrorState
        title="Focus Mode Unavailable"
        message={errorMessage || "This classroom focus session could not be loaded."}
        onRetry={() => navigate(appPaths.teacher)}
      />
    );
  }

  return (
    <SessionRoomProvider
      id={buildSessionRoomId(session.id)}
      initialPresence={{
        currentTaskId: student.currentTaskId ?? taskId,
        status: "active",
        workspaceStudentId: student.studentId,
        mode: "view",
      }}
      initialStorage={{
        activeTaskId: session.activeTaskId ?? taskId,
        broadcastMessage: session.broadcastMessage ?? null,
        pinnedHint: session.pinnedHint ?? null,
        snippets: {},
        studentStatuses: {},
        helpStatuses: {},
      }}
    >
      <LiveSession
        session={session}
        student={student}
        onExit={() => navigate(appPaths.teacher)}
        onResolveHelp={async ({ taskId, responseNotes }) => {
          const response = await classroomService.resolveHelpRequest(session.id, {
            studentId: student.studentId,
            taskId,
            responseNotes,
          });
          await loadFocusSession();
          return response.response;
        }}
        onResetCode={async () => {
          if (!student.currentTaskId) {
            return;
          }

          await classroomService.resetStudentCode(
            session.id,
            student.studentId,
            student.currentTaskId,
          );
          await loadFocusSession();
        }}
        onCompleteSession={async () => {
          await classroomService.updateTeacherSessionState(session.id, "completed");
          navigate(appPaths.teacher);
        }}
      />
    </SessionRoomProvider>
  );
};

export default TeacherSessionPage;
