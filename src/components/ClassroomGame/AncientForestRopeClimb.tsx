import React from 'react';
import { Racer } from '../../types';
import { Trophy, ArrowUp, ArrowDown, Trees } from 'lucide-react';

interface AncientForestRopeClimbProps {
  racers: Racer[];
  activeRacerIndex: number;
  selectedStudentName?: string | null;
}

const WILD_ANIMAL_PROFILES = [
  { emoji: '🦁', label: 'Sư Tử Chúa', color: '#f59e0b' },
  { emoji: '🐯', label: 'Hổ Vằn Rừng Xanh', color: '#ea580c' },
  { emoji: '🐆', label: 'Báo Đốm Thần Tốc', color: '#eab308' },
  { emoji: '🐻', label: 'Gấu Nâu Cổ Thụ', color: '#b45309' },
  { emoji: '🐺', label: 'Sói Đầu Đàn', color: '#38bdf8' },
  { emoji: '🐒', label: 'Khỉ Vàng Leo Núi', color: '#10b981' },
  { emoji: '🦊', label: 'Cáo Đỏ Tinh Anh', color: '#f43f5e' },
  { emoji: '🐼', label: 'Gấu Trúc Khổng Lồ', color: '#a855f7' },
  { emoji: '🦅', label: 'Đại Bàng Núi Cao', color: '#06b6d4' },
  { emoji: '🐘', label: 'Voi Rừng Dũng Mãnh', color: '#6366f1' },
  { emoji: '🦌', label: 'Hươu Sao Nhanh Nhẹn', color: '#84cc16' },
  { emoji: '🐊', label: 'Cá Sấu Đầm Lầy', color: '#14b8a6' },
];

