import TeacherDashboard from "@/components/Classroom/TeacherDashboard";
import { appPaths } from "@/app/paths";
import {
  saveTeacherSession,
  type TeacherSessionData,
} from "@/features/classroom/sessionStore";
import { useNavigate } from "@/lib/router";

const TeacherViewPage = () => {
  const navigate = useNavigate();

  const handleJoinRoom = (session: TeacherSessionData) => {
    saveTeacherSession(session);
    navigate(appPaths.teacherSession(session.roomId));
  };

  return <TeacherDashboard onJoinRoom={handleJoinRoom} />;
};

export default TeacherViewPage;
