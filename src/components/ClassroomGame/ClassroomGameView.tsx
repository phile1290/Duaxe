import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { RacingCanvas3D } from './RacingCanvas3D';
import { QuizModal } from './QuizModal';
import { FeedbackModal } from './FeedbackModal';
import { VictoryPodium } from './VictoryPodium';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  BookOpen,
  Award,
  Zap,
  Settings,
} from 'lucide-react';
import { SettingsModal } from '../SettingsModal';

export const ClassroomGameView: React.FC = () => {
  const {
    currentClass,
    selectedWeek,
    currentQuiz,
    gameState,
    currentQuestion,
    currentTurnTeamIndex,
    selectedStudentForTurn,
    lastFeedback,
    winnerTeam,
    isMuted,
    isSettingsOpen,
    openSettings,
    closeSettings,
    setViewMode,
    startRace,
    resetRace,
    answerQuestion,
    closeFeedback,
    toggleSound,
  } = useGameStore();

  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const activeTeam = currentClass.teams[currentTurnTeamIndex];

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden flex flex-col font-sans select-none">
      
      {/* 1. TOP HEADER HUD (Projector & Classroom Friendly) */}
      <header className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent">
        
        {/* Left: Lesson & Subject Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 rounded-2xl shadow-lg backdrop-blur-md">
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-1 rounded-xl">
              TUẦN {selectedWeek} / 35
            </span>
            <div className="border-l border-slate-700 pl-2">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                {currentQuiz?.subject || 'Toán học'} • {currentClass.name}
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-white truncate max-w-xs sm:max-w-md">
                {currentQuiz?.lessonTitle || 'Ôn tập kiến thức tuần'}
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Live Team Standing Bar */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-2xl shadow-md">
          {currentClass.teams.map((t, idx) => (
            <div
              key={t.id}
              className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                idx === currentTurnTeamIndex
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50 scale-105'
                  : 'text-slate-300'
              }`}
            >
              <span>{t.avatar}</span>
              <span>{t.name}:</span>
              <span className="text-white font-mono">{t.score}đ</span>
            </div>
          ))}
        </div>

        {/* Right: Controls & Dashboard Switch */}
        <div className="flex items-center gap-2">
          {/* Settings Gear Button */}
          <button
            onClick={openSettings}
            title="Cài đặt khóa Gemini API"
            className="w-10 h-10 rounded-2xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-800 shadow-md transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5 text-amber-400 hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="w-10 h-10 rounded-2xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-800 shadow-md transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Toàn màn hình trình chiếu"
            className="w-10 h-10 rounded-2xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-800 shadow-md transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Reset Race */}
          <button
            onClick={resetRace}
            title="Làm mới cuộc đua"
            className="w-10 h-10 rounded-2xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-800 shadow-md transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Teacher Dashboard Switch */}
          <button
            onClick={() => setViewMode('dashboard')}
            className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 border border-slate-600 shadow-lg cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Dashboard Giáo Viên</span>
          </button>
        </div>
      </header>

      {/* 2. THREE.JS 3D RACING CANVAS BACKGROUND */}
      <main className="relative flex-1 w-full h-full">
        <RacingCanvas3D teams={currentClass.teams} activeTeamIndex={currentTurnTeamIndex} />

        {/* Start Game Welcome Banner if Idle */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900/95 border-4 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-lg text-center text-white shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="text-4xl mb-2">🏁 🏎️ 💨</div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2 text-white">
                SẴN SÀNG XUẤT PHÁT!
              </h2>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Cuộc đua trắc nghiệm gồm 4 đội: <strong className="text-red-400">Rồng Lửa</strong>, <strong className="text-blue-400">Chim Ưng</strong>, <strong className="text-yellow-400">Sấm Sét</strong>, và <strong className="text-emerald-400">Báo Đốm</strong>.
                Trả lời đúng để tăng tốc, chuỗi 3 câu đúng sẽ bứt phá với <strong className="text-cyan-400">NITRO</strong>!
              </p>

              <button
                onClick={startRace}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xl flex items-center justify-center gap-3 shadow-xl shadow-orange-500/40 transform hover:scale-102 active:scale-98 transition-all cursor-pointer"
              >
                <Play className="w-7 h-7 fill-slate-950" />
                <span>BẮT ĐẦU CHẶNG ĐUA</span>
              </button>
            </div>
          </div>
        )}

        {/* Question Modal (Active Turn) */}
        {gameState === 'question' && currentQuestion && (
          <QuizModal
            question={currentQuestion}
            activeTeam={activeTeam}
            student={selectedStudentForTurn}
            onAnswer={answerQuestion}
            combo={activeTeam.combo}
          />
        )}

        {/* Feedback Modal (Result of turn) */}
        {gameState === 'feedback' && lastFeedback && (
          <FeedbackModal
            isCorrect={lastFeedback.isCorrect}
            teamName={lastFeedback.teamName}
            explanation={lastFeedback.explanation}
            isNitroTriggered={lastFeedback.isNitroTriggered}
            onContinue={closeFeedback}
          />
        )}

        {/* Victory Podium (When a team wins) */}
        {gameState === 'finished' && winnerTeam && (
          <VictoryPodium
            winner={winnerTeam}
            allTeams={currentClass.teams}
            onRestart={startRace}
            onGoToDashboard={() => setViewMode('dashboard')}
          />
        )}

        {/* Global Settings Modal */}
        <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
      </main>
    </div>
  );
};
