import React from 'react';
import { Racer } from '../../types';
import { Trophy, RotateCcw, LayoutDashboard, Flag } from 'lucide-react';

interface VictoryPodiumProps {
  winner: Racer;
  allRacers: Racer[];
  onRestart: () => void;
  onGoToDashboard: () => void;
}

export const VictoryPodium: React.FC<VictoryPodiumProps> = ({
  winner,
  allRacers,
  onRestart,
  onGoToDashboard,
}) => {
  const sortedRacers = [...allRacers].sort((a, b) => b.score - a.score);

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border-2 sm:border-4 border-amber-400 rounded-3xl p-4 sm:p-6 text-center text-white shadow-2xl animate-in zoom-in-90 duration-300 max-h-[94dvh] flex flex-col justify-between">
        
        <div className="overflow-y-auto pr-1">
          {/* Trophy icon */}
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center mb-2 shadow-xl shadow-yellow-500/40 animate-bounce">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-slate-950" />
          </div>

          <div className="text-amber-400 font-extrabold uppercase tracking-widest text-[11px] sm:text-xs mb-1 flex items-center justify-center gap-1.5">
            <Flag className="w-3.5 h-3.5" />
            <span>VỀ ĐÍCH THÀNH CÔNG!</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black mb-1">
            CHÚC MỪNG {winner.name.toUpperCase()}!
          </h2>
          <p className="text-slate-300 text-xs mb-3">
            Đã xuất sắc cán đích đầu tiên và giành chức vô địch chặng đua tuần này!
          </p>

          {/* Podium Standing List */}
          <div className="bg-slate-800/80 rounded-2xl p-2.5 border border-slate-700 mb-3 space-y-1.5 max-h-44 sm:max-h-52 overflow-y-auto pr-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 text-left px-1">Bảng tổng kết chặng đua:</div>
            {sortedRacers.map((racer, idx) => (
              <div
                key={racer.id}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                  idx === 0
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-extrabold'
                    : 'bg-slate-800 border-slate-700/60 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : 'bg-slate-700 text-white'
                  }`}>
                    #{idx + 1}
                  </span>
                  <span className="text-sm">{racer.avatar}</span>
                  <span className="font-bold truncate max-w-[120px] sm:max-w-[160px]">{racer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono">{Math.round(racer.progress)}%</span>
                  <span className="bg-slate-900 px-2 py-0.5 rounded-lg text-amber-400 font-mono font-bold text-xs">
                    {racer.score}đ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1 shrink-0">
          <button
            onClick={onRestart}
            className="flex-1 py-2.5 sm:py-3 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/30 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ĐUA LẠI CHẶNG NÀY</span>
          </button>
          <button
            onClick={onGoToDashboard}
            className="py-2.5 sm:py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-slate-600 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>SỔ ĐIỂM & THỐNG KÊ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
