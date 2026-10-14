import { create } from 'zustand';
import {
  ClassRoom,
  GameMode,
  LeaderboardEntry,
  Question,
  QuizSet,
  Racer,
  RaceSetupConfig,
  Student,
  Team,
} from '../types';
import { INITIAL_CLASS, INITIAL_STUDENTS, PREBUILT_QUIZZES } from '../services/mockData';
import { sound } from '../services/soundService';
import confetti from 'canvas-confetti';

const CAR_PALETTE = [
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

const ANIMAL_AVATARS = [
  '🐉', '🦅', '⚡', '🐆', '🦁', '🦊', '🐻', '🐼', '🐯', '🦄',
  '🐺', '🐬', '🦚', '🦖', '🚀', '⭐', '🔥', '🏆', '🎯', '🏎️'
];

interface GameStoreState {
  viewMode: 'classroom' | 'dashboard';
  currentClass: ClassRoom;
  students: Student[];
  selectedWeek: number;
  quizzes: QuizSet[];
  currentQuiz: QuizSet | null;
  activeQuestionIndex: number;
  currentQuestion: Question | null;

  // Race Mode & Racers (Teams or Individual Students)
  gameMode: GameMode;
  racers: Racer[];
  currentRacerIndex: number;
  isSetupOpen: boolean;

  // Race session status
  gameState: 'idle' | 'question' | 'feedback' | 'finished';
  lastFeedback: {
    isCorrect: boolean;
    racerName: string;
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

  setupRace: (config: RaceSetupConfig, generatedQuestions: Question[]) => void;
  startRace: () => void;
  resetRace: () => void;
  openNextQuestion: () => void;
  answerQuestion: (optionIndex: number) => void;
  closeFeedback: () => void;
  toggleSound: () => boolean;

  // Student & Roster management
  addStudent: (student: Omit<Student, 'id' | 'cumulativeScore' | 'totalCorrect' | 'totalWrong' | 'highestCombo' | 'weeklyScores'>) => void;
  importStudentsCsv: (csvContent: string) => number;
  exportStudentsCsv: () => string;
  updateTeamAssignment: (studentId: string, teamId: string) => void;
  addGeneratedQuiz: (quiz: QuizSet) => void;

  // Analytics & Leaderboard selector
  getLeaderboard: (weekNumber?: number) => LeaderboardEntry[];
}

// Helper to build initial racers from 4 teams
function createInitialRacers(teams: Team[]): Racer[] {
  return teams.map((team, idx) => ({
    id: team.id,
    name: team.name,
    subInfo: `${team.studentIds.length} bạn`,
    colorHex: team.carHex,
    carNumber: idx + 1,
    progress: 0,
    score: 0,
    combo: 0,
    isNitro: false,
    avatar: team.avatar,
    lane: idx,
  }));
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  viewMode: 'classroom',
  currentClass: INITIAL_CLASS,
  students: INITIAL_STUDENTS,
  selectedWeek: 1,
  quizzes: PREBUILT_QUIZZES,
  currentQuiz: PREBUILT_QUIZZES[0],
  activeQuestionIndex: 0,
  currentQuestion: PREBUILT_QUIZZES[0].questions[0] || null,

  gameMode: 'team',
  racers: createInitialRacers(INITIAL_CLASS.teams),
  currentRacerIndex: 0,
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

  setSelectedWeek: (week) => {
    const { quizzes } = get();
    const foundQuiz = quizzes.find((q) => q.weekNumber === week) || quizzes[0];
    set({
      selectedWeek: week,
      currentQuiz: foundQuiz,
      activeQuestionIndex: 0,
      currentQuestion: foundQuiz?.questions[0] || null,
    });
  },

  setCurrentQuiz: (quiz) => {
    set({
      currentQuiz: quiz,
      selectedWeek: quiz.weekNumber,
      activeQuestionIndex: 0,
      currentQuestion: quiz.questions[0] || null,
      gameState: 'idle',
    });
  },

  setupRace: (config, questions) => {
    const { currentClass, students, quizzes } = get();
    sound.playEngineRev();

    // 1. Build Racers based on Mode
    let newRacers: Racer[] = [];

    if (config.gameMode === 'individual') {
      // Chế độ Cá Nhân: Số xe hiển thị đúng bằng số lượng học sinh trong lớp, mỗi học sinh 1 xe có tên riêng!
      const studentList = config.studentsText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const rawList = studentList.length > 0 ? studentList : students.map((s) => s.name);
      const finalNames = rawList;

      newRacers = finalNames.map((name, idx) => ({
        id: `indiv-${idx}`,
        name: name,
        subInfo: `Số xe #${idx + 1}`,
        colorHex: CAR_PALETTE[idx % CAR_PALETTE.length],
        carNumber: idx + 1,
        progress: 0,
        score: 0,
        combo: 0,
        isNitro: false,
        avatar: ANIMAL_AVATARS[idx % ANIMAL_AVATARS.length],
        lane: idx,
      }));
    } else {
      // Team Mode: 2 to 4 teams
      newRacers = config.teamsConfig.map((t, idx) => ({
        id: t.teamId,
        name: t.teamName,
        subInfo: `${t.studentNames.length} học sinh`,
        colorHex: CAR_PALETTE[idx % CAR_PALETTE.length],
        carNumber: idx + 1,
        progress: 0,
        score: 0,
        combo: 0,
        isNitro: false,
        avatar: ANIMAL_AVATARS[idx % ANIMAL_AVATARS.length],
        lane: idx,
      }));
    }

    // 2. Build or Update QuizSet
    const newQuizSet: QuizSet = {
      id: `quiz-week-${config.weekNumber}-${Date.now()}`,
      weekNumber: config.weekNumber,
      lessonTitle: config.lessonTitle,
      subject: config.subject,
      grade: config.grade,
      description: `Bài học: ${config.lessonTitle}`,
      questions: questions.length > 0 ? questions : (get().currentQuiz?.questions || []),
      createdAt: new Date().toISOString(),
    };

    // Update students list in store to reflect the entered students
    let finalStudents = [...students];
    const studentList = config.studentsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (studentList.length > 0) {
      finalStudents = studentList.map((name, idx) => {
        const found = students.find((s) => s.name === name);
        if (found) return found;
        return {
          id: `std-${idx + 1}-${Date.now()}`,
          classId: currentClass.id,
          name,
          rollNumber: `${idx + 1 < 10 ? '0' : ''}${idx + 1}`,
          teamId: config.teamsConfig[idx % (config.teamsConfig.length || 1)]?.teamId || 'team-1',
          gender: idx % 2 === 0 ? 'nam' : 'nu',
          avatar: idx % 2 === 0 ? '👦' : '👧',
          cumulativeScore: 0,
          totalCorrect: 0,
          totalWrong: 0,
          highestCombo: 0,
          weeklyScores: {},
        };
      });
    }

    set({
      currentClass: {
        ...currentClass,
        name: config.className || currentClass.name,
      },
      students: finalStudents,
      gameMode: config.gameMode,
      racers: newRacers,
      currentRacerIndex: 0,
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
  },

  startRace: () => {
    const { racers, currentQuiz } = get();
    sound.playEngineRev();

    const resetRacers = racers.map((r) => ({
      ...r,
      progress: 0,
      score: 0,
      combo: 0,
      isNitro: false,
    }));

    set({
      racers: resetRacers,
      currentRacerIndex: 0,
      activeQuestionIndex: 0,
      currentQuestion: currentQuiz?.questions[0] || null,
      gameState: 'question',
      lastFeedback: null,
      winnerRacer: null,
    });
  },

  resetRace: () => {
    const { racers, currentQuiz } = get();
    const resetRacers = racers.map((r) => ({
      ...r,
      progress: 0,
      score: 0,
      combo: 0,
      isNitro: false,
    }));

    set({
      racers: resetRacers,
      currentRacerIndex: 0,
      activeQuestionIndex: 0,
      currentQuestion: currentQuiz?.questions[0] || null,
      gameState: 'idle',
      lastFeedback: null,
      winnerRacer: null,
    });
  },

  openNextQuestion: () => {
    const { currentQuiz, activeQuestionIndex, racers, currentRacerIndex } = get();
    if (!currentQuiz || currentQuiz.questions.length === 0) return;

    const nextQIndex = (activeQuestionIndex + 1) % currentQuiz.questions.length;
    const nextRacerIdx = (currentRacerIndex + 1) % racers.length;

    set({
      gameState: 'question',
      activeQuestionIndex: nextQIndex,
      currentQuestion: currentQuiz.questions[nextQIndex],
      currentRacerIndex: nextRacerIdx,
      lastFeedback: null,
    });
  },

  answerQuestion: (optionIndex) => {
    const {
      currentQuestion,
      racers,
      currentRacerIndex,
      selectedWeek,
      students,
      gameMode,
    } = get();

    if (!currentQuestion) return;

    const activeRacer = racers[currentRacerIndex] || racers[0];
    const isCorrect = optionIndex === currentQuestion.correctIndex;

    let newCombo = isCorrect ? activeRacer.combo + 1 : 0;
    let isNitroTriggered = false;

    // COMBO 3 = NITRO BOOST!
    if (newCombo >= 3) {
      isNitroTriggered = true;
      sound.playNitro();
    } else if (isCorrect) {
      sound.playCorrect();
      sound.playEngineRev();
    } else {
      sound.playWrong();
    }

    // Progression: +20% on normal correct, +35% on nitro, -6% on wrong
    const scoreAdd = isCorrect ? (isNitroTriggered ? 25 : 10) : 0;
    const progressStep = isCorrect ? (isNitroTriggered ? 35 : 20) : -6;
    const newProgress = Math.max(0, Math.min(100, activeRacer.progress + progressStep));
    const newScore = activeRacer.score + scoreAdd;

    // Check winner
    let winner: Racer | null = null;
    if (newProgress >= 100) {
      winner = { ...activeRacer, progress: 100, score: newScore };
      sound.playVictory();
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.5 },
      });
    }

    // Update active racer
    const updatedRacers = racers.map((r, idx) => {
      if (idx === currentRacerIndex) {
        return {
          ...r,
          score: newScore,
          progress: newProgress,
          combo: newCombo,
          isNitro: isNitroTriggered,
        };
      }
      return r;
    });

    // Update student record if student name matches
    let updatedStudents = [...students];
    const matchedStudent = students.find((s) => s.name === activeRacer.name);
    if (matchedStudent) {
      updatedStudents = updatedStudents.map((s) => {
        if (s.id === matchedStudent.id) {
          const currentWeekRecord = s.weeklyScores[selectedWeek] || { score: 0, correctCount: 0, wrongCount: 0 };
          return {
            ...s,
            cumulativeScore: s.cumulativeScore + scoreAdd,
            totalCorrect: s.totalCorrect + (isCorrect ? 1 : 0),
            totalWrong: s.totalWrong + (isCorrect ? 0 : 1),
            highestCombo: Math.max(s.highestCombo, newCombo),
            weeklyScores: {
              ...s.weeklyScores,
              [selectedWeek]: {
                score: currentWeekRecord.score + scoreAdd,
                correctCount: currentWeekRecord.correctCount + (isCorrect ? 1 : 0),
                wrongCount: currentWeekRecord.wrongCount + (isCorrect ? 0 : 1),
              },
            },
          };
        }
        return s;
      });
    }

    set({
      racers: updatedRacers,
      students: updatedStudents,
      gameState: winner ? 'finished' : 'feedback',
      winnerRacer: winner,
      lastFeedback: {
        isCorrect,
        racerName: activeRacer.name,
        explanation: currentQuestion.explanation,
        isNitroTriggered,
      },
    });
  },

  closeFeedback: () => {
    const { winnerRacer } = get();
    if (winnerRacer) {
      set({ gameState: 'finished' });
    } else {
      get().openNextQuestion();
    }
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
        const gender = (parts[2]?.toLowerCase() === 'nu' || parts[2]?.toLowerCase() === 'nữ') ? 'nu' : 'nam';
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
    const headers = ['Mã HS,Họ và Tên,Giới tính,Đội,Điểm Tuần Này,Điểm Cộng Dồn,Số Câu Đúng,Số Câu Sai,Combo Cao Nhất'];
    const rows = students.map((s) => {
      const team = currentClass.teams.find((t) => t.id === s.teamId);
      const weekScore = s.weeklyScores[selectedWeek]?.score || 0;
      return `${s.rollNumber},"${s.name}",${s.gender},"${team?.name || 'Chưa xếp'}",${weekScore},${s.cumulativeScore},${s.totalCorrect},${s.totalWrong},${s.highestCombo}`;
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

  getLeaderboard: (weekNumber) => {
    const { students, currentClass, selectedWeek } = get();
    const targetWeek = weekNumber ?? selectedWeek;

    const entries: LeaderboardEntry[] = students.map((s) => {
      const team = currentClass.teams.find((t) => t.id === s.teamId);
      const weekData = s.weeklyScores[targetWeek];
      const weeklyScore = weekData ? weekData.score : 0;
      const totalAttempts = s.totalCorrect + s.totalWrong;
      const accuracy = totalAttempts > 0 ? Math.round((s.totalCorrect / totalAttempts) * 100) : 100;

      return {
        rank: 0,
        studentId: s.id,
        studentName: s.name,
        teamName: team?.name || 'Tự do',
        teamColor: team?.carHex || '#94a3b8',
        rollNumber: s.rollNumber,
        weeklyScore,
        cumulativeScore: s.cumulativeScore,
        highestCombo: s.highestCombo,
        accuracy,
      };
    });

    entries.sort((a, b) => b.cumulativeScore - a.cumulativeScore);
    entries.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    return entries;
  },
}));
