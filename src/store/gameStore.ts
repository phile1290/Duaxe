import { create } from 'zustand';
import { ClassRoom, LeaderboardEntry, Question, QuizSet, Student, Team } from '../types';
import { INITIAL_CLASS, INITIAL_STUDENTS, PREBUILT_QUIZZES } from '../services/mockData';
import { sound } from '../services/soundService';
import confetti from 'canvas-confetti';

interface GameStoreState {
  viewMode: 'classroom' | 'dashboard';
  currentClass: ClassRoom;
  students: Student[];
  selectedWeek: number;
  quizzes: QuizSet[];
  currentQuiz: QuizSet | null;
  activeQuestionIndex: number;
  currentQuestion: Question | null;
  
  // Game session states
  gameState: 'idle' | 'question' | 'feedback' | 'finished';
  currentTurnTeamIndex: number; // 0, 1, 2, 3
  selectedStudentForTurn: Student | null;
  lastFeedback: {
    isCorrect: boolean;
    teamName: string;
    explanation: string;
    isNitroTriggered: boolean;
  } | null;

  winnerTeam: Team | null;
  isMuted: boolean;

  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  // Actions
  setViewMode: (mode: 'classroom' | 'dashboard') => void;
  setSelectedWeek: (week: number) => void;
  setCurrentQuiz: (quiz: QuizSet) => void;
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

export const useGameStore = create<GameStoreState>((set, get) => ({
  viewMode: 'classroom',
  currentClass: INITIAL_CLASS,
  students: INITIAL_STUDENTS,
  selectedWeek: 1,
  quizzes: PREBUILT_QUIZZES,
  currentQuiz: PREBUILT_QUIZZES[0],
  activeQuestionIndex: 0,
  currentQuestion: PREBUILT_QUIZZES[0].questions[0] || null,

  gameState: 'idle',
  currentTurnTeamIndex: 0,
  selectedStudentForTurn: null,
  lastFeedback: null,
  winnerTeam: null,
  isMuted: false,
  isSettingsOpen: false,

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),

  setViewMode: (mode) => set({ viewMode: mode }),

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

  startRace: () => {
    const { currentClass, currentQuiz, students } = get();
    sound.playEngineRev();

    // Reset teams for a fresh race session
    const resetTeams = currentClass.teams.map((t) => ({
      ...t,
      score: 0,
      lap: 0,
      combo: 0,
      isNitroActive: false,
      nitroRemainingSec: 0,
    }));

    // Pick first student for team 0
    const team0Students = students.filter((s) => s.teamId === resetTeams[0].id);
    const firstStudent = team0Students[Math.floor(Math.random() * (team0Students.length || 1))] || null;

    set({
      currentClass: { ...currentClass, teams: resetTeams },
      gameState: 'question',
      activeQuestionIndex: 0,
      currentQuestion: currentQuiz?.questions[0] || null,
      currentTurnTeamIndex: 0,
      selectedStudentForTurn: firstStudent,
      lastFeedback: null,
      winnerTeam: null,
    });
  },

  resetRace: () => {
    const { currentClass, currentQuiz } = get();
    const resetTeams = currentClass.teams.map((t) => ({
      ...t,
      score: 0,
      lap: 0,
      combo: 0,
      isNitroActive: false,
      nitroRemainingSec: 0,
    }));
    set({
      currentClass: { ...currentClass, teams: resetTeams },
      gameState: 'idle',
      activeQuestionIndex: 0,
      currentQuestion: currentQuiz?.questions[0] || null,
      lastFeedback: null,
      winnerTeam: null,
    });
  },

  openNextQuestion: () => {
    const { currentQuiz, activeQuestionIndex, currentClass, currentTurnTeamIndex, students } = get();
    if (!currentQuiz) return;

    const nextIndex = (activeQuestionIndex + 1) % currentQuiz.questions.length;
    const nextTeamIdx = (currentTurnTeamIndex + 1) % currentClass.teams.length;
    const nextTeam = currentClass.teams[nextTeamIdx];

    // Pick student for that team
    const teamStudents = students.filter((s) => s.teamId === nextTeam.id);
    const pickedStudent = teamStudents.length > 0
      ? teamStudents[Math.floor(Math.random() * teamStudents.length)]
      : null;

    set({
      gameState: 'question',
      activeQuestionIndex: nextIndex,
      currentQuestion: currentQuiz.questions[nextIndex],
      currentTurnTeamIndex: nextTeamIdx,
      selectedStudentForTurn: pickedStudent,
      lastFeedback: null,
    });
  },

  answerQuestion: (optionIndex: number) => {
    const {
      currentQuestion,
      currentClass,
      currentTurnTeamIndex,
      selectedWeek,
      selectedStudentForTurn,
      students,
    } = get();

    if (!currentQuestion) return;

    const isCorrect = optionIndex === currentQuestion.correctIndex;
    const activeTeam = currentClass.teams[currentTurnTeamIndex];

    let newCombo = isCorrect ? activeTeam.combo + 1 : 0;
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

    // Calculate Lap & Score progression
    const scoreAdd = isCorrect ? (isNitroTriggered ? 25 : 10) : 0;
    const lapStep = isCorrect ? (isNitroTriggered ? 35 : 20) : -8;
    const newLap = Math.max(0, Math.min(100, activeTeam.lap + lapStep));
    const newScore = activeTeam.score + scoreAdd;

    // Check winner (lap >= 100)
    let winner: Team | null = null;
    if (newLap >= 100) {
      winner = { ...activeTeam, lap: 100, score: newScore };
      sound.playVictory();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }

    // Update team in currentClass
    const updatedTeams = currentClass.teams.map((t, idx) => {
      if (idx === currentTurnTeamIndex) {
        return {
          ...t,
          score: newScore,
          lap: newLap,
          combo: newCombo,
          isNitroActive: isNitroTriggered,
        };
      }
      return t;
    });

    // Update Student record (Cumulative score + 35 weeks map)
    let updatedStudents = [...students];
    if (selectedStudentForTurn) {
      updatedStudents = updatedStudents.map((s) => {
        if (s.id === selectedStudentForTurn.id) {
          const currentWeekRecord = s.weeklyScores[selectedWeek] || {
            score: 0,
            correctCount: 0,
            wrongCount: 0,
          };
          const newWeekRecord = {
            score: currentWeekRecord.score + scoreAdd,
            correctCount: currentWeekRecord.correctCount + (isCorrect ? 1 : 0),
            wrongCount: currentWeekRecord.wrongCount + (isCorrect ? 0 : 1),
            lastPlayedDate: new Date().toISOString(),
          };

          return {
            ...s,
            cumulativeScore: s.cumulativeScore + scoreAdd,
            totalCorrect: s.totalCorrect + (isCorrect ? 1 : 0),
            totalWrong: s.totalWrong + (isCorrect ? 0 : 1),
            highestCombo: Math.max(s.highestCombo, newCombo),
            weeklyScores: {
              ...s.weeklyScores,
              [selectedWeek]: newWeekRecord,
            },
          };
        }
        return s;
      });
    }

    set({
      currentClass: { ...currentClass, teams: updatedTeams },
      students: updatedStudents,
      gameState: winner ? 'finished' : 'feedback',
      winnerTeam: winner,
      lastFeedback: {
        isCorrect,
        teamName: activeTeam.name,
        explanation: currentQuestion.explanation,
        isNitroTriggered,
      },
    });
  },

  closeFeedback: () => {
    const { winnerTeam } = get();
    if (winnerTeam) {
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
    const { students, currentClass } = get();
    const newStudent: Student = {
      ...newStudentData,
      id: `s-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cumulativeScore: 0,
      totalCorrect: 0,
      totalWrong: 0,
      highestCombo: 0,
      weeklyScores: {},
    };
    set({
      students: [...students, newStudent],
    });
  },

  importStudentsCsv: (csvContent: string) => {
    const lines = csvContent.split('\n').filter((line) => line.trim().length > 0);
    if (lines.length <= 1) return 0;

    const { currentClass, students } = get();
    const teamIds = currentClass.teams.map((t) => t.id);
    const addedStudents: Student[] = [];

    // Header expected: Name, RollNumber, Gender, Team (optional)
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length >= 2 && parts[0]) {
        const name = parts[0];
        const rollNumber = parts[1];
        const gender = (parts[2]?.toLowerCase() === 'nu' || parts[2]?.toLowerCase() === 'nữ') ? 'nu' : 'nam';
        // Assign round robin to teams if team not specified
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

    // Default sort by cumulativeScore descending
    entries.sort((a, b) => b.cumulativeScore - a.cumulativeScore);
    entries.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    return entries;
  },
}));
