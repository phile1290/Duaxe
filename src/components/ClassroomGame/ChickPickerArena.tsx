import React, { useState, useEffect, useRef } from 'react';
import { GameMode, Racer, Student } from '../../types';
import { sound } from '../../services/soundService';
import { normalizeEntityKey } from '../../services/classroomStorageService';
import { Flag, Users, Shuffle, RotateCcw, Volume2, Trophy } from 'lucide-react';

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

interface Duck3DPalette {
  id: string;
  bodyLight: string;
  bodyMid: string;
  bodyDark: string;
  wingLight: string;
  wingDark: string;
  beakLight: string;
  beakDark: string;
  collarHex: string;
}

// Bộ màu sắc 3D đa dạng, bóng bẩy cho từng chú vịt
const DUCK_3D_PALETTES: Duck3DPalette[] = [
  {
    id: 'gold',
    bodyLight: '#fef08a',
    bodyMid: '#facc15',
    bodyDark: '#ca8a04',
    wingLight: '#fde047',
    wingDark: '#a16207',
    beakLight: '#fb923c',
    beakDark: '#c2410c',
    collarHex: '#ef4444',
  },
  {
    id: 'ruby',
    bodyLight: '#fecdd3',
    bodyMid: '#fb7185',
    bodyDark: '#be123c',
    wingLight: '#fda4af',
    wingDark: '#9f1239',
    beakLight: '#facc15',
    beakDark: '#ca8a04',
    collarHex: '#38bdf8',
  },
  {
    id: 'emerald',
    bodyLight: '#a7f3d0',
    bodyMid: '#34d399',
    bodyDark: '#047857',
    wingLight: '#6ee7b7',
    wingDark: '#065f46',
    beakLight: '#fb923c',
    beakDark: '#ea580c',
    collarHex: '#facc15',
  },
  {
    id: 'sapphire',
    bodyLight: '#bae6fd',
    bodyMid: '#38bdf8',
    bodyDark: '#0369a1',
    wingLight: '#7dd3fc',
    wingDark: '#075985',
    beakLight: '#fbbf24',
    beakDark: '#d97706',
    collarHex: '#f43f5e',
  },
  {
    id: 'amethyst',
    bodyLight: '#e9d5ff',
    bodyMid: '#c084fc',
    bodyDark: '#6b21a8',
    wingLight: '#d8b4fe',
    wingDark: '#581c87',
    beakLight: '#fb923c',
    beakDark: '#c2410c',
    collarHex: '#2dd4bf',
  },
  {
    id: 'tangerine',
    bodyLight: '#fed7aa',
    bodyMid: '#fb923c',
    bodyDark: '#c2410c',
    wingLight: '#fdba74',
    wingDark: '#9a3412',
    beakLight: '#fde047',
    beakDark: '#ca8a04',
    collarHex: '#a855f7',
  },
  {
    id: 'cyan',
    bodyLight: '#99f6e4',
    bodyMid: '#2dd4bf',
    bodyDark: '#0f766e',
    wingLight: '#5eead4',
    wingDark: '#115e59',
    beakLight: '#fb923c',
    beakDark: '#ea580c',
    collarHex: '#ec4899',
  },
  {
    id: 'magenta',
    bodyLight: '#fbcfe8',
    bodyMid: '#f472b6',
    bodyDark: '#9d174d',
    wingLight: '#f9a8d4',
    wingDark: '#831843',
    beakLight: '#fde047',
    beakDark: '#ca8a04',
    collarHex: '#10b981',
  },
  {
    id: 'lime',
    bodyLight: '#d9f99d',
    bodyMid: '#a3e635',
    bodyDark: '#3f6212',
    wingLight: '#bef264',
    wingDark: '#365314',
    beakLight: '#fb923c',
    beakDark: '#c2410c',
    collarHex: '#3b82f6',
  },
  {
    id: 'indigo',
    bodyLight: '#c7d2fe',
    bodyMid: '#818cf8',
    bodyDark: '#3730a3',
    wingLight: '#a5b4fc',
    wingDark: '#312e81',
    beakLight: '#fbbf24',
    beakDark: '#d97706',
    collarHex: '#f43f5e',
  },
];