export const AncientForestRopeClimb: React.FC<AncientForestRopeClimbProps> = ({
  racers,
  activeRacerIndex,
  selectedStudentName,
}) => {
  // 10 hooks from top (10) down to bottom (1)
  const hooks = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 relative overflow-hidden select-none">
      {/* 1. Header Banner of Right Screen: Rừng Cổ Thụ - Leo Dây Thừng 10 Móc */}
      <div className="shrink-0 z-20 bg-emerald-950/95 border-b border-emerald-500/40 px-3 py-2 flex items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center text-lg font-black shadow shrink-0">
            🌳
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-emerald-300 uppercase tracking-wide truncate">
              RỪNG CỔ THỤ — THÚ HOANG LEO DÂY THỪNG 10 MÓC
            </h3>
            <p className="text-[10px] text-emerald-100/80 truncate">
              Trả lời ĐÚNG: Leo lên +1 móc ⬆️ • Trả lời SAI: Tụt xuống -1 móc ⬇️ • Đạt Móc 10: Chiến thắng 🏆
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0 text-[11px] font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-900/90 border border-emerald-400/50 text-emerald-200 flex items-center gap-1">
            <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Đúng: +1 Móc</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-950/90 border border-rose-400/50 text-rose-200 flex items-center gap-1">
            <ArrowDown className="w-3.5 h-3.5 text-rose-400" />
            <span>Sai: -1 Móc</span>
          </span>
        </div>
      </div>

      {/* 2. Main Ancient Forest Scene & Climbing Ropes Container */}
      <div className="flex-1 relative w-full h-full overflow-x-auto overflow-y-hidden">
        {/* Ancient Forest Atmospheric SVG Background */}
        <svg
          viewBox="0 0 1200 700"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            <linearGradient id="forestSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#022c22" />
              <stop offset="45%" stopColor="#064e3b" />
              <stop offset="85%" stopColor="#0f291e" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>
            <linearGradient id="treeTrunk" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#271206" />
              <stop offset="50%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#1c0d04" />
            </linearGradient>
            <linearGradient id="sunBeam" x1="0%" y1="0%" x2="20%" y2="100%">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Deep Forest Background */}
          <rect x="0" y="0" width="1200" height="700" fill="url(#forestSky)" />

          {/* Sunbeams filtering through ancient canopy */}
          <polygon points="150,0 320,0 520,700 260,700" fill="url(#sunBeam)" />
          <polygon points="650,0 820,0 1040,700 760,700" fill="url(#sunBeam)" />

          {/* Distant Ancient Trees Silhouettes */}
          {[140, 380, 620, 860, 1080].map((tx, idx) => (
            <g key={idx} opacity="0.28">
              <rect x={tx - 28} y="40" width="56" height="660" fill="#041f18" />
              <circle cx={tx} cy="60" r="95" fill="#063729" />
            </g>
          ))}

          {/* Giant Left & Right Ancient Tree Trunks (Cây Cổ Thụ Ngàn Năm) */}
          <path d="M-20,0 L95,0 L70,620 L125,700 L-20,700 Z" fill="url(#treeTrunk)" />
          <path d="M1220,0 L1105,0 L1130,620 L1075,700 L1220,700 Z" fill="url(#treeTrunk)" />

          {/* Massive Horizontal Ancient Branch at Top holding the ropes */}
          <path
            d="M0,18 Q300,38 600,24 Q900,38 1200,18 L1200,56 Q900,72 600,58 Q300,72 0,56 Z"
            fill="url(#treeTrunk)"
            stroke="#78350f"
            strokeWidth="3"
          />

          {/* Lush Ancient Tree Canopy Leaves along the top */}
          {Array.from({ length: 18 }).map((_, i) => (
            <ellipse
              key={i}
              cx={i * 72 + 20}
              cy={16 + (i % 3) * 8}
              rx="55"
              ry="24"
              fill={i % 2 === 0 ? '#065f46' : '#047857'}
              opacity="0.9"
            />
          ))}

          {/* Hanging Vines */}
          {[110, 290, 510, 740, 960].map((vx, idx) => (
            <path
              key={idx}
              d={`M${vx},45 Q${vx + 15},120 ${vx - 5},190 Q${vx + 10},250 ${vx},310`}
              fill="none"
              stroke="#15803d"
              strokeWidth="3"
              opacity="0.55"
            />
          ))}

          {/* Forest Ground & Moss at bottom */}
          <rect x="0" y="648" width="1200" height="52" fill="#052e16" />
          <path d="M0,650 Q300,635 600,650 Q900,665 1200,645 L1200,700 L0,700 Z" fill="#14532d" />
        </svg>

        {/* 3. Ropes & Wild Animals Columns */}
        <div
          className="relative z-10 h-full flex items-stretch justify-around px-3 sm:px-6 pt-3 pb-2 gap-2 sm:gap-4"
          style={{
            minWidth: racers.length > 6 ? `${racers.length * 135}px` : '100%',
          }}
        >
          {/* Left Hook Scale Guide (Móc 10 -> Móc 1) */}
          <div className="hidden md:flex flex-col justify-between py-10 pr-2 border-r border-emerald-500/20 text-[10px] font-black text-emerald-300/90 shrink-0 select-none">
            <div className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md shadow text-center">
              🏆 ĐỈNH 10 MÓC
            </div>
            {hooks.map((h) => (
              <div key={h} className="flex items-center gap-1 justify-end">
                <span>Móc {h}</span>
                <span className="w-2 h-0.5 bg-emerald-400/60 rounded" />
              </div>
            ))}
            <div className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md text-center">
              Móc 0 (Đất)
            </div>
          </div>

          {/* Individual Climbing Ropes for Each Team / Student */}
          {racers.map((racer, idx) => {
            const isCurrentTurn = idx === activeRacerIndex;
            const hookLevel = Math.max(0, Math.min(10, racer.hookLevel ?? Math.round((racer.progress || 0) / 10)));
            const animalProfile = WILD_ANIMAL_PROFILES[idx % WILD_ANIMAL_PROFILES.length];
            // Calculate vertical position from bottom (0% = Móc 0 at bottom, 100% = Móc 10 at top)
            const bottomPercent = 6 + (hookLevel / 10) * 78;

            return (
              <div
                key={racer.id}
                className={`flex-1 min-w-[105px] sm:min-w-[130px] max-w-[210px] h-full flex flex-col items-center relative rounded-2xl transition-all ${
                  isCurrentTurn
                    ? 'bg-amber-400/10 ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-950/25 hover:bg-slate-950/40'
                }`}
              >
                {/* Top Canopy Crown Target (Móc 10) */}
                <div className="shrink-0 mt-1 px-2 py-0.5 rounded-full bg-slate-900/90 border border-amber-400/60 text-[10px] font-black text-amber-300 flex items-center gap-1 shadow">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span>MÓC 10</span>
                </div>

                {/* Vertical Braided Rope & 10 Hooks Track */}
                <div className="flex-1 w-full relative my-1 flex justify-center">
                  {/* The Braided Climbing Rope (Chiếc dây thừng) */}
                  <div
                    className="w-3 sm:w-3.5 h-full rounded-full shadow-inner relative"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(45deg, #d97706 0px, #d97706 6px, #92400e 6px, #92400e 12px)',
                      borderLeft: '1px solid #fde68a66',
                      borderRight: '1px solid #451a03',
                    }}
                  />

                  {/* The 10 Hooks (10 Móc trên dây thừng) */}
                  {hooks.map((hookNum) => {
                    const hookBottomPct = 6 + (hookNum / 10) * 78;
                    const isPassed = hookLevel >= hookNum;
                    const isExact = hookLevel === hookNum;

                    return (
                      <div
                        key={hookNum}
                        style={{ bottom: `${hookBottomPct}%` }}
                        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none"
                      >
                        {/* Hook knot & metallic ring on the rope */}
                        <div
                          className={`w-6 sm:w-7 h-3 rounded-full border flex items-center justify-center transition-all ${
                            isExact
                              ? 'bg-amber-400 border-white scale-125 shadow-md shadow-amber-400/60'
                              : isPassed
                              ? 'bg-emerald-500 border-emerald-200'
                              : 'bg-amber-950/95 border-amber-600/80'
                          }`}
                        >
                          <span
                            className={`text-[8px] font-black leading-none ${
                              isExact || isPassed ? 'text-slate-950' : 'text-amber-200/90'
                            }`}
                          >
                            {hookNum}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Ground Hook 0 marker */}
                  <div
                    style={{ bottom: '4%' }}
                    className="absolute left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-slate-900/90 border border-slate-700 text-[8px] font-bold text-slate-400"
                  >
                    Móc 0
                  </div>

                  {/* WILD ANIMAL CLIMBER ON THE ROPE (Con thú hoang tương ứng với tên đội/cá nhân) */}
                  <div
                    style={{ bottom: `${bottomPercent}%` }}
                    className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 z-20 flex flex-col items-center transition-all duration-700 ease-out"
                  >
                    {/* Current Hook Badge */}
                    <div
                      className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black shadow-md border mb-0.5 whitespace-nowrap ${
                        hookLevel >= 10
                          ? 'bg-amber-400 text-slate-950 border-white animate-bounce'
                          : isCurrentTurn
                          ? 'bg-emerald-400 text-slate-950 border-white'
                          : 'bg-slate-900/95 text-amber-300 border-amber-400/60'
                      }`}
                    >
                      Móc {hookLevel}/10
                    </div>

                    {/* Wild Animal Avatar Medallion */}
                    <div
                      className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-xl border-2 relative transition-transform ${
                        isCurrentTurn ? 'scale-110 ring-4 ring-amber-400/40' : ''
                      }`}
                      style={{
                        backgroundColor: '#0f172a',
                        borderColor: racer.colorHex || animalProfile.color,
                      }}
                    >
                      <span>{animalProfile.emoji}</span>
                      {/* Climbing paws holding rope */}
                      <span className="absolute -bottom-1.5 right-0 text-[10px] bg-slate-900 px-1 rounded border border-slate-700 font-black text-white">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Team / Student Name Banner right on the Wild Animal */}
                    <div
                      className="mt-1 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black text-slate-950 shadow-md max-w-[115px] sm:max-w-[140px] truncate text-center border border-white/40"
                      style={{ backgroundColor: racer.colorHex || animalProfile.color }}
                      title={racer.name}
                    >
                      {racer.name}
                    </div>
                  </div>
                </div>

                {/* Bottom Base Pedestal: Team Name, Wild Animal Species, Score, Correct Answers & Seconds */}
                <div className="shrink-0 w-full p-1.5 sm:p-2 bg-slate-900/95 border-t border-emerald-500/30 rounded-b-2xl text-center space-y-0.5">
                  <div className="text-[10px] font-extrabold text-amber-300 truncate">
                    {animalProfile.emoji} {racer.animalName || animalProfile.label}
                  </div>
                  <div className="text-[11px] sm:text-xs font-black text-white truncate" title={racer.name}>
                    {racer.name}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[10px] font-mono flex-wrap">
                    <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                      Móc {hookLevel}/10
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-bold">
                      {racer.score}đ
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-mono text-slate-300 flex-wrap pt-0.5">
                    <span className="px-1.5 py-0.2 rounded bg-slate-950 border border-emerald-500/30 text-emerald-300 font-bold">
                      ✅ {racer.correctCount ?? 0} đúng
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-950 border border-amber-500/30 text-amber-300 font-bold">
                      ⏱️ {(racer.totalTimeSec ?? 0).toFixed(1)}s
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
