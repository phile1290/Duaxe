import React, { useEffect, useState } from 'react';
import { sound } from '../../services/soundService';
import {
  CheckCircle2,
  XCircle,
  Zap,
  ArrowRight,
  Flame,
  ArrowUp,
  ArrowDown,
  Trophy,
  Clock,
  Shuffle,
  Volume2,
} from 'lucide-react';

interface FeedbackModalProps {
  isCorrect: boolean;
  teamName: string;
  studentName?: string | null;
  hookLevel?: number;
  responseTimeSec?: number;
  totalCorrectCount?: number;
  totalTimeSec?: number;
  studentCallCount?: number;
  explanation: string;
  isNitroTriggered: boolean;
  questionNumber?: number;
  totalQuestions?: number;
  onContinue: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isCorrect,
  teamName,
  studentName,
  hookLevel = 0,
  responseTimeSec = 0,
  totalCorrectCount = 0,
  totalTimeSec = 0,
  studentCallCount = 1,
  explanation,
  isNitroTriggered,
  questionNumber = 1,
  totalQuestions = 1,
  onContinue,
}) => {
  const isFinalQuestion = questionNumber >= totalQuestions;
  const [isReadingExplanation, setIsReadingExplanation] = useState(false);

  // Tự động đọc văn bản giải thích đáp án để học sinh không cần phải tự đọc
  useEffect(() => {
    const statusPrefix = isCorrect ? 'Chính xác!' : 'Chưa đúng!';
    const speechText = `${statusPrefix} Giải thích: ${explanation}`;
    const timer = setTimeout(() => {
      sound.speakVietnameseText(speechText, {
        interrupt: true,
        onStart: () => setIsReadingExplanation(true),
        onEnd: () => setIsReadingExplanation(false),
      });
    }, 350);

    return () => {
      clearTimeout(timer);
      sound.stopSpeech();
      setIsReadingExplanation(false);
    };
  }, [isCorrect, explanation]);

  const handleReadExplanation = () => {
    if (isReadingExplanation) {
      sound.stopSpeech();
      setIsReadingExplanation(false);
      return;
    }
    const statusPrefix = isCorrect ? 'Chính xác!' : 'Chưa đúng!';
    sound.speakVietnameseText(`${statusPrefix} Giải thích: ${explanation}`, {
      interrupt: true,
      onStart: () => setIsReadingExplanation(true),
      onEnd: () => setIsReadingExplanation(false),
    });
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className={`w-full max-w-md sm:max-w-lg rounded-3xl p-4 sm:p-6 text-center text-white shadow-2xl border-2 sm:border-4 transition-all transform animate-in zoom-in-95 duration-200 max-h-[92dvh] flex flex-col justify-between ${
          isCorrect
            ? 'bg-gradient-to-b from-emerald-800 to-slate-900 border-emerald-400'
            : 'bg-gradient-to-b from-rose-900 to-slate-900 border-rose-500'
        }`}
      >
        <div className="overflow-y-auto pr-1">
          {/* Question Progress Pill */}
          <div className="mb-2 flex flex-wrap items-center justify-center gap-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/75 border border-white/15 text-[11px] font-black text-amber-300">
              <span>
                Lượt câu hỏi: {questionNumber} / {totalQuestions}
              </span>
              {isFinalQuestion && (
                <span className="text-emerald-300">• Đã hoàn thành câu cuối!</span>
              )}
            </div>

            {studentCallCount > 1 && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-900/90 border border-indigo-400/50 text-[11px] font-black text-indigo-200">
                <Shuffle className="w-3 h-3" />
                <span>Gọi ngẫu nhiên lần {studentCallCount}</span>
              </div>
            )}
          </div>

          {/* Animated Icon */}
          <div className="mx-auto mb-2 flex items-center justify-center">
            {isCorrect ? (
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500/20 flex items-center justify-center animate-ping absolute inset-0" />
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/50">
                <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            )}
          </div>

          {/* Heading */}
          <h3 className="text-xl sm:text-2xl font-black mb-1">
            {isCorrect ? 'CHÍNH XÁC! LEO LÊN +1 MÓC!' : 'CHƯA ĐÚNG! TỤT XUỐNG -1 MÓC!'}
          </h3>

          <p className="text-xs sm:text-sm font-semibold opacity-95 mb-2.5">
            {studentName && studentName !== teamName ? (
              <span>
                Học sinh <strong className="text-amber-300">{studentName}</strong> ({teamName})
              </span>
            ) : (
              <strong className="text-amber-300">{teamName}</strong>
            )}{' '}
            {isCorrect
              ? `đã giúp thú hoang leo lên 1 móc trên dây thừng rừng cổ thụ (Hiện tại: Móc ${hookLevel}/10)!`
              : `bị trượt tay tụt xuống 1 móc trên dây thừng (Hiện tại: Móc ${hookLevel}/10). Cố lên nhé!`}
          </p>

          {/* Hook Status & Response Time in Seconds Badges */}
          <div className="mb-2.5 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/70 border border-white/15 text-xs font-black">
              {isCorrect ? (
                <>
                  <ArrowUp className="w-4 h-4 text-emerald-400 animate-bounce" />
                  <span className="text-emerald-300">Móc {hookLevel} / 10 (+1 móc)</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-4 h-4 text-rose-400 animate-bounce" />
                  <span className="text-rose-300">Móc {hookLevel} / 10 (-1 móc)</span>
                </>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/80 border border-amber-400/50 text-xs font-black text-amber-300">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Thời gian câu này: {responseTimeSec.toFixed(1)} giây</span>
            </div>
          </div>

          {/* Cumulative Correct Answers & Total Seconds Summary */}
          <div className="mb-2.5 bg-slate-950/60 border border-white/10 rounded-xl px-3 py-1.5 text-[11px] sm:text-xs font-bold text-slate-200 flex items-center justify-center gap-3 flex-wrap">
            <span>
              ✅ Số câu trả lời đúng: <strong className="text-emerald-300">{totalCorrectCount} câu</strong>
            </span>
            <span>•</span>
            <span>
              ⏱️ Tổng thời gian: <strong className="text-amber-300">{totalTimeSec.toFixed(1)} giây</strong>
            </span>
          </div>

          {/* Combo Announcement Banner */}
          {isNitroTriggered && (
            <div className="mb-2.5 p-2 sm:p-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-cyan-500 rounded-2xl text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 animate-bounce shadow-lg">
              <Flame className="w-5 h-5 text-white" />
              <span>CHUỖI 3 CÂU ĐÚNG LIÊN TIẾP! PHONG ĐỘ ĐỈNH CAO!</span>
              <Zap className="w-5 h-5 text-white" />
            </div>
          )}

          {/* Explanation Card with Voice Read Button */}
          <div className="bg-black/40 rounded-xl p-3 text-left border border-white/10 mb-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="text-[10px] sm:text-xs uppercase font-bold text-amber-400">
                💡 Giải thích chi tiết kiến thức bài học:
              </div>
              <button
                type="button"
                onClick={handleReadExplanation}
                className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black flex items-center gap-1 cursor-pointer border ${
                  isReadingExplanation
                    ? 'bg-emerald-400 text-slate-950 border-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-400/40'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isReadingExplanation ? 'Đang đọc...' : 'Nghe đọc'}</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-200">{explanation}</p>
          </div>
        </div>

        {/* Action Button: Either advance to next question OR finish the single-pass play session */}
        <button
          onClick={() => {
            sound.stopSpeech();
            onContinue();
          }}
          className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-400/30 transform hover:scale-101 active:scale-98 transition-all cursor-pointer shrink-0"
        >
          {isFinalQuestion ? (
            <>
              <Trophy className="w-5 h-5" />
              <span>
                HOÀN THÀNH LƯỢT CHƠI ({totalQuestions}/{totalQuestions} CÂU) — XEM KẾT QUẢ
              </span>
            </>
          ) : (
            <>
              <span>
                TIẾP TỤC CÂU TIẾP THEO (CÂU {questionNumber + 1}/{totalQuestions})
              </span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