interface RacingDuck {
  id: string;
  name: string;
  teamName: string;
  racerIndex: number;
  colorHex: string;
  palette: Duck3DPalette;
  x: number; // % từ vạch xuất phát (9%) đến vạch đích (88%)
  y: number; // % vị trí dọc trên mặt hồ 3D (22%..84%)
  baseY: number;
  vx: number; // tốc độ tiến về phía trước (LUÔN > 0, KHÔNG BAO GIỜ BƠI LÙI)
  targetVx: number;
  vy: number; // độ lượn sóng nhẹ lên/xuống ngẫu nhiên (không bơi theo đường thẳng cứng nhắc)
  weavePhase: number;
  ticksToNextSpeedChange: number;
  isTurboSurging: boolean;
}

const START_LINE_X = 9;
const FINISH_LINE_X = 87.5;

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
  const [isRacing, setIsRacing] = useState(false);
  const [winnerDuck, setWinnerDuck] = useState<RacingDuck | null>(null);
  const [ducks, setDucks] = useState<RacingDuck[]>([]);
  const [filterTeamIdx, setFilterTeamIdx] = useState<number | 'all'>('all');

  const ducksRef = useRef<RacingDuck[]>([]);
  ducksRef.current = ducks;

  const raceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Khởi tạo danh sách các chú vịt 3D đứng tại VẠCH XUẤT PHÁT
  const buildStartingDucks = (): RacingDuck[] => {
    const rawItems: Array<{
      id: string;
      name: string;
      teamName: string;
      racerIndex: number;
      colorHex: string;
    }> = [];

    if (gameMode === 'individual') {
      racers.forEach((r, rIdx) => {
        rawItems.push({
          id: `duck-ind-${rIdx}`,
          name: r.name,
          teamName: 'Cá nhân',
          racerIndex: rIdx,
          colorHex: r.colorHex,
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
          rawItems.push({
            id: `duck-team-${rIdx}-${sIdx}`,
            name: sName,
            teamName: r.name,
            racerIndex: rIdx,
            colorHex: r.colorHex,
          });
        });
      });
    }

    const total = Math.max(1, rawItems.length);
    return rawItems.map((item, idx) => {
      const palette = DUCK_3D_PALETTES[idx % DUCK_3D_PALETTES.length];
      // Phân bổ đều các chú vịt dọc theo vạch xuất phát trên mặt hồ 3D (24% -> 82%)
      const laneY =
        total === 1 ? 54 : 24 + (idx / Math.max(1, total - 1)) * 58;
      // Tốc độ ban đầu ngẫu nhiên (luôn dương)
      const initialVx = 0.25 + Math.random() * 0.45;
      return {
        ...item,
        palette,
        x: START_LINE_X,
        y: laneY,
        baseY: laneY,
        vx: initialVx,
        targetVx: initialVx,
        vy: (Math.random() - 0.5) * 0.25,
        weavePhase: Math.random() * Math.PI * 2,
        ticksToNextSpeedChange: 5 + Math.floor(Math.random() * 8),
        isTurboSurging: false,
      };
    });
  };

  useEffect(() => {
    if (raceIntervalRef.current) {
      clearInterval(raceIntervalRef.current);
      raceIntervalRef.current = null;
    }
    setIsRacing(false);
    const initialDucks = buildStartingDucks();
    setDucks(initialDucks);
    if (!selectedStudentName) {
      setWinnerDuck(null);
    }
  }, [gameMode, racers, students, filterTeamIdx]);

  // Đồng bộ khi selectedStudentName thay đổi từ bên ngoài (ví dụ khi sang câu hỏi mới -> reset về vạch xuất phát)
  useEffect(() => {
    if (!selectedStudentName && !isRacing) {
      setWinnerDuck(null);
      setDucks(buildStartingDucks());
      return;
    }
    if (selectedStudentName && !isRacing) {
      const found = ducksRef.current.find(
        (d) => d.name.trim().toLowerCase() === selectedStudentName.trim().toLowerCase()
      );
      if (found) {
        setWinnerDuck(found);
      }
    }
  }, [selectedStudentName]);

  useEffect(() => {
    return () => {
      if (raceIntervalRef.current) {
        clearInterval(raceIntervalRef.current);
      }
    };
  }, []);

  // Đặt lại tất cả các chú vịt về Vạch Xuất Phát
  const handleResetToStartLine = () => {
    if (raceIntervalRef.current) {
      clearInterval(raceIntervalRef.current);
      raceIntervalRef.current = null;
    }
    setIsRacing(false);
    setWinnerDuck(null);
    setDucks(buildStartingDucks());
    sound.playClick();
  };

  // Bắt đầu cuộc đua vịt 3D gọi tên học sinh:
  // - Các chú vịt xuất phát từ VẠCH XUẤT PHÁT (START_LINE_X)
  // - Bơi về VẠCH ĐÍCH (FINISH_LINE_X)
  // - Bơi ngẫu nhiên, lượn sóng mềm mại (KHÔNG theo một đường thẳng cố định)
  // - TUYỆT ĐỐI KHÔNG BƠI LÙI (vx luôn > 0)
  // - Tốc độ thay đổi ngẫu nhiên liên tục: vịt A lúc đầu bơi nhanh nhưng sau đó bơi chậm lại, vịt B bứt tốc vượt qua mặt vịt A và về đích!
  // - Khi vịt về đích: Phát âm thanh "Mời bạn + Họ và tên của học sinh đó"
  const handleStartDuckRace = () => {
    if (isRacing) return;
    const freshDucks = buildStartingDucks().map((d) => {
      // Lúc xuất phát: một số chú vịt vọt nhanh lên trước, một số chú vịt khởi đầu chậm hơn
      const startBurst =
        Math.random() < 0.35
          ? 0.65 + Math.random() * 0.35 // Khởi đầu nhanh
          : 0.22 + Math.random() * 0.28; // Khởi đầu vừa/chậm
      return {
        ...d,
        x: START_LINE_X,
        vx: startBurst,
        targetVx: startBurst,
        ticksToNextSpeedChange: 6 + Math.floor(Math.random() * 7),
        isTurboSurging: startBurst > 0.68,
      };
    });

    if (freshDucks.length === 0) return;

    setDucks(freshDucks);
    ducksRef.current = freshDucks;
    setWinnerDuck(null);
    setIsRacing(true);
    sound.playClick();

    if (raceIntervalRef.current) {
      clearInterval(raceIntervalRef.current);
    }

    raceIntervalRef.current = setInterval(() => {
      const currentList = ducksRef.current;
      if (currentList.length === 0) return;

      // Tìm vị trí dẫn đầu và trung bình của đàn vịt để tạo kịch tính vượt mặt (vịt đang dẫn đầu có thể mỏi/chậm lại, vịt phía sau bứt tốc vượt lên)
      const maxX = Math.max(...currentList.map((d) => d.x));

      let finishedWinner: RacingDuck | null = null;

      const updated = currentList.map((duck) => {
        let nextTicks = duck.ticksToNextSpeedChange - 1;
        let nextTargetVx = duck.targetVx;
        let nextVy = duck.vy;
        let nextTurbo = duck.isTurboSurging;

        // Đến nhịp thay đổi tốc độ ngẫu nhiên
        if (nextTicks <= 0) {
          nextTicks = 6 + Math.floor(Math.random() * 9);
          const isLeader = duck.x >= maxX - 3 && duck.x > START_LINE_X + 12;
          const roll = Math.random();

          if (isLeader && Math.random() < 0.62) {
            // Chú vịt đang dẫn đầu bất ngờ bơi chậm lại (vẫn tiến về phía trước, không bao giờ bơi lùi!)
            nextTargetVx = 0.14 + Math.random() * 0.16;
            nextTurbo = false;
          } else if (roll < 0.32) {
            // Bứt tốc mạnh mẽ để vượt qua mặt các chú vịt phía trước!
            nextTargetVx = 0.72 + Math.random() * 0.42;
            nextTurbo = true;
          } else if (roll < 0.68) {
            // Bơi tốc độ trung bình
            nextTargetVx = 0.36 + Math.random() * 0.26;
            nextTurbo = false;
          } else {
            // Bơi thong thả
            nextTargetVx = 0.16 + Math.random() * 0.18;
            nextTurbo = false;
          }

          // Đổi hướng lượn sóng nhẹ lên/xuống để đường bơi tự nhiên, không đi theo đường thẳng cứng nhắc
          nextVy = (Math.random() - 0.5) * 0.55;
        }

        // Chuyển mượt tốc độ hiện tại về targetVx, đảm bảo LUÔN DƯƠNG (vx >= 0.12, tuyệt đối không bơi lùi)
        const blendedVx = Math.max(0.12, duck.vx * 0.72 + nextTargetVx * 0.28);
        const nextX = Math.min(FINISH_LINE_X + 1.5, duck.x + blendedVx);

        // Chuyển động lượn sóng dọc theo mặt hồ 3D (không theo đường thẳng cố định)
        const nextPhase = duck.weavePhase + 0.22;
        const waveDeltaY = Math.sin(nextPhase) * 0.26 + nextVy;
        let nextY = duck.y + waveDeltaY;

        // Giữ chú vịt trong phạm vi lòng hồ 3D (22% .. 84%)
        if (nextY < 22) {
          nextY = 22;
          nextVy = Math.abs(nextVy) * 0.6;
        } else if (nextY > 84) {
          nextY = 84;
          nextVy = -Math.abs(nextVy) * 0.6;
        }

        const movedDuck: RacingDuck = {
          ...duck,
          x: nextX,
          y: nextY,
          vx: blendedVx,
          targetVx: nextTargetVx,
          vy: nextVy,
          weavePhase: nextPhase,
          ticksToNextSpeedChange: nextTicks,
          isTurboSurging: nextTurbo,
        };

        if (nextX >= FINISH_LINE_X) {
          if (!finishedWinner || nextX > finishedWinner.x) {
            finishedWinner = movedDuck;
          }
        }

        return movedDuck;
      });

      ducksRef.current = updated;
      setDucks(updated);

      // Nếu đã có chú vịt cán VẠCH ĐÍCH trước tiên!
      if (finishedWinner) {
        if (raceIntervalRef.current) {
          clearInterval(raceIntervalRef.current);
          raceIntervalRef.current = null;
        }
        const champ: RacingDuck = finishedWinner;
        setIsRacing(false);
        setWinnerDuck(champ);
        sound.playCorrect();
        onSelectStudent(champ.name, champ.racerIndex);
        // Đọc to, rõ ràng: "Mời bạn + Họ và tên của học sinh đó"
        sound.speakInviteStudent(champ.name);
      }
    }, 50);
  };

  // Cho phép giáo viên bấm trực tiếp vào 1 chú vịt nếu muốn chọn nhanh học sinh đó
  const handleManualPickDuck = (duck: RacingDuck) => {
    if (isRacing) return;
    const updated = ducksRef.current.map((d) =>
      d.id === duck.id ? { ...d, x: FINISH_LINE_X, isTurboSurging: true } : d
    );
    ducksRef.current = updated;
    setDucks(updated);
    setWinnerDuck({ ...duck, x: FINISH_LINE_X });
    sound.playCorrect();
    onSelectStudent(duck.name, duck.racerIndex);
    sound.speakInviteStudent(duck.name);
  };

  const activeRacer = racers[currentRacerIndex] || racers[0];
  const displayedStudentFullName = winnerDuck?.name || selectedStudentName || null;
  const caughtCallCount = displayedStudentFullName
    ? studentCallCounts[normalizeEntityKey(displayedStudentFullName)] || 1
    : 0;

  // Tìm chú vịt đang dẫn đầu khi đang đua
  const leadingDuckId = isRacing
    ? ducks.reduce(
        (best, cur) => (cur.x > (best?.x ?? -1) ? cur : best),
        ducks[0] || null
      )?.id
    : null;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-cyan-400/85 shadow-2xl flex flex-col select-none bg-slate-950">
      {/* Thanh Điều Khiển Phía Trên: Tiêu đề / Tên Học Sinh Về Đích + Lọc Đội + Nút Gọi Tên Đua Vịt 3D */}
      <div className="relative z-30 bg-slate-950/95 backdrop-blur-md px-2.5 py-1.5 border-b border-cyan-400/50 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {displayedStudentFullName && !isRacing ? (
            <div className="flex items-center gap-2 min-w-0 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 text-slate-950 px-3 py-1 rounded-xl shadow-lg border-2 border-white">
              <Trophy className="w-4 h-4 text-amber-800 shrink-0" />
              <span className="text-xs sm:text-base font-black uppercase tracking-wide truncate">
                Mời bạn: {displayedStudentFullName}
              </span>
              <button
                type="button"
                onClick={() => sound.speakInviteStudent(displayedStudentFullName)}
                title={`Đọc lại: Mời bạn ${displayedStudentFullName}`}
                className="p-1 rounded-lg bg-slate-950/15 hover:bg-slate-950/25 text-slate-950 cursor-pointer shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <span className="text-lg sm:text-xl shrink-0">🦆🌊🏁</span>
              <div className="min-w-0">
                <h3 className="text-[11px] sm:text-xs font-black text-cyan-300 uppercase tracking-wider leading-tight truncate">
                  Đua Vịt 3D Gọi Tên Học Sinh
                </h3>
                <p className="text-[10px] text-amber-200 font-semibold truncate">
                  Vịt 3D đứng ở vạch xuất phát • Bơi ngẫu nhiên bứt tốc vượt mặt • Về đích đọc tên học sinh
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {gameMode === 'team' && racers.length > 1 && (
            <div className="hidden xl:flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setFilterTeamIdx('all')}
                disabled={isRacing}
                className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold transition-all cursor-pointer ${
                  filterTeamIdx === 'all'
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Tất cả ({students.length})
              </button>
              {racers.map((r, idx) => (
                <button
                  key={r.id}
                  type="button"
                  disabled={isRacing}
                  onClick={() => {
                    setFilterTeamIdx(idx);
                    onSelectTeamFilter?.(idx);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-0.5 ${
                    filterTeamIdx === idx
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>{r.avatar}</span>
                  <span className="max-w-[60px] truncate">{r.name}</span>
                </button>
              ))}
            </div>
          )}

          {!isRacing && displayedStudentFullName && (
            <button
              type="button"
              onClick={handleResetToStartLine}
              title="Đưa các chú vịt về lại vạch xuất phát"
              className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-200 font-bold text-xs border border-cyan-500/40 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Về Vạch Xuất Phát</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleStartDuckRace}
            disabled={isRacing}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 hover:from-amber-300 hover:to-rose-400 disabled:opacity-60 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/30 flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 border-2 border-white/70"
          >
            <Flag className={`w-4 h-4 ${isRacing ? 'animate-bounce' : ''}`} />
            <span>
              {isRacing
                ? 'Đang đua vịt về đích...'
                : displayedStudentFullName
                ? 'Gọi tên tiếp (Đua vịt 3D)'
                : 'Gọi tên (Bắt đầu đua vịt)'}
            </span>
          </button>
        </div>
      </div>

      {/* KHU VỰC HỒ NƯỚC 3D NHIỀU MÀU SẮC & ĐƯỜNG ĐUA VỊT 3D */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Nền Hồ Nước 3D Đa Sắc Màu (Bầu trời bình minh 3D + Mặt hồ 3D nhiều tầng màu sắc lung linh) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, #ffedd5 0%, #fde68a 11%, #38bdf8 15%, #06b6d4 34%, #0284c7 55%, #4f46e5 78%, #0f172a 100%)',
          }}
        />

        {/* Ánh sáng mặt trời phản chiếu 3D nhiều màu sắc trên mặt hồ */}
        <div
          className="absolute inset-0 pointer-events-none opacity-65"
          style={{
            background:
              'radial-gradient(ellipse at 50% 18%, rgba(253, 224, 71, 0.55) 0%, rgba(244, 114, 182, 0.28) 28%, rgba(45, 212, 191, 0.35) 55%, rgba(59, 130, 246, 0.2) 80%, transparent 100%)',
          }}
        />

        {/* Bờ Hồ 3D Phía Xa (Đồi cỏ xanh, hoa sen, cầu vồng & hàng cây 3D) */}
        <div className="absolute top-0 inset-x-0 h-[17%] pointer-events-none overflow-hidden">
          <svg viewBox="0 0 1200 90" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="bankGrad1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="35%" stopColor="#22c55e" />
                <stop offset="70%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="rainbowArc" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
                <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.45" />
                <stop offset="75%" stopColor="#3b82f6" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.45" />
              </linearGradient>
            </defs>
            {/* Cầu vồng 3D phía chân trời */}
            <path
              d="M180 85 Q600 -45 1020 85"
              fill="none"
              stroke="url(#rainbowArc)"
              strokeWidth="18"
            />
            {/* Đồi cỏ 3D */}
            <path
              d="M0 55 Q180 20 380 52 T760 46 T1200 54 L1200 90 L0 90 Z"
              fill="url(#bankGrad1)"
            />
            {/* Bờ đá 3D sát mép nước */}
            <rect x="0" y="76" width="1200" height="14" fill="#0f766e" opacity="0.8" />
          </svg>
        </div>

        {/* Các dải sóng 3D nhiều màu sắc và phao phân làn 3D tạo chiều sâu mặt hồ */}
        <svg
          viewBox="0 0 1200 400"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-55"
        >
          <defs>
            <linearGradient id="wavePinkCyan" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
              <stop offset="35%" stopColor="#f472b6" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#facc15" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="waveGoldEmerald" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fde047" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.45" />
            </linearGradient>
          </defs>

          {/* Gợn sóng nước 3D đa sắc */}
          <path
            d="M0 110 Q150 95 300 110 T600 110 T900 110 T1200 110"
            fill="none"
            stroke="url(#wavePinkCyan)"
            strokeWidth="4"
          />
          <path
            d="M0 185 Q150 170 300 185 T600 185 T900 185 T1200 185"
            fill="none"
            stroke="url(#waveGoldEmerald)"
            strokeWidth="5"
          />
          <path
            d="M0 265 Q150 250 300 265 T600 265 T900 265 T1200 265"
            fill="none"
            stroke="url(#wavePinkCyan)"
            strokeWidth="5"
          />
          <path
            d="M0 340 Q150 325 300 340 T600 340 T900 340 T1200 340"
            fill="none"
            stroke="url(#waveGoldEmerald)"
            strokeWidth="6"
          />
        </svg>

        {/* Lá sen & Hoa sen 3D trang trí trên mặt hồ */}
        <div className="absolute left-[26%] top-[20%] text-sm sm:text-base opacity-80 pointer-events-none drop-shadow">
          🪷
        </div>
        <div className="absolute left-[58%] top-[85%] text-sm sm:text-base opacity-80 pointer-events-none drop-shadow">
          🪷
        </div>
        <div className="absolute left-[42%] top-[19%] text-xs sm:text-sm opacity-75 pointer-events-none">
          ✨
        </div>
        <div className="absolute left-[72%] top-[22%] text-xs sm:text-sm opacity-75 pointer-events-none">
          ✨
        </div>

        {/* VẠCH XUẤT PHÁT 3D (Bên trái) */}
        <div
          style={{ left: `${START_LINE_X}%` }}
          className="absolute top-[16%] bottom-0 -translate-x-1/2 w-5 sm:w-6 pointer-events-none z-10 flex flex-col items-center"
        >
          <div className="bg-emerald-400 text-slate-950 font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full shadow-lg border border-white whitespace-nowrap -mt-1 z-20">
            VẠCH XUẤT PHÁT
          </div>
          {/* Dây phao xuất phát 3D */}
          <div
            className="w-2.5 flex-1 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.8)] border border-white/70"
            style={{
              background:
                'repeating-linear-gradient(180deg, #10b981 0px, #10b981 10px, #ffffff 10px, #ffffff 20px)',
            }}
          />
        </div>

        {/* VẠCH ĐÍCH 3D 🏁 (Bên phải) */}
        <div
          style={{ left: `${FINISH_LINE_X}%` }}
          className="absolute top-[15%] bottom-0 -translate-x-1/2 w-7 sm:w-8 pointer-events-none z-10 flex flex-col items-center"
        >
          <div className="bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400 text-slate-950 font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full shadow-xl border-2 border-white whitespace-nowrap -mt-1.5 z-20 flex items-center gap-1">
            <span>🏁 VẠCH ĐÍCH</span>
          </div>
          {/* Cột cờ caro 3D */}
          <div
            className="w-3.5 sm:w-4 flex-1 rounded-sm shadow-[0_0_18px_rgba(250,204,21,0.9)] border border-amber-300"
            style={{
              backgroundImage:
                'conic-gradient(#0f172a 90deg, #ffffff 90deg 180deg, #0f172a 180deg 270deg, #ffffff 270deg)',
              backgroundSize: '12px 12px',
            }}
          />
        </div>

        {/* CÁC CHÚ VỊT 3D NHIỀU MÀU SẮC MANG TÊN HỌC SINH TRÊN ĐẦU */}
        {ducks.map((duck) => {
          const isWinner =
            !isRacing &&
            Boolean(displayedStudentFullName) &&
            (winnerDuck?.id === duck.id ||
              duck.name.trim().toLowerCase() ===
                displayedStudentFullName?.trim().toLowerCase());
          const isLeadingNow = isRacing && leadingDuckId === duck.id;
          const gradBodyId = `duck3d-body-${duck.id}`;
          const gradHeadId = `duck3d-head-${duck.id}`;
          const gradWingId = `duck3d-wing-${duck.id}`;
          const gradBeakId = `duck3d-beak-${duck.id}`;

          return (
            <button
              key={duck.id}
              type="button"
              onClick={() => handleManualPickDuck(duck)}
              title={`Học sinh: ${duck.name} (${duck.teamName})`}
              style={{
                left: `${duck.x}%`,
                top: `${duck.y}%`,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-linear cursor-pointer group focus:outline-none ${
                isWinner
                  ? 'z-40 scale-125'
                  : isLeadingNow
                  ? 'z-30 scale-110'
                  : 'z-20 hover:scale-110'
              }`}
            >
              {/* TÊN CỦA HỌC SINH TRÊN ĐẦU CHÚ VỊT 3D */}
              <div
                className={`px-2.5 py-0.5 rounded-full font-black whitespace-nowrap shadow-xl border transition-all mb-0.5 flex items-center gap-1.5 ${
                  isWinner
                    ? 'bg-amber-300 text-slate-950 border-2 border-white ring-4 ring-amber-400/90 text-xs sm:text-sm scale-110'
                    : isLeadingNow
                    ? 'bg-emerald-400 text-slate-950 border-2 border-white text-[11px] sm:text-xs shadow-emerald-500/40'
                    : 'bg-slate-950/90 text-white border-cyan-300/60 text-[10px] sm:text-xs group-hover:bg-slate-900'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/70"
                  style={{ backgroundColor: duck.palette.bodyMid }}
                />
                <span>{duck.name}</span>
                {isWinner && <span>🏆</span>}
              </div>

              {/* HÌNH ẢNH CHÚ VỊT 3D ĐA SẮC MÀU BƠI TRÊN SÓNG NƯỚC */}
              <div className="relative flex flex-col items-center">
                {isWinner && (
                  <div className="absolute -inset-2 rounded-full bg-amber-300/60 animate-ping pointer-events-none" />
                )}

                {/* Tia nước bứt tốc phía sau khi chú vịt tăng tốc vượt mặt */}
                {isRacing && duck.isTurboSurging && (
                  <div className="absolute -left-5 bottom-1.5 flex items-center gap-0.5 pointer-events-none animate-pulse">
                    <span className="w-2.5 h-1 rounded-full bg-white/90 shadow" />
                    <span className="w-1.5 h-1 rounded-full bg-cyan-200/80" />
                  </div>
                )}

                <svg
                  viewBox="0 0 84 68"
                  className={`w-10 h-8 sm:w-12 sm:h-10 drop-shadow-[0_5px_6px_rgba(0,0,0,0.55)] ${
                    isWinner ? 'animate-bounce' : ''
                  }`}
                >
                  <defs>
                    {/* Gradient 3D cho thân vịt */}
                    <radialGradient id={gradBodyId} cx="35%" cy="28%" r="70%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                      <stop offset="22%" stopColor={duck.palette.bodyLight} />
                      <stop offset="65%" stopColor={duck.palette.bodyMid} />
                      <stop offset="100%" stopColor={duck.palette.bodyDark} />
                    </radialGradient>
                    {/* Gradient 3D cho đầu vịt */}
                    <radialGradient id={gradHeadId} cx="38%" cy="25%" r="68%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                      <stop offset="25%" stopColor={duck.palette.bodyLight} />
                      <stop offset="70%" stopColor={duck.palette.bodyMid} />
                      <stop offset="100%" stopColor={duck.palette.bodyDark} />
                    </radialGradient>
                    {/* Gradient 3D cho cánh vịt */}
                    <linearGradient id={gradWingId} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={duck.palette.wingLight} />
                      <stop offset="55%" stopColor={duck.palette.bodyMid} />
                      <stop offset="100%" stopColor={duck.palette.wingDark} />
                    </linearGradient>
                    {/* Gradient 3D cho mỏ vịt */}
                    <linearGradient id={gradBeakId} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={duck.palette.beakLight} />
                      <stop offset="100%" stopColor={duck.palette.beakDark} />
                    </linearGradient>
                  </defs>

                  {/* Vòng sóng nước 3D dưới bụng vịt */}
                  <ellipse
                    cx="40"
                    cy="58"
                    rx="28"
                    ry="6"
                    fill="rgba(255,255,255,0.45)"
                  />
                  <ellipse
                    cx="38"
                    cy="58"
                    rx="22"
                    ry="4"
                    fill="rgba(56,189,248,0.65)"
                  />

                  {/* Đuôi vịt 3D cong vút */}
                  <path
                    d="M14 40 C6 33, 6 26, 15 30 C18 32, 20 36, 18 42 Z"
                    fill={`url(#${gradBodyId})`}
                    stroke={duck.palette.bodyDark}
                    strokeWidth="1.5"
                  />

                  {/* Thân vịt 3D bóng mượt (luôn hướng về phía Vạch Đích bên phải) */}
                  <path
                    d="M14 42 C12 29, 26 24, 44 26 C57 27, 64 34, 62 45 C60 54, 48 56, 34 56 C20 56, 15 50, 14 42 Z"
                    fill={`url(#${gradBodyId})`}
                    stroke={duck.palette.bodyDark}
                    strokeWidth="1.8"
                  />

                  {/* Vòng cổ 3D sắc màu */}
                  <path
                    d="M46 27 Q54 31 58 27"
                    fill="none"
                    stroke={duck.palette.collarHex}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Cánh vịt 3D nổi khối */}
                  <path
                    d="M24 35 C30 29, 44 30, 48 38 C46 46, 32 48, 23 43 C21 40, 22 37, 24 35 Z"
                    fill={`url(#${gradWingId})`}
                    stroke={duck.palette.wingDark}
                    strokeWidth="1.5"
                  />

                  {/* Đầu vịt 3D tròn bóng */}
                  <circle
                    cx="54"
                    cy="19"
                    r="12.5"
                    fill={`url(#${gradHeadId})`}
                    stroke={duck.palette.bodyDark}
                    strokeWidth="1.8"
                  />

                  {/* Điểm phản quang 3D trên đỉnh đầu và thân */}
                  <ellipse
                    cx="49"
                    cy="13"
                    rx="4.5"
                    ry="2.2"
                    transform="rotate(-18 49 13)"
                    fill="rgba(255,255,255,0.65)"
                  />
                  <ellipse
                    cx="32"
                    cy="32"
                    rx="6"
                    ry="2.4"
                    transform="rotate(-8 32 32)"
                    fill="rgba(255,255,255,0.45)"
                  />

                  {/* Mỏ vịt 3D hướng về phía trước */}
                  <path
                    d="M64 16 C73 16, 78 19, 77 22 C76 25, 69 26, 63 24 Z"
                    fill={`url(#${gradBeakId})`}
                    stroke={duck.palette.beakDark}
                    strokeWidth="1.4"
                  />

                  {/* Mắt vịt 3D long lanh */}
                  <circle cx="57.5" cy="17.5" r="2.8" fill="#0f172a" />
                  <circle cx="56.6" cy="16.6" r="1.1" fill="#ffffff" />

                  {/* Má hồng 3D */}
                  <ellipse cx="54" cy="22.5" rx="3" ry="1.6" fill="#fb7185" opacity="0.75" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>

      {/* Thanh Trạng Thái Phía Dưới */}
      <div className="relative z-30 bg-slate-950/95 border-t border-cyan-400/50 px-3 py-1.5 flex items-center justify-between gap-2">
        {displayedStudentFullName && !isRacing ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow">
              🦆
            </div>
            <div className="text-sm sm:text-base font-black text-amber-300 truncate flex items-center gap-2 flex-wrap">
              <span>Mời bạn {displayedStudentFullName}</span>
              {gameMode === 'team' && (
                <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                  {winnerDuck?.teamName || activeRacer?.name}
                </span>
              )}
              {caughtCallCount > 1 && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-200 border border-indigo-400/50 font-black">
                  <Shuffle className="w-2.5 h-2.5" />
                  <span>Lần {caughtCallCount}</span>
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-slate-800 border border-cyan-400/50 text-cyan-300 flex items-center justify-center font-black text-sm shrink-0">
              🦆
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-slate-200 truncate">
              {isRacing ? (
                <span className="text-amber-300 font-black">
                  Các chú vịt 3D đang bứt tốc về đích... Chú vịt nào cán đích trước sẽ được chọn!
                </span>
              ) : (
                <>
                  Bấm <span className="text-amber-300 font-black">"Gọi tên (Bắt đầu đua vịt)"</span> để các chú vịt 3D bơi về đích chọn học sinh
                </>
              )}
            </div>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1 text-[10px] text-cyan-200 font-semibold shrink-0">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>{ducks.length} chú vịt 3D</span>
        </div>
      </div>
    </div>
  );
};
