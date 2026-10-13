export type SubjectType = 'Toán' | 'Tiếng Việt' | 'Khoa học' | 'Lịch sử & Địa lí' | 'Tiếng Anh';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  visualType?: 'math_shape' | 'diagram' | 'emoji_icon' | 'badge' | 'animal' | 'clock';
  visualPrompt?: string;
  visualData?: string; // SVG or icon code
  points?: number;
}

export interface QuizSet {
  id: string;
  weekNumber: number; // 1 to 35
  lessonTitle: string;
  subject: SubjectType;
  grade: number; // 1 - 5
  description?: string;
  questions: Question[];
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  carHex: string;
  carNumber: number;
  score: number;
  lap: number; // 0 to 100%
  combo: number;
  isNitroActive: boolean;
  nitroRemainingSec: number;
  studentIds: string[];
  avatar: string;
}

export interface Student {
  id: string;
  classId: string;
  name: string;
  rollNumber: string;
  teamId: string;
  gender: 'nam' | 'nu';
  avatar: string;
  cumulativeScore: number;
  totalCorrect: number;
  totalWrong: number;
  highestCombo: number;
  // Map of week 1 -> 35
  weeklyScores: Record<number, {
    score: number;
    correctCount: number;
    wrongCount: number;
    lastPlayedDate?: string;
  }>;
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: number;
  academicYear: string;
  teacherName: string;
  teams: Team[];
}

export interface RaceCarState {
  lane: number;
  distance: number; // 0.0 to 100.0 (progress along track)
  speed: number;
  targetDistance: number;
  isSliding: boolean;
  isNitro: boolean;
  consecutiveCorrect: number;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  teamName: string;
  teamColor: string;
  rollNumber: string;
  weeklyScore: number;
  cumulativeScore: number;
  highestCombo: number;
  accuracy: number;
}
