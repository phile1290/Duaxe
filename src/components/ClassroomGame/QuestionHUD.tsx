import React, { useEffect, useState } from 'react';
import { Question, Racer } from '../../types';
import { Timer, Flame, Sparkles } from 'lucide-react';

interface QuestionHUDProps {
  question: Question;
  activeRacer: Racer;
  onAnswer: (optionIndex: number) => void;
  combo: number;
}

export const QuestionHUD: React.FC<QuestionHUDProps> = ({
  question,
  activeRacer,
  onAnswer,
  combo,
}) => {
  const [timeLeft, setTimeLeft] = useState(25);
  const totalTime = 25;
  const answeredRef = React.useRef(false);
  const onAnswerRef = React.useRef(onAnswer);
  onAnswerRef.current = onAnswer;

  // Reset answered status and timer whenever question changes
  useEffect(() => {
    answeredRef.current = false;
    setTimeLeft(totalTime);

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [question.id]);

  // Handle timeout safely outside render phase
  useEffect(() => {
    if (timeLeft === 0 && !answeredRef.current) {
      answeredRef.current = true;
      const timeoutTimer = setTimeout(() => {
        onAnswerRef.current(-1); // Timeout
      }, 0);
      return () => clearTimeout(timeoutTimer);
    }
  }, [timeLeft]);

  const handleSelectAnswer = (optionIndex: number) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    onAnswer(optionIndex);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', 'a', 'A'].includes(e.key)) handleSelectAnswer(0);
      if (['2', 'b', 'B'].includes(e.key)) handleSelectAnswer(1);
      if (['3', 'c', 'C'].includes(e.key)) handleSelectAnswer(2);
      if (['4', 'd', 'D'].includes(e.key)) handleSelectAnswer(3);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const optionColors = [
    { bg: 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700', border: 'border-rose-400', badge: 'bg-rose-700', label: 'A' },
    { bg: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700', border: 'border-blue-400', badge: 'bg-blue-700', label: 'B' },
    { bg: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700', border: 'border-amber-400', badge: 'bg-amber-700', label: 'C' },
    { bg: 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700', border: 'border-emerald-400', badge: 'bg-emerald-700', label: 'D' },
  ];

  const timePercent = (timeLeft / totalTime) * 100;

  return (
    <div className="w-full bg-slate-900/95 border-b-2 border-amber-400/80 shadow-2xl backdrop-blur-md px-2.5 py-2 sm:px-5 sm:py-3 select-none flex flex-col justify-between">
      
      {/* 1. Header Bar: Active Racer Turn + Combo + Countdown Timer */}
      <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-800">
        
        {/* Racer Turn Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0 shadow font-black text-slate-950 ring-1 ring-white/20"
            style={{ backgroundColor: activeRacer.colorHex }}
          >
            {activeRacer.avatar}
          </div>
          <div className="min-w-0">
            <div className="text-[9px] sm:text-[10px] text-amber-300 font-bold uppercase tracking-wider leading-none">
              Lượt thi đấu của:
            </div>
            <div className="text-xs sm:text-sm md:text-base font-extrabold text-white truncate">
              {activeRacer.name}{' '}
              <span className="text-[11px] sm:text-xs text-amber-300 font-mono font-bold">
                (Xe #{activeRacer.carNumber} • {activeRacer.score}đ)
              </span>
            </div>
          </div>
        </div>

        {/* Combo & Timer */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="bg-slate-800/90 px-2 py-0.5 rounded-lg border border-slate-700 flex items-center gap-1 text-[11px]">
            <Flame className={`w-3.5 h-3.5 ${combo >= 2 ? 'text-orange-400 animate-bounce' : 'text-slate-400'}`} />
            <span className="font-mono font-black text-amber-300">{combo}/3</span>
            {combo >= 3 && <span className="text-[9px] text-cyan-400 font-black animate-pulse">NITRO!</span>}
          </div>

          <div className="bg-slate-800/90 px-2 sm:px-2.5 py-0.5 rounded-lg border border-slate-700 flex items-center gap-1">
            <Timer className={`w-3.5 h-3.5 ${timeLeft <= 5 ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
            <span className={`font-mono text-xs sm:text-sm font-black ${timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>
      </div>

      {/* Timer Progress Bar */}
      <div className="w-full bg-slate-800 h-1 rounded-full my-1 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            timeLeft <= 5 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'
          }`}
          style={{ width: `${timePercent}%` }}
        />
      </div>

      {/* 2. Question Text Card */}
      <div className="my-1 px-0.5">
        <div className="flex items-start gap-1.5">
          <span className="text-[10px] sm:text-xs bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded shrink-0">
            Câu hỏi:
          </span>
          <h2 className="text-xs sm:text-sm md:text-base font-extrabold text-white leading-snug line-clamp-2">
            {question.question}
          </h2>
        </div>
      </div>

      {/* 3. 4 Answer Options (2 cols on mobile portrait, 4 cols on mobile landscape & desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 pt-0.5">
        {question.options.map((opt, idx) => {
          const col = optionColors[idx];
          return (
            <button
              key={idx}
              onClick={() => handleSelectAnswer(idx)}
              className={`group flex items-center gap-1.5 p-1.5 sm:p-2.5 rounded-xl ${col.bg} border ${col.border} text-white font-bold text-left transition-all active:scale-95 shadow-md cursor-pointer`}
            >
              <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg ${col.badge} flex items-center justify-center text-[11px] sm:text-xs font-black shrink-0 shadow`}>
                {col.label}
              </span>
              <span className="text-[11px] sm:text-xs md:text-sm flex-1 font-semibold leading-tight line-clamp-2">
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
