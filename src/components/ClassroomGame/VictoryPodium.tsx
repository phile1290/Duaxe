import React, { useEffect, useMemo, useState } from 'react';
import { GameMode, Racer, SessionStudentRecord } from '../../types';
import {
  compareRacersByResult,
  compareSessionStudentsByResult,
} from '../../store/gameStore';
import {
  Trophy,
  RotateCcw,
  LayoutDashboard,
  Flag,
  Music,
  VolumeX,
  Home,
  Sparkles,
  Clock,
  CheckCircle2,
  Zap,
  Users,
  User,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../../services/soundService';

interface VictoryPodiumProps {
  winner: Racer;
  allRacers: Racer[];
  gameMode?: GameMode;
  sessionStudentRecords?: Record<string, SessionStudentRecord>;
  totalQuestions?: number;
  lessonTitle?: string;
  onRestart: () => void;
  onReturnHome?: () => void;
  onGoToDashboard: () => void;
}

interface CelebrationParticle {
  id: number;
  symbol: string;
  type: 'flower' | 'trophy';
  left: number;
  delay: number;
  duration: number;
  size: number;
  sway: number;
}

const FLOWER_SYMBOLS = ['🌸', '🌺', '🌻', '🌼', '🌷', '💐', '🏵️'];
const TROPHY_SYMBOLS = ['🏆', '🥇', '🏅', '👑', '🏆'];

export const VictoryPodium: React.FC<VictoryPodiumProps> = ({
  winner,
  allRacers,
  gameMode = 'team',
  sessionStudentRecords = {},
  totalQuestions = 10,
  lessonTitle,
  onRestart,
  onReturnHome,
  onGoToDashboard,
}) => {
  const [isMusicActive, setIsMusicActive] = useState<boolean>(!sound.getMuted());
  const [rankingTab, setRankingTab] = useState<'racers' | 'students'>('racers');

  // Sắp xếp kết quả theo quy tắc: Điểm số -> Số câu trả lời đúng -> Móc leo -> Số GIÂY trả lời nhanh nhất (ít giây hơn đứng nhất!)
  const sortedRacers = useMemo(
    () => [...allRacers].sort(compareRacersByResult),
    [allRacers]
  );

  // Sắp xếp danh sách học sinh cá nhân được Bà Già bắt ngẫu nhiên trong lượt chơi
  const sortedSessionStudents = useMemo(
    () => Object.values(sessionStudentRecords).sort(compareSessionStudentsByResult),
    [sessionStudentRecords]
  );

  const topWinner = sortedRacers[0] || winner;
  const runnerUp = sortedRacers[1] || null;
  const winnerHook = topWinner.hookLevel ?? Math.round((topWinner.progress || 0) / 10);
  const winnerCorrect = topWinner.correctCount ?? 0;
  const winnerTimeSec = topWinner.totalTimeSec ?? 0;

  // Kiểm tra xem người đứng nhất và người đứng nhì có ngang điểm nhau và phân thắng bại nhờ SỐ GIÂY nhanh hơn hay không
  const wonByFastestSeconds =
    runnerUp !== null &&
    topWinner.score === runnerUp.score &&
    topWinner.score > 0 &&
    winnerTimeSec < (runnerUp.totalTimeSec ?? 999999);

  // Danh sách các hiệu ứng Bông Hoa & Chiếc Cúp bay rực rỡ trên màn hình kết quả
  const celebrationParticles = useMemo<CelebrationParticle[]>(() => {
    return Array.from({ length: 32 }, (_, idx) => {
      const isTrophy = idx % 3 === 0;
      const symbol = isTrophy
        ? TROPHY_SYMBOLS[idx % TROPHY_SYMBOLS.length]
        : FLOWER_SYMBOLS[idx % FLOWER_SYMBOLS.length];
      return {
        id: idx,
        symbol,
        type: isTrophy ? 'trophy' : 'flower',
        left: ((idx * 17 + 5) % 94) + 3,
        delay: (idx % 8) * 0.45,
        duration: 4.5 + (idx % 5) * 0.85,
        size: isTrophy ? 26 + (idx % 3) * 6 : 22 + (idx % 4) * 5,
        sway: idx % 2 === 0 ? 18 : -18,
      };
    });
  }, []);

  // Khởi chạy nhạc nền sôi động chúc mừng & pháo hoa khi hoàn thành lượt chơi
  useEffect(() => {
    if (!sound.getMuted()) {
      sound.startCelebrationMusic();
      setIsMusicActive(true);
    }

    const fireBurst = () => {
      try {
        confetti({
          particleCount: 65,
          spread: 80,
          origin: { x: 0.2, y: 0.65 },
          colors: ['#fbbf24', '#34d399', '#f472b6', '#60a5fa', '#fb7185', '#a78bfa'],
        });
        confetti({
          particleCount: 65,
          spread: 80,
          origin: { x: 0.8, y: 0.65 },
          colors: ['#fbbf24', '#34d399', '#f472b6', '#60a5fa', '#fb7185', '#a78bfa'],
        });
      } catch {
        // Ignore confetti errors if canvas is unavailable
      }
    };

    fireBurst();
    const burstInterval = window.setInterval(fireBurst, 3400);

    return () => {
      window.clearInterval(burstInterval);
      sound.stopCelebrationMusic();
    };
  }, []);

  const handleToggleCelebrationMusic = () => {
    if (isMusicActive) {
      sound.stopCelebrationMusic();
      setIsMusicActive(false);
    } else {
      if (sound.getMuted()) {
        sound.toggleMute();
      }
      sound.startCelebrationMusic();
      setIsMusicActive(true);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-hidden">
      {/* Keyframes cho hiệu ứng Bông Hoa & Chiếc Cúp tung bay rực rỡ */}
      <style>{`
        @keyframes floatFlowerTrophy {
          0% {
            transform: translateY(105vh) translateX(0px) rotate(0deg) scale(0.75);
            opacity: 0;
          }
          15% {
            opacity: 0.95;
          }
          50% {
            transform: translateY(45vh) translateX(var(--sway-x, 16px)) rotate(180deg) scale(1.1);
            opacity: 1;
          }
          85% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(-15vh) translateX(calc(var(--sway-x, 16px) * -1)) rotate(360deg) scale(0.9);
            opacity: 0;
          }
        }
        @keyframes trophyPulseGlow {
          0%, 100% {
            transform: scale(1) rotate(-4deg);
            filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.8));
          }
          50% {
            transform: scale(1.14) rotate(4deg);
            filter: drop-shadow(0 0 22px rgba(245, 158, 11, 1));
          }
        }
      `}</style>

      {/* Lớp hiệu ứng mưa Bông Hoa (🌸🌺🌻🌷💐) và Chiếc Cúp (🏆🥇🏅👑) toàn màn hình */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        {celebrationParticles.map((item) => (
          <div
            key={item.id}
            style={
              {
                left: `${item.left}%`,
                fontSize: `${item.size}px`,
                animation: `floatFlowerTrophy ${item.duration}s ease-in-out ${item.delay}s infinite`,
                '--sway-x': `${item.sway}px`,
              } as React.CSSProperties
            }
            className="absolute bottom-0 select-none drop-shadow-[0_4px_10px_rgba(251,191,36,0.45)]"
          >
            {item.symbol}
          </div>
        ))}
      </div>

      {/* Bảng Vinh Danh Kết Quả Trung Tâm */}
      <div className="relative z-10 w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/95 border-2 sm:border-4 border-amber-400 rounded-3xl p-4 sm:p-6 text-center text-white shadow-[0_0_50px_rgba(251,191,36,0.35)] animate-in zoom-in-90 duration-300 max-h-[95dvh] flex flex-col justify-between">
        {/* Thanh trạng thái Nhạc nền sôi động & Hoa Cúp góc trên */}
        <div className="flex items-center justify-between gap-2 mb-1.5 shrink-0">
          <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/40 px-2.5 py-1 rounded-full text-[11px] font-extrabold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>🏆🌸 VINH DANH CHIẾN THẮNG 🌸🏆</span>
          </div>

          <button
            type="button"
            onClick={handleToggleCelebrationMusic}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isMusicActive
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-sm shadow-emerald-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title={isMusicActive ? 'Tắt nhạc nền chúc mừng' : 'Bật nhạc nền chúc mừng sôi động'}
          >
            {isMusicActive ? (
              <>
                <Music className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                <span>Nhạc nền sôi động: BẬT</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                <span>Nhạc nền: TẮT</span>
              </>
            )}
          </button>
        </div>

        <div className="overflow-y-auto pr-1">
          {/* Cụm Cúp Vàng & Hoa Tươi Rực Rỡ */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 my-1">
            <span className="text-2xl sm:text-3xl animate-bounce" style={{ animationDelay: '0.1s' }}>
              💐
            </span>
            <span className="text-xl sm:text-2xl animate-pulse">🌸</span>
            <div
              style={{ animation: 'trophyPulseGlow 2s ease-in-out infinite' }}
              className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-200 flex items-center justify-center shadow-2xl shadow-yellow-400/50 border-4 border-white/80"
            >
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-xl sm:text-2xl animate-pulse">🌻</span>
            <span className="text-2xl sm:text-3xl animate-bounce" style={{ animationDelay: '0.25s' }}>
              🏆
            </span>
          </div>

          <div className="text-amber-400 font-extrabold uppercase tracking-widest text-[11px] sm:text-xs mt-1 mb-0.5 flex items-center justify-center gap-1.5">
            <Flag className="w-3.5 h-3.5" />
            <span>
              HOÀN THÀNH LƯỢT CHƠI ({totalQuestions}/{totalQuestions} CÂU HỎI)!
            </span>
          </div>

          {lessonTitle && (
            <div className="text-xs font-extrabold text-emerald-300 uppercase mb-1 px-2">
              {lessonTitle}
            </div>
          )}

          <h2 className="text-lg sm:text-2xl font-black mb-1 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 drop-shadow">
            🏆 CHÚC MỪNG {topWinner.name.toUpperCase()} CHIẾN THẮNG! 🌸
          </h2>

          {/* Thống kê nổi bật của Quán Quân: Số câu đúng + Số GIÂY + Điểm + Móc */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-950/90 border border-emerald-400/60 text-emerald-200 text-xs font-black flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đúng {winnerCorrect} câu</span>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-amber-950/90 border border-amber-400/60 text-amber-200 text-xs font-black flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Thời gian: {winnerTimeSec.toFixed(1)} giây</span>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-600 text-white text-xs font-black">
              🧗 Móc {winnerHook}/10 • {topWinner.score} điểm
            </span>
          </div>

          {/* Thông báo phân định thắng thua bằng SỐ GIÂY khi ngang điểm */}
          {wonByFastestSeconds && runnerUp ? (
            <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-emerald-500/25 to-amber-500/25 border border-amber-400 text-[11px] sm:text-xs font-extrabold text-amber-200 flex items-center justify-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
              <span>
                Ngang điểm ({topWinner.score}đ) với <strong>{runnerUp.name}</strong> —{' '}
                <strong className="text-emerald-300">{topWinner.name}</strong> đứng Nhất nhờ trả lời nhanh hơn (
                <strong>{winnerTimeSec.toFixed(1)} giây</strong> so với{' '}
                <strong>{(runnerUp.totalTimeSec ?? 0).toFixed(1)} giây</strong>)!
              </span>
            </div>
          ) : (
            <p className="text-slate-300 text-[11px] mb-2">
              💡 <em>Quy tắc xếp hạng:</em> Ưu tiên Điểm số & Số câu trả lời đúng; nếu ngang điểm nhau sẽ phân định người thắng cuộc dựa vào <strong>số GIÂY trả lời nhanh nhất</strong>!
            </p>
          )}

          {/* Chuyển đổi xem Bảng Xếp Hạng Chung Cuộc & Bảng Xếp Hạng Cá Nhân Học Sinh Được Gọi */}
          {gameMode === 'team' && sortedSessionStudents.length > 0 && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setRankingTab('racers')}
                className={`px-3 py-1 rounded-xl text-[11px] font-black flex items-center gap-1.5 border cursor-pointer transition-all ${
                  rankingTab === 'racers'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Xếp Hạng Đội ({sortedRacers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setRankingTab('students')}
                className={`px-3 py-1 rounded-xl text-[11px] font-black flex items-center gap-1.5 border cursor-pointer transition-all ${
                  rankingTab === 'students'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Kết Quả Cá Nhân Học Sinh ({sortedSessionStudents.length} em)</span>
              </button>
            </div>
          )}

          {/* Bảng Tổng Kết Xếp Hạng Kèm Số Câu Đúng, Số GIÂY, Cúp & Hoa */}
          <div className="bg-slate-950/80 rounded-2xl p-2.5 sm:p-3 border border-amber-400/40 mb-3 space-y-1.5 max-h-48 sm:max-h-56 overflow-y-auto pr-1">
            {rankingTab === 'racers' ? (
              <>
                <div className="text-[10px] sm:text-[11px] uppercase font-extrabold text-amber-300 text-left px-1 flex items-center justify-between flex-wrap gap-1">
                  <span>🏆 Bảng xếp hạng (Điểm • Số câu đúng • Số giây):</span>
                  <span>⏱️ Nhanh nhất xếp trên khi ngang điểm</span>
                </div>
                {sortedRacers.map((racer, idx) => {
                  const hookLvl = racer.hookLevel ?? Math.round((racer.progress || 0) / 10);
                  const corr = racer.correctCount ?? 0;
                  const sec = racer.totalTimeSec ?? 0;
                  const calls = racer.callCount ?? 0;
                  const rankBadge =
                    idx === 0 ? '🏆🌸' : idx === 1 ? '🥈🌺' : idx === 2 ? '🥉🌻' : '🌼';

                  return (
                    <div
                      key={racer.id}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all gap-2 ${
                        idx === 0
                          ? 'bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-amber-500/25 border-amber-400 text-amber-200 font-extrabold shadow-md shadow-amber-500/10'
                          : idx === 1
                          ? 'bg-slate-800/90 border-slate-500/80 text-slate-100 font-bold'
                          : idx === 2
                          ? 'bg-amber-950/40 border-amber-700/60 text-amber-100 font-bold'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-slate-950'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-950'
                              : idx === 2
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-700 text-white'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span className="text-base shrink-0">{racer.avatar}</span>
                        <span className="font-bold truncate max-w-[105px] sm:max-w-[155px]">
                          {racer.name}
                        </span>
                        <span className="text-sm shrink-0" title="Cúp và hoa chúc mừng">
                          {rankBadge}
                        </span>
                        {calls > 1 && gameMode === 'individual' && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-900/90 text-indigo-200 text-[9px] font-bold shrink-0">
                            Gọi {calls} lần
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-[11px]">
                          ✅ {corr} đúng
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-950 border border-indigo-400/40 text-cyan-300 font-mono font-bold text-[11px]">
                          ⏱️ {sec.toFixed(1)}s
                        </span>
                        <span className="hidden sm:inline text-[11px] font-mono text-slate-300 font-bold">
                          Móc {hookLvl}/10
                        </span>
                        <span className="bg-slate-900 px-2 py-0.5 rounded-lg text-amber-400 font-mono font-bold text-xs border border-amber-400/30">
                          {racer.score}đ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                <div className="text-[10px] sm:text-[11px] uppercase font-extrabold text-amber-300 text-left px-1 flex items-center justify-between flex-wrap gap-1">
                  <span>🐥 Xếp hạng cá nhân học sinh (Số câu đúng & Số giây):</span>
                  <span>🎲 Có thể được gọi ngẫu nhiên nhiều lần</span>
                </div>
                {sortedSessionStudents.map((std, idx) => {
                  const rankBadge =
                    idx === 0 ? '🏆🌸' : idx === 1 ? '🥈🌺' : idx === 2 ? '🥉🌻' : '🌼';
                  return (
                    <div
                      key={std.studentName}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all gap-2 ${
                        idx === 0
                          ? 'bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-amber-500/25 border-amber-400 text-amber-200 font-extrabold'
                          : 'bg-slate-900/90 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-slate-950'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-950'
                              : idx === 2
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-700 text-white'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span className="font-bold truncate max-w-[110px] sm:max-w-[160px]">
                          🐥 {std.studentName}
                        </span>
                        <span className="text-xs shrink-0">{rankBadge}</span>
                        {std.callCount > 1 && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-900 text-indigo-200 text-[9px] font-bold shrink-0">
                            Gọi {std.callCount} lần
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-[11px]">
                          ✅ {std.correctCount} đúng
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-950 border border-indigo-400/40 text-cyan-300 font-mono font-bold text-[11px]">
                          ⏱️ {std.totalTimeSec.toFixed(1)}s
                        </span>
                        <span className="bg-slate-900 px-2 py-0.5 rounded-lg text-amber-400 font-mono font-bold text-xs border border-amber-400/30">
                          {std.score}đ
                        </span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Các Nút Điều Khiển Sau Khi Chơi Xong */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1 shrink-0">
          <button
            onClick={() => {
              sound.stopCelebrationMusic();
              onRestart();
            }}
            className="flex-1 py-2.5 sm:py-3 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/30 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>CHƠI LẠI BÀI NÀY</span>
          </button>

          {onReturnHome && (
            <button
              onClick={() => {
                sound.stopCelebrationMusic();
                onReturnHome();
              }}
              className="py-2.5 sm:py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Home className="w-4 h-4" />
              <span>MÀN HÌNH CHÍNH</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.stopCelebrationMusic();
              onGoToDashboard();
            }}
            className="py-2.5 sm:py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-slate-600 cursor-pointer transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>SỔ ĐIỂM & THỐNG KÊ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
