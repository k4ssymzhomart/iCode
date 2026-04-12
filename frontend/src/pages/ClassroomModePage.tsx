import React, { useState } from "react";
import LobbyScreen from "@/components/Classroom/Student/LobbyScreen";
import LabLayout from "@/components/Classroom/Student/LabLayout";
import TaskPanel from "@/components/Classroom/Student/TaskPanel";
import CollaborativeEditor from "@/components/Classroom/CollaborativeEditor";
import StudentCompilerPanel from "@/components/Classroom/Student/StudentCompilerPanel";
import ClassmatesPanel from "@/components/Classroom/Student/ClassmatesPanel";
import { sessionService } from "@/services/session";
import { Task } from "../../../shared/types";
import { LoadingState, ErrorState } from "@/components/ui/app-states";
import { useAuth } from "@/lib/auth-context";

type AppState = "lobby" | "loading" | "lab" | "error";

const ClassroomModePage = () => {
  const { profile } = useAuth();
  const [appState, setAppState] = useState<AppState>("lobby");
  const [sessionCode, setSessionCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatarId, setAvatarId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  
  const [code, setCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sessionConfig, setSessionConfig] = useState<any>(null);

  const handleJoin = async (name: string, joinCode: string, avatar: string) => {
    setNickname(name);
    setSessionCode(joinCode);
    setAvatarId(avatar);
    setAppState("loading");

    try {
      const response = await sessionService.joinSession({
        joinCode,
        studentName: name,
        avatarId: avatar,
      });

      if (response.success && response.task && response.sessionId) {
        setCurrentTask(response.task);
        setCode(response.task.initialCode || "");
        setSessionId(response.sessionId);
        setSessionConfig(response.config || null);
        setAppState("lab");
      } else {
        setErrorMessage(response.error || "Failed to join session");
        setAppState("error");
      }
    } catch (e) {
      setErrorMessage("Network error occurred.");
      setAppState("error");
    }
  };

  if (appState === "lobby") {
    return <LobbyScreen onJoin={handleJoin} />;
  }

  if (appState === "loading") {
    return <LoadingState message="Joining Session..." />;
  }

  if (appState === "error") {
    return (
      <ErrorState 
        title="Connection Failed" 
        message={errorMessage} 
        onRetry={() => setAppState("lobby")} 
      />
    );
  }

  if (!currentTask || !sessionId || !profile) {
    return <ErrorState message="No active task found for this session." onRetry={() => setAppState("lobby")} />;
  }

  return (
    <LabLayout
      sessionCode={sessionCode}
      nickname={profile?.fullName || nickname}
      avatarId={avatarId}
      leftPanel={<TaskPanel task={currentTask as any} />}
      centerPanel={
        <CollaborativeEditor 
          roomId={`editor_${sessionId}_${profile.id}`} 
          sessionId={sessionId} 
          userId={profile.id} 
          userName={profile.fullName} 
          initialCode={code} 
          role="student" 
          onChange={(val) => setCode(val)}
        />
      }
      rightPanel={<StudentCompilerPanel code={code} taskId={currentTask.id} config={sessionConfig} />}
      classmatesPanel={<ClassmatesPanel />}
    />
  );
};

export default ClassroomModePage;
