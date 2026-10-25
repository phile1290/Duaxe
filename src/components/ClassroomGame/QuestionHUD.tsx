import React, { useEffect, useState } from 'react';
import { Question, Racer } from '../../types';
import {
  QuestionVisualIllustration,
  OptionVisualIllustration,
  getUniformOptionVisuals,
  resolveVisualDisplayMode,
} from './QuestionVisualIllustration';
import { Timer, Flame, UserCheck, Clock, CheckCircle2, Shuffle } from 'lucide-react';

interface QuestionHUDProps {
  question: Question;
  activeRacer: Racer;
  selectedStudentName?: string | null;
  studentCallCount?: number;
  lessonTitle?: string;
  questionNumber?: number;
  totalQuestions?: number;
  onAnswer: (optionIndex: number, elapsedSeconds: number) => void;
  combo: number;
}

export const QuestionHUD: React.FC<QuestionHUDProps> = ({
  question,
  activeRacer,
  selectedStudentName,
  studentCallCount = 1,
  lessonTitle,
  questionNumber = 1,
  totalQuestions = 5,
  onAnswer,
  combo,
}) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [elapsedSec, setElapsedSec] = useState(0);
  const totalTime = 30;
  const answeredRef = React.useRef(false);
  const startTimeRef = React.useRef<number>(Date.now());
  const onAnswerRef = React.useRef(onAnswer);
  onAnswerRef.current = onAnswer;

  useEffect(() => {
    answeredRef.current = false;
    setTimeLeft(totalTime);
    setElapsedSec(0);
    startTimeRef.current = Date.now();

    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    const stopwatchInterval = setInterval(() => {
      const diffSec = (Date.now() - startTimeRef.current) / 1000;
      setElapsedSec(Math.min(totalTime, Math.round(diffSec * 10) / 10));
    }, 100);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(stopwatchInterval);
    };
  }, [question.id, questionNumber]);

  useEffect(() => {
    if (timeLeft === 0 && !answeredRef.current) {
      answeredRef.current = true;
      const timeoutTimer = setTimeout(() => {
        onAnswerRef.current(-1, totalTime);
      }, 0);
      return () => clearTimeout(timeoutTimer);
    }
  }, [timeLeft]);

  const handleSelectAnswer = (optionIndex: number) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    const rawElapsed = (Date.now() - startTimeRef.current) / 1000;
    const finalSeconds = Math.max(0.1, Math.min(totalTime, Math.round(rawElapsed * 10) / 10));
    onAnswer(optionIndex, finalSeconds);
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
    { bg: 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700', border: 'border-rose-400', badge: 'bg-rose-900', label: 'A' },
    { bg: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700', border: 'border-blue-400', badge: 'bg-blue-900', label: 'B' },
    { bg: 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700', border: 'border-amber-400', badge: 'bg-amber-900', label: 'C' },
    { bg: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700', border: 'border-emerald-400', badge: 'bg-emerald-900', label: 'D' },
  ];

  const timePercent = (timeLeft / totalTime) * 100;
  const currentHook = activeRacer?.hookLevel ?? Math.round((activeRacer?.progress || 0) / 10);
  const currentCorrect = activeRacer?.correctCount ?? 0;
  const currentTotalSec = activeRacer?.totalTimeSec ?? 0;
  const visualMode = resolveVisualDisplayMode(question);
  const showQuestionImage = visualMode === 'question_image';
  const uniformOptionVisuals = visualMode === 'options_image' ? getUniformOptionVisuals(question) : null;

  return (
    <div className="w-full bg-slate-900/95 border-b-2 border-amber-400/80 shadow-2xl backdrop-blur-md px-2.5 py-2 sm:px-4 sm:py-2.5 select-none flex flex-col justify-between">
      {/* 1. Header Bar: Active Climber Turn + Selected Student + Correct Count & Seconds + Timer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-800">
        {/* Left: Active Team/Student & Caught Chick Student */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0 shadow font-black text-slate-950 ring-1 ring-white/20"
            style={{ backgroundColor: activeRacer?.colorHex || '#f59e0b' }}
          >
            {activeRacer?.avatar || '🦁'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider leading-none">
                Lượt trả lời ngẫu nhiên:
              </span>
              {lessonTitle && (
                <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/90 border border-emerald-500/40 px-1.5 py-0.2 rounded uppercase truncate max-w-[180px] sm:max-w-xs">
                  {lessonTitle.toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-white truncate flex items-center gap-1.5 flex-wrap">
              <span>{activeRacer?.name}</span>
              <span className="text-[10px] sm:text-xs text-amber-300 font-mono font-bold">
                (Móc {currentHook}/10 • {activeRacer?.score || 0}đ • ✅ {currentCorrect} đúng • ⏱️{' '}
                {currentTotalSec.toFixed(1)}s)
              </span>
              {selectedStudentName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black">
                  <UserCheck className="w-3 h-3" />
                  <span>🐥 {selectedStudentName}</span>
                </span>
              )}
              {studentCallCount > 1 && (
                <span
                  title="Bà già chống gậy bắt ngẫu nhiên nên một học sinh có thể được gọi nhiều lần trong cuộc chơi"
                  className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-indigo-600/90 border border-indigo-300 text-white text-[10px] font-black"
                >
                  <Shuffle className="w-2.5 h-2.5" />
                  <span>Ngẫu nhiên lần {studentCallCount}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Question Counter, Live Stopwatch (Số Giây), Combo & Countdown Timer */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="bg-indigo-950 border border-indigo-500/50 text-indigo-200 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black">
            Câu {questionNumber}/{totalQuestions}
          </span>

          {/* Đồng hồ bấm giây tính tốc độ trả lời để phân định thắng thua khi ngang điểm */}
          <div
            title="Số giây trả lời câu hỏi này (dùng để phân định người thắng cuộc khi ngang điểm)"
            className="bg-emerald-950/90 px-2 py-0.5 rounded-lg border border-emerald-500/60 flex items-center gap-1 text-[11px]"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-mono font-black text-emerald-300">
              {elapsedSec.toFixed(1)} giây
            </span>
          </div>

          <div className="bg-slate-800/90 px-2 py-0.5 rounded-lg border border-slate-700 flex items-center gap-1 text-[11px]">
            <Flame className={`w-3.5 h-3.5 ${combo >= 2 ? 'text-orange-400 animate-bounce' : 'text-slate-400'}`} />
            <span className="font-mono font-black text-amber-300">{combo}/3</span>
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

      {/* 2. Question Area:
          - Khi câu hỏi có hình ảnh (showQuestionImage): Hiển thị văn bản câu hỏi + hình ảnh câu hỏi bên cạnh (và đáp án sẽ là văn bản thuần).
          - Khi đáp án là các hình ảnh (options_image) hoặc câu hỏi thuần chữ: Câu hỏi CHỈ hiển thị văn bản toàn chiều ngang. */}
      <div className="my-1 grid grid-cols-1 lg:grid-cols-12 gap-2 items-center">
        <div
          className={`${
            showQuestionImage ? 'lg:col-span-8' : 'lg:col-span-12'
          } flex items-start gap-2 bg-slate-950/70 border border-slate-800 rounded-xl p-2 sm:p-2.5`}
        >
          <span className="text-[10px] sm:text-xs bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-md shrink-0">
            CÂU {questionNumber}
          </span>
          <h2 className="text-xs sm:text-sm md:text-base font-extrabold text-white leading-snug">
            {question.question}
          </h2>
        </div>

        {showQuestionImage && (
          <div className="lg:col-span-4">
            <QuestionVisualIllustration question={question} index={questionNumber} compact />
          </div>
        )}
      </div>

      {/* 3. 4 Answer Options (A, B, C, D):
          - Khi câu hỏi hiển thị hình ảnh -> Đáp án chỉ là VĂN BẢN.
          - Khi đáp án là các hình ảnh -> Cả 4 đáp án đều có hình ảnh đồng nhất và câu hỏi là VĂN BẢN. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 pt-0.5">
        {question.options.map((opt, idx) => {
          const col = optionColors[idx];
          return (
            <button
              key={idx}
              onClick={() => handleSelectAnswer(idx)}
              className={`group flex flex-col justify-between gap-1.5 p-2 sm:p-2.5 rounded-xl ${col.bg} border-2 ${col.border} text-white font-bold text-left transition-all active:scale-95 shadow-md cursor-pointer`}
            >
              {uniformOptionVisuals && (
                <OptionVisualIllustration
                  optionText={opt}
                  visualSpec={uniformOptionVisuals[idx]}
                  optionSvg={question.optionSvgs?.[idx]}
                  optionIndex={idx}
                  visualType={question.visualType}
                  questionText={question.question}
                />
              )}

              <div className="flex items-center gap-2 w-full">
                <span
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg ${col.badge} flex items-center justify-center text-[11px] sm:text-xs font-black shrink-0 shadow`}
                >
                  {col.label}
                </span>
                <span className="text-xs sm:text-sm md:text-base flex-1 font-extrabold leading-tight line-clamp-2">
                  {opt}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
