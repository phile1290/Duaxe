import React, { useState, useEffect, useRef } from 'react';
import { GameMode, Racer, Student } from '../../types';
import { sound } from '../../services/soundService';
import { normalizeEntityKey } from '../../services/classroomStorageService';
import { Sparkles, Users, UserCheck, Volume2, Shuffle } from 'lucide-react';

interface ChickPickerArenaProps {
  students: Student[];
  racers: Racer[];
  gameMode: GameMode;
  currentRacerIndex: number;
  selectedStudentName: string | null;
  studentCallCounts?: Record<string, number>;
  onSelectStudent: (studentName: string, racerIndex?: number) => void;
  onSelectTeamFilter?: (racerIndex: number) => void;
}

interface WanderingChick {
  id: string;
  name: string;
  teamName: string;
  racerIndex: number;
  colorHex: string;
  x: number; // percentage 12..86
  y: number; // percentage 26..80
  vx: number;
  vy: number;
  facingLeft: boolean;
  bobOffset: number;
  justDodged?: boolean;
}

type JumpStatus = 'idle' | 'jumping' | 'missed' | 'caught';

export const ChickPickerArena: React.FC<ChickPickerArenaProps> = ({
  students,
  racers,
  gameMode,
  currentRacerIndex,
  selectedStudentName,
  studentCallCounts = {},
  onSelectStudent,
  onSelectTeamFilter,
}) => {
  const [isCatching, setIsCatching] = useState(false);
  const [jumpStatus, setJumpStatus] = useState<JumpStatus>('idle');
  const [statusBannerText, setStatusBannerText] = useState<string | null>(null);
  const [grandmaPos, setGrandmaPos] = useState<{ x: number; y: number; facingLeft: boolean }>({
    x: 15,
    y: 52,
    facingLeft: false,
  });
  const [highlightedChickId, setHighlightedChickId] = useState<string | null>(null);
  const [caughtChick, setCaughtChick] = useState<WanderingChick | null>(null);
  const [chicks, setChicks] = useState<WanderingChick[]>([]);
  const [filterTeamIdx, setFilterTeamIdx] = useState<number | 'all'>('all');

  const chicksRef = useRef<WanderingChick[]>([]);
  chicksRef.current = chicks;

  // Build list of chicks based on active mode & team filter
  // Các chú gà di chuyển CHẬM RÃI trên sân cỏ
  useEffect(() => {
    const built: WanderingChick[] = [];

    if (gameMode === 'individual') {
      racers.forEach((r, rIdx) => {
        const angle = (rIdx / Math.max(1, racers.length)) * Math.PI * 2;
        const speed = 0.14 + (rIdx % 3) * 0.035; // Di chuyển chậm rãi, nhẹ nhàng
        built.push({
          id: `chick-ind-${rIdx}`,
          name: r.name,
          teamName: 'Cá nhân',
          racerIndex: rIdx,
          colorHex: r.colorHex,
          x: 24 + ((rIdx * 17) % 60),
          y: 30 + ((rIdx * 23) % 46),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          facingLeft: rIdx % 2 === 0,
          bobOffset: rIdx * 0.7,
        });
      });
    } else {
      racers.forEach((r, rIdx) => {
        if (filterTeamIdx !== 'all' && filterTeamIdx !== rIdx) return;

        const names =
          r.memberNames && r.memberNames.length > 0
            ? r.memberNames
            : students.filter((s) => s.teamId === r.id).map((s) => s.name);

        const effectiveNames = names.length > 0 ? names : [r.name];

        effectiveNames.forEach((sName, sIdx) => {
          const seed = rIdx * 7 + sIdx * 13;
          const angle = ((seed % 12) / 12) * Math.PI * 2;
          const speed = 0.14 + (seed % 3) * 0.035; // Di chuyển chậm rãi, khoan thai
          built.push({
            id: `chick-team-${rIdx}-${sIdx}`,
            name: sName,
            teamName: r.name,
            racerIndex: rIdx,
            colorHex: r.colorHex,
            x: 22 + ((seed * 19) % 62),
            y: 28 + ((seed * 29) % 48),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            facingLeft: seed % 2 === 1,
            bobOffset: seed * 0.5,
          });
        });
      });
    }

    setChicks(built);
  }, [gameMode, racers, students, filterTeamIdx]);

  // Đồng bộ trạng thái bắt gà với selectedStudentName trong kho lưu trữ:
  // TUYỆT ĐỐI KHÔNG gọi tên học sinh trước khi bấm "Bắt đầu bắt gà gọi tên"
  useEffect(() => {
    if (!selectedStudentName) {
      setCaughtChick(null);
      setHighlightedChickId(null);
      setJumpStatus('idle');
      setStatusBannerText(null);
      setGrandmaPos({ x: 15, y: 52, facingLeft: false });
      return;
    }
    const found = chicksRef.current.find(
      (c) => c.name.trim().toLowerCase() === selectedStudentName.trim().toLowerCase()
    );
    if (found) {
      setCaughtChick(found);
      setHighlightedChickId(found.id);
    }
  }, [selectedStudentName]);

  // Animate chicks strolling slowly around the meadow
  useEffect(() => {
    const interval = setInterval(() => {
      setChicks((prev) =>
        prev.map((c) => {
          // Nếu chú gà này đã bị Bà cụ bắt trúng thì đứng yên bên Bà cụ
          if (caughtChick && c.id === caughtChick.id && !isCatching) {
            return c;
          }

          let nx = c.x + c.vx;
          let ny = c.y + c.vy;
          let nvx = c.vx;
          let nvy = c.vy;

          if (nx < 16) {
            nx = 16;
            nvx = Math.abs(nvx);
          } else if (nx > 86) {
            nx = 86;
            nvx = -Math.abs(nvx);
          }

          if (ny < 26) {
            ny = 26;
            nvy = Math.abs(nvy);
          } else if (ny > 80) {
            ny = 80;
            nvy = -Math.abs(nvy);
          }

          // Thỉnh thoảng đổi hướng nhẹ nhàng, chậm rãi
          if (Math.random() < 0.025) {
            const deltaAngle = (Math.random() - 0.5) * 0.5;
            const cos = Math.cos(deltaAngle);
            const sin = Math.sin(deltaAngle);
            const rvx = nvx * cos - nvy * sin;
            const rvy = nvx * sin + nvy * cos;
            nvx = rvx;
            nvy = rvy;
          }

          return {
            ...c,
            x: nx,
            y: ny,
            vx: nvx,
            vy: nvy,
            facingLeft: nvx < 0,
          };
        })
      );
    }, 100);

    return () => clearInterval(interval);
  }, [caughtChick, isCatching]);

  // Bà cụ chống gậy nhảy tới bắt gà:
  // - Bà cụ nhảy tới chụp chú gà, CÓ THỂ BẮT TRÚNG HOẶC BẮT TRẬT (HỤT) chú gà!
  // - Nếu nhảy chụp trật (chú gà nhanh chân né kịp), Bà cụ sẽ báo "Ôi trật chú gà rồi!" và lấy đà nhảy chụp tiếp cho đến khi bắt trúng!
  const handleStartCatchChick = () => {
    if (isCatching || chicksRef.current.length === 0) return;

    setIsCatching(true);
    setCaughtChick(null);
    setHighlightedChickId(null);
    setJumpStatus('jumping');
    setStatusBannerText('🦘 Bà cụ chống gậy đang lấy đà nhảy tới bắt gà...');
    sound.playClick();

    // Quyết định số lần nhảy chụp trật trước khi bắt trúng (0, 1 hoặc 2 lần nhảy trật để tạo kịch tính "có thể trúng hay trật chú gà")
    const missCount =
      chicksRef.current.length > 1
        ? Math.random() < 0.65
          ? Math.random() < 0.45
            ? 2
            : 1
          : 0
        : 0;

    let currentAttempt = 0;

    const executeJumpAttempt = () => {
      const currentPool = chicksRef.current;
      if (currentPool.length === 0) {
        setIsCatching(false);
        setJumpStatus('idle');
        return;
      }

      const targetChick = currentPool[Math.floor(Math.random() * currentPool.length)];
      setHighlightedChickId(targetChick.id);

      // Bà cụ nhảy bật lên không trung hướng tới vị trí chú gà
      setJumpStatus('jumping');
      setStatusBannerText(`🦘 Bà cụ nhảy tới chụp chú gà "${targetChick.name}"...`);
      setGrandmaPos((prev) => ({
        x: Math.max(12, Math.min(82, targetChick.x - 5)),
        y: Math.max(24, Math.min(76, targetChick.y - 3)),
        facingLeft: targetChick.x < prev.x,
      }));
      sound.playClick();

      setTimeout(() => {
        if (currentAttempt < missCount) {
          // BẮT TRẬT (HỤT) CHÚ GÀ!
          currentAttempt++;
          setJumpStatus('missed');
          setStatusBannerText(
            `💨 Ôi trật rồi! Chú gà "${targetChick.name}" vừa lách thoát! Bà cụ nhảy bắt tiếp...`
          );
          sound.playWrong();

          // Chú gà bị chụp hụt nhảy vọt sang hướng khác
          setChicks((prev) =>
            prev.map((c) => {
              if (c.id === targetChick.id) {
                const dodgeX = c.x < 50 ? Math.min(84, c.x + 18) : Math.max(18, c.x - 18);
                const dodgeY = c.y < 52 ? Math.min(78, c.y + 14) : Math.max(28, c.y - 14);
                return {
                  ...c,
                  x: dodgeX,
                  y: dodgeY,
                  vx: -c.vx,
                  vy: -c.vy,
                  facingLeft: dodgeX < c.x,
                  justDodged: true,
                };
              }
              return { ...c, justDodged: false };
            })
          );

          // Sau 750ms Bà cụ lấy đà nhảy tới chụp chú gà tiếp theo
          setTimeout(() => {
            executeJumpAttempt();
          }, 750);
        } else {
          // BẮT TRÚNG CHÚ GÀ!
          const latestPool = chicksRef.current;
          const winner =
            latestPool.find((c) => c.id === targetChick.id) ||
            latestPool[Math.floor(Math.random() * latestPool.length)];

          setJumpStatus('caught');
          setHighlightedChickId(winner.id);
          setCaughtChick(winner);
          setGrandmaPos({
            x: Math.max(12, Math.min(82, winner.x - 5)),
            y: Math.max(24, Math.min(76, winner.y - 2)),
            facingLeft: false,
          });
          setChicks((prev) => prev.map((c) => ({ ...c, justDodged: false })));
          setStatusBannerText(`🎯 Bắt trúng chú gà "${winner.name}" rồi! Xin mời em trả lời!`);

          setIsCatching(false);
          sound.playCorrect();
          onSelectStudent(winner.name, winner.racerIndex);
        }
      }, 520);
    };

    executeJumpAttempt();
  };

  // Click directly on a specific chick -> Grandma jumps toward that chick (can still hit or miss then catch)
  const handleManualPickChick = (chick: WanderingChick) => {
    if (isCatching) return;
    setIsCatching(true);
    setCaughtChick(null);
    setHighlightedChickId(chick.id);
    setJumpStatus('jumping');
    setStatusBannerText(`🦘 Bà cụ nhảy tới chụp chú gà "${chick.name}"...`);
    sound.playClick();

    setGrandmaPos((prev) => ({
      x: Math.max(12, Math.min(82, chick.x - 5)),
      y: Math.max(24, Math.min(76, chick.y - 2)),
      facingLeft: chick.x < prev.x,
    }));

    // Có xác suất 35% chụp hụt nhịp đầu rồi chụp trúng ngay nhịp kế tiếp
    const willMissFirst = Math.random() < 0.35;

    setTimeout(() => {
      if (willMissFirst) {
        setJumpStatus('missed');
        setStatusBannerText(`💨 Chú gà "${chick.name}" né rất nhanh! Bà cụ nhảy chụp lần 2...`);
        sound.playWrong();

        setTimeout(() => {
          setJumpStatus('caught');
          setCaughtChick(chick);
          setHighlightedChickId(chick.id);
          setStatusBannerText(`🎯 Đã bắt trúng chú gà "${chick.name}"!`);
          setIsCatching(false);
          sound.playCorrect();
          onSelectStudent(chick.name, chick.racerIndex);
        }, 650);
      } else {
        setJumpStatus('caught');
        setCaughtChick(chick);
        setHighlightedChickId(chick.id);
        setStatusBannerText(`🎯 Đã bắt trúng chú gà "${chick.name}"!`);
        setIsCatching(false);
        sound.playCorrect();
        onSelectStudent(chick.name, chick.racerIndex);
      }
    }, 480);
  };

  const activeRacer = racers[currentRacerIndex] || racers[0];
  const caughtCallCount = caughtChick
    ? studentCallCounts[normalizeEntityKey(caughtChick.name)] || 1
    : selectedStudentName
    ? studentCallCounts[normalizeEntityKey(selectedStudentName)] || 1
    : 0;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-xl flex flex-col select-none bg-gradient-to-b from-sky-400 via-emerald-500 to-emerald-800">
      {/* Top Bar: Title + Filter by Team + Catch Chick Button */}
      <div className="relative z-20 bg-slate-950/90 backdrop-blur-md px-2.5 py-1.5 border-b border-amber-400/50 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg sm:text-xl shrink-0">👵🦯🐥</span>
          <div className="min-w-0">
            <h3 className="text-[11px] sm:text-xs font-black text-amber-300 uppercase tracking-wider leading-tight truncate">
              Khu Vực Bà Cụ Chống Gậy Bắt Gà Gọi Tên Học Sinh
            </h3>
            <p className="text-[10px] text-emerald-200 font-semibold truncate">
              Bà cụ chỉ cầm cây gậy • Gà đi chậm rãi • Nhảy chụp có thể trúng hoặc trật
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {gameMode === 'team' && racers.length > 1 && (
            <div className="hidden xl:flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setFilterTeamIdx('all')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold transition-all cursor-pointer ${
                  filterTeamIdx === 'all'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Tất cả ({students.length})
              </button>
              {racers.map((r, idx) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setFilterTeamIdx(idx);
                    onSelectTeamFilter?.(idx);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-0.5 ${
                    filterTeamIdx === idx
                      ? 'bg-emerald-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>{r.avatar}</span>
                  <span className="max-w-[60px] truncate">{r.name}</span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleStartCatchChick}
            disabled={isCatching}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 hover:from-amber-300 hover:to-rose-400 disabled:opacity-60 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/30 flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 border border-white/50"
          >
            <Sparkles className={`w-4 h-4 ${isCatching ? 'animate-spin' : ''}`} />
            <span>
              {isCatching
                ? 'Bà cụ đang nhảy bắt gà...'
                : selectedStudentName
                ? 'Bắt gà gọi tên tiếp'
                : 'Bắt đầu bắt gà gọi tên'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Grass Courtyard Arena */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Sky & Village Background Elements */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 22%, #4ade80 23%, #16a34a 68%, #15803d 100%)',
          }}
        />

        {/* Sun & Clouds */}
        <div className="absolute top-1.5 right-5 w-8 h-8 rounded-full bg-amber-300 shadow-[0_0_24px_#fde047] pointer-events-none opacity-90" />
        <div className="absolute top-1.5 left-10 text-xl opacity-80 pointer-events-none">☁️</div>
        <div className="absolute top-2.5 left-1/2 text-lg opacity-75 pointer-events-none">☁️</div>

        {/* Bamboo Fence & Rural Scenery on Horizon */}
        <div className="absolute top-[16%] inset-x-0 flex items-end justify-between px-3 pointer-events-none opacity-90">
          <div className="flex items-end gap-1 text-lg sm:text-xl">
            <span>🎋</span>
            <span>🏡</span>
            <span>🌳</span>
          </div>
          <div className="flex items-center gap-0.5 text-amber-800/60 font-black text-xs tracking-widest">
            <span>🪵🪵🪵🪵🪵🪵🪵🪵🪵🪵🪵🪵</span>
          </div>
          <div className="flex items-end gap-1 text-lg sm:text-xl">
            <span>🌾</span>
            <span>🌴</span>
            <span>🎋</span>
          </div>
        </div>

        {/* Grass Tufts */}
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute left-[10%] top-[40%] text-xs opacity-60">🌱</span>
          <span className="absolute left-[32%] top-[70%] text-xs opacity-60">🌿</span>
          <span className="absolute left-[68%] top-[36%] text-xs opacity-60">🌼</span>
          <span className="absolute left-[84%] top-[66%] text-xs opacity-60">🌱</span>
          <span className="absolute left-[50%] top-[56%] text-xs opacity-60">🍀</span>
        </div>

        {/* Status Banner when Grandma is jumping / missed / caught */}
        {statusBannerText && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div
              className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-black shadow-lg border flex items-center gap-1.5 whitespace-nowrap ${
                jumpStatus === 'missed'
                  ? 'bg-rose-600/95 border-rose-200 text-white animate-bounce'
                  : jumpStatus === 'caught'
                  ? 'bg-emerald-600/95 border-emerald-200 text-white'
                  : 'bg-amber-400/95 border-white text-slate-950 animate-pulse'
              }`}
            >
              <span>{statusBannerText}</span>
            </div>
          </div>
        )}

        {/* Wandering Chicks (Students) - Di chuyển chậm rãi */}
        {chicks.map((chick) => {
          const isHighlighted = highlightedChickId === chick.id;
          const isCaught =
            Boolean(selectedStudentName) &&
            caughtChick?.id === chick.id &&
            !isCatching;

          return (
            <button
              key={chick.id}
              type="button"
              onClick={() => handleManualPickChick(chick)}
              title={`Bấm để Bà cụ nhảy bắt chú gà: ${chick.name} (${chick.teamName})`}
              style={{
                left: `${chick.x}%`,
                top: `${chick.y}%`,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-linear cursor-pointer group focus:outline-none ${
                isCaught
                  ? 'z-30 scale-125'
                  : isHighlighted
                  ? 'z-25 scale-115'
                  : 'z-10 hover:scale-110'
              }`}
            >
              {/* Dodge / Miss Indicator */}
              {chick.justDodged && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow border border-white whitespace-nowrap animate-bounce">
                  💨 Né kịp!
                </div>
              )}

              {/* Student Name Tag Above Chick */}
              <div
                className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black whitespace-nowrap shadow-md border transition-all mb-0.5 flex items-center gap-1 ${
                  isCaught
                    ? 'bg-amber-300 text-slate-950 border-white ring-2 ring-amber-400 scale-105'
                    : isHighlighted
                    ? 'bg-rose-500 text-white border-white scale-105'
                    : 'bg-slate-950/85 text-white border-white/30 group-hover:bg-slate-900'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: chick.colorHex }}
                />
                <span>{chick.name}</span>
              </div>

              {/* Cute 2D SVG Yellow Chick */}
              <div className="relative flex flex-col items-center">
                {isCaught && (
                  <div className="absolute -inset-2 rounded-full bg-amber-300/60 animate-ping pointer-events-none" />
                )}
                <svg
                  viewBox="0 0 64 64"
                  className={`w-8 h-8 sm:w-10 sm:h-10 drop-shadow-[0_3px_4px_rgba(0,0,0,0.4)] transition-transform ${
                    chick.facingLeft ? '' : '-scale-x-100'
                  } ${isHighlighted || isCaught ? 'animate-bounce' : ''}`}
                >
                  {/* Shadow */}
                  <ellipse cx="32" cy="58" rx="14" ry="4" fill="rgba(0,0,0,0.28)" />
                  {/* Legs */}
                  <path
                    d="M26 48 L24 56 M24 56 L20 56 M24 56 L27 57 M38 48 L40 56 M40 56 L36 56 M40 56 L43 57"
                    stroke="#ea580c"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                  {/* Chick Body */}
                  <ellipse
                    cx="34"
                    cy="36"
                    rx="16"
                    ry="14"
                    fill="#fde047"
                    stroke="#ca8a04"
                    strokeWidth="2"
                  />
                  {/* Chick Head */}
                  <circle
                    cx="22"
                    cy="24"
                    r="11"
                    fill="#fef08a"
                    stroke="#ca8a04"
                    strokeWidth="2"
                  />
                  {/* Cute Comb on Head */}
                  <path
                    d="M20 13 C20 9, 24 9, 24 13 C26 9, 30 10, 27 14"
                    fill="#ef4444"
                  />
                  {/* Wing */}
                  <ellipse
                    cx="37"
                    cy="35"
                    rx="8"
                    ry="5.5"
                    transform="rotate(-12 37 35)"
                    fill="#facc15"
                    stroke="#ca8a04"
                    strokeWidth="1.5"
                  />
                  {/* Beak */}
                  <polygon points="11,22 4,25 11,28" fill="#f97316" />
                  {/* Eye */}
                  <circle cx="18" cy="22" r="2.3" fill="#0f172a" />
                  <circle cx="17.3" cy="21.2" r="0.8" fill="#ffffff" />
                  {/* Rosy Cheek */}
                  <ellipse cx="21" cy="27" rx="2.5" ry="1.5" fill="#fb7185" opacity="0.7" />
                </svg>
              </div>
            </button>
          );
        })}

        {/* Grandma with Cane Character (Bà Cụ Chống Gậy - KHÔNG cầm gì theo bên mình ngoài cây gậy!) */}
        <div
          style={{
            left: `${grandmaPos.x}%`,
            top: `${grandmaPos.y}%`,
          }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none transition-all duration-450 ease-out`}
        >
          <div
            className={`relative flex flex-col items-center transition-transform duration-300 ${
              jumpStatus === 'jumping'
                ? '-translate-y-6 scale-110'
                : jumpStatus === 'missed'
                ? '-translate-y-2 rotate-3'
                : ''
            }`}
          >
            <div
              className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-lg mb-0.5 whitespace-nowrap border ${
                jumpStatus === 'missed'
                  ? 'bg-rose-600 text-white border-white'
                  : jumpStatus === 'caught'
                  ? 'bg-emerald-500 text-slate-950 border-white'
                  : 'bg-amber-950/90 border-amber-300 text-amber-200'
              }`}
            >
              {jumpStatus === 'jumping'
                ? '🦘 Bà cụ nhảy chụp gà!'
                : jumpStatus === 'missed'
                ? '💨 Bà cụ chụp trật rồi!'
                : jumpStatus === 'caught'
                ? '🎯 Bà cụ bắt trúng gà!'
                : '👵 Bà Cụ Chống Gậy'}
            </div>

            {/* Custom 2D SVG Illustration of Kind Vietnamese Grandma with ONLY her Walking Cane */}
            <svg
              viewBox="0 0 96 100"
              className={`w-14 h-14 sm:w-16 sm:h-16 drop-shadow-[0_6px_8px_rgba(0,0,0,0.5)] ${
                grandmaPos.facingLeft ? '-scale-x-100' : ''
              }`}
            >
              {/* Ground Shadow */}
              <ellipse cx="46" cy="92" rx="22" ry="5" fill="rgba(0,0,0,0.35)" />

              {/* Hair Bun (Búi tóc bạc phía sau) */}
              <circle cx="28" cy="24" r="9" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />

              {/* Áo bà ba nâu truyền thống (Hơi khom lưng hiền hậu) */}
              <path
                d="M30 42 C24 52, 24 72, 28 84 L58 84 C60 70, 58 52, 50 42 Z"
                fill="#92400e"
                stroke="#451a03"
                strokeWidth="2.2"
              />
              {/* Quần đen truyền thống */}
              <path
                d="M32 82 L30 92 L41 92 L43 82 Z M46 82 L47 92 L57 92 L55 82 Z"
                fill="#1e293b"
              />

              {/* Tay phải vươn tự nhiên (KHÔNG cầm giỏ hay nơm, chỉ có bàn tay không) */}
              <path
                d="M46 48 Q58 52 64 46"
                fill="none"
                stroke="#78350f"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <circle cx="65" cy="45" r="4" fill="#fde68a" stroke="#b45309" strokeWidth="1.5" />

              {/* Head & Kind Smiling Face */}
              <circle
                cx="44"
                cy="27"
                r="13"
                fill="#fde68a"
                stroke="#b45309"
                strokeWidth="2"
              />
              {/* Silver Hair Front */}
              <path
                d="M32 23 C34 12, 52 12, 56 22 C50 18, 38 18, 32 23 Z"
                fill="#f1f5f9"
              />
              {/* Glasses & Kind Eyes */}
              <circle
                cx="49"
                cy="26"
                r="3.5"
                fill="none"
                stroke="#475569"
                strokeWidth="1.5"
              />
              <circle cx="49" cy="26" r="1.3" fill="#0f172a" />
              {/* Gentle Smile */}
              <path
                d="M46 33 Q50 36 53 33"
                fill="none"
                stroke="#991b1b"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              {/* Left Arm holding ONLY the Wooden Walking Cane (Cây gậy chống bên mình) */}
              <path
                d="M36 48 Q50 56 58 54"
                fill="none"
                stroke="#b45309"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <circle cx="59" cy="54" r="4" fill="#fde68a" stroke="#b45309" strokeWidth="1.5" />

              {/* Wooden Walking Cane (Cây gậy trúc/gỗ chống tay) */}
              <path
                d="M59 50 C65 46, 69 50, 65 55 L63 92"
                fill="none"
                stroke="#d97706"
                strokeWidth="3.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Announced Student Banner:
          - Khi CHƯA bấm "Bắt đầu bắt gà gọi tên" (selectedStudentName === null): Hiển thị hướng dẫn bấm nút, KHÔNG gọi tên trước!
          - Khi Bà cụ ĐÃ bắt trúng chú gà: Hiển thị rõ tên học sinh và đội để trả lời câu hỏi. */}
      <div className="relative z-20 bg-slate-950/95 border-t border-amber-400/50 px-3 py-1.5 flex items-center justify-between gap-2">
        {selectedStudentName ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow">
              🐥
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-amber-300 font-bold uppercase leading-none flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-400" />
                <span>Bà cụ đã bắt trúng chú gà (Ngẫu nhiên):</span>
              </div>
              <div className="text-xs sm:text-sm font-black text-white truncate flex items-center gap-1.5 flex-wrap">
                <span className="text-amber-300">
                  {caughtChick?.name || selectedStudentName}
                </span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                  {caughtChick?.teamName || activeRacer?.name || 'Đội thi'}
                </span>
                {caughtCallCount > 1 && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-200 border border-indigo-400/50 font-black">
                    <Shuffle className="w-2.5 h-2.5" />
                    <span>Được gọi lần {caughtCallCount}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-slate-800 border border-amber-400/50 text-amber-300 flex items-center justify-center font-black text-sm shrink-0">
              👵
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-amber-300 font-bold uppercase leading-none">
                Chưa gọi tên học sinh:
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-200 truncate">
                Hãy bấm <span className="text-amber-300 font-black">"Bắt đầu bắt gà gọi tên"</span> để Bà cụ nhảy bắt chú gà!
              </div>
            </div>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-semibold shrink-0">
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span>{chicks.length} chú gà trên sân</span>
        </div>
      </div>
    </div>
  );
};
