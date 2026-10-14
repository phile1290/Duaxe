import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { RacingCanvas3D } from './RacingCanvas3D';
import { QuestionHUD } from './QuestionHUD';
import { FeedbackModal } from './FeedbackModal';
import { VictoryPodium } from './VictoryPodium';
import { RaceSetupModal } from './RaceSetupModal';
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
} from 'lucide-react';

export const ClassroomGameView: React.FC = () => {
  const {
    selectedWeek,
    currentQuiz,
    gameState,
    currentQuestion,
    gameMode,
    racers,
    currentRacerIndex,
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
    setupRace,
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

  const activeRacer = racers[currentRacerIndex] || racers[0];

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] bg-slate-950 overflow-hidden flex flex-col font-sans select-none">
      
      {/* 1. TOP HEADER BAR (Compact, responsive on mobile portrait, landscape, desktop) */}
      <header className="z-30 shrink-0 bg-slate-900 border-b border-slate-800 px-2 py-1.5 sm:px-4 sm:py-2 flex items-center justify-between gap-1.5 shadow-md">
        
        {/* Left: Week Badge & Lesson Title */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <span className="bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg shrink-0">
            TUẦN {selectedWeek}
          </span>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[120px] sm:max-w-xs md:max-w-md">
              {currentQuiz?.lessonTitle || 'Ôn tập bài học'}
            </h1>
            <div className="text-[10px] text-slate-300 hidden sm:flex items-center gap-1.5">
              <span>Môn {currentQuiz?.subject || 'Toán'}</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">
                {gameMode === 'individual' ? `Đua Cá Nhân (${racers.length} xe)` : `Đua Theo Nhóm (${racers.length} đội)`}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls & Navigation Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          
          {/* Button: Cài Đặt Bài & Đội (Mở 4 Ô Nhập Liệu + PDF) */}
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
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Toàn màn hình"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer hidden md:flex"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Race Button */}
          <button
            onClick={resetRace}
            title="Làm mới cuộc đua"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Teacher Dashboard Switch */}
          <button
            onClick={() => setViewMode('dashboard')}
            className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 border border-slate-700 cursor-pointer"
            title="Sổ điểm 35 tuần & Quản lý"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Dashboard</span>
          </button>
        </div>
      </header>

      {/* 2. SPLIT LAYOUT: PHÍA TRÊN LÀ CÂU HỎI TRẮC NGHIỆM, PHÍA DƯỚI LÀ ĐƯỜNG ĐUA XE 3D */}
      <div className="flex-1 w-full h-full flex flex-col overflow-hidden relative">
        
        {/* TOP SPLIT: VÙNG CÂU HỎI TRẮC NGHIỆM TỪ BÀI HỌC (Không che khuất đường đua) */}
        <div className="shrink-0 z-20 w-full">
          {currentQuestion && gameState === 'question' ? (
            <QuestionHUD
              question={currentQuestion}
              activeRacer={activeRacer}
              onAnswer={answerQuestion}
              combo={activeRacer.combo}
            />
          ) : (
            <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 sm:px-4 sm:py-2 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white">Chặng đua đang sẵn sàng!</span>
                <span className="hidden sm:inline">• Bấm "Cài Đặt Bài & Đội" để chọn bài hoặc nạp PDF</span>
              </div>
              <button
                onClick={startRace}
                className="py-1 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg cursor-pointer shadow text-xs"
              >
                XUẤT PHÁT
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM SPLIT: VÙNG ĐƯỜNG ĐUA 3D VỚI NHỮNG CHIẾC XE CỦA CÁC ĐỘI HOẶC TỪNG HỌC SINH */}
        <div className="flex-1 w-full h-full relative overflow-hidden min-h-0">
          <RacingCanvas3D racers={racers} activeRacerIndex={currentRacerIndex} />

          {/* Idle Welcome Overlay before race start */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 z-10 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3">
              <div className="bg-slate-900/95 border-2 border-amber-400 rounded-3xl p-5 sm:p-7 max-w-md text-center text-white shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="text-3xl mb-1">🏁 🏎️ 💨</div>
                <h3 className="text-lg sm:text-xl font-black mb-1.5 text-white">
                  ĐƯỜNG ĐUA ĐÃ SẴN SÀNG!
                </h3>
                <p className="text-slate-300 text-xs mb-4 leading-relaxed">
                  Đang đua chế độ: <strong className="text-amber-400">{gameMode === 'individual' ? 'Cá Nhân (Từng Học Sinh)' : 'Theo Nhóm (Đội Đua)'}</strong> với <strong>{racers.length} xe</strong> trên đường đua.
                  Tên của từng em/đội được hiển thị trực tiếp ngay trên nóc xe!
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={startRace}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>BẮT ĐẦU ĐUA NGAY</span>
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

        {/* Feedback Modal (Result of turn: correct/wrong/nitro) */}
        {gameState === 'feedback' && lastFeedback && (
          <FeedbackModal
            isCorrect={lastFeedback.isCorrect}
            teamName={lastFeedback.racerName}
            explanation={lastFeedback.explanation}
            isNitroTriggered={lastFeedback.isNitroTriggered}
            onContinue={closeFeedback}
          />
        )}

        {/* Victory Podium (When a racer reaches finish line) */}
        {gameState === 'finished' && winnerRacer && (
          <VictoryPodium
            winner={winnerRacer}
            allRacers={racers}
            onRestart={startRace}
            onGoToDashboard={() => setViewMode('dashboard')}
          />
        )}

        {/* Race Setup Modal (4 Input Fields + PDF Upload + Mode Selector) */}
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
