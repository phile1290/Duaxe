import React, { useState, useEffect, useRef } from 'react';
import { GameMode, Racer, SessionStudentRecord, Student } from '../../types';
import { sound } from '../../services/soundService';
import { normalizeEntityKey } from '../../services/classroomStorageService';
import { Shuffle, UserCheck } from 'lucide-react';

interface ChickPickerArenaProps {
  gameMode: GameMode;
  racers: Racer[];
  students: Student[];
  activeRacerIndex: number;
  selectedStudentName: string | null;
  studentCallCounts?: Record<string, number>;
  sessionStudentRecords?: Record<string, SessionStudentRecord>;
  onSelectStudent: (studentName: string, racerIndex?: number) => void;
  onChangeActiveTeam?: (racerIndex: number) => void;
}

interface WanderingChick {
  id: string;
  name: string;
  racerIdx: number;
  teamName: string;
  teamColor: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facingLeft: boolean;
}

export const ChickPickerArena: React.FC<ChickPickerArenaProps> = ({
  gameMode,
  racers,
  students,
  activeRacerIndex,
  selectedStudentName,
  studentCallCounts = {},
  sessionStudentRecords = {},
  onSelectStudent,
}) => {
  const activeRacer = racers[activeRacerIndex] || racers[0];
  const selectedNormKey = selectedStudentName ? normalizeEntityKey(selectedStudentName) : '';
  const selectedCallCount = selectedNormKey ? studentCallCounts[selectedNormKey] || 1 : 0;
  const selectedStdStat = selectedNormKey ? sessionStudentRecords[selectedNormKey] : undefined;

  // Build the full list of ALL students across ALL teams (or all individuals)
  // so turns are truly random across all teams/individuals!
  const allCandidateChicks = React.useMemo(() => {
    if (gameMode === 'individual') {
      if (racers.length > 0) {
        return racers.map((r, idx) => ({
          id: `chick-ind-${idx}-${r.name}`,
          name: r.name,
          racerIdx: idx,
          teamName: r.name,
          teamColor: r.colorHex || '#f59e0b',
        }));
      }
      return students.map((s, idx) => ({
        id: `chick-std-${idx}-${s.name}`,
        name: s.name,
        racerIdx: idx,
        teamName: s.name,
        teamColor: '#f59e0b',
      }));
    } else {
      // Team mode: gather ALL students from ALL teams so Bà Già Chống Gậy catches any student of any team randomly
      const list: {
        id: string;
        name: string;
        racerIdx: number;
        teamName: string;
        teamColor: string;
      }[] = [];

      racers.forEach((racer, rIdx) => {
        if (racer.memberNames && racer.memberNames.length > 0) {
          racer.memberNames.forEach((studentName, mIdx) => {
            list.push({
              id: `chick-team-${rIdx}-${mIdx}-${studentName}`,
              name: studentName,
              racerIdx: rIdx,
              teamName: racer.name,
              teamColor: racer.colorHex || '#f59e0b',
            });
          });
        } else {
          const teamStudents = students.filter((s) => s.teamId === racer.id);
          if (teamStudents.length > 0) {
            teamStudents.forEach((s, sIdx) => {
              list.push({
                id: `chick-team-std-${rIdx}-${sIdx}-${s.name}`,
                name: s.name,
                racerIdx: rIdx,
                teamName: racer.name,
                teamColor: racer.colorHex || '#f59e0b',
              });
            });
          } else {
            list.push({
              id: `chick-team-rep-${rIdx}`,
              name: racer.name,
              racerIdx: rIdx,
              teamName: racer.name,
              teamColor: racer.colorHex || '#f59e0b',
            });
          }
        }
      });

      return list;
    }
  }, [gameMode, racers, students]);

  const [chicks, setChicks] = useState<WanderingChick[]>([]);
  const [isCatching, setIsCatching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [grandmaPos, setGrandmaPos] = useState<{ x: number; y: number; facingLeft: boolean }>({
    x: 50,
    y: 55,
    facingLeft: false,
  });

  const chicksRef = useRef<WanderingChick[]>([]);
  chicksRef.current = chicks;
  const highlightedRef = useRef<number | null>(null);
  highlightedRef.current = highlightedIndex;
  const isCatchingRef = useRef<boolean>(false);
  isCatchingRef.current = isCatching;

  // Initialize chicks at random positions with random velocities
  useEffect(() => {
    const count = allCandidateChicks.length;
    if (count === 0) {
      setChicks([]);
      return;
    }

    const initialChicks: WanderingChick[] = allCandidateChicks.map((item, idx) => {
      const angle = ((idx * 137.5) % 360) * (Math.PI / 180);
      const speed = 0.65 + (idx % 4) * 0.22;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      return {
        ...item,
        x: 15 + ((idx * 23) % 70),
        y: 22 + ((idx * 19) % 58),
        vx,
        vy,
        facingLeft: vx < 0,
      };
    });

    setChicks(initialChicks);

    if (selectedStudentName) {
      const foundIdx = initialChicks.findIndex(
        (c) => c.name === selectedStudentName && (c.racerIdx === activeRacerIndex || gameMode === 'individual')
      );
      const fallbackIdx = foundIdx >= 0 ? foundIdx : initialChicks.findIndex((c) => c.name === selectedStudentName);
      setHighlightedIndex(fallbackIdx >= 0 ? fallbackIdx : null);
    } else {
      setHighlightedIndex(null);
    }
  }, [allCandidateChicks]);

  // Keep highlight in sync when selectedStudentName changes from store
  useEffect(() => {
    if (!selectedStudentName) {
      setHighlightedIndex(null);
      return;
    }
    const idx = chicksRef.current.findIndex(
      (c) => c.name === selectedStudentName && c.racerIdx === activeRacerIndex
    );
    const anyIdx = idx >= 0 ? idx : chicksRef.current.findIndex((c) => c.name === selectedStudentName);
    if (anyIdx >= 0) {
      setHighlightedIndex(anyIdx);
    }
  }, [selectedStudentName, activeRacerIndex]);

  // Continuous wandering loop: All baby chicks move around randomly ("di chuyển lung tung")
  // and Bà Già Chống Gậy also patrols around the yard!
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setChicks((prev) => {
        if (prev.length === 0) return prev;
        const speedMultiplier = isCatchingRef.current ? 2.2 : 1.0;

        return prev.map((chick, idx) => {
          // If this chick is currently caught and we're not in the middle of a new chase, keep it near grandma
          if (!isCatchingRef.current && highlightedRef.current === idx) {
            return chick;
          }

          let vx = chick.vx;
          let vy = chick.vy;

          // Randomly jitter direction so chicks wander unpredictably ("di chuyển lung tung")
          if (Math.random() < 0.18) {
            vx += (Math.random() - 0.5) * 0.7;
            vy += (Math.random() - 0.5) * 0.7;
          }

          // Clamp speed
          const maxSpd = 1.25;
          const minSpd = 0.4;
          const mag = Math.hypot(vx, vy) || 0.5;
          if (mag > maxSpd) {
            vx = (vx / mag) * maxSpd;
            vy = (vy / mag) * maxSpd;
          } else if (mag < minSpd) {
            vx = (vx / mag) * minSpd;
            vy = (vy / mag) * minSpd;
          }

          let nx = chick.x + vx * speedMultiplier;
          let ny = chick.y + vy * speedMultiplier;

          // Bounce off farmyard walls
          if (nx < 12) {
            nx = 12;
            vx = Math.abs(vx);
          } else if (nx > 88) {
            nx = 88;
            vx = -Math.abs(vx);
          }

          if (ny < 20) {
            ny = 20;
            vy = Math.abs(vy);
          } else if (ny > 82) {
            ny = 82;
            vy = -Math.abs(vy);
          }

          return {
            ...chick,
            x: nx,
            y: ny,
            vx,
            vy,
            facingLeft: vx < 0,
          };
        });
      });

      // If not actively catching, Bà Già Chống Gậy walks around or stands next to the caught chick
      if (!isCatchingRef.current) {
        const caughtIdx = highlightedRef.current;
        const currentChicks = chicksRef.current;
        if (caughtIdx !== null && currentChicks[caughtIdx]) {
          const target = currentChicks[caughtIdx];
          setGrandmaPos((prev) => ({
            x: Math.max(12, Math.min(86, target.x - 7)),
            y: Math.max(20, Math.min(82, target.y + 2)),
            facingLeft: target.x < prev.x,
          }));
        } else {
          // Patrol around the yard with her cane
          setGrandmaPos((prev) => {
            const dx = (Math.random() - 0.48) * 4.5;
            const dy = (Math.random() - 0.48) * 3.5;
            const nx = Math.max(15, Math.min(85, prev.x + dx));
            const ny = Math.max(24, Math.min(78, prev.y + dy));
            return {
              x: nx,
              y: ny,
              facingLeft: dx < 0,
            };
          });
        }
      }
    }, 85);

    return () => clearInterval(tickInterval);
  }, []);

  // Trigger "Bà Già Chống Gậy Chạy Xung Quanh Bắt Gà Con Ngẫu Nhiên"
  const handleCatchChick = () => {
    if (isCatching || chicksRef.current.length === 0) return;

    setIsCatching(true);
    sound.playEngineRev();

    let step = 0;
    const totalSteps = 16;

    const chaseTimer = setInterval(() => {
      const currentList = chicksRef.current;
      if (currentList.length === 0) {
        clearInterval(chaseTimer);
        setIsCatching(false);
        return;
      }

      const randIdx = Math.floor(Math.random() * currentList.length);
      const targetChick = currentList[randIdx];
      setHighlightedIndex(randIdx);

      if (targetChick) {
        setGrandmaPos((prev) => ({
          x: Math.max(12, Math.min(86, targetChick.x - 6)),
          y: Math.max(20, Math.min(82, targetChick.y + 2)),
          facingLeft: targetChick.x < prev.x,
        }));
      }

      step++;
      if (step >= totalSteps) {
        clearInterval(chaseTimer);
        const finalIdx = Math.floor(Math.random() * currentList.length);
        const caughtChick = currentList[finalIdx];
        setHighlightedIndex(finalIdx);

        if (caughtChick) {
          setGrandmaPos({
            x: Math.max(12, Math.min(86, caughtChick.x - 7)),
            y: Math.max(20, Math.min(82, caughtChick.y + 1)),
            facingLeft: false,
          });
          sound.playCorrect();
          // Select this student AND switch active turn to their team / individual rope!
          onSelectStudent(caughtChick.name, caughtChick.racerIdx);
        }
        setIsCatching(false);
      }
    }, 105);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-amber-950 via-emerald-950 to-slate-950 border-r-2 border-amber-500/40 select-none overflow-hidden relative">
      {/* 1. Top Header of Left Screen: Bà Già Chống Gậy Bắt Gà Con */}
      <div className="shrink-0 bg-slate-900/95 border-b border-amber-500/40 px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-lg shadow shrink-0">
            👵🦯
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide truncate">
              BÀ GIÀ CHỐNG GẬY BẮT GÀ CON
            </h3>
            <p className="text-[10px] text-slate-300 truncate">
              {gameMode === 'team'
                ? `Ngẫu nhiên 100% (${chicks.length} gà con • 1 em có thể được bắt ngẫu nhiên nhiều lần)`
                : `Ngẫu nhiên 100% (${chicks.length} cá nhân • 1 em có thể được bắt ngẫu nhiên nhiều lần)`}
            </p>
          </div>
        </div>

        {/* Active Team/Individual Badge */}
        {activeRacer && (
          <span
            className="px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-950 shrink-0 shadow"
            style={{ backgroundColor: activeRacer.colorHex || '#f59e0b' }}
          >
            {activeRacer.avatar} {activeRacer.name}
          </span>
        )}
      </div>

      {/* 2. Farmyard Pen with Wandering Baby Chicks & Bà Già Chống Gậy Running Around */}
      <div className="flex-1 relative overflow-hidden m-2 rounded-2xl border-2 border-amber-600/70 shadow-inner bg-gradient-to-b from-sky-900/50 via-lime-900/60 to-emerald-950">
        {/* Sunny Village Yard Background Details */}
        <svg
          viewBox="0 0 400 300"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-65"
        >
          <rect x="0" y="0" width="400" height="52" fill="#0c4a6e" opacity="0.4" />
          <circle cx="355" cy="28" r="17" fill="#fbbf24" opacity="0.85" />
          {/* Wooden fence along top */}
          {Array.from({ length: 16 }).map((_, i) => (
            <g key={i}>
              <rect
                x={i * 26 + 4}
                y="34"
                width="12"
                height="26"
                rx="2"
                fill="#92400e"
                stroke="#78350f"
                strokeWidth="1"
              />
            </g>
          ))}
          <rect x="0" y="42" width="400" height="5" fill="#b45309" />
          <rect x="0" y="52" width="400" height="5" fill="#b45309" />

          {/* Dirt paths & grass tufts */}
          <ellipse cx="200" cy="185" rx="145" ry="70" fill="#713f12" opacity="0.25" />
          <ellipse cx="345" cy="258" rx="35" ry="15" fill="#d97706" opacity="0.55" />
          <ellipse cx="345" cy="255" rx="25" ry="9" fill="#fbbf24" opacity="0.45" />
        </svg>

        {/* Wandering Baby Chicks with Student Full Name (and Team dot) on Head */}
        {chicks.map((chick, idx) => {
          const isCaught = highlightedIndex === idx;
          const normChickKey = normalizeEntityKey(chick.name);
          const chickCalls = studentCallCounts[normChickKey] || 0;
          const chickStat = sessionStudentRecords[normChickKey];
          return (
            <div
              key={chick.id}
              onClick={() => {
                if (!isCatching) {
                  setHighlightedIndex(idx);
                  setGrandmaPos({
                    x: Math.max(10, chick.x - 7),
                    y: chick.y,
                    facingLeft: false,
                  });
                  sound.playCorrect();
                  onSelectStudent(chick.name, chick.racerIdx);
                }
              }}
              style={{
                left: `${chick.x}%`,
                top: `${chick.y}%`,
                transition: 'left 85ms linear, top 85ms linear',
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer ${
                isCaught ? 'z-30 scale-115' : 'z-10 hover:scale-110'
              }`}
              title={`Bấm để chọn học sinh: ${chick.name} (${chick.teamName})${
                chickCalls > 0 ? ` • Đã gọi ngẫu nhiên ${chickCalls} lần` : ''
              }`}
            >
              {/* FULL STUDENT NAME FLOATING ON CHICK'S HEAD */}
              <div
                className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black whitespace-nowrap shadow-md border flex items-center gap-1 mb-0.5 ${
                  isCaught
                    ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-300 scale-105'
                    : 'bg-slate-950/90 text-white border-amber-400/60'
                }`}
              >
                {gameMode === 'team' && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0 border border-white/50"
                    style={{ backgroundColor: chick.teamColor }}
                  />
                )}
                <span>
                  {isCaught ? '🎯 ' : ''}
                  {chick.name}
                </span>
                {chickCalls > 1 && (
                  <span
                    className={`px-1 rounded text-[9px] font-extrabold ${
                      isCaught ? 'bg-slate-950 text-amber-300' : 'bg-indigo-600 text-white'
                    }`}
                  >
                    x{chickCalls}
                  </span>
                )}
                {chickStat && chickStat.correctCount > 0 && (
                  <span
                    className={`px-1 rounded text-[9px] font-mono ${
                      isCaught ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-900/90 text-emerald-200'
                    }`}
                  >
                    {chickStat.correctCount}Đ•{chickStat.totalTimeSec.toFixed(1)}s
                  </span>
                )}
              </div>

              {/* Cute Baby Chick SVG Illustration with animated running feet */}
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center">
                {isCaught && (
                  <div className="absolute inset-0 rounded-full bg-amber-400/45 animate-ping" />
                )}
                <svg
                  viewBox="0 0 64 64"
                  className={`w-full h-full drop-shadow-md ${
                    chick.facingLeft ? '' : 'scale-x-[-1]'
                  }`}
                >
                  <ellipse cx="32" cy="57" rx="14" ry="4" fill="rgba(0,0,0,0.35)" />
                  {/* Running Legs */}
                  <line
                    x1="27"
                    y1="48"
                    x2="23"
                    y2="56"
                    stroke="#f97316"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <line
                    x1="37"
                    y1="48"
                    x2="41"
                    y2="56"
                    stroke="#f97316"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Chick Body */}
                  <ellipse
                    cx="34"
                    cy="38"
                    rx="15"
                    ry="13"
                    fill="#facc15"
                    stroke="#ca8a04"
                    strokeWidth="2"
                  />
                  {/* Flapping Wing */}
                  <ellipse
                    cx="37"
                    cy="38"
                    rx="7"
                    ry="5"
                    fill="#eab308"
                    stroke="#ca8a04"
                    strokeWidth="1.5"
                    transform="rotate(-18 37 38)"
                  />
                  {/* Chick Head */}
                  <circle
                    cx="24"
                    cy="26"
                    r="11"
                    fill="#fde047"
                    stroke="#ca8a04"
                    strokeWidth="2"
                  />
                  <path d="M22 15 Q24 10 27 15 Q30 11 29 16" fill="#ef4444" />
                  <circle cx="20" cy="24" r="2.2" fill="#0f172a" />
                  <circle cx="19.3" cy="23.2" r="0.8" fill="#ffffff" />
                  <ellipse cx="22" cy="28" rx="2.5" ry="1.5" fill="#fb7185" opacity="0.7" />
                  <polygon
                    points="13,25 8,28 14,30"
                    fill="#f97316"
                    stroke="#c2410c"
                    strokeWidth="1"
                  />
                </svg>
              </div>
            </div>
          );
        })}

        {/* BÀ GIÀ CHỐNG GẬY (OLD LADY HOLDING WALKING CANE) RUNNING AROUND TO CATCH CHICKS */}
        <div
          style={{
            left: `${grandmaPos.x}%`,
            top: `${grandmaPos.y}%`,
            transition: 'left 95ms linear, top 95ms linear',
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
        >
          <div className="flex flex-col items-center">
            <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] shadow border border-rose-300 mb-0.5 whitespace-nowrap">
              {isCatching ? '👵🦯 Bà già chống gậy đang đuổi bắt...' : '👵🦯 Bà Già Chống Gậy'}
            </span>
            <svg
              viewBox="0 0 96 86"
              className={`w-16 h-16 sm:w-20 sm:h-20 drop-shadow-xl ${
                grandmaPos.facingLeft ? 'scale-x-[-1]' : ''
              } ${isCatching ? 'animate-bounce' : ''}`}
            >
              {/* Ground Shadow */}
              <ellipse cx="46" cy="79" rx="24" ry="5" fill="rgba(0,0,0,0.45)" />

              {/* Running Feet */}
              <line x1="36" y1="66" x2="30" y2="77" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
              <line x1="50" y1="66" x2="56" y2="77" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />

              {/* Áo bà ba tunic & dark trousers */}
              <path
                d="M28 43 L58 43 L63 68 L24 68 Z"
                fill="#92400e"
                stroke="#451a03"
                strokeWidth="2"
              />

              {/* Grey Hair Bun at back */}
              <circle cx="28" cy="24" r="7.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />

              {/* Slightly hunched posture Head */}
              <circle cx="44" cy="27" r="13" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" />

              {/* Round Glasses & Kind Smile */}
              <circle cx="40" cy="26" r="3.5" fill="none" stroke="#334155" strokeWidth="1.5" />
              <circle cx="49" cy="26" r="3.5" fill="none" stroke="#334155" strokeWidth="1.5" />
              <line x1="43.5" y1="26" x2="45.5" y2="26" stroke="#334155" strokeWidth="1.5" />
              <path
                d="M41 33 Q45 37 49 33"
                fill="none"
                stroke="#9a3412"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Khăn vấn headscarf */}
              <path
                d="M31 21 Q44 12 57 21"
                fill="none"
                stroke="#78350f"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Left Arm holding the WALKING CANE (Gậy gỗ chống tay của bà già) */}
              <path
                d="M32 47 L18 52"
                stroke="#fed7aa"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              {/* Curved Wooden Walking Cane (Cây gậy chống) */}
              <path
                d="M23 48 Q16 42 12 49 L10 79"
                fill="none"
                stroke="#fcd34d"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M23 48 Q16 42 12 49 L10 79"
                fill="none"
                stroke="#78350f"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Right Arm reaching out to catch chicks with Bamboo Nơm */}
              <path
                d="M54 47 L72 42"
                stroke="#fed7aa"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              {/* Bamboo Nơm / Basket */}
              <path
                d="M64 38 L84 38 L88 64 L60 64 Z"
                fill="#d97706"
                fillOpacity="0.8"
                stroke="#78350f"
                strokeWidth="2"
              />
              <line x1="69" y1="38" x2="67" y2="64" stroke="#78350f" strokeWidth="1.5" />
              <line x1="74" y1="38" x2="74" y2="64" stroke="#78350f" strokeWidth="1.5" />
              <line x1="79" y1="38" x2="81" y2="64" stroke="#78350f" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Bottom Action Bar: Caught Student + Team Info & Random Catch Button */}
      <div className="shrink-0 p-2.5 bg-slate-900/95 border-t border-amber-500/30 space-y-2">
        {/* Selected Student & Team Display */}
        <div className="bg-slate-950/90 border border-amber-400/50 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block leading-none">
                Bà già bắt ngẫu nhiên (1 em có thể được gọi ngẫu nhiên nhiều lần):
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-amber-300 truncate">
                  {selectedStudentName
                    ? `🐥 ${selectedStudentName}`
                    : 'Chưa bắt (Bấm nút bên dưới để bà già bắt ngẫu nhiên)'}
                </span>
                {selectedCallCount > 1 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[9px] font-black">
                    Lần gọi #{selectedCallCount}
                  </span>
                )}
                {selectedStdStat && (
                  <span className="text-[10px] font-mono text-emerald-300 font-bold">
                    (✅{selectedStdStat.correctCount} đúng • ⏱️{selectedStdStat.totalTimeSec.toFixed(1)}s)
                  </span>
                )}
              </div>
            </div>
          </div>
          {activeRacer && (
            <span
              className="px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-950 shrink-0"
              style={{ backgroundColor: activeRacer.colorHex || '#f59e0b' }}
            >
              {gameMode === 'team' ? `Tính điểm: ${activeRacer.name}` : `Cá nhân: ${activeRacer.name}`}
            </span>
          )}
        </div>

        {/* Button to trigger Bà Già Chống Gậy Bắt Gà Ngẫu Nhiên */}
        <button
          type="button"
          onClick={handleCatchChick}
          disabled={isCatching || chicks.length === 0}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 cursor-pointer disabled:opacity-50 active:scale-98 transition-all"
        >
          <Shuffle className={`w-4 h-4 ${isCatching ? 'animate-spin' : ''}`} />
          <span>
            {isCatching
              ? 'BÀ GIÀ CHỐNG GẬY ĐANG CHẠY BẮT GÀ CON...'
              : '👵🦯 BÀ GIÀ CHỐNG GẬY BẮT GÀ (CHỌN NGẪU NHIÊN)'}
          </span>
        </button>
      </div>
    </div>
  );
};
