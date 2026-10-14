export type SubjectType = 'Toán' | 'Tiếng Việt' | 'Khoa học' | 'Lịch sử & Địa lí' | 'Tiếng Anh';

export type GameMode = 'team' | 'individual';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  visualType?: 'math_shape' | 'diagram' | 'emoji_icon' | 'badge' | 'animal' | 'clock';
  visualPrompt?: string;
  visualData?: string;
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
  weeklyScores: Record<number, {
    score: number;
    correctCount: number;
    wrongCount: number;
    lastPlayedDate?: string;
  }>;
}

export interface Racer {
  id: string;
  name: string; // Tên học sinh hoặc tên đội
  subInfo?: string; // Mã học sinh hoặc nhóm
  colorHex: string;
  carNumber: number;
  progress: number; // 0 to 100%
  score: number;
  combo: number;
  isNitro: boolean;
  avatar: string;
  lane: number;
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: number;
  academicYear: string;
  teacherName: string;
  teams: Team[];
}

export interface RaceSetupConfig {
  weekNumber: number; // 1 to 35
  lessonTitle: string;
  subject: SubjectType;
  grade: number;
  className?: string;
  gameMode: GameMode;
  questionCount: number;
  studentsText: string;
  teamsConfig: {
    teamId: string;
    teamName: string;
    studentNames: string[];
  }[];
  pdfFileName?: string;
  pdfBase64?: string | null;
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
