import { UserProfile, Classroom, LabSession, Task, HelpRequest, UserRole } from "../../../shared/types";

// Helper to persist to localStorage or sessionStorage if needed later, 
// for now we'll keep it in-memory for the current session.

class MockDatabase {
  public profiles: Record<string, UserProfile> = {};
  public classrooms: Record<string, Classroom> = {};
  public sessions: Record<string, LabSession> = {};
  public tasks: Record<string, Task> = {};
  public helpRequests: Record<string, HelpRequest> = {};

  constructor() {
    this.seed();
  }

  private seed() {
    // Seed some mock tasks
    const testTask: Task = {
      id: "tsk_123",
      title: "Reverse the Vowels",
      description: "Write a function to reverse the vowels in a given string.",
      initialCode: `def solve(s: str) -> str:\n    pass\n`,
      language: "python",
      testCases: [
        { input: "hello", expectedOutput: "holle" },
        { input: "leetcode", expectedOutput: "leotcede" }
      ]
    };
    this.tasks[testTask.id] = testTask;

    const teacherProfile: UserProfile = {
      id: "teacher_1",
      email: "teacher@icode.com",
      fullName: "Jane Teacher",
      role: "teacher",
      createdAt: new Date().toISOString()
    };
    this.profiles[teacherProfile.id] = teacherProfile;

    const classroom: Classroom = {
      id: "class_1",
      name: "Intro to Python CS101",
      teacherId: "teacher_1",
      joinCode: "PYTHON101",
      activeTaskId: testTask.id,
      createdAt: new Date().toISOString()
    };
    this.classrooms[classroom.id] = classroom;
  }

  // --- Profile Operations ---
  async getProfile(userId: string): Promise<UserProfile | null> {
    await this.delay();
    return this.profiles[userId] || null;
  }

  async createProfile(userId: string, email: string, role: UserRole): Promise<UserProfile> {
    await this.delay();
    if (this.profiles[userId]) {
      return this.profiles[userId];
    }
    const newProfile: UserProfile = {
      id: userId,
      email,
      fullName: email.split("@")[0] || "User",
      role,
      createdAt: new Date().toISOString()
    };
    this.profiles[userId] = newProfile;
    return newProfile;
  }

  // --- Session Operations ---
  async getSessionByJoinCode(joinCode: string): Promise<LabSession | null> {
    await this.delay();
    const classroom = Object.values(this.classrooms).find(c => c.joinCode === joinCode);
    if (!classroom) return null;

    // Simulate finding or creating an active session for the classroom task
    let session = Object.values(this.sessions).find(s => s.classroomId === classroom.id && s.state === "live");
    if (!session && classroom.activeTaskId) {
      session = {
        id: "room_mock_" + Math.random().toString(36).substring(7),
        classroomId: classroom.id,
        taskId: classroom.activeTaskId,
        state: "live",
        startTime: new Date().toISOString()
      };
      this.sessions[session.id] = session;
    }
    return session || null;
  }

  // Helper
  private delay(ms: number = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const mockDb = new MockDatabase();
