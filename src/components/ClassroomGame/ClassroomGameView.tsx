import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ChickPickerArena } from './ChickPickerArena';
import { AncientForestRopeClimb } from './AncientForestRopeClimb';
import { QuestionHUD } from './QuestionHUD';
import { FeedbackModal } from './FeedbackModal';
import { VictoryPodium } from './VictoryPodium';
import { RaceSetupModal } from './RaceSetupModal';
import { WeeklyLeaderboard } from '../TeacherDashboard/WeeklyLeaderboard';
import { SettingsModal } from '../SettingsModal';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  Settings,
  SlidersHorizontal,
  Flag,
  Save,
  Trash2,
  CheckCircle2,
  BarChart3,
  X,
} from 'lucide-react';
import {
  saveQuizForLessonAndClass,
  deleteSavedQuizForLesson,
  getActiveClassId,
} from '../../services/classroomStorageService';

export const ClassroomGameView: React.FC = () => {
  const {
    selectedWeek,
    currentQuiz,
    currentClass,
    activeQuestionIndex,
    gameState,
    currentQuestion,
    gameMode,
    racers,
    students,
    currentRacerIndex,
    selectedStudentName,
    studentCallCounts,
    sessionStudentRecords,
    lastFeedback,
    winnerRacer,
    isMuted,
    isSettingsOpen,
    isSetupOpen,
    openSettings,
    closeSettings,
    openSetup,
    closeSetup,
    setViewMode,
    selectStudentToAnswer,
    setCurrentRacerIndex,
    setupRace,
    startRace,
    resetRace,
    answerQuestion,
    closeFeedback,
    toggleSound,
  } = useGameStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [quizToast, setQuizToast] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const handleSaveCurrentQuiz = () => {
    if (!currentQuiz || !currentQuiz.questions || currentQuiz.questions.length === 0) {
      return;
    }
    const classId = currentClass?.id || getActiveClassId() || 'class-active';
    const upperTitle = (currentQuiz.lessonTitle || 'BÀI HỌC').toUpperCase();
    const res = saveQuizForLessonAndClass(
      classId,
      upperTitle,
      currentQuiz.questions,
      currentQuiz.subject,
      upperTitle,
      selectedWeek,
      currentClass?.name
    );
    setQuizToast({ text: res.message, type: 'success' });
    setTimeout(() => setQuizToast(null), 4500);
  };

  const handleDeleteCurrentSavedQuiz = () => {
    if (!currentQuiz || !currentQuiz.lessonTitle) return;
    const classId = currentClass?.id || getActiveClassId() || 'class-active';
    const upperTitle = currentQuiz.lessonTitle.toUpperCase();
    const res = deleteSavedQuizForLesson(
      classId,
      upperTitle,
      currentClass?.name,
      selectedWeek,
      currentQuiz.subject
    );
    setQuizToast({ text: res.message, type: res.success ? 'info' : 'info' });
    setTimeout(() => setQuizToast(null), 4500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const activeRacer = racers[currentRacerIndex] || racers[0];
  const displayLessonTitle = (currentQuiz?.lessonTitle || 'ÔN TẬP BÀI HỌC').toUpperCase();

  const handleReturnToStartScreen = () => {
    setIsStatsModalOpen(false);
    closeSetup();
    closeSettings();
    resetRace();
    setViewMode('classroom');
  };

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] bg-slate-950 overflow-hidden flex flex-col font-sans select-none">
      {/* Toast Notification when user saves or deletes current quiz */}
      {quizToast && (
        <div
          className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 border-2 ${
            quizToast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
              : 'bg-rose-950/95 border-rose-400 text-rose-200'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{quizToast.text}</span>
        </div>
      )}

      {/* 1. TOP HEADER BAR (Displays App Name + Author Subtitle + Lesson Title in UPPERCASE + Controls) */}
      <header className="z-30 shrink-0 bg-slate-900 border-b border-slate-800 px-2 py-1.5 sm:px-4 sm:py-2 flex items-center justify-between gap-2 shadow-md">
        {/* Left: Brand Title & Author Description (Clickable to return to start screen) + Week Badge & UPPERCASE Lesson Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={handleReturnToStartScreen}
            title="Bấm vào biểu tượng ứng dụng để quay lại màn hình chính khi bắt đầu trò chơi"
            className="group flex items-center gap-2 min-w-0 pr-2 sm:pr-3 border-r border-slate-800 text-left hover:opacity-95 transition-all cursor-pointer rounded-xl focus:outline-none"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-amber-400 text-slate-950 flex items-center justify-center text-base sm:text-lg font-black shadow shrink-0 group-hover:scale-105 transition-transform">
              🌳
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 tracking-wide leading-tight truncate transition-colors">
                CHINH PHỤC ĐỈNH TRI THỨC
              </div>
              <div className="text-[10px] sm:text-[11px] font-bold text-amber-300 leading-tight truncate">
                Ứng dụng được phát triển bởi thầy giáo Lê Văn Phi
              </div>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-2 min-w-0">
            <span className="bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg shrink-0">
              TUẦN {selectedWeek}
            </span>
            <div className="min-w-0">
              <h1
                className="text-xs sm:text-sm font-black text-emerald-300 uppercase truncate max-w-[160px] lg:max-w-md tracking-wide"
                title={displayLessonTitle}
              >
                {displayLessonTitle}
              </h1>
              <div className="text-[10px] text-slate-300 flex items-center gap-1.5">
                {currentQuiz?.subject && <span>Môn: {currentQuiz.subject} •</span>}
                <span className="text-slate-400 font-bold">
                  {gameMode === 'individual'
                    ? `Cá Nhân (${racers.length} HS)`
                    : `Theo Đội (${racers.length} đội)`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Save Quiz, Delete Saved Quiz, Stats Modal, Setup & Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Lưu Bộ Câu Hỏi & Xóa Bộ Câu Hỏi Đã Lưu */}
          {currentQuiz && currentQuiz.questions && currentQuiz.questions.length > 0 && (
            <>
              <button
                onClick={handleSaveCurrentQuiz}
                title="Lưu bộ câu hỏi của bài học này cho lớp để lần sau tự động mở lại"
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Lưu Bộ Câu Hỏi</span>
              </button>

              <button
                onClick={handleDeleteCurrentSavedQuiz}
                title="Xóa bộ câu hỏi đã lưu của bài học này"
                className="px-2 py-1.5 rounded-xl bg-rose-900/90 hover:bg-rose-800 border border-rose-500/60 text-rose-200 font-bold text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Xóa Bộ Câu Hỏi Đã Lưu</span>
              </button>
            </>
          )}

          {/* Button: Thống Kê Cá Nhân / Đội (Từng Tuần & Lũy Kế) */}
          <button
            onClick={() => setIsStatsModalOpen(true)}
            title="Xem thống kê theo cá nhân hoặc theo đội theo từng tuần hoặc lũy kế từ đầu đến hiện tại"
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Thống Kê Tuần & Lũy Kế</span>
          </button>

          {/* Button: Cài Đặt Bài & Đội */}
          <button
            onClick={openSetup}
            title="Thiết lập 4 ô nhập liệu & PDF bài học"
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cài Đặt Bài & Đội</span>
          </button>

          {/* Settings Gear Button (Gemini API Key) */}
          <button
            onClick={openSettings}
            title="Cài đặt khóa Gemini API"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Toàn màn hình"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer hidden md:flex"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Game Button */}
          <button
            onClick={resetRace}
            title="Làm mới trò chơi"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Teacher Dashboard Switch */}
          <button
            onClick={() => setViewMode('dashboard')}
            className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 border border-slate-700 cursor-pointer"
            title="Quản lý lớp học & Bảng thống kê 35 tuần"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Quản Lý</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE: TOP QUESTION HUD (WITH PURE LARGE VISUALS) + BOTTOM DUAL-SCREEN ARENA */}
      <div className="flex-1 w-full h-full flex flex-col overflow-hidden relative">
        {/* TOP: VÙNG CÂU HỎI TRẮC NGHIỆM KÈM HÌNH ẢNH TO RÕ RÀNG */}
        <div className="shrink-0 z-20 w-full">
          {currentQuestion && gameState === 'question' ? (
            <QuestionHUD
              question={currentQuestion}
              activeRacer={activeRacer}
              selectedStudentName={selectedStudentName}
              studentCallCount={
                selectedStudentName
                  ? studentCallCounts[selectedStudentName.trim().toLowerCase().replace(/\s+/g, ' ')] || 1
                  : 1
              }
              lessonTitle={displayLessonTitle}
              questionNumber={activeQuestionIndex + 1}
              totalQuestions={currentQuiz?.questions?.length || 1}
              onAnswer={answerQuestion}
              combo={activeRacer?.combo || 0}
            />
          ) : (
            <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 sm:px-4 sm:py-2 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-400" />
                <span className="font-black text-amber-300 uppercase">{displayLessonTitle}</span>
                <span className="hidden sm:inline">
                  • Bấm "Cài Đặt Bài & Đội" để chọn bài học hoặc tải file PDF
                </span>
              </div>
              <button
                onClick={startRace}
                className="py-1 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg cursor-pointer shadow text-xs"
              >
                BẮT ĐẦU CHƠI
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM DUAL-SCREEN LAYOUT:
            - Màn hình nhỏ bên trái: Bà Già Chống Gậy chạy quanh sân bắt các chú gà con di chuyển lung tung (lượt ngẫu nhiên)
            - Màn hình lớn bên phải: Rừng Cổ Thụ & Thú Hoang Leo Dây Thừng 10 Móc (đúng leo lên 1 móc, sai tụt xuống 1 móc)
        */}
        <div className="flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden relative min-h-0">
          {/* MÀN HÌNH NHỎ BÊN TRÁI: BÀ GIÀ CHỐNG GẬY BẮT GÀ CON */}
          <div className="w-full md:w-[37%] lg:w-[35%] h-[42%] md:h-full shrink-0 overflow-hidden">
            <ChickPickerArena
              gameMode={gameMode}
              racers={racers}
              students={students}
              activeRacerIndex={currentRacerIndex}
              selectedStudentName={selectedStudentName}
              studentCallCounts={studentCallCounts}
              sessionStudentRecords={sessionStudentRecords}
              onSelectStudent={(studentName, racerIdx) =>
                selectStudentToAnswer(studentName, racerIdx)
              }
              onChangeActiveTeam={(racerIdx) => setCurrentRacerIndex(racerIdx)}
            />
          </div>

          {/* MÀN HÌNH LỚN BÊN PHẢI: RỪNG CỔ THỤ VỚI DÂY THỪNG 10 MÓC & THÚ HOANG */}
          <div className="flex-1 h-[58%] md:h-full min-w-0 overflow-hidden">
            <AncientForestRopeClimb
              racers={racers}
              activeRacerIndex={currentRacerIndex}
              selectedStudentName={selectedStudentName}
            />
          </div>

          {/* Idle Welcome Overlay before game starts */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 z-30 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3">
              <div className="bg-slate-900/95 border-2 border-amber-400 rounded-3xl p-5 sm:p-7 max-w-lg text-center text-white shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="text-3xl mb-1">👵🦯🐥 🌳🦁🧗</div>
                <div className="text-xs font-black text-amber-400 uppercase tracking-wider mb-1">
                  {displayLessonTitle}
                </div>
                <h3 className="text-lg sm:text-xl font-black mb-1.5 text-white">
                  BÀ GIÀ CHỐNG GẬY BẮT GÀ & RỪNG CỔ THỤ 10 MÓC!
                </h3>
                <p className="text-slate-300 text-xs mb-4 leading-relaxed">
                  • <strong>Màn hình trái:</strong> Bà già chống gậy chạy xung quanh bắt các chú gà con đang di chuyển lung tung (Lượt chơi ngẫu nhiên: trúng học sinh của đội nào thì tính điểm/trừ điểm cho đội đó hoặc cá nhân đó).
                  <br />• <strong>Màn hình phải:</strong> Rừng cổ thụ với dây thừng 10 móc và thú hoang của{' '}
                  <strong className="text-amber-400">
                    {gameMode === 'individual' ? `${racers.length} cá nhân` : `${racers.length} đội nhóm`}
                  </strong>
                  . Trả lời đúng leo lên +1 móc, trả lời sai tụt xuống -1 móc!
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={startRace}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>BẮT ĐẦU TRÒ CHƠI NGAY</span>
                  </button>

                  <button
                    onClick={openSetup}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cài Đặt Bài & Đội</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Modal (Result of turn: +1 hook or -1 hook + response time in seconds) */}
        {gameState === 'feedback' && lastFeedback && (
          <FeedbackModal
            isCorrect={lastFeedback.isCorrect}
            teamName={lastFeedback.racerName}
            studentName={lastFeedback.studentName}
            hookLevel={lastFeedback.hookLevel}
            responseTimeSec={lastFeedback.responseTimeSec}
            totalCorrectCount={lastFeedback.totalCorrectCount}
            totalTimeSec={lastFeedback.totalTimeSec}
            studentCallCount={lastFeedback.studentCallCount}
            explanation={lastFeedback.explanation}
            isNitroTriggered={lastFeedback.isNitroTriggered}
            questionNumber={activeQuestionIndex + 1}
            totalQuestions={currentQuiz?.questions?.length || 1}
            onContinue={closeFeedback}
          />
        )}

        {/* Victory Podium (When all questions in the lesson play session are completed) */}
        {gameState === 'finished' && winnerRacer && (
          <VictoryPodium
            winner={winnerRacer}
            allRacers={racers}
            gameMode={gameMode}
            sessionStudentRecords={sessionStudentRecords}
            totalQuestions={currentQuiz?.questions?.length || 1}
            lessonTitle={displayLessonTitle}
            onRestart={startRace}
            onReturnHome={handleReturnToStartScreen}
            onGoToDashboard={() => setIsStatsModalOpen(true)}
          />
        )}

        {/* Quick Statistics Modal (Thống Kê Theo Cá Nhân / Theo Đội • Từng Tuần Hoặc Lũy Kế Từ Đầu Đến Hiện Tại) */}
        {isStatsModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
            <div className="bg-slate-950 border-2 border-amber-400 w-full max-w-6xl rounded-3xl p-4 sm:p-6 shadow-2xl text-white max-h-[94dvh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg">
                    📊
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      THỐNG KÊ KẾT QUẢ CÁ NHÂN & ĐỘI NHÓM (THEO TUẦN & LŨY KẾ)
                    </h3>
                    <p className="text-xs text-slate-300">
                      Dữ liệu được lưu trữ tự động từ lúc bắt đầu chơi (VD: Tuần 1) đến tuần hiện tại (Tuần {selectedWeek})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsStatsModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                <WeeklyLeaderboard />
              </div>
            </div>
          </div>
        )}

        {/* Setup Modal (4 Input Fields + PDF Upload + Saved Quiz Save/Delete + Preview) */}
        <RaceSetupModal
          isOpen={isSetupOpen}
          onClose={closeSetup}
          onStartGame={setupRace}
        />

        {/* Global Settings Modal for API Key */}
        <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
      </div>
    </div>
  );
};
