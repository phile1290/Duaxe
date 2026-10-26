export type SubjectType = string;

export type GameMode = 'team' | 'individual';

export type VisualDisplayMode = 'question_image' | 'options_image' | 'text_only';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  /**
   * Phân loại mức độ câu hỏi:
   * - 'co_ban': Câu hỏi nhận biết, thông hiểu kiến thức bài học
   * - 'nang_cao': Câu hỏi vận dụng, nâng cao, xử lý tình huống thực tiễn (từ 1 đến 3 câu trong mỗi bộ đề)
   */
  difficulty?: 'co_ban' | 'nang_cao';
  isAdvanced?: boolean;
  /**
   * Nguyên tắc bắt buộc:
   * - 'question_image': Câu hỏi hiển thị hình ảnh minh họa -> 4 đáp án A, B, C, D chỉ hiển thị VĂN BẢN.
   * - 'options_image': 4 đáp án A, B, C, D là các hình ảnh đồng nhất -> Câu hỏi chỉ hiển thị VĂN BẢN.
   * - 'text_only': Câu hỏi lý thuyết thuần văn bản (không ép hiển thị hình ảnh sai nội dung).
   */
  visualDisplayMode?: VisualDisplayMode;
  visualType?:
    | 'math_shape'
    | 'diagram'
    | 'emoji_icon'
    | 'badge'
    | 'animal'
    | 'clock'
    | 'number_line'
    | 'fraction'
    | 'balance_scale'
    | 'experiment'
    | 'computer_hardware'
    | 'software_icon'
    | 'technology_tool'
    | 'digital_skill'
    | 'ai_concept'
    | 'none';
  visualPrompt?: string;
  visualData?: string;
  visualKey?: string;
  questionSvg?: string;
  /**
   * Hình ảnh minh họa cho 4 đáp án A, B, C, D (chỉ hiển thị khi visualDisplayMode === 'options_image').
   * Khi một đáp án có hình ảnh thì TẤT CẢ 4 đáp án đều phải có hình ảnh để đảm bảo sự đồng nhất, và khi đó câu hỏi là văn bản.
   */
  optionVisuals?: string[];
  optionSvgs?: string[];
  points?: number;
}

export interface QuizSet {
  id: string;
  weekNumber: number; // 1 to 35
  lessonTitle: string;
  subject: SubjectType;
  grade?: number;
  className?: string;
  description?: string;
  questions: Question[];
  createdAt: string;
}

export interface WeeklyScoreRecord {
  score: number;
  correctCount: number;
  wrongCount: number;
  hooksClimbed?: number;
  totalTimeSec?: number; // Tổng số giây trả lời câu hỏi
  callCount?: number; // Số lần được gọi ngẫu nhiên
  lastPlayedDate?: string;
}

export interface SessionStudentRecord {
  studentName: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  totalTimeSec: number;
  callCount: number;
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
  weeklyScores?: Record<number, WeeklyScoreRecord>;
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
  totalTimeSec?: number;
  highestCombo: number;
  weeklyScores: Record<number, WeeklyScoreRecord>;
}

export interface Racer {
  id: string;
  name: string; // Tên học sinh hoặc tên đội
  subInfo?: string; // Mã học sinh hoặc nhóm
  colorHex: string;
  carNumber: number;
  progress: number; // 0 to 100% (hookLevel * 10)
  hookLevel: number; // 0 to 10 (10 móc trên dây thừng rừng cổ thụ)
  score: number;
  correctCount?: number; // Số câu trả lời đúng trong lượt chơi
  wrongCount?: number; // Số câu trả lời sai trong lượt chơi
  totalTimeSec?: number; // Tổng số GIÂY trả lời trong lượt chơi (dùng để phân định thắng thua khi ngang điểm)
  callCount?: number; // Số lần được Bà Già bắt trúng ngẫu nhiên trong lượt chơi
  combo: number;
  isNitro: boolean;
  avatar: string;
  animalName?: string;
  memberNames?: string[]; // Danh sách họ và tên học sinh trong đội (để Bà Già Chống Gậy bắt gà con)
  weeklyScores?: Record<number, WeeklyScoreRecord>;
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
  grade?: number;
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
  rangeScore: number;
  rangeCorrect: number;
  rangeWrong: number;
  rangeHooks: number;
  rangeTimeSec: number;
  weeklyBreakdown: Record<number, WeeklyScoreRecord>;
  highestCombo: number;
  accuracy: number;
}

export interface TeamLeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  teamColor: string;
  avatar: string;
  memberCount: number;
  weeklyScore: number;
  cumulativeScore: number;
  rangeScore: number;
  rangeCorrect: number;
  rangeWrong: number;
  rangeHooks: number;
  rangeTimeSec: number;
  weeklyBreakdown: Record<number, WeeklyScoreRecord>;
  accuracy: number;
}
