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
    <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl border-4 transition-all transform animate-in zoom-in-95 duration-200 ${
          isCorrect
            ? 'bg-gradient-to-b from-emerald-800 to-slate-900 border-emerald-400'
            : 'bg-gradient-to-b from-rose-900 to-slate-900 border-rose-500'
        }`}
      >
        {/* Animated Icon */}
        <div className="mx-auto mb-4 flex items-center justify-center">
          {isCorrect ? (
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center animate-ping absolute inset-0" />
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/50">
              <XCircle className="w-12 h-12 text-white" />
            </div>
          )}
        </div>

        {/* Heading */}
        <h3 className="text-2xl sm:text-3xl font-black mb-1">
          {isCorrect ? 'CHÍNH XÁC! XUẤT SẮC!' : 'TIẾC QUÁ, CHƯA ĐÚNG!'}
        </h3>
        
        <p className="text-sm font-semibold opacity-90 mb-4">
          {isCorrect
            ? `${teamName} tiến lên 1 bậc trên đường đua!`
            : `${teamName} bị trượt lốp, lùi lại 1 bậc. Cố lên nhé!`}
        </p>

        {/* Nitro Announcement Banner */}
        {isNitroTriggered && (
          <div className="mb-4 p-3 bg-gradient-to-r from-amber-500 via-orange-500 to-cyan-500 rounded-2xl text-slate-950 font-black text-sm flex items-center justify-center gap-2 animate-bounce shadow-lg">
            <Flame className="w-6 h-6 text-white" />
            <span>ĐẠT 3 COMBO! KÍCH HOẠT NITRO TĂNG TỐC SIÊU HẠNG!</span>
            <Zap className="w-6 h-6 text-white" />
          </div>
        )}

        {/* Explanation Card */}
        <div className="bg-black/40 rounded-2xl p-4 text-left border border-white/10 mb-6">
          <div className="text-xs uppercase font-bold text-amber-400 mb-1">Giải thích chi tiết:</div>
          <p className="text-sm sm:text-base leading-relaxed text-slate-200">{explanation}</p>
        </div>

        {/* Action Button */}
        <button
          onClick={onContinue}
          className="w-full py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-amber-400/30 transform hover:scale-102 active:scale-98 transition-all cursor-pointer"
        >
          <span>TIẾP TỤC CUỘC ĐUA</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
