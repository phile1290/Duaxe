import React from 'react';
import { CheckCircle2, XCircle, Zap, ArrowRight, Flame } from 'lucide-react';

interface FeedbackModalProps {
  isCorrect: boolean;
  teamName: string;
  explanation: string;
  isNitroTriggered: boolean;
  onContinue: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isCorrect,
  teamName,
  explanation,
  isNitroTriggered,
  onContinue,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className={`w-full max-w-md sm:max-w-lg rounded-3xl p-4 sm:p-6 text-center text-white shadow-2xl border-2 sm:border-4 transition-all transform animate-in zoom-in-95 duration-200 max-h-[92dvh] flex flex-col justify-between ${
          isCorrect
            ? 'bg-gradient-to-b from-emerald-800 to-slate-900 border-emerald-400'
            : 'bg-gradient-to-b from-rose-900 to-slate-900 border-rose-500'
        }`}
      >
        <div className="overflow-y-auto pr-1">
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
            {isCorrect ? 'CHÍNH XÁC! XUẤT SẮC!' : 'TIẾC QUÁ, CHƯA ĐÚNG!'}
          </h3>
          
          <p className="text-xs sm:text-sm font-semibold opacity-90 mb-2.5">
            {isCorrect
              ? `${teamName} tiến lên 1 đích trên đường đua!`
              : `${teamName} bị trượt lốp, lùi lại 1 bậc. Cố lên nhé!`}
          </p>

          {/* Nitro Announcement Banner */}
          {isNitroTriggered && (
            <div className="mb-2.5 p-2 sm:p-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-cyan-500 rounded-2xl text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 animate-bounce shadow-lg">
              <Flame className="w-5 h-5 text-white" />
              <span>ĐẠT 3 COMBO! KÍCH HOẠT NITRO TĂNG TỐC!</span>
              <Zap className="w-5 h-5 text-white" />
            </div>
          )}

          {/* Explanation Card */}
          <div className="bg-black/40 rounded-xl p-3 text-left border border-white/10 mb-3">
            <div className="text-[10px] sm:text-xs uppercase font-bold text-amber-400 mb-1">Giải thích chi tiết:</div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-200">{explanation}</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onContinue}
          className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-400/30 transform hover:scale-101 active:scale-98 transition-all cursor-pointer shrink-0"
        >
          <span>TIẾP TỤC CUỘC ĐUA</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
