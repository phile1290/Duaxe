import React from 'react';
import { Team } from '../../types';
import { Trophy, Award, RotateCcw, LayoutDashboard, Flag } from 'lucide-react';

interface VictoryPodiumProps {
  winner: Team;
  allTeams: Team[];
  onRestart: () => void;
  onGoToDashboard: () => void;
}

export const VictoryPodium: React.FC<VictoryPodiumProps> = ({
  winner,
  allTeams,
  onRestart,
  onGoToDashboard,
}) => {
  // Sort teams by lap progress or score
  const sortedTeams = [...allTeams].sort((a, b) => b.score - a.score);

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border-4 border-amber-400 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl animate-in zoom-in-90 duration-300">
        
        {/* Trophy icon */}
        <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center mb-4 shadow-xl shadow-yellow-500/40 animate-bounce">
          <Trophy className="w-14 h-14 text-slate-950" />
        </div>

        <div className="text-amber-400 font-extrabold uppercase tracking-widest text-sm mb-1 flex items-center justify-center gap-1.5">
          <Flag className="w-4 h-4" />
          <span>VỀ ĐÍCH THÀNH CÔNG!</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black mb-1">
          CHÚC MỪNG {winner.name.toUpperCase()}!
        </h2>
        <p className="text-slate-300 text-sm mb-6">
          Đội đã xuất sắc cán đích đầu tiên và giành chức vô địch chặng đua tuần này!
        </p>

        {/* Podium Standing List */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 mb-6 space-y-2.5">
          <div className="text-xs uppercase font-bold text-slate-400 text-left px-2">Bảng tổng kết chặng đua:</div>
          {sortedTeams.map((team, idx) => (
            <div
              key={team.id}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                idx === 0
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-extrabold'
                  : 'bg-slate-800 border-slate-700/60 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                  idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : 'bg-slate-700 text-white'
                }`}>
                  #{idx + 1}
                </span>
                <span className="text-xl">{team.avatar}</span>
                <span className="font-bold">{team.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono">{Math.round(team.lap)}% đường đua</span>
                <span className="bg-slate-900 px-3 py-1 rounded-lg text-amber-400 font-mono font-bold text-sm">
                  {team.score} Điểm
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transform hover:scale-102 transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>ĐUA LẠI CHẶNG NÀY</span>
          </button>
          <button
            onClick={onGoToDashboard}
            className="py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base flex items-center justify-center gap-2 border border-slate-600 cursor-pointer"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>SỔ ĐIỂM & THỐNG KÊ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
