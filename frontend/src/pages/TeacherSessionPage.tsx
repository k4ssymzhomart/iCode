import LiveSession from "@/components/Classroom/LiveSession";
import { appPaths } from "@/app/paths";
import {
  buildFallbackTeacherSession,
  loadTeacherSession,
} from "@/features/classroom/sessionStore";
import { useNavigate } from "@/lib/router";

const TeacherSessionPage = ({ roomId }: { roomId: string }) => {
  const navigate = useNavigate();
  const session = loadTeacherSession(roomId) ?? buildFallbackTeacherSession(roomId);

  return (
    <LiveSession
      sessionData={session}
      onExit={() => navigate(appPaths.teacher)}
    />
  );
};

export default TeacherSessionPage;
