import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { CURRICULUM_WEEKS } from '../../services/mockData';
import {
  Trophy,
  Medal,
  Calendar,
  Flame,
  TrendingUp,
  Percent,
  CheckCircle2,
  Award,
  ChevronRight,
} from 'lucide-react';

export const WeeklyLeaderboard: React.FC = () => {
  const { selectedWeek, setSelectedWeek, getLeaderboard, students } = useGameStore();

  const [filterWeek, setFilterWeek] = useState<number>(selectedWeek);
  const [viewType, setViewType] = useState<'cumulative' | 'weekly'>('cumulative');

  const leaderboardData = getLeaderboard(filterWeek);

  // Re-sort based on toggle
  const sortedData = [...leaderboardData].sort((a, b) => {
    if (viewType === 'weekly') {
      return b.weeklyScore - a.weeklyScore;
    }
    return b.cumulativeScore - a.cumulativeScore;
  });

  // Calculate high-level stats
  const totalClassPoints = sortedData.reduce((acc, c) => acc + c.cumulativeScore, 0);
  const avgAccuracy = Math.round(
    sortedData.reduce((acc, c) => acc + c.accuracy, 0) / (sortedData.length || 1)
  );
  const topStudent = sortedData[0];

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Week Selector */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="text-xs uppercase font-bold text-amber-400 mb-1 flex items-center gap-1.5">
            <Trophy className="w-4 h-4" />
            <span>Sổ Điểm & Bảng Xếp Hạng 35 Tuần Học</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Theo Dõi Năng Lực Học Sinh Từ Tuần 1 Đến Tuần 35
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Hệ thống tự động tính toán điểm chặng từng tuần và điểm cộng dồn lũy kế cả năm học với thời gian phản hồi O(1).
          </p>
        </div>

        {/* Week Selector Dropdown & Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-2xl px-3 py-2 text-white">
            <Calendar className="w-4 h-4 text-amber-400" />
            <select
              value={filterWeek}
              onChange={(e) => {
                const w = parseInt(e.target.value, 10);
                setFilterWeek(w);
                setSelectedWeek(w);
              }}
              className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
            >
              {CURRICULUM_WEEKS.map((w) => (
                <option key={w.week} value={w.week} className="bg-slate-900 text-white">
                  Tuần {w.week}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle View Mode */}
          <div className="bg-slate-800 p-1 rounded-2xl border border-slate-700 flex">
            <button
              onClick={() => setViewType('cumulative')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewType === 'cumulative'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Cộng Dồn Cả Năm
            </button>
            <button
              onClick={() => setViewType('weekly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewType === 'weekly'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Điểm Tuần {filterWeek}
            </button>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold text-slate-300">Học sinh dẫn đầu</div>
            <div className="text-base font-extrabold text-white truncate">
              {topStudent ? topStudent.studentName : 'Đang cập nhật'}
            </div>
            <div className="text-xs text-amber-400 font-bold font-mono">
              {topStudent ? `${topStudent.cumulativeScore} điểm tích lũy` : ''}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold text-slate-300">Độ chính xác trung bình</div>
            <div className="text-xl font-black text-white font-mono">{avgAccuracy}%</div>
            <div className="text-xs text-emerald-400">Toàn bộ 4 đội thi đua</div>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-400/20 text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold text-slate-300">Tổng điểm tích lũy lớp</div>
            <div className="text-xl font-black text-white font-mono">{totalClassPoints} đ</div>
            <div className="text-xs text-blue-300">Tính đến Tuần {filterWeek}</div>
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-3">
          <div>
            <h3 className="font-extrabold text-white text-base">
              Bảng Xếp Hạng {viewType === 'cumulative' ? 'Cộng Dồn (Lũy kế cả năm)' : `Chi Tiết Tuần ${filterWeek}`}
            </h3>
            <span className="text-xs text-slate-300">
              Xếp hạng từ cao xuống thấp theo tiêu chí lựa chọn
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-300 uppercase font-bold">
              <tr>
                <th className="py-3 px-3 text-center w-14">Hạng</th>
                <th className="py-3 px-3">Học Sinh</th>
                <th className="py-3 px-3">Đội Đua</th>
                <th className="py-3 px-3 text-right">Điểm Tuần {filterWeek}</th>
                <th className="py-3 px-3 text-right font-black text-amber-300">Điểm Cộng Dồn</th>
                <th className="py-3 px-3 text-center">Tỷ Lệ Đúng</th>
                <th className="py-3 px-3 text-center">Chuỗi Combo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedData.map((item, idx) => {
                const rank = idx + 1;
                return (
                  <tr
                    key={item.studentId}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      rank === 1 ? 'bg-amber-500/10' : rank === 2 ? 'bg-slate-500/10' : rank === 3 ? 'bg-orange-500/10' : ''
                    }`}
                  >
                    {/* Rank Badge */}
                    <td className="py-3 px-3 text-center">
                      {rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md">
                          🥇 1
                        </span>
                      ) : rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black text-xs shadow-md">
                          🥈 2
                        </span>
                      ) : rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs shadow-md">
                          🥉 3
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-slate-400">#{rank}</span>
                      )}
                    </td>

                    {/* Student Name */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-white text-sm">{item.studentName}</div>
                      <div className="text-[11px] text-slate-300 font-mono">{item.rollNumber}</div>
                    </td>

                    {/* Team */}
                    <td className="py-3 px-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: `${item.teamColor}33`, borderColor: item.teamColor, borderWidth: 1 }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.teamColor }} />
                        {item.teamName}
                      </span>
                    </td>

                    {/* Weekly Score */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-300">
                      {item.weeklyScore} đ
                    </td>

                    {/* Cumulative Score */}
                    <td className="py-3 px-3 text-right font-mono font-black text-base text-amber-400">
                      {item.cumulativeScore} đ
                    </td>

                    {/* Accuracy */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-mono font-bold text-slate-200">{item.accuracy}%</span>
                      </div>
                    </td>

                    {/* Combo */}
                    <td className="py-3 px-3 text-center">
                      <span className="bg-orange-500/20 text-orange-400 font-mono font-bold px-2 py-0.5 rounded-md">
                        🔥 {item.highestCombo}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
