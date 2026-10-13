import React, { useEffect, useState } from 'react';
import { Question, Student, Team } from '../../types';
import { Sparkles, Timer, Flame, Zap, CheckCircle2, XCircle } from 'lucide-react';

interface QuizModalProps {
  question: Question;
  activeTeam: Team;
  student: Student | null;
  onAnswer: (index: number) => void;
  combo: number;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  question,
  activeTeam,
  student,
  onAnswer,
  combo,
}) => {
  const [timeLeft, setTimeLeft] = useState(25);
  const totalTime = 25;

  // Countdown timer
  useEffect(() => {
    setTimeLeft(totalTime);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Timeout counts as incorrect option
          onAnswer(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [question.id]);

  // Keyboard shortcut listener (1, 2, 3, 4 or A, B, C, D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', 'a', 'A'].includes(e.key)) onAnswer(0);
      if (['2', 'b', 'B'].includes(e.key)) onAnswer(1);
      if (['3', 'c', 'C'].includes(e.key)) onAnswer(2);
      if (['4', 'd', 'D'].includes(e.key)) onAnswer(3);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAnswer]);

  const optionColors = [
    { bg: 'bg-rose-500 hover:bg-rose-600', border: 'border-rose-400', badge: 'bg-rose-700', label: 'A' },
    { bg: 'bg-blue-500 hover:bg-blue-600', border: 'border-blue-400', badge: 'bg-blue-700', label: 'B' },
    { bg: 'bg-amber-500 hover:bg-amber-600', border: 'border-amber-400', badge: 'bg-amber-700', label: 'C' },
    { bg: 'bg-emerald-500 hover:bg-emerald-600', border: 'border-emerald-400', badge: 'bg-emerald-700', label: 'D' },
  ];

  const timeRatio = (timeLeft / totalTime) * 100;

  return (
    <div className="absolute inset-x-0 bottom-4 sm:bottom-6 mx-auto w-11/12 max-w-4xl z-30">
      <div className="bg-slate-900/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-2xl border-4 border-amber-400 ring-8 ring-black/40 text-white animate-in fade-in slide-in-from-bottom duration-300">
        
        {/* Top Header Bar: Turn information, Student avatar, Timer, and Nitro Combo bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-700">
          
          {/* Active Team & Student */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg shadow-orange-500/20">
              {activeTeam.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-amber-300">Lượt đua của:</span>
                <span className="font-extrabold text-lg text-white">{activeTeam.name}</span>
              </div>
              <div className="text-sm text-slate-300 flex items-center gap-1.5 font-medium">
                <span>Học sinh đại diện:</span>
                <span className="bg-white/10 px-2.5 py-0.5 rounded-lg text-amber-300 font-bold">
                  {student ? `${student.avatar} ${student.name} (${student.rollNumber})` : 'Cả đội'}
                </span>
              </div>
            </div>
          </div>

          {/* Combo & Nitro status */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-800/90 px-3.5 py-1.5 rounded-2xl border border-slate-700 flex items-center gap-2">
              <Flame className={`w-5 h-5 ${combo >= 2 ? 'text-orange-400 animate-bounce' : 'text-slate-400'}`} />
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-slate-400">Chuỗi Combo</div>
                <div className="text-sm font-black text-amber-400 flex items-center gap-1">
                  <span>{combo}/3</span>
                  {combo === 2 && <span className="text-xs text-orange-400 font-bold">(Chuẩn bị NITRO!)</span>}
                  {combo >= 3 && <span className="text-xs text-cyan-400 font-extrabold">🚀 NITRO SIÊU TỐC!</span>}
                </div>
              </div>
            </div>

            {/* Big Countdown Timer */}
            <div className="flex items-center gap-2 bg-slate-800/90 px-3.5 py-1.5 rounded-2xl border border-slate-700">
              <Timer className={`w-5 h-5 ${timeLeft <= 5 ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
              <span className={`font-mono text-2xl font-black ${timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${
              timeLeft <= 5 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'
            }`}
            style={{ width: `${timeRatio}%` }}
          />
        </div>

        {/* Question Area */}
        <div className="my-5 flex flex-col md:flex-row items-center gap-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
          {/* Visual Hint Badge / Diagram */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-800 border-2 border-indigo-500/30 flex flex-col items-center justify-center p-2 text-center shrink-0 shadow-inner">
            <span className="text-3xl mb-1">
              {question.visualType === 'math_shape' ? '📐' :
               question.visualType === 'animal' ? '🐾' :
               question.visualType === 'emoji_icon' ? '⭐' :
               question.visualType === 'clock' ? '⏰' : '💡'}
            </span>
            <span className="text-[10px] text-indigo-300 font-bold leading-tight line-clamp-1">
              {question.visualType || 'Hình ảnh'}
            </span>
          </div>

          <div className="flex-1 text-left">
            <div className="text-xs text-amber-400 font-bold tracking-wide uppercase flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Câu hỏi thử thách (+{question.points || 10} Điểm)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
              {question.question}
            </h2>
            {question.visualPrompt && (
              <p className="text-xs text-slate-300 mt-1 italic flex items-center gap-1">
                <span>Gợi ý trực quan:</span> {question.visualPrompt}
              </p>
            )}
          </div>
        </div>

        {/* 4 Large Choice Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {question.options.map((opt, idx) => {
            const col = optionColors[idx];
            return (
              <button
                key={idx}
                onClick={() => onAnswer(idx)}
                className={`group relative flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl ${col.bg} border-2 ${col.border} text-white font-bold text-left transition-all duration-150 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/30 cursor-pointer`}
              >
                <span className={`w-9 h-9 rounded-xl ${col.badge} flex items-center justify-center text-lg font-black shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                  {col.label}
                </span>
                <span className="text-base sm:text-lg flex-1 font-semibold leading-snug">
                  {opt}
                </span>
                <span className="text-xs text-white/60 font-mono hidden md:inline">[{idx + 1}]</span>
              </button>
            );
          })}
        </div>

        {/* Bottom Hint */}
        <div className="mt-3.5 text-center text-xs text-slate-300 flex items-center justify-center gap-4">
          <span>💡 Bấm phím 1, 2, 3, 4 trên bàn phím hoặc bút trình chiếu để chọn nhanh</span>
        </div>
      </div>
    </div>
  );
};
