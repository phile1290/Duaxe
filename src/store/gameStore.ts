import { create } from 'zustand';
import {
  ClassRoom,
  GameMode,
  LeaderboardEntry,
  Question,
  QuizSet,
  Racer,
  RaceSetupConfig,
  SessionStudentRecord,
  Student,
  Team,
  TeamLeaderboardEntry,
  WeeklyScoreRecord,
} from '../types';
import { INITIAL_CLASS, INITIAL_STUDENTS, PREBUILT_QUIZZES } from '../services/mockData';
import {
  clearPersistentStatsForClass,
  getActiveClassId,
  getPersistentStats,
  getSavedClassesFromLocalStorage,
  normalizeEntityKey,
  recordTurnResultToStorage,
} from '../services/classroomStorageService';
import { sound } from '../services/soundService';
import confetti from 'canvas-confetti';

const CLIMBER_PALETTE = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#eab308', // Yellow
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#f43f5e', // Rose
  '#d946ef', // Fuchsia
  '#0284c7', // Sky
  '#15803d', // Green
  '#ca8a04', // Amber
  '#4f46e5', // Violet
  '#059669', // Mint
  '#e11d48', // Crimson
  '#7c3aed', // Purple Deep
];

const WILD_ANIMAL_AVATARS = [
  { avatar: '🦁', animalName: 'Sư Tử Chúa' },
  { avatar: '🐯', animalName: 'Hổ Vằn Rừng Xanh' },
  { avatar: '🐆', animalName: 'Báo Đốm Thần Tốc' },
  { avatar: '🐻', animalName: 'Gấu Nâu Cổ Thụ' },
  { avatar: '🐺', animalName: 'Sói Đầu Đàn' },
  { avatar: '🐒', animalName: 'Khỉ Vàng Leo Núi' },
  { avatar: '🦊', animalName: 'Cáo Đỏ Tinh Anh' },
  { avatar: '🐼', animalName: 'Gấu Trúc Khổng Lồ' },
  { avatar: '🦅', animalName: 'Đại Bàng Núi Cao' },
  { avatar: '🐘', animalName: 'Voi Rừng Dũng Mãnh' },
  { avatar: '🦌', animalName: 'Hươu Sao Nhanh Nhẹn' },
  { avatar: '🐊', animalName: 'Cá Sấu Đầm Lầy' },
];

/**
 * So sánh thứ hạng giữa 2 người chơi / đội nhóm (Racer):
 * 1. Điểm số cao hơn xếp trên
 * 2. Số câu trả lời đúng nhiều hơn xếp trên
 * 3. Móc dây thừng leo cao hơn xếp trên
 * 4. KHI NGANG ĐIỂM / NGANG SỐ CÂU ĐÚNG: Dựa vào SỐ GIÂY trả lời nhanh nhất (ít giây hơn đứng nhất!)
 */
export function compareRacersByResult(a: Racer, b: Racer): number {
  if (b.score !== a.score) return b.score - a.score;

  const aCorrect = a.correctCount ?? 0;
  const bCorrect = b.correctCount ?? 0;
  if (bCorrect !== aCorrect) return bCorrect - aCorrect;

  const aHook = a.hookLevel ?? Math.round((a.progress || 0) / 10);
  const bHook = b.hookLevel ?? Math.round((b.progress || 0) / 10);
  if (bHook !== aHook) return bHook - aHook;

  const aTurns = aCorrect + (a.wrongCount ?? 0);
  const bTurns = bCorrect + (b.wrongCount ?? 0);
  if (aTurns > 0 && bTurns > 0) {
    const aTime = a.totalTimeSec ?? 999999;
    const bTime = b.totalTimeSec ?? 999999;
    if (aTime !== bTime) return aTime - bTime;
  } else if (aTurns > 0 && bTurns === 0) {
    return -1;
  } else if (bTurns > 0 && aTurns === 0) {
    return 1;
  }

  return 0;
}

/**
 * So sánh thứ hạng cá nhân học sinh trong lượt chơi (SessionStudentRecord):
 * 1. Điểm số cao hơn xếp trên
 * 2. Số câu trả lời đúng nhiều hơn xếp trên
 * 3. KHI NGANG ĐIỂM / NGANG SỐ CÂU ĐÚNG: Số GIÂY trả lời nhanh nhất (ít giây hơn đứng nhất!)
 */
export function compareSessionStudentsByResult(
  a: SessionStudentRecord,
  b: SessionStudentRecord
): number {
  if (b.score !== a.score) return b.score - a.score;
  if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
  const aTurns = a.correctCount + a.wrongCount;
  const bTurns = b.correctCount + b.wrongCount;
  if (aTurns > 0 && bTurns > 0) {
    if (a.totalTimeSec !== b.totalTimeSec) return a.totalTimeSec - b.totalTimeSec;
  } else if (aTurns > 0 && bTurns === 0) {
    return -1;
  } else if (bTurns > 0 && aTurns === 0) {
    return 1;
  }
  return 0;
}

