import React, { useEffect, useState } from 'react';
import { Question, Racer } from '../../types';
import {
  QuestionVisualIllustration,
  OptionVisualIllustration,
  getUniformOptionVisuals,
  resolveVisualDisplayMode,
} from './QuestionVisualIllustration';
import { sound } from '../../services/soundService';
import { Timer, Flame, Clock, Shuffle, Volume2, VolumeX } from 'lucide-react';

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
  // Thời gian 1 câu hỏi là 1 phút (60 giây) để học sinh thoải mái đọc/nghe kỹ câu hỏi và 4 đáp án
  const totalTime = 60;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isSpeakingText, setIsSpeakingText] = useState(false);

  const answeredRef = React.useRef(false);
  const startTimeRef = React.useRef<number>(Date.now());
  const onAnswerRef = React.useRef(onAnswer);
  onAnswerRef.current = onAnswer;

  // Tự động đọc to, rõ ràng, tốc độ trung bình toàn bộ văn bản Câu hỏi và 4 Đáp án A, B, C, D ngay khi hiển thị câu hỏi
  useEffect(() => {
    answeredRef.current = false;
    setTimeLeft(totalTime);
    setElapsedSec(0);
    startTimeRef.current = Date.now();

    const speechTimer = setTimeout(() => {
      sound.speakQuestionAndOptions(questionNumber, question.question, question.options, {
        onStart: () => setIsSpeakingText(true),
        onEnd: () => setIsSpeakingText(false),
      });
    }, 180);

    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    const stopwatchInterval = setInterval(() => {
      const diffSec = (Date.now() - startTimeRef.current) / 1000;
      setElapsedSec(Math.min(totalTime, Math.round(diffSec * 10) / 10));
    }, 100);

    return () => {
      clearTimeout(speechTimer);
      clearInterval(countdownInterval);
      clearInterval(stopwatchInterval);
      sound.stopSpeech();
      setIsSpeakingText(false);
    };
  }, [question.id, questionNumber]);

  useEffect(() => {
    if (timeLeft === 0 && !answeredRef.current) {
      answeredRef.current = true;
      sound.stopSpeech();
      const timeoutTimer = setTimeout(() => {
        onAnswerRef.current(-1, totalTime);
      }, 0);
      return () => clearTimeout(timeoutTimer);
    }
  }, [timeLeft]);

  const handleSelectAnswer = (optionIndex: number) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    sound.stopSpeech();
    setIsSpeakingText(false);
    const rawElapsed = (Date.now() - startTimeRef.current) / 1000;
    const finalSeconds = Math.max(0.1, Math.min(totalTime, Math.round(rawElapsed * 10) / 10));
    onAnswer(optionIndex, finalSeconds);
  };

  const handleReadFullQuestionAndOptions = () => {
    if (isSpeakingText) {
      sound.stopSpeech();
      setIsSpeakingText(false);
      return;
    }
    sound.speakQuestionAndOptions(questionNumber, question.question, question.options, {
      onStart: () => setIsSpeakingText(true),
      onEnd: () => setIsSpeakingText(false),
    });
  };

  const handleReadSingleOption = (e: React.MouseEvent, optLabel: string, optText: string) => {
    e.stopPropagation();
    sound.speakVietnameseText(`Đáp án ${optLabel}: ${optText}`, {
      interrupt: true,
      onStart: () => setIsSpeakingText(true),
      onEnd: () => setIsSpeakingText(false),
    });
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
    {
      bg: 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700',
      border: 'border-rose-400',
      badge: 'bg-rose-900',
      label: 'A',
    },
    {
      bg: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700',
      border: 'border-blue-400',
      badge: 'bg-blue-900',
      label: 'B',
    },
    {
      bg: 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700',
      border: 'border-amber-400',
      badge: 'bg-amber-900',
      label: 'C',
    },
    {
      bg: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700',
      border: 'border-emerald-400',
      badge: 'bg-emerald-900',
      label: 'D',
    },
  ];

  const timePercent = (timeLeft / totalTime) * 100;
  const currentHook = activeRacer?.hookLevel ?? Math.round((activeRacer?.progress || 0) / 10);
  const currentCorrect = activeRacer?.correctCount ?? 0;
  const currentTotalSec = activeRacer?.totalTimeSec ?? 0;
  const visualMode = resolveVisualDisplayMode(question);
  const showQuestionImage = visualMode === 'question_image';
  const uniformOptionVisuals =
    visualMode === 'options_image' ? getUniformOptionVisuals(question) : null;

  return (
    <div className="w-full h-full bg-slate-900/95 border-2 border-amber-400/85 rounded-2xl shadow-2xl backdrop-blur-md p-3 sm:p-4 select-none flex flex-col justify-between overflow-y-auto gap-2.5">
      {/* 1. Top Status & 1-Minute Timer Header */}
      <div className="space-y-2 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="bg-indigo-950 border border-indigo-500/60 text-indigo-200 px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black">
              Câu {questionNumber}/{totalQuestions}
            </span>

            {/* Đồng hồ bấm giây tính tốc độ trả lời để phân định thắng thua khi ngang điểm */}
            <div
              title="Số giây trả lời câu hỏi này (dùng để phân định người thắng cuộc khi ngang điểm)"
              className="bg-emerald-950/90 px-2.5 py-1 rounded-lg border border-emerald-500/60 flex items-center gap-1 text-xs"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="font-mono font-black text-emerald-300">
                {elapsedSec.toFixed(1)}s
              </span>
            </div>

            <div className="bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-700 flex items-center gap-1 text-xs">
              <Flame
                className={`w-3.5 h-3.5 ${
                  combo >= 2 ? 'text-orange-400 animate-bounce' : 'text-slate-400'
                }`}
              />
              <span className="font-mono font-black text-amber-300">{combo}/3</span>
            </div>
          </div>

          {/* 60-Second (1 Minute) Countdown Timer */}
          <div
            title="Thời gian suy nghĩ và đọc đáp án: 1 phút (60 giây)"
            className="bg-slate-800/95 px-2.5 py-1 rounded-lg border border-amber-400/50 flex items-center gap-1.5"
          >
            <Timer
              className={`w-4 h-4 ${
                timeLeft <= 10 ? 'text-rose-400 animate-spin' : 'text-amber-400'
              }`}
            />
            <span
              className={`font-mono text-xs sm:text-sm font-black ${
                timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-amber-300'
              }`}
            >
              {timeLeft}s / 60s
            </span>
          </div>
        </div>

        {/* Timer Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${
              timeLeft <= 10
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400'
            }`}
            style={{ width: `${timePercent}%` }}
          />
        </div>

        {/* Active Student Full Name Display (Khi bắt được học sinh nào thì chỉ hiển thị rõ Họ và Tên học sinh) */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-2">
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0 shadow font-black text-slate-950 ring-1 ring-white/20"
            style={{ backgroundColor: activeRacer?.colorHex || '#f59e0b' }}
          >
            {activeRacer?.avatar || '🦁'}
          </div>
          <div className="min-w-0 flex-1">
            {lessonTitle && (
              <div className="text-[10px] font-black text-emerald-300 uppercase truncate">
                {lessonTitle.toUpperCase()}
              </div>
            )}
            {selectedStudentName ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs sm:text-sm font-black shadow">
                  <span>🐥 {selectedStudentName}</span>
                </span>
                <span className="text-xs font-extrabold text-white truncate">
                  ({activeRacer?.name} • Móc {currentHook}/10 • {activeRacer?.score || 0}đ • ✅{' '}
                  {currentCorrect} • ⏱️ {currentTotalSec.toFixed(1)}s)
                </span>
                {studentCallCount > 1 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600/90 border border-indigo-300 text-white text-[10px] font-black">
                    <Shuffle className="w-2.5 h-2.5" />
                    <span>Lần {studentCallCount}</span>
                  </span>
                )}
              </div>
            ) : (
              <div className="text-xs font-bold text-amber-300 leading-snug">
                Chưa gọi tên học sinh — Hãy bấm{' '}
                <span className="underline font-black">"Bắt đầu bắt gà gọi tên"</span> ở khung bên
                phải!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Question Content Area (Cỡ chữ lớn, rõ ràng + Tự động đọc văn bản + Nút nghe đọc lại) */}
      <div
        className={`flex flex-col gap-2 bg-slate-950/85 border-2 ${
          question.isAdvanced || question.difficulty === 'nang_cao'
            ? 'border-purple-400/85 shadow-[0_0_18px_rgba(168,85,247,0.3)]'
            : 'border-slate-800'
        } rounded-2xl p-3 sm:p-3.5 shrink-0`}
      >
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-lg shrink-0">
              CÂU HỎI {questionNumber}
            </span>
            {(question.isAdvanced || question.difficulty === 'nang_cao') && (
              <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black px-2.5 py-0.5 rounded-lg shrink-0 shadow">
                🌟 CÂU HỎI NÂNG CAO
              </span>
            )}
          </div>

          {/* Nút Đọc Văn Bản Câu Hỏi & 4 Đáp Án (Giọng đọc to, rõ ràng, tốc độ trung bình) */}
          <button
            type="button"
            onClick={handleReadFullQuestionAndOptions}
            title="Máy tự động đọc to, rõ ràng câu hỏi và 4 đáp án (tốc độ trung bình)"
            className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow border ${
              isSpeakingText
                ? 'bg-emerald-500 text-slate-950 border-white animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400'
            }`}
          >
            {isSpeakingText ? (
              <>
                <Volume2 className="w-4 h-4 animate-bounce" />
                <span>Đang đọc văn bản... (Bấm để dừng)</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>Đọc câu hỏi & đáp án</span>
              </>
            )}
          </button>
        </div>

        <h2
          onClick={() =>
            sound.speakVietnameseText(`Câu hỏi số ${questionNumber}: ${question.question}`, {
              interrupt: true,
              onStart: () => setIsSpeakingText(true),
              onEnd: () => setIsSpeakingText(false),
            })
          }
          title="Bấm vào văn bản câu hỏi để nghe máy đọc lại câu hỏi"
          className="text-base sm:text-lg xl:text-xl font-black text-white leading-snug break-words cursor-pointer hover:text-amber-200 transition-colors"
        >
          {question.question}
        </h2>

        {showQuestionImage && (
          <div className="pt-1">
            <QuestionVisualIllustration question={question} index={questionNumber} compact />
          </div>
        )}
      </div>

      {/* 3. Các Đáp Án A, B, C, D Đặt Dọc Từ Trên Xuống Ở Cột Trái 1/3:
          - Tăng cỡ chữ nội dung đáp án (text-sm sm:text-base xl:text-lg)
          - Không cắt chữ (không dùng line-clamp), hiển thị đầy đủ các đáp án dài từ trên xuống dưới
          - Có nút loa đọc riêng từng đáp án để học sinh không cần phải tự đọc */}
      <div
        className={`flex-1 flex flex-col justify-between ${
          uniformOptionVisuals ? 'grid grid-cols-2 gap-2' : 'gap-2 sm:gap-2.5'
        }`}
      >
        {question.options.map((opt, idx) => {
          const col = optionColors[idx];
          return (
            <div
              key={idx}
              onClick={() => handleSelectAnswer(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectAnswer(idx);
                }
              }}
              className={`group w-full flex flex-col justify-center gap-1.5 p-2.5 sm:p-3.5 rounded-2xl ${col.bg} border-2 ${col.border} text-white font-bold text-left transition-all active:scale-[0.98] shadow-lg cursor-pointer`}
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

              <div className="flex items-start justify-between gap-2 w-full">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <span
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${col.badge} flex items-center justify-center text-sm sm:text-base font-black shrink-0 shadow border border-white/20 mt-0.5`}
                  >
                    {col.label}
                  </span>
                  <span className="text-sm sm:text-base xl:text-lg flex-1 font-extrabold leading-snug break-words">
                    {opt}
                  </span>
                </div>

                {/* Nút loa đọc riêng văn bản của từng đáp án */}
                <button
                  type="button"
                  onClick={(e) => handleReadSingleOption(e, col.label, opt)}
                  title={`Nghe đọc đáp án ${col.label}`}
                  className="p-1.5 rounded-xl bg-black/25 hover:bg-black/45 text-white/90 hover:text-amber-300 border border-white/20 shrink-0 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
