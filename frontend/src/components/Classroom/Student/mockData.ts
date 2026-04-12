export interface LogicStep {
  id: string;
  title: string;
  description: string;
}

export interface TaskTest {
  input: string;
  expectedOutput: string;
}

export interface MockTask {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tests: TaskTest[];
  logicSteps: LogicStep[];
}

export const mockTasks: MockTask[] = [
  {
    id: "task-1",
    title: "Reverse the Vowels",
    description:
      "Given a string `s`, reverse only all the vowels in the string and return it. The vowels are 'a', 'e', 'i', 'o', and 'u', and they can appear in both cases.",
    difficulty: "Medium",
    tests: [
      { input: "hello", expectedOutput: "holle" },
      { input: "leetcode", expectedOutput: "leotcede" },
    ],
    logicSteps: [
      {
        id: "step-1",
        title: "Identify Vowels",
        description: "First, we need to know what a vowel is. Create a quick lookup for all vowels (a, e, i, o, u).",
      },
      {
        id: "step-2",
        title: "Two Pointers Strategy",
        description: "Place one pointer at the start of the string, and another at the end of the string.",
      },
      {
        id: "step-3",
        title: "Move Pointers Inward",
        description: "Move the left pointer until you hit a vowel. Then move the right pointer until you hit a vowel. Stop if they cross.",
      },
      {
        id: "step-4",
        title: "Swap & Repeat",
        description: "When both pointers are sitting on a vowel, swap them! Then move both pointers inward and repeat.",
      },
    ],
  },
];

export interface AvatarOption {
  id: string;
  iconSrc: string; // We'll just use colors/shapes for pure UI
  color: string;
  shape: "circle" | "square" | "triangle" | "hexagon";
}

export const avatarOptions: AvatarOption[] = [
  { id: "av-1", iconSrc: "", color: "bg-[#ccff00]", shape: "circle" },
  { id: "av-2", iconSrc: "", color: "bg-purple-500", shape: "square" },
  { id: "av-3", iconSrc: "", color: "bg-rose-500", shape: "triangle" },
  { id: "av-4", iconSrc: "", color: "bg-cyan-400", shape: "hexagon" },
  { id: "av-5", iconSrc: "", color: "bg-orange-500", shape: "circle" },
  { id: "av-6", iconSrc: "", color: "bg-white", shape: "square" },
];

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarId: string;
  timeSpent: string;
  attempts: number;
  correctionsUsed: number;
  status: "coding" | "stuck" | "solved";
  isMe?: boolean;
}

export const mockLeaderboard: LeaderboardEntry[] = [
  { userId: "u1", name: "Alex (You)", avatarId: "av-1", timeSpent: "14m 30s", attempts: 3, correctionsUsed: 1, status: "coding", isMe: true },
  { userId: "u2", name: "Jamie", avatarId: "av-2", timeSpent: "12m 15s", attempts: 1, correctionsUsed: 0, status: "solved" },
  { userId: "u3", name: "Jordan", avatarId: "av-3", timeSpent: "15m 00s", attempts: 5, correctionsUsed: 2, status: "stuck" },
  { userId: "u4", name: "Taylor", avatarId: "av-4", timeSpent: "8m 45s", attempts: 2, correctionsUsed: 0, status: "solved" },
];