// Pick a random student & their team/individual rope index across all available participants.
// LƯU Ý QUAN TRỌNG: Bà Già Chống Gậy bắt gà hoàn toàn NGẪU NHIÊN (có hoàn lại) trên toàn bộ danh sách học sinh,
// do đó trong một cuộc chơi một em học sinh có thể được gọi ngẫu nhiên nhiều lần (không bắt buộc chỉ gọi 1 lần và cũng không ép buộc lặp lại).
function pickRandomTurn(
  gameMode: GameMode,
  racers: Racer[],
  students: Student[]
): { racerIndex: number; studentName: string | null } {
  if (racers.length === 0) {
    return { racerIndex: 0, studentName: null };
  }

  if (gameMode === 'individual') {
    const randIdx = Math.floor(Math.random() * racers.length);
    return {
      racerIndex: randIdx,
      studentName: racers[randIdx]?.name || null,
    };
  }

  // Team mode: build flat pool of all students with their team index so every student has an equal random chance on every turn
  const pool: { studentName: string; racerIndex: number }[] = [];
  racers.forEach((r, rIdx) => {
    if (r.memberNames && r.memberNames.length > 0) {
      r.memberNames.forEach((name) => {
        pool.push({ studentName: name, racerIndex: rIdx });
      });
    } else {
      const teamStds = students.filter((s) => s.teamId === r.id);
      if (teamStds.length > 0) {
        teamStds.forEach((s) => {
          pool.push({ studentName: s.name, racerIndex: rIdx });
        });
      } else {
        pool.push({ studentName: r.name, racerIndex: rIdx });
      }
    }
  });

  if (pool.length === 0) {
    const randRacer = Math.floor(Math.random() * racers.length);
    return { racerIndex: randRacer, studentName: racers[randRacer]?.name || null };
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return chosen;
}

interface GameStoreState {
  viewMode: 'classroom' | 'dashboard';
  currentClass: ClassRoom;
  students: Student[];
  selectedWeek: number;
  quizzes: QuizSet[];
  currentQuiz: QuizSet | null;
  activeQuestionIndex: number;
  currentQuestion: Question | null;

  // Game Mode & Climbers (Teams or Individual Students)
  gameMode: GameMode;
  racers: Racer[];
  currentRacerIndex: number;
  selectedStudentName: string | null;
  studentCallCounts: Record<string, number>;
  sessionStudentRecords: Record<string, SessionStudentRecord>;
  isSetupOpen: boolean;

  // Session status
  gameState: 'idle' | 'question' | 'feedback' | 'finished';
  lastFeedback: {
    isCorrect: boolean;
    racerName: string;
    studentName?: string | null;
    hookLevel: number;
    pointsDelta: number;
    responseTimeSec: number;
    totalCorrectCount: number;
    totalTimeSec: number;
    studentCallCount: number;
    explanation: string;
    isNitroTriggered: boolean;
  } | null;

  winnerRacer: Racer | null;
  isMuted: boolean;
  isSettingsOpen: boolean;

  // Actions
  setViewMode: (mode: 'classroom' | 'dashboard') => void;
  setSelectedWeek: (week: number) => void;
  setCurrentQuiz: (quiz: QuizSet) => void;
  openSetup: () => void;
  closeSetup: () => void;
  openSettings: () => void;
  closeSettings: () => void;

  selectStudentToAnswer: (studentName: string, racerIndex?: number) => void;
  setCurrentRacerIndex: (racerIndex: number) => void;

  setupRace: (config: RaceSetupConfig, generatedQuestions: Question[]) => void;
  startRace: () => void;
  resetRace: () => void;
  openNextQuestion: () => void;
  answerQuestion: (optionIndex: number, elapsedSeconds?: number) => void;
  closeFeedback: () => void;
  toggleSound: () => boolean;

  // Student & Roster management
  addStudent: (
    student: Omit<
      Student,
      'id' | 'cumulativeScore' | 'totalCorrect' | 'totalWrong' | 'highestCombo' | 'weeklyScores'
    >
  ) => void;
  importStudentsCsv: (csvContent: string) => number;
  exportStudentsCsv: () => string;
  updateTeamAssignment: (studentId: string, teamId: string) => void;
  addGeneratedQuiz: (quiz: QuizSet) => void;

  // Analytics & Leaderboard selectors (Individual & Team, Weekly & Cumulative Range, By Selected Class)
  resetClassStatistics: (targetClassId?: string) => void;
  getLeaderboard: (
    weekNumber?: number,
    startWeek?: number,
    endWeek?: number,
    targetClassId?: string
  ) => LeaderboardEntry[];
  getTeamLeaderboard: (
    weekNumber?: number,
    startWeek?: number,
    endWeek?: number,
    targetClassId?: string
  ) => TeamLeaderboardEntry[];
}

function createInitialRacers(teams: Team[], students: Student[]): Racer[] {
  return teams.map((team, idx) => {
    const wild = WILD_ANIMAL_AVATARS[idx % WILD_ANIMAL_AVATARS.length];
    const teamMembers = students.filter((s) => s.teamId === team.id).map((s) => s.name);
    return {
      id: team.id,
      name: team.name,
      subInfo: `${teamMembers.length} bạn`,
      colorHex: team.carHex,
      carNumber: idx + 1,
      progress: 0,
      hookLevel: 0,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      totalTimeSec: 0,
      callCount: 0,
      combo: 0,
      isNitro: false,
      avatar: wild.avatar,
      animalName: wild.animalName,
      memberNames: teamMembers,
      weeklyScores: team.weeklyScores || {},
      lane: idx,
    };
  });
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  viewMode: 'classroom',
  currentClass: INITIAL_CLASS,
  students: INITIAL_STUDENTS,
  selectedWeek: 1,
  quizzes: PREBUILT_QUIZZES.map((q) => ({ ...q, lessonTitle: q.lessonTitle.toUpperCase() })),
  currentQuiz: {
    ...PREBUILT_QUIZZES[0],
    lessonTitle: PREBUILT_QUIZZES[0].lessonTitle.toUpperCase(),
  },
  activeQuestionIndex: 0,
  currentQuestion: PREBUILT_QUIZZES[0].questions[0] || null,

  gameMode: 'team',
  racers: createInitialRacers(INITIAL_CLASS.teams, INITIAL_STUDENTS),
  currentRacerIndex: 0,
  selectedStudentName: INITIAL_STUDENTS[0]?.name || null,
  studentCallCounts: {},
  sessionStudentRecords: {},
  isSetupOpen: true,

  gameState: 'idle',
  lastFeedback: null,
  winnerRacer: null,
  isMuted: false,
  isSettingsOpen: false,

  setViewMode: (mode) => set({ viewMode: mode }),
  openSetup: () => set({ isSetupOpen: true }),
  closeSetup: () => set({ isSetupOpen: false }),
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),

  selectStudentToAnswer: (studentName, racerIndex) => {
    set((state) => {
      const normKey = normalizeEntityKey(studentName);
      const nextCalls = {
        ...state.studentCallCounts,
        [normKey]: (state.studentCallCounts[normKey] || 0) + 1,
      };
      return {
        selectedStudentName: studentName,
        currentRacerIndex: typeof racerIndex === 'number' ? racerIndex : state.currentRacerIndex,
        studentCallCounts: nextCalls,
      };
    });
  },

  setCurrentRacerIndex: (racerIndex) => {
    set({
      currentRacerIndex: racerIndex,
      selectedStudentName: null,
    });
  },

  setSelectedWeek: (week) => {
    const { quizzes } = get();
    const foundQuiz = quizzes.find((q) => q.weekNumber === week) || quizzes[0];
    set({
      selectedWeek: week,
      currentQuiz: foundQuiz ? { ...foundQuiz, lessonTitle: foundQuiz.lessonTitle.toUpperCase() } : null,
      activeQuestionIndex: 0,
      currentQuestion: foundQuiz?.questions[0] || null,
    });
  },

  setCurrentQuiz: (quiz) => {
    set({
      currentQuiz: { ...quiz, lessonTitle: quiz.lessonTitle.toUpperCase() },
      selectedWeek: quiz.weekNumber,
      activeQuestionIndex: 0,
      currentQuestion: quiz.questions[0] || null,
      gameState: 'idle',
    });
  },

  setupRace: (config, questions) => {
    const { currentClass, students, quizzes } = get();
    sound.playEngineRev();

    // 1. Build Climbers (Thú Hoang Leo Dây Thừng 10 Móc) based on Mode
    let newRacers: Racer[] = [];

    if (config.gameMode === 'individual') {
      const studentList = config.studentsText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const rawList = studentList.length > 0 ? studentList : students.map((s) => s.name);

      newRacers = rawList.map((name, idx) => {
        const wild = WILD_ANIMAL_AVATARS[idx % WILD_ANIMAL_AVATARS.length];
        return {
          id: `indiv-${idx}`,
          name: name,
          subInfo: `Dây #${idx + 1}`,
          colorHex: CLIMBER_PALETTE[idx % CLIMBER_PALETTE.length],
          carNumber: idx + 1,
          progress: 0,
          hookLevel: 0,
          score: 0,
          correctCount: 0,
          wrongCount: 0,
          totalTimeSec: 0,
          callCount: 0,
          combo: 0,
          isNitro: false,
          avatar: wild.avatar,
          animalName: wild.animalName,
          memberNames: [name],
          weeklyScores: {},
          lane: idx,
        };
      });
    } else {
      newRacers = config.teamsConfig.map((t, idx) => {
        const wild = WILD_ANIMAL_AVATARS[idx % WILD_ANIMAL_AVATARS.length];
        return {
          id: t.teamId,
          name: t.teamName,
          subInfo: `${t.studentNames.length} học sinh`,
          colorHex: CLIMBER_PALETTE[idx % CLIMBER_PALETTE.length],
          carNumber: idx + 1,
          progress: 0,
          hookLevel: 0,
          score: 0,
          correctCount: 0,
          wrongCount: 0,
          totalTimeSec: 0,
          callCount: 0,
          combo: 0,
          isNitro: false,
          avatar: wild.avatar,
          animalName: wild.animalName,
          memberNames: t.studentNames,
          weeklyScores: {},
          lane: idx,
        };
      });
    }

    // 2. Build or Update QuizSet with UPPERCASE lessonTitle
    const upperLessonTitle = (config.lessonTitle || 'BÀI HỌC').trim().toUpperCase();
    const newQuizSet: QuizSet = {
      id: `quiz-week-${config.weekNumber}-${Date.now()}`,
      weekNumber: config.weekNumber,
      lessonTitle: upperLessonTitle,
      subject: config.subject,
      grade: config.grade,
      description: `BÀI HỌC: ${upperLessonTitle}`,
      questions: questions.length > 0 ? questions : get().currentQuiz?.questions || [],
      createdAt: new Date().toISOString(),
    };

    // Update students list in store to reflect the entered students and team assignments
    let finalStudents = [...students];
    const allEnteredNames: { name: string; teamId: string }[] = [];

    if (config.gameMode === 'team' && config.teamsConfig.length > 0) {
      config.teamsConfig.forEach((t) => {
        t.studentNames.forEach((sName) => {
          if (sName.trim()) {
            allEnteredNames.push({ name: sName.trim(), teamId: t.teamId });
          }
        });
      });
    }

    const studentListFromBox2 = config.studentsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    studentListFromBox2.forEach((sName, idx) => {
      if (!allEnteredNames.some((x) => x.name.toLowerCase() === sName.toLowerCase())) {
        const fallbackTeamId =
          config.teamsConfig[idx % Math.max(1, config.teamsConfig.length)]?.teamId || 'team-1';
        allEnteredNames.push({ name: sName, teamId: fallbackTeamId });
      }
    });

    const persistentStats = getPersistentStats(getActiveClassId() || currentClass.id);

    if (allEnteredNames.length > 0) {
      finalStudents = allEnteredNames.map((entry, idx) => {
        const found = students.find((s) => s.name.toLowerCase() === entry.name.toLowerCase());
        const savedStat = persistentStats.individualStats[normalizeEntityKey(entry.name)];
        const mergedWeekly = {
          ...(savedStat?.weeklyScores || {}),
        };
        const totalScore = Object.values(mergedWeekly).reduce((acc, w) => acc + (w.score || 0), 0);
        const totalCorr = Object.values(mergedWeekly).reduce((acc, w) => acc + (w.correctCount || 0), 0);
        const totalWr = Object.values(mergedWeekly).reduce((acc, w) => acc + (w.wrongCount || 0), 0);

        return {
          id: found?.id || `std-${idx + 1}-${Date.now()}`,
          classId: getActiveClassId() || currentClass.id,
          name: entry.name,
          rollNumber: found?.rollNumber || `${idx + 1 < 10 ? '0' : ''}${idx + 1}`,
          teamId: entry.teamId,
          gender: found?.gender || (idx % 2 === 0 ? 'nam' : 'nu'),
          avatar: found?.avatar || (idx % 2 === 0 ? '👦' : '👧'),
          cumulativeScore: totalScore,
          totalCorrect: totalCorr,
          totalWrong: totalWr,
          highestCombo: found?.highestCombo || 0,
          weeklyScores: mergedWeekly,
        };
      });
    }

    // Update currentClass teams if in team mode
    const updatedTeams: Team[] =
      config.gameMode === 'team' && config.teamsConfig.length > 0
        ? config.teamsConfig.map((tc, idx) => {
            const wild = WILD_ANIMAL_AVATARS[idx % WILD_ANIMAL_AVATARS.length];
            const savedTeamStat = persistentStats.teamStats[normalizeEntityKey(tc.teamName)];
            return {
              id: tc.teamId,
              name: tc.teamName,
              color: 'from-amber-400 to-orange-500',
              carHex: CLIMBER_PALETTE[idx % CLIMBER_PALETTE.length],
              carNumber: idx + 1,
              score: 0,
              lap: 0,
              combo: 0,
              isNitroActive: false,
              nitroRemainingSec: 0,
              studentIds: finalStudents.filter((s) => s.teamId === tc.teamId).map((s) => s.id),
              avatar: wild.avatar,
              weeklyScores: savedTeamStat?.weeklyScores || {},
            };
          })
        : currentClass.teams;

    // Pick initial random student & team
    const randomTurn = pickRandomTurn(config.gameMode, newRacers, finalStudents);
    const initialCalls: Record<string, number> = {};
    if (randomTurn.studentName) {
      initialCalls[normalizeEntityKey(randomTurn.studentName)] = 1;
    }

    set({
      currentClass: {
        ...currentClass,
        id: getActiveClassId() || currentClass.id,
        name: config.className || currentClass.name,
        teams: updatedTeams,
      },
      students: finalStudents,
      gameMode: config.gameMode,
      racers: newRacers,
      currentRacerIndex: randomTurn.racerIndex,
      selectedStudentName: randomTurn.studentName,
      studentCallCounts: initialCalls,
      sessionStudentRecords: {},
      selectedWeek: config.weekNumber,
      currentQuiz: newQuizSet,
      quizzes: [newQuizSet, ...quizzes.filter((q) => q.weekNumber !== config.weekNumber)],
      activeQuestionIndex: 0,
      currentQuestion: newQuizSet.questions[0] || null,
      isSetupOpen: false,
      gameState: 'question',
      lastFeedback: null,
      winnerRacer: null,
    });
    sound.stopCelebrationMusic();
  },

  startRace: () => {
    const { racers, currentQuiz, gameMode, students } = get();
    sound.stopCelebrationMusic();
    sound.playEngineRev();

    const resetRacers = racers.map((r) => ({
      ...r,
      progress: 0,
      hookLevel: 0,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      totalTimeSec: 0,
      callCount: 0,
      combo: 0,
      isNitro: false,
    }));

    const randomTurn = pickRandomTurn(gameMode, resetRacers, students);
    const initialCalls: Record<string, number> = {};
    if (randomTurn.studentName) {
      initialCalls[normalizeEntityKey(randomTurn.studentName)] = 1;
    }

    set({
      racers: resetRacers,
      currentRacerIndex: randomTurn.racerIndex,
      selectedStudentName: randomTurn.studentName,
      studentCallCounts: initialCalls,
      sessionStudentRecords: {},
      activeQuestionIndex: 0,
      currentQuestion: currentQuiz?.questions[0] || null,
      gameState: 'question',
      lastFeedback: null,
      winnerRacer: null,
    });
  },

  resetRace: () => {
    const { racers, currentQuiz } = get();
    sound.stopCelebrationMusic();
    const resetRacers = racers.map((r) => ({
      ...r,
      progress: 0,
      hookLevel: 0,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      totalTimeSec: 0,
      callCount: 0,
      combo: 0,
      isNitro: false,
    }));

    set({
      racers: resetRacers,
      currentRacerIndex: 0,
      selectedStudentName: null,
      studentCallCounts: {},
      sessionStudentRecords: {},
      activeQuestionIndex: 0,
      currentQuestion: currentQuiz?.questions[0] || null,
      gameState: 'idle',
      lastFeedback: null,
      winnerRacer: null,
    });
  },

  openNextQuestion: () => {
    const { currentQuiz, activeQuestionIndex, racers, gameMode, students, studentCallCounts } = get();
    if (!currentQuiz || currentQuiz.questions.length === 0) return;

    const nextQIndex = activeQuestionIndex + 1;

    // Mỗi lần chơi chỉ có 1 lượt duy nhất qua bộ câu hỏi của bài học (ví dụ hết 10 câu là kết thúc, không quay lại câu 1)
    if (nextQIndex >= currentQuiz.questions.length) {
      // Sắp xếp người thắng cuộc: Ưu tiên Điểm -> Số câu đúng -> Móc dây -> Số GIÂY trả lời nhanh nhất (ít giây nhất đứng nhất!)
      const sortedRacers = [...racers].sort(compareRacersByResult);
      const topWinner = sortedRacers[0] || racers[0] || null;
      sound.playVictory();
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
      });
      set({
        gameState: 'finished',
        winnerRacer: topWinner,
        lastFeedback: null,
      });
      return;
    }

    // Lượt gọi ngẫu nhiên hoàn toàn trên toàn bộ danh sách (một em có thể được Bà Già bắt trúng nhiều lần một cách ngẫu nhiên!)
    const randomTurn = pickRandomTurn(gameMode, racers, students);
    const nextCalls = { ...studentCallCounts };
    if (randomTurn.studentName) {
      const normKey = normalizeEntityKey(randomTurn.studentName);
      nextCalls[normKey] = (nextCalls[normKey] || 0) + 1;
    }

    set({
      gameState: 'question',
      activeQuestionIndex: nextQIndex,
      currentQuestion: currentQuiz.questions[nextQIndex],
      currentRacerIndex: randomTurn.racerIndex,
      selectedStudentName: randomTurn.studentName,
      studentCallCounts: nextCalls,
      lastFeedback: null,
    });
  },

  answerQuestion: (optionIndex, elapsedSeconds) => {
    const {
      currentQuestion,
      racers,
      currentRacerIndex,
      selectedStudentName,
      studentCallCounts,
      sessionStudentRecords,
      selectedWeek,
      students,
      currentClass,
      gameMode,
    } = get();

    if (!currentQuestion) return;

    const activeRacer = racers[currentRacerIndex] || racers[0];
    const isCorrect = optionIndex === currentQuestion.correctIndex;

    // Tính số GIÂY trả lời câu hỏi này (làm tròn 1 chữ số thập phân, tối thiểu 0.1 giây, tối đa 30 giây)
    const rawSec =
      typeof elapsedSeconds === 'number' && !Number.isNaN(elapsedSeconds) && elapsedSeconds > 0
        ? elapsedSeconds
        : optionIndex === -1
        ? 30
        : 3.5;
    const responseTimeSec = Math.max(0.1, Math.min(30, Math.round(rawSec * 10) / 10));

    const newCombo = isCorrect ? activeRacer.combo + 1 : 0;
    let isNitroTriggered = false;

    if (newCombo >= 3) {
      isNitroTriggered = true;
      sound.playNitro();
    } else if (isCorrect) {
      sound.playCorrect();
      sound.playEngineRev();
    } else {
      sound.playWrong();
    }

    // 10-HOOK ROPE CLIMBING & SCORE MECHANIC:
    // Trả lời ĐÚNG -> Leo lên +1 móc (tối đa 10 móc), +10 điểm
    // Trả lời SAI -> Tụt xuống -1 móc (tối thiểu 0 móc), trừ 5 điểm (tối thiểu 0 điểm)
    const currentHook = activeRacer.hookLevel ?? Math.round((activeRacer.progress || 0) / 10);
    const newHookLevel = isCorrect
      ? Math.min(10, currentHook + 1)
      : Math.max(0, currentHook - 1);
    const newProgress = newHookLevel * 10;

    const pointsDelta = isCorrect ? 10 : -5;
    const newScore = Math.max(0, activeRacer.score + pointsDelta);
    const newRacerCorrect = (activeRacer.correctCount || 0) + (isCorrect ? 1 : 0);
    const newRacerWrong = (activeRacer.wrongCount || 0) + (isCorrect ? 0 : 1);
    const newRacerTimeSec = Math.round(((activeRacer.totalTimeSec || 0) + responseTimeSec) * 10) / 10;
    const newRacerCalls = (activeRacer.callCount || 0) + 1;

    // Update active climber (team or individual)
    const updatedRacers = racers.map((r, idx) => {
      if (idx === currentRacerIndex) {
        const prevWeekRec = r.weeklyScores?.[selectedWeek] || {
          score: 0,
          correctCount: 0,
          wrongCount: 0,
          hooksClimbed: 0,
          totalTimeSec: 0,
          callCount: 0,
        };
        return {
          ...r,
          score: newScore,
          correctCount: newRacerCorrect,
          wrongCount: newRacerWrong,
          totalTimeSec: newRacerTimeSec,
          callCount: newRacerCalls,
          hookLevel: newHookLevel,
          progress: newProgress,
          combo: newCombo,
          isNitro: isNitroTriggered,
          weeklyScores: {
            ...(r.weeklyScores || {}),
            [selectedWeek]: {
              score: Math.max(0, prevWeekRec.score + pointsDelta),
              correctCount: prevWeekRec.correctCount + (isCorrect ? 1 : 0),
              wrongCount: prevWeekRec.wrongCount + (isCorrect ? 0 : 1),
              hooksClimbed: Math.max(0, (prevWeekRec.hooksClimbed || 0) + (isCorrect ? 1 : -1)),
              totalTimeSec: Math.round(((prevWeekRec.totalTimeSec || 0) + responseTimeSec) * 10) / 10,
              callCount: (prevWeekRec.callCount || 0) + 1,
              lastPlayedDate: new Date().toISOString(),
            },
          },
        };
      }
      return r;
    });

    // Update student record in memory & sessionStudentRecords
    const targetStudentName = selectedStudentName || activeRacer.name;
    const normStudentKey = normalizeEntityKey(targetStudentName);
    const prevSessionStd = sessionStudentRecords[normStudentKey] || {
      studentName: targetStudentName,
      teamId: activeRacer.id,
      teamName: activeRacer.name,
      teamColor: activeRacer.colorHex || '#f59e0b',
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      totalTimeSec: 0,
      callCount: 0,
    };

    const updatedSessionStd: SessionStudentRecord = {
      ...prevSessionStd,
      studentName: targetStudentName,
      teamId: activeRacer.id,
      teamName: activeRacer.name,
      teamColor: activeRacer.colorHex || '#f59e0b',
      score: Math.max(0, prevSessionStd.score + pointsDelta),
      correctCount: prevSessionStd.correctCount + (isCorrect ? 1 : 0),
      wrongCount: prevSessionStd.wrongCount + (isCorrect ? 0 : 1),
      totalTimeSec: Math.round((prevSessionStd.totalTimeSec + responseTimeSec) * 10) / 10,
      callCount: prevSessionStd.callCount + 1,
    };

    const nextSessionStudentRecords = {
      ...sessionStudentRecords,
      [normStudentKey]: updatedSessionStd,
    };

    let updatedStudents = [...students];
    const matchedStudent = students.find(
      (s) => s.name.trim().toLowerCase() === targetStudentName.trim().toLowerCase()
    );

    if (matchedStudent) {
      updatedStudents = updatedStudents.map((s) => {
        if (s.id === matchedStudent.id) {
          const currentWeekRecord = s.weeklyScores[selectedWeek] || {
            score: 0,
            correctCount: 0,
            wrongCount: 0,
            hooksClimbed: 0,
            totalTimeSec: 0,
            callCount: 0,
          };
          const updatedWeekScore = Math.max(0, currentWeekRecord.score + pointsDelta);
          const updatedWeeklyScores = {
            ...s.weeklyScores,
            [selectedWeek]: {
              score: updatedWeekScore,
              correctCount: currentWeekRecord.correctCount + (isCorrect ? 1 : 0),
              wrongCount: currentWeekRecord.wrongCount + (isCorrect ? 0 : 1),
              hooksClimbed: Math.max(
                0,
                (currentWeekRecord.hooksClimbed || 0) + (isCorrect ? 1 : -1)
              ),
              totalTimeSec: Math.round(((currentWeekRecord.totalTimeSec || 0) + responseTimeSec) * 10) / 10,
              callCount: (currentWeekRecord.callCount || 0) + 1,
              lastPlayedDate: new Date().toISOString(),
            },
          };
          const newCumulative = Object.values(updatedWeeklyScores).reduce(
            (sum, w) => sum + (w.score || 0),
            0
          );

          return {
            ...s,
            cumulativeScore: newCumulative,
            totalCorrect: s.totalCorrect + (isCorrect ? 1 : 0),
            totalWrong: s.totalWrong + (isCorrect ? 0 : 1),
            totalTimeSec: Math.round(((s.totalTimeSec || 0) + responseTimeSec) * 10) / 10,
            highestCombo: Math.max(s.highestCombo, newCombo),
            weeklyScores: updatedWeeklyScores,
          };
        }
        return s;
      });
    } else if (targetStudentName) {
      // Create student entry on the fly so statistics always capture every player
      const newStd: Student = {
        id: `std-auto-${Date.now()}`,
        classId: getActiveClassId() || currentClass.id,
        name: targetStudentName,
        rollNumber: `${updatedStudents.length + 1}`,
        teamId: activeRacer.id,
        gender: 'nam',
        avatar: '🐥',
        cumulativeScore: Math.max(0, pointsDelta),
        totalCorrect: isCorrect ? 1 : 0,
        totalWrong: isCorrect ? 0 : 1,
        totalTimeSec: responseTimeSec,
        highestCombo: newCombo,
        weeklyScores: {
          [selectedWeek]: {
            score: Math.max(0, pointsDelta),
            correctCount: isCorrect ? 1 : 0,
            wrongCount: isCorrect ? 0 : 1,
            hooksClimbed: isCorrect ? 1 : 0,
            totalTimeSec: responseTimeSec,
            callCount: 1,
            lastPlayedDate: new Date().toISOString(),
          },
        },
      };
      updatedStudents.push(newStd);
    }

    // Update team weeklyScores in currentClass.teams as well
    const updatedClassTeams = currentClass.teams.map((t) => {
      if (t.id === activeRacer.id || t.name === activeRacer.name) {
        const wRec = t.weeklyScores?.[selectedWeek] || {
          score: 0,
          correctCount: 0,
          wrongCount: 0,
          hooksClimbed: 0,
          totalTimeSec: 0,
          callCount: 0,
        };
        return {
          ...t,
          score: newScore,
          weeklyScores: {
            ...(t.weeklyScores || {}),
            [selectedWeek]: {
              score: Math.max(0, wRec.score + pointsDelta),
              correctCount: wRec.correctCount + (isCorrect ? 1 : 0),
              wrongCount: wRec.wrongCount + (isCorrect ? 0 : 1),
              hooksClimbed: Math.max(0, (wRec.hooksClimbed || 0) + (isCorrect ? 1 : -1)),
              totalTimeSec: Math.round(((wRec.totalTimeSec || 0) + responseTimeSec) * 10) / 10,
              callCount: (wRec.callCount || 0) + 1,
              lastPlayedDate: new Date().toISOString(),
            },
          },
        };
      }
      return t;
    });

    // Save persistently to localStorage for Weekly & Cumulative Statistics
    recordTurnResultToStorage({
      classId: getActiveClassId() || currentClass.id,
      className: currentClass.name,
      weekNumber: selectedWeek,
      studentName: targetStudentName,
      teamId: activeRacer.id,
      teamName: gameMode === 'team' ? activeRacer.name : undefined,
      teamColor: activeRacer.colorHex,
      teamAvatar: activeRacer.avatar,
      memberCount: activeRacer.memberNames?.length || 1,
      isCorrect,
      pointsEarned: pointsDelta,
      hookDelta: isCorrect ? 1 : -1,
      responseTimeSec,
    });

    set({
      racers: updatedRacers,
      students: updatedStudents,
      sessionStudentRecords: nextSessionStudentRecords,
      currentClass: {
        ...currentClass,
        teams: updatedClassTeams,
      },
      gameState: 'feedback',
      lastFeedback: {
        isCorrect,
        racerName: activeRacer.name,
        studentName: selectedStudentName,
        hookLevel: newHookLevel,
        pointsDelta,
        responseTimeSec,
        totalCorrectCount: gameMode === 'individual' ? newRacerCorrect : updatedSessionStd.correctCount,
        totalTimeSec: gameMode === 'individual' ? newRacerTimeSec : updatedSessionStd.totalTimeSec,
        studentCallCount: studentCallCounts[normStudentKey] || updatedSessionStd.callCount || 1,
        explanation: currentQuestion.explanation,
        isNitroTriggered,
      },
    });
  },

  closeFeedback: () => {
    get().openNextQuestion();
  },

  toggleSound: () => {
    const muted = sound.toggleMute();
    set({ isMuted: muted });
    return muted;
  },

  addStudent: (newStudentData) => {
    const { students } = get();
    const newStudent: Student = {
      ...newStudentData,
      id: `s-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cumulativeScore: 0,
      totalCorrect: 0,
      totalWrong: 0,
      highestCombo: 0,
      weeklyScores: {},
    };
    set({ students: [...students, newStudent] });
  },

  importStudentsCsv: (csvContent) => {
    const lines = csvContent.split('\n').filter((line) => line.trim().length > 0);
    if (lines.length <= 1) return 0;

    const { currentClass, students } = get();
    const teamIds = currentClass.teams.map((t) => t.id);
    const addedStudents: Student[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 2 && parts[0]) {
        const name = parts[0];
        const rollNumber = parts[1];
        const gender =
          parts[2]?.toLowerCase() === 'nu' || parts[2]?.toLowerCase() === 'nữ' ? 'nu' : 'nam';
        const teamIndex = (i - 1) % teamIds.length;
        const teamId = parts[3] || teamIds[teamIndex];

        addedStudents.push({
          id: `csv-${Date.now()}-${i}`,
          classId: currentClass.id,
          name,
          rollNumber,
          teamId,
          gender,
          avatar: gender === 'nu' ? '👧' : '👦',
          cumulativeScore: 0,
          totalCorrect: 0,
          totalWrong: 0,
          highestCombo: 0,
          weeklyScores: {},
        });
      }
    }

    if (addedStudents.length > 0) {
      set({ students: [...students, ...addedStudents] });
    }
    return addedStudents.length;
  },

  exportStudentsCsv: () => {
    const { students, currentClass, selectedWeek } = get();
    const headers = [
      'Mã HS,Họ và Tên,Giới tính,Đội,Điểm Tuần Này,Điểm Cộng Dồn Lũy Kế,Số Câu Đúng,Số Câu Sai,Combo Cao Nhất',
    ];
    const rows = students.map((s) => {
      const team = currentClass.teams.find((t) => t.id === s.teamId);
      const weekScore = s.weeklyScores[selectedWeek]?.score || 0;
      return `${s.rollNumber},"${s.name}",${s.gender},"${team?.name || 'Cá nhân'}",${weekScore},${s.cumulativeScore},${s.totalCorrect},${s.totalWrong},${s.highestCombo}`;
    });
    return [headers, ...rows].join('\n');
  },

  updateTeamAssignment: (studentId, teamId) => {
    const { students } = get();
    set({
      students: students.map((s) => (s.id === studentId ? { ...s, teamId } : s)),
    });
  },

  addGeneratedQuiz: (newQuiz) => {
    const { quizzes } = get();
    const filtered = quizzes.filter((q) => q.weekNumber !== newQuiz.weekNumber);
    set({
      quizzes: [newQuiz, ...filtered],
      currentQuiz: newQuiz,
      selectedWeek: newQuiz.weekNumber,
      activeQuestionIndex: 0,
      currentQuestion: newQuiz.questions[0] || null,
    });
  },

  /**
   * Thống kê theo CÁ NHÂN (Theo từng tuần hoặc Lũy kế từ startWeek đến endWeek, lọc theo Lớp Học được chọn)
   */
  getLeaderboard: (weekNumber, startWeek = 1, endWeek, targetClassId) => {
    const { students, currentClass, selectedWeek } = get();
    const targetWeek = weekNumber ?? selectedWeek;
    const effectiveEndWeek = endWeek ?? targetWeek;
    const effectiveStartWeek = Math.min(startWeek, effectiveEndWeek);

    const resolvedClassId = targetClassId || getActiveClassId() || currentClass.id;
    const isCurrentActiveClass = resolvedClassId === currentClass.id;
    const persistent = getPersistentStats(resolvedClassId);

    // Look up saved class configuration if this class was saved in localStorage
    const savedClasses = getSavedClassesFromLocalStorage();
    const savedClass = savedClasses.find((c) => c.classId === resolvedClassId);

    const studentMap = new Map<string, Student>();
    const teamLookup = new Map<string, { name: string; color: string }>();

    // Populate team lookup from savedClass.teamsConfig or currentClass.teams
    if (savedClass?.teamsConfig && savedClass.teamsConfig.length > 0) {
      savedClass.teamsConfig.forEach((tc, idx) => {
        const color = CLIMBER_PALETTE[idx % CLIMBER_PALETTE.length];
        teamLookup.set(tc.teamId, { name: tc.teamName, color });
        teamLookup.set(tc.teamName, { name: tc.teamName, color });
      });
    }
    if (isCurrentActiveClass) {
      currentClass.teams.forEach((t, idx) => {
        const color = t.carHex || CLIMBER_PALETTE[idx % CLIMBER_PALETTE.length];
        teamLookup.set(t.id, { name: t.name, color });
        teamLookup.set(t.name, { name: t.name, color });
      });
    }

    // 1. Seed students from savedClass (if selected class is in localStorage)
    if (savedClass) {
      const teamByStudentName = new Map<string, string>();
      if (savedClass.teamsConfig) {
        savedClass.teamsConfig.forEach((tc) => {
          tc.studentNames.forEach((sName) => {
            if (sName.trim()) {
              teamByStudentName.set(normalizeEntityKey(sName), tc.teamId);
            }
          });
        });
      }

      const rawNames = (savedClass.studentsText || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      // Also include any students in teamsConfig not in studentsText
      if (savedClass.teamsConfig) {
        savedClass.teamsConfig.forEach((tc) => {
          tc.studentNames.forEach((sName) => {
            if (sName.trim() && !rawNames.some((n) => normalizeEntityKey(n) === normalizeEntityKey(sName))) {
              rawNames.push(sName.trim());
            }
          });
        });
      }

      rawNames.forEach((sName, idx) => {
        const normKey = normalizeEntityKey(sName);
        const assignedTeamId =
          teamByStudentName.get(normKey) ||
          (savedClass.gameMode === 'team' && savedClass.teamsConfig?.[idx % Math.max(1, savedClass.teamsConfig.length)]?.teamId) ||
          'Cá nhân';

        studentMap.set(normKey, {
          id: `${resolvedClassId}-std-${idx + 1}`,
          classId: resolvedClassId,
          name: sName,
          rollNumber: `${idx + 1 < 10 ? '0' : ''}${idx + 1}`,
          teamId: assignedTeamId,
          gender: idx % 2 === 0 ? 'nam' : 'nu',
          avatar: '🐥',
          cumulativeScore: 0,
          totalCorrect: 0,
          totalWrong: 0,
          highestCombo: 0,
          weeklyScores: {},
        });
      });
    }

    // 2. If viewing the currently active class in store, merge in-memory students
    if (isCurrentActiveClass) {
      students.forEach((s) => {
        const normKey = normalizeEntityKey(s.name);
        const existing = studentMap.get(normKey);
        studentMap.set(normKey, {
          ...s,
          weeklyScores: {
            ...(existing?.weeklyScores || {}),
            ...(s.weeklyScores || {}),
          },
        });
      });
    }

    // 3. Merge persistent individual stats recorded for resolvedClassId
    Object.entries(persistent.individualStats).forEach(([normKey, pStat]) => {
      const existing = studentMap.get(normKey);
      if (existing) {
        const mergedWeeks: Record<number, WeeklyScoreRecord> = { ...existing.weeklyScores };
        Object.entries(pStat.weeklyScores).forEach(([wStr, wVal]) => {
          const wNum = Number(wStr);
          mergedWeeks[wNum] = wVal;
        });
        studentMap.set(normKey, {
          ...existing,
          teamId: pStat.teamName || existing.teamId,
          weeklyScores: mergedWeeks,
        });
      } else {
        studentMap.set(normKey, {
          id: pStat.id,
          classId: resolvedClassId,
          name: pStat.name,
          rollNumber: '--',
          teamId: pStat.teamName || 'Cá nhân',
          gender: 'nam',
          avatar: pStat.avatar || '🐥',
          cumulativeScore: 0,
          totalCorrect: 0,
          totalWrong: 0,
          highestCombo: 0,
          weeklyScores: pStat.weeklyScores || {},
        });
      }
    });

    const entries: LeaderboardEntry[] = Array.from(studentMap.values()).map((s) => {
      const teamInfo = teamLookup.get(s.teamId);
      const pStat = persistent.individualStats[normalizeEntityKey(s.name)];

      const weekData = s.weeklyScores[targetWeek];
      const weeklyScore = weekData ? weekData.score : 0;

      // Sum across [effectiveStartWeek .. effectiveEndWeek]
      let rangeScore = 0;
      let rangeCorrect = 0;
      let rangeWrong = 0;
      let rangeHooks = 0;
      let rangeTimeSec = 0;

      for (let w = effectiveStartWeek; w <= effectiveEndWeek; w++) {
        const wRec = s.weeklyScores[w];
        if (wRec) {
          rangeScore += wRec.score || 0;
          rangeCorrect += wRec.correctCount || 0;
          rangeWrong += wRec.wrongCount || 0;
          rangeHooks += wRec.hooksClimbed ?? Math.floor((wRec.score || 0) / 10);
          rangeTimeSec += wRec.totalTimeSec || 0;
        }
      }
      rangeTimeSec = Math.round(rangeTimeSec * 10) / 10;

      // Total all-time cumulative across all 35 weeks
      let allTimeScore = 0;
      Object.values(s.weeklyScores).forEach((wRec) => {
        allTimeScore += wRec.score || 0;
      });
      const finalCumulative = Math.max(allTimeScore, rangeScore);

      const totalAttempts = rangeCorrect + rangeWrong;
      const accuracy =
        totalAttempts > 0 ? Math.round((rangeCorrect / totalAttempts) * 100) : 0;

      return {
        rank: 0,
        studentId: s.id,
        studentName: s.name,
        teamName: teamInfo?.name || pStat?.teamName || 'Cá nhân',
        teamColor: teamInfo?.color || pStat?.teamColor || '#f59e0b',
        rollNumber: s.rollNumber,
        weeklyScore,
        cumulativeScore: finalCumulative,
        rangeScore,
        rangeCorrect,
        rangeWrong,
        rangeHooks,
        rangeTimeSec,
        weeklyBreakdown: s.weeklyScores,
        highestCombo: s.highestCombo,
        accuracy,
      };
    });

    // Sắp xếp thứ hạng: Điểm -> Số câu đúng -> Số GIÂY trả lời nhanh nhất (ít giây hơn đứng trên!) -> Lũy kế
    entries.sort((a, b) => {
      if (b.rangeScore !== a.rangeScore) return b.rangeScore - a.rangeScore;
      if (b.rangeCorrect !== a.rangeCorrect) return b.rangeCorrect - a.rangeCorrect;
      const aTurns = a.rangeCorrect + a.rangeWrong;
      const bTurns = b.rangeCorrect + b.rangeWrong;
      if (aTurns > 0 && bTurns > 0 && a.rangeTimeSec > 0 && b.rangeTimeSec > 0) {
        if (a.rangeTimeSec !== b.rangeTimeSec) return a.rangeTimeSec - b.rangeTimeSec;
      } else if (aTurns > 0 && bTurns === 0) {
        return -1;
      } else if (bTurns > 0 && aTurns === 0) {
        return 1;
      }
      return b.cumulativeScore - a.cumulativeScore;
    });

    entries.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    return entries;
  },

  /**
   * Thống kê theo ĐỘI NHÓM (Theo từng tuần hoặc Lũy kế từ startWeek đến endWeek, lọc theo Lớp Học được chọn)
   */
  getTeamLeaderboard: (weekNumber, startWeek = 1, endWeek, targetClassId) => {
    const { currentClass, racers, students, selectedWeek, gameMode } = get();
    const targetWeek = weekNumber ?? selectedWeek;
    const effectiveEndWeek = endWeek ?? targetWeek;
    const effectiveStartWeek = Math.min(startWeek, effectiveEndWeek);

    const resolvedClassId = targetClassId || getActiveClassId() || currentClass.id;
    const isCurrentActiveClass = resolvedClassId === currentClass.id;
    const persistent = getPersistentStats(resolvedClassId);

    const savedClasses = getSavedClassesFromLocalStorage();
    const savedClass = savedClasses.find((c) => c.classId === resolvedClassId);

    const teamMap = new Map<
      string,
      {
        id: string;
        name: string;
        color: string;
        avatar: string;
        memberCount: number;
        weeklyScores: Record<number, WeeklyScoreRecord>;
      }
    >();

    // 1. Seed from savedClass.teamsConfig if available
    if (savedClass?.teamsConfig && savedClass.teamsConfig.length > 0) {
      savedClass.teamsConfig.forEach((tc, idx) => {
        const key = normalizeEntityKey(tc.teamName);
        const wild = WILD_ANIMAL_AVATARS[idx % WILD_ANIMAL_AVATARS.length];
        // Aggregate weekly scores of members from persistent.individualStats
        const aggregatedFromMembers: Record<number, WeeklyScoreRecord> = {};
        tc.studentNames.forEach((mName) => {
          const mStat = persistent.individualStats[normalizeEntityKey(mName)];
          if (mStat?.weeklyScores) {
            Object.entries(mStat.weeklyScores).forEach(([wStr, wRec]) => {
              const wNum = Number(wStr);
              const cur = aggregatedFromMembers[wNum] || {
                score: 0,
                correctCount: 0,
                wrongCount: 0,
                hooksClimbed: 0,
                totalTimeSec: 0,
              };
              aggregatedFromMembers[wNum] = {
                score: cur.score + (wRec.score || 0),
                correctCount: cur.correctCount + (wRec.correctCount || 0),
                wrongCount: cur.wrongCount + (wRec.wrongCount || 0),
                hooksClimbed:
                  (cur.hooksClimbed || 0) +
                  (wRec.hooksClimbed ?? Math.floor((wRec.score || 0) / 10)),
                totalTimeSec: Math.round(((cur.totalTimeSec || 0) + (wRec.totalTimeSec || 0)) * 10) / 10,
              };
            });
          }
        });

        teamMap.set(key, {
          id: tc.teamId,
          name: tc.teamName,
          color: CLIMBER_PALETTE[idx % CLIMBER_PALETTE.length],
          avatar: wild.avatar,
          memberCount: tc.studentNames.length || 1,
          weeklyScores: aggregatedFromMembers,
        });
      });
    }

    // 2. Seed from currentClass.teams if viewing active class
    if (isCurrentActiveClass) {
      currentClass.teams.forEach((t, idx) => {
        const key = normalizeEntityKey(t.name);
        const teamStds = students.filter((s) => s.teamId === t.id || s.teamId === t.name);

        const aggregatedFromStudents: Record<number, WeeklyScoreRecord> = {};
        teamStds.forEach((st) => {
          Object.entries(st.weeklyScores).forEach(([wStr, wRec]) => {
            const wNum = Number(wStr);
            const cur = aggregatedFromStudents[wNum] || {
              score: 0,
              correctCount: 0,
              wrongCount: 0,
              hooksClimbed: 0,
              totalTimeSec: 0,
            };
            aggregatedFromStudents[wNum] = {
              score: cur.score + (wRec.score || 0),
              correctCount: cur.correctCount + (wRec.correctCount || 0),
              wrongCount: cur.wrongCount + (wRec.wrongCount || 0),
              hooksClimbed:
                (cur.hooksClimbed || 0) +
                (wRec.hooksClimbed ?? Math.floor((wRec.score || 0) / 10)),
              totalTimeSec: Math.round(((cur.totalTimeSec || 0) + (wRec.totalTimeSec || 0)) * 10) / 10,
            };
          });
        });

        const existing = teamMap.get(key);
        teamMap.set(key, {
          id: t.id,
          name: t.name,
          color: t.carHex || existing?.color || CLIMBER_PALETTE[idx % CLIMBER_PALETTE.length],
          avatar:
            t.avatar ||
            existing?.avatar ||
            WILD_ANIMAL_AVATARS[idx % WILD_ANIMAL_AVATARS.length].avatar,
          memberCount: teamStds.length || t.studentIds.length || existing?.memberCount || 1,
          weeklyScores: {
            ...(existing?.weeklyScores || {}),
            ...aggregatedFromStudents,
            ...(t.weeklyScores || {}),
          },
        });
      });

      // Merge from active racers if in team mode
      if (gameMode === 'team') {
        racers.forEach((r, idx) => {
          const key = normalizeEntityKey(r.name);
          const existing = teamMap.get(key);
          teamMap.set(key, {
            id: r.id,
            name: r.name,
            color: r.colorHex || existing?.color || CLIMBER_PALETTE[idx % CLIMBER_PALETTE.length],
            avatar: r.avatar || existing?.avatar || '🦁',
            memberCount: r.memberNames?.length || existing?.memberCount || 1,
            weeklyScores: {
              ...(existing?.weeklyScores || {}),
              ...(r.weeklyScores || {}),
            },
          });
        });
      }
    }

    // 3. Merge persistent team stats from localStorage for resolvedClassId
    Object.entries(persistent.teamStats).forEach(([key, pTeam]) => {
      const existing = teamMap.get(key);
      teamMap.set(key, {
        id: pTeam.id || existing?.id || key,
        name: pTeam.name || existing?.name || 'Đội',
        color: pTeam.teamColor || existing?.color || '#10b981',
        avatar: pTeam.avatar || existing?.avatar || '🦁',
        memberCount: pTeam.memberCount || existing?.memberCount || 1,
        weeklyScores: {
          ...(existing?.weeklyScores || {}),
          ...(pTeam.weeklyScores || {}),
        },
      });
    });

    const entries: TeamLeaderboardEntry[] = Array.from(teamMap.values()).map((t) => {
      const weekData = t.weeklyScores[targetWeek];
      const weeklyScore = weekData ? weekData.score : 0;

      let rangeScore = 0;
      let rangeCorrect = 0;
      let rangeWrong = 0;
      let rangeHooks = 0;
      let rangeTimeSec = 0;

      for (let w = effectiveStartWeek; w <= effectiveEndWeek; w++) {
        const wRec = t.weeklyScores[w];
        if (wRec) {
          rangeScore += wRec.score || 0;
          rangeCorrect += wRec.correctCount || 0;
          rangeWrong += wRec.wrongCount || 0;
          rangeHooks += wRec.hooksClimbed ?? Math.floor((wRec.score || 0) / 10);
          rangeTimeSec += wRec.totalTimeSec || 0;
        }
      }
      rangeTimeSec = Math.round(rangeTimeSec * 10) / 10;

      let allTimeScore = 0;
      Object.values(t.weeklyScores).forEach((wRec) => {
        allTimeScore += wRec.score || 0;
      });
      const finalCumulative = Math.max(allTimeScore, rangeScore);

      const totalAttempts = rangeCorrect + rangeWrong;
      const accuracy =
        totalAttempts > 0 ? Math.round((rangeCorrect / totalAttempts) * 100) : 0;

      return {
        rank: 0,
        teamId: t.id,
        teamName: t.name,
        teamColor: t.color,
        avatar: t.avatar,
        memberCount: t.memberCount,
        weeklyScore,
        cumulativeScore: finalCumulative,
        rangeScore,
        rangeCorrect,
        rangeWrong,
        rangeHooks,
        rangeTimeSec,
        weeklyBreakdown: t.weeklyScores,
        accuracy,
      };
    });

    // Sắp xếp thứ hạng Đội: Điểm -> Số câu đúng -> Số GIÂY trả lời nhanh nhất (ít giây hơn đứng trên!) -> Lũy kế
    entries.sort((a, b) => {
      if (b.rangeScore !== a.rangeScore) return b.rangeScore - a.rangeScore;
      if (b.rangeCorrect !== a.rangeCorrect) return b.rangeCorrect - a.rangeCorrect;
      const aTurns = a.rangeCorrect + a.rangeWrong;
      const bTurns = b.rangeCorrect + b.rangeWrong;
      if (aTurns > 0 && bTurns > 0 && a.rangeTimeSec > 0 && b.rangeTimeSec > 0) {
        if (a.rangeTimeSec !== b.rangeTimeSec) return a.rangeTimeSec - b.rangeTimeSec;
      } else if (aTurns > 0 && bTurns === 0) {
        return -1;
      } else if (bTurns > 0 && aTurns === 0) {
        return 1;
      }
      return b.cumulativeScore - a.cumulativeScore;
    });

    entries.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    return entries;
  },

  /**
   * Làm mới lưu trữ thống kê của lớp đang chọn về trạng thái mặc định ban đầu (0 điểm, 0 câu đúng/sai, 0 móc, 0 giây)
   */
  resetClassStatistics: (targetClassId) => {
    const { currentClass, students, racers } = get();
    const resolvedClassId = targetClassId || getActiveClassId() || currentClass.id;
    const savedClasses = getSavedClassesFromLocalStorage();
    const matchedSaved = savedClasses.find((c) => c.classId === resolvedClassId);
    const targetClassName =
      matchedSaved?.className ||
      (resolvedClassId === currentClass.id ? currentClass.name : undefined);

    // 1. Xóa sạch dữ liệu thống kê lưu trữ trong localStorage của lớp này
    clearPersistentStatsForClass(resolvedClassId, targetClassName);

    // 2. Đặt lại toàn bộ dữ liệu thống kê trong bộ nhớ (students, teams, racers) về mặc định 0
    const isCurrentActiveClass =
      !targetClassId ||
      resolvedClassId === currentClass.id ||
      resolvedClassId === getActiveClassId() ||
      (targetClassName &&
        currentClass.name.trim().toLowerCase() === targetClassName.trim().toLowerCase());

    if (isCurrentActiveClass) {
      const resetStudents = students.map((s) => ({
        ...s,
        cumulativeScore: 0,
        totalCorrect: 0,
        totalWrong: 0,
        totalTimeSec: 0,
        highestCombo: 0,
        weeklyScores: {},
      }));

      const resetTeams = currentClass.teams.map((t) => ({
        ...t,
        score: 0,
        lap: 0,
        combo: 0,
        isNitroActive: false,
        nitroRemainingSec: 0,
        weeklyScores: {},
      }));

      const resetRacers = racers.map((r) => ({
        ...r,
        score: 0,
        correctCount: 0,
        wrongCount: 0,
        totalTimeSec: 0,
        callCount: 0,
        progress: 0,
        hookLevel: 0,
        combo: 0,
        isNitro: false,
        weeklyScores: {},
      }));

      set({
        students: resetStudents,
        currentClass: {
          ...currentClass,
          teams: resetTeams,
        },
        racers: resetRacers,
        studentCallCounts: {},
        sessionStudentRecords: {},
      });
    }
  },
}));

