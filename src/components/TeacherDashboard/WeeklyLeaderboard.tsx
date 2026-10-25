import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { CURRICULUM_WEEKS } from '../../services/mockData';
import {
  clearPersistentStatsForClass,
  getActiveClassId,
  getAvailableClassesForStatistics,
  setActiveClassId,
  StatsClassOption,
} from '../../services/classroomStorageService';
import {
  Trophy,
  Calendar,
  TrendingUp,
  Percent,
  CheckCircle2,
  Award,
  Users,
  User,
  Download,
  RotateCcw,
  ArrowRight,
  Layers,
  GraduationCap,
} from 'lucide-react';

export const WeeklyLeaderboard: React.FC = () => {
  const {
    selectedWeek,
    setSelectedWeek,
    resetClassStatistics,
    getLeaderboard,
    getTeamLeaderboard,
    currentClass,
    students,
    racers,
  } = useGameStore();

  // Class Selection for Statistics (Adjustment 1)
  const [availableClasses, setAvailableClasses] = useState<StatsClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(
    () => getActiveClassId() || currentClass.id
  );

  // Entity Mode: 'individual' (Cá nhân) or 'team' (Theo đội)
  const [entityMode, setEntityMode] = useState<'individual' | 'team'>('individual');

  // Time Range Mode: 'cumulative' (Lũy kế từ lúc bắt đầu chơi đến hiện tại) or 'weekly' (Theo từng tuần)
  const [viewType, setViewType] = useState<'cumulative' | 'weekly'>('cumulative');

  // Week selectors: startWeek (default Tuần 1) -> endWeek (default Tuần hiện tại, hoặc Tuần 10)
  const [startWeek, setStartWeek] = useState<number>(1);
  const [endWeek, setEndWeek] = useState<number>(Math.max(selectedWeek, 10));
  const [singleWeek, setSingleWeek] = useState<number>(selectedWeek);
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  // Load available classes from storage + current active class
  useEffect(() => {
    const list = getAvailableClassesForStatistics({
      id: currentClass.id,
      name: currentClass.name,
      studentCount: students.length,
      teamCount: currentClass.teams.length,
    });
    setAvailableClasses(list);

    const activeId = getActiveClassId() || currentClass.id;
    if (list.some((c) => c.classId === selectedClassId)) {
      // keep current selection
    } else if (list.some((c) => c.classId === activeId)) {
      setSelectedClassId(activeId);
    } else if (list.length > 0) {
      setSelectedClassId(list[0].classId);
    }
  }, [currentClass.id, currentClass.name, students.length, currentClass.teams.length, refreshTick]);

  useEffect(() => {
    setSingleWeek(selectedWeek);
    if (selectedWeek > endWeek) {
      setEndWeek(selectedWeek);
    }
  }, [selectedWeek]);

  const handleSelectStatsClass = (cid: string) => {
    setSelectedClassId(cid);
    setActiveClassId(cid);
  };

  const activeSelectedClassOption =
    availableClasses.find((c) => c.classId === selectedClassId) || {
      classId: selectedClassId,
      className: currentClass.name || 'Lớp học hiện tại',
      studentCount: students.length,
      teamCount: currentClass.teams.length,
    };

  // Effective range based on viewType
  const effectiveStart = viewType === 'weekly' ? singleWeek : Math.min(startWeek, endWeek);
  const effectiveEnd = viewType === 'weekly' ? singleWeek : Math.max(startWeek, endWeek);

  // Compute Individual & Team Leaderboards dynamically for the SELECTED CLASS
  const individualData = React.useMemo(
    () => getLeaderboard(singleWeek, effectiveStart, effectiveEnd, selectedClassId),
    [
      getLeaderboard,
      singleWeek,
      effectiveStart,
      effectiveEnd,
      selectedClassId,
      students,
      currentClass,
      racers,
      refreshTick,
    ]
  );

  const teamData = React.useMemo(
    () => getTeamLeaderboard(singleWeek, effectiveStart, effectiveEnd, selectedClassId),
    [
      getTeamLeaderboard,
      singleWeek,
      effectiveStart,
      effectiveEnd,
      selectedClassId,
      students,
      currentClass,
      racers,
      refreshTick,
    ]
  );

  // List of played weeks within [effectiveStart..effectiveEnd] to show breakdown badges
  const activeWeeksInRange = React.useMemo(() => {
    const weeksSet = new Set<number>();
    if (entityMode === 'individual') {
      individualData.forEach((item) => {
        Object.keys(item.weeklyBreakdown || {}).forEach((w) => {
          const wNum = Number(w);
          if (
            wNum >= effectiveStart &&
            wNum <= effectiveEnd &&
            (item.weeklyBreakdown[wNum]?.score > 0 || item.weeklyBreakdown[wNum]?.correctCount > 0)
          ) {
            weeksSet.add(wNum);
          }
        });
      });
    } else {
      teamData.forEach((item) => {
        Object.keys(item.weeklyBreakdown || {}).forEach((w) => {
          const wNum = Number(w);
          if (
            wNum >= effectiveStart &&
            wNum <= effectiveEnd &&
            (item.weeklyBreakdown[wNum]?.score > 0 || item.weeklyBreakdown[wNum]?.correctCount > 0)
          ) {
            weeksSet.add(wNum);
          }
        });
      });
    }
    return Array.from(weeksSet).sort((a, b) => a - b);
  }, [entityMode, individualData, teamData, effectiveStart, effectiveEnd]);

  // High-level summary metrics
  const totalPoints =
    entityMode === 'individual'
      ? individualData.reduce((acc, c) => acc + c.rangeScore, 0)
      : teamData.reduce((acc, c) => acc + c.rangeScore, 0);

  const avgAccuracy =
    entityMode === 'individual'
      ? Math.round(
          individualData.reduce((acc, c) => acc + c.accuracy, 0) /
            Math.max(1, individualData.length)
        )
      : Math.round(
          teamData.reduce((acc, c) => acc + c.accuracy, 0) / Math.max(1, teamData.length)
        );

  const topLeaderScore =
    entityMode === 'individual'
      ? individualData[0]?.rangeScore || 0
      : teamData[0]?.rangeScore || 0;

  const topLeaderName =
    topLeaderScore > 0
      ? entityMode === 'individual'
        ? individualData[0]?.studentName || 'Chưa có dữ liệu'
        : teamData[0]?.teamName || 'Chưa có dữ liệu'
      : 'Chưa có điểm (Mặc định 0đ)';

  // Export current statistics table to CSV
  const handleExportStatsCsv = () => {
    const safeClassName = (activeSelectedClassOption.className || 'Lop')
      .replace(/\s+/g, '_');
    const rangeLabel =
      viewType === 'weekly'
        ? `Tuan_${singleWeek}`
        : `Tu_Tuan_${effectiveStart}_Den_Tuan_${effectiveEnd}`;

    if (entityMode === 'individual') {
      const headers = [
        'Lớp Học,Hạng,Họ và Tên Học Sinh,Đội Nhóm,Tổng Điểm Thống Kê,Số Câu Đúng,Số Câu Sai,Tổng Thời Gian (Giây),Tổng Móc Leo Được,Tỷ Lệ Chính Xác (%),Chi Tiết Từng Tuần',
      ];
      const rows = individualData.map((item, idx) => {
        const weekDetails = Object.entries(item.weeklyBreakdown || {})
          .filter(([w]) => Number(w) >= effectiveStart && Number(w) <= effectiveEnd)
          .map(
            ([w, rec]) =>
              `T${w}: ${rec.score}đ (${rec.correctCount}Đ/${rec.wrongCount}S - ${(rec.totalTimeSec || 0).toFixed(1)}s)`
          )
          .join(' | ');
        return `"${activeSelectedClassOption.className}",${idx + 1},"${item.studentName}","${item.teamName}",${item.rangeScore},${item.rangeCorrect},${item.rangeWrong},${(item.rangeTimeSec || 0).toFixed(1)}s,${item.rangeHooks},${item.accuracy}%,"${weekDetails}"`;
      });
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thong_ke_ca_nhan_${safeClassName}_${rangeLabel}.csv`;
      a.click();
    } else {
      const headers = [
        'Lớp Học,Hạng,Tên Đội Nhóm,Số Thành Viên,Tổng Điểm Thống Kê,Số Câu Đúng,Số Câu Sai,Tổng Thời Gian (Giây),Tổng Móc Leo Được,Tỷ Lệ Chính Xác (%),Chi Tiết Từng Tuần',
      ];
      const rows = teamData.map((item, idx) => {
        const weekDetails = Object.entries(item.weeklyBreakdown || {})
          .filter(([w]) => Number(w) >= effectiveStart && Number(w) <= effectiveEnd)
          .map(
            ([w, rec]) =>
              `T${w}: ${rec.score}đ (${rec.correctCount}Đ/${rec.wrongCount}S - ${(rec.totalTimeSec || 0).toFixed(1)}s)`
          )
          .join(' | ');
        return `"${activeSelectedClassOption.className}",${idx + 1},"${item.teamName}",${item.memberCount},${item.rangeScore},${item.rangeCorrect},${item.rangeWrong},${(item.rangeTimeSec || 0).toFixed(1)}s,${item.rangeHooks},${item.accuracy}%,"${weekDetails}"`;
      });
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thong_ke_doi_nhom_${safeClassName}_${rangeLabel}.csv`;
      a.click();
    }
  };

  const handleResetSavedStats = () => {
    clearPersistentStatsForClass(selectedClassId, activeSelectedClassOption.className);
    resetClassStatistics(selectedClassId);
    setRefreshTick((t) => t + 1);
    setResetNotice(
      `Đã làm mới toàn bộ dữ liệu thống kê của lớp "${activeSelectedClassOption.className}" về mặc định ban đầu (0 điểm, 0 câu đúng/sai, 0 giây, 0 móc)!`
    );
    setTimeout(() => setResetNotice(null), 4500);
  };

  return (
    <div className="space-y-6">
      {resetNotice && (
        <div className="bg-emerald-950/90 border-2 border-emerald-400 text-emerald-200 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-lg animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{resetNotice}</span>
        </div>
      )}

      {/* 1. Top Control Banner: Class Selection + Mode Toggle (Cá Nhân / Theo Đội) + Time Range Toggle */}
      <div className="bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-bold text-amber-400 mb-1 flex items-center gap-1.5 flex-wrap">
              <Trophy className="w-4 h-4" />
              <span>Hệ Thống Thống Kê Kết Quả Lưu Trữ Vĩnh Viễn (35 Tuần Học)</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/50 text-indigo-300 font-black">
                🏫 Đang thống kê: {activeSelectedClassOption.className}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Thống Kê Theo Lớp Học, Cá Nhân & Đội Nhóm — Từng Tuần Hoặc Lũy Kế
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Chọn lớp học cần xem thống kê để tổng hợp điểm số, số câu đúng/sai và số móc dây thừng leo được từ tuần bắt đầu đến tuần hiện tại.
            </p>
          </div>

          {/* Export & Reset Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExportStatsCsv}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Báo Cáo CSV ({activeSelectedClassOption.className})</span>
            </button>

            <button
              onClick={handleResetSavedStats}
              title="Đặt lại toàn bộ dữ liệu thống kê của lớp đang chọn về mặc định ban đầu (0 điểm)"
              className="px-3.5 py-2 rounded-xl bg-rose-950/90 hover:bg-rose-900 border border-rose-500/60 text-rose-200 hover:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm mới lưu trữ lớp này</span>
            </button>
          </div>
        </div>

        {/* Filter Bar: 1) Chọn Lớp Học + 2) Đối tượng thống kê + 3) Phương thức thống kê + 4) Chọn tuần */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-3 pt-3 border-t border-slate-800 items-end">
          {/* Filter 1: Lựa Chọn Lớp Học Để Thống Kê */}
          <div className="xl:col-span-3 flex flex-col gap-1">
            <span className="text-[11px] font-bold text-amber-300 uppercase flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>1. Chọn lớp học thống kê:</span>
            </span>
            <div className="flex items-center gap-2 bg-slate-950 border-2 border-amber-400/60 rounded-2xl px-3 py-1.5 shadow-inner">
              <select
                value={selectedClassId}
                onChange={(e) => handleSelectStatsClass(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-amber-300 focus:outline-none focus:border-amber-400 cursor-pointer w-full"
              >
                {availableClasses.map((cls) => (
                  <option key={cls.classId} value={cls.classId}>
                    🏫 {cls.className} ({cls.studentCount} học sinh
                    {cls.teamCount > 0 ? ` • ${cls.teamCount} nhóm` : ''})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter 2: Cá Nhân vs Theo Đội */}
          <div className="xl:col-span-3 flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              2. Chọn đối tượng thống kê:
            </span>
            <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 grid grid-cols-2 gap-1">
              <button
                onClick={() => setEntityMode('individual')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  entityMode === 'individual'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Theo Cá Nhân</span>
              </button>

              <button
                onClick={() => setEntityMode('team')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  entityMode === 'team'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Theo Đội Nhóm</span>
              </button>
            </div>
          </div>

          {/* Filter 3: Lũy kế từ lúc bắt đầu đến hiện tại vs Theo từng tuần */}
          <div className="xl:col-span-3 flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              3. Chọn phương thức thống kê:
            </span>
            <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 grid grid-cols-2 gap-1">
              <button
                onClick={() => setViewType('cumulative')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  viewType === 'cumulative'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>Lũy Kế Nhiều Tuần</span>
              </button>

              <button
                onClick={() => setViewType('weekly')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  viewType === 'weekly'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Theo Từng Tuần</span>
              </button>
            </div>
          </div>

          {/* Filter 4: Chọn khoảng tuần (VD: Từ Tuần 1 -> Tuần 10) hoặc Chọn 1 tuần cụ thể */}
          <div className="xl:col-span-3 flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              {viewType === 'cumulative'
                ? '4. Khoảng tuần cộng dồn:'
                : '4. Chọn tuần học cần xem:'}
            </span>

            {viewType === 'cumulative' ? (
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-2xl px-2.5 py-1.5">
                <select
                  value={startWeek}
                  onChange={(e) => setStartWeek(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs font-bold text-amber-300 focus:outline-none cursor-pointer flex-1"
                >
                  {CURRICULUM_WEEKS.map((w) => (
                    <option key={w.week} value={w.week}>
                      Tuần {w.week}
                    </option>
                  ))}
                </select>

                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                <select
                  value={endWeek}
                  onChange={(e) => setEndWeek(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs font-bold text-emerald-300 focus:outline-none cursor-pointer flex-1"
                >
                  {CURRICULUM_WEEKS.map((w) => (
                    <option key={w.week} value={w.week}>
                      Tuần {w.week}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5">
                <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                <select
                  value={singleWeek}
                  onChange={(e) => {
                    const w = Number(e.target.value);
                    setSingleWeek(w);
                    setSelectedWeek(w);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1 text-xs font-bold text-white focus:outline-none cursor-pointer w-full"
                >
                  {CURRICULUM_WEEKS.map((w) => (
                    <option key={w.week} value={w.week}>
                      Tuần {w.week}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. 3 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase font-bold text-slate-300">
              {entityMode === 'individual' ? 'Học sinh dẫn đầu' : 'Đội nhóm dẫn đầu'} (
              {activeSelectedClassOption.className})
            </div>
            <div className="text-base font-extrabold text-white truncate">{topLeaderName}</div>
            <div className="text-xs text-amber-400 font-bold font-mono">
              {topLeaderScore} điểm{' '}
              {viewType === 'cumulative'
                ? `(Tuần ${effectiveStart} ➔ Tuần ${effectiveEnd})`
                : `(Tuần ${singleWeek})`}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold text-slate-300">
              Tỷ lệ trả lời đúng trung bình
            </div>
            <div className="text-xl font-black text-white font-mono">{avgAccuracy}%</div>
            <div className="text-xs text-emerald-400">
              {entityMode === 'individual'
                ? `${individualData.length} học sinh thuộc ${activeSelectedClassOption.className}`
                : `${teamData.length} đội nhóm thuộc ${activeSelectedClassOption.className}`}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-400/20 text-blue-400 flex items-center gap-4 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold text-slate-300">
              {viewType === 'cumulative'
                ? `Tổng điểm cộng dồn (Tuần ${effectiveStart} ➔ Tuần ${effectiveEnd})`
                : `Tổng điểm đạt được trong Tuần ${singleWeek}`}
            </div>
            <div className="text-xl font-black text-white font-mono">{totalPoints} đ</div>
            <div className="text-xs text-blue-300">
              Đã ghi nhận {activeWeeksInRange.length} tuần có kết quả
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Statistics Table (Cá Nhân OR Theo Đội) */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800 mb-3">
          <div>
            <h3 className="font-extrabold text-white text-base">
              {entityMode === 'individual'
                ? `Bảng Thống Kê Cá Nhân — ${activeSelectedClassOption.className}`
                : `Bảng Thống Kê Đội Nhóm — ${activeSelectedClassOption.className}`}{' '}
              —{' '}
              <span className="text-amber-300">
                {viewType === 'cumulative'
                  ? `Cộng Dồn Lũy Kế Từ Tuần ${effectiveStart} Đến Tuần ${effectiveEnd}`
                  : `Chi Tiết Tuần ${singleWeek}`}
              </span>
            </h3>
            <span className="text-xs text-slate-300">
              Tự động cộng gộp điểm số, số câu trả lời đúng/sai, <strong>số GIÂY trả lời</strong> và số móc leo được của{' '}
              <strong className="text-white">{activeSelectedClassOption.className}</strong>.{' '}
              <span className="text-amber-300 font-bold">
                (Khi ngang điểm & số câu đúng, người có số GIÂY trả lời nhanh nhất sẽ xếp trên!)
              </span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {entityMode === 'individual' ? (
            /* TABLE A: INDIVIDUAL STATISTICS */
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/90 text-slate-300 uppercase font-bold">
                <tr>
                  <th className="py-3 px-3 text-center w-14">Hạng</th>
                  <th className="py-3 px-3">Học Sinh</th>
                  <th className="py-3 px-3">Đội Nhóm</th>
                  <th className="py-3 px-3">
                    {viewType === 'cumulative'
                      ? `Chi Tiết Điểm Từng Tuần (T${effectiveStart} ➔ T${effectiveEnd})`
                      : `Kết Quả Tuần ${singleWeek}`}
                  </th>
                  <th className="py-3 px-3 text-center">Đúng / Sai</th>
                  <th className="py-3 px-3 text-center">Thời Gian (Giây)</th>
                  <th className="py-3 px-3 text-center">Móc Leo Được</th>
                  <th className="py-3 px-3 text-center">Tỷ Lệ Đúng</th>
                  <th className="py-3 px-3 text-right font-black text-amber-300">
                    {viewType === 'cumulative'
                      ? `Tổng Cộng Dồn (T${effectiveStart}➔T${effectiveEnd})`
                      : `Điểm Tuần ${singleWeek}`}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {individualData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                      Chưa có danh sách học sinh hoặc dữ liệu thống kê cho lớp học này.
                    </td>
                  </tr>
                ) : (
                  individualData.map((item, idx) => {
                    const rank = idx + 1;
                    const weekEntries = Object.entries(item.weeklyBreakdown || {})
                      .map(([w, rec]) => ({ week: Number(w), ...rec }))
                      .filter((x) => x.week >= effectiveStart && x.week <= effectiveEnd)
                      .sort((a, b) => a.week - b.week);

                    return (
                      <tr
                        key={item.studentId}
                        className={`hover:bg-slate-800/50 transition-colors ${
                          rank === 1
                            ? 'bg-amber-500/10'
                            : rank === 2
                            ? 'bg-slate-500/10'
                            : rank === 3
                            ? 'bg-orange-500/10'
                            : ''
                        }`}
                      >
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

                        <td className="py-3 px-3">
                          <div className="font-bold text-white text-sm">🐥 {item.studentName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {item.rollNumber}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white"
                            style={{
                              backgroundColor: `${item.teamColor}33`,
                              borderColor: item.teamColor,
                              borderWidth: 1,
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: item.teamColor }}
                            />
                            {item.teamName}
                          </span>
                        </td>

                        {/* Per-Week Breakdown */}
                        <td className="py-3 px-3">
                          {weekEntries.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-md">
                              {weekEntries.map((wItem) => (
                                <span
                                  key={wItem.week}
                                  className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-200"
                                >
                                  <strong className="text-amber-300">T{wItem.week}:</strong>{' '}
                                  {wItem.score}đ ({wItem.correctCount}Đ/{wItem.wrongCount}S •{' '}
                                  {(wItem.totalTimeSec || 0).toFixed(1)}s)
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">
                              Chưa có lượt chơi trong khoảng tuần này
                            </span>
                          )}
                        </td>

                        {/* Correct / Wrong */}
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="text-emerald-400 font-bold">
                            {item.rangeCorrect} đúng
                          </span>
                          <span className="text-slate-500 mx-1">/</span>
                          <span className="text-rose-400 font-bold">{item.rangeWrong} sai</span>
                        </td>

                        {/* Response Time in Seconds (Tie-breaker) */}
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-400/40 text-cyan-300 font-mono font-bold">
                            ⏱️ {(item.rangeTimeSec || 0).toFixed(1)} giây
                          </span>
                        </td>

                        {/* Hooks Climbed */}
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
                            🧗 {item.rangeHooks} móc
                          </span>
                        </td>

                        {/* Accuracy */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="font-mono font-bold text-slate-200">
                              {item.accuracy}%
                            </span>
                          </div>
                        </td>

                        {/* Total Score for Selected Range/Week */}
                        <td className="py-3 px-3 text-right font-mono font-black text-base text-amber-400">
                          {item.rangeScore} đ
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* TABLE B: TEAM STATISTICS */
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/90 text-slate-300 uppercase font-bold">
                <tr>
                  <th className="py-3 px-3 text-center w-14">Hạng</th>
                  <th className="py-3 px-3">Đội Thú Hoang</th>
                  <th className="py-3 px-3 text-center">Thành Viên</th>
                  <th className="py-3 px-3">
                    {viewType === 'cumulative'
                      ? `Chi Tiết Điểm Từng Tuần (T${effectiveStart} ➔ T${effectiveEnd})`
                      : `Kết Quả Tuần ${singleWeek}`}
                  </th>
                  <th className="py-3 px-3 text-center">Đúng / Sai</th>
                  <th className="py-3 px-3 text-center">Thời Gian (Giây)</th>
                  <th className="py-3 px-3 text-center">Tổng Móc Leo</th>
                  <th className="py-3 px-3 text-center">Tỷ Lệ Đúng</th>
                  <th className="py-3 px-3 text-right font-black text-amber-300">
                    {viewType === 'cumulative'
                      ? `Tổng Cộng Dồn (T${effectiveStart}➔T${effectiveEnd})`
                      : `Điểm Tuần ${singleWeek}`}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {teamData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                      Chưa có danh sách đội nhóm hoặc dữ liệu thống kê cho lớp học này.
                    </td>
                  </tr>
                ) : (
                  teamData.map((team, idx) => {
                    const rank = idx + 1;
                    const weekEntries = Object.entries(team.weeklyBreakdown || {})
                      .map(([w, rec]) => ({ week: Number(w), ...rec }))
                      .filter((x) => x.week >= effectiveStart && x.week <= effectiveEnd)
                      .sort((a, b) => a.week - b.week);

                    return (
                      <tr
                        key={team.teamId}
                        className={`hover:bg-slate-800/50 transition-colors ${
                          rank === 1
                            ? 'bg-amber-500/10'
                            : rank === 2
                            ? 'bg-slate-500/10'
                            : rank === 3
                            ? 'bg-orange-500/10'
                            : ''
                        }`}
                      >
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

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shadow shrink-0"
                              style={{ backgroundColor: team.teamColor }}
                            >
                              {team.avatar}
                            </span>
                            <span className="font-extrabold text-white text-sm">
                              {team.teamName}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center font-bold text-slate-300">
                          {team.memberCount} học sinh
                        </td>

                        {/* Per-week breakdown */}
                        <td className="py-3 px-3">
                          {weekEntries.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-md">
                              {weekEntries.map((wItem) => (
                                <span
                                  key={wItem.week}
                                  className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-200"
                                >
                                  <strong className="text-amber-300">T{wItem.week}:</strong>{' '}
                                  {wItem.score}đ ({wItem.correctCount}Đ/{wItem.wrongCount}S •{' '}
                                  {(wItem.totalTimeSec || 0).toFixed(1)}s)
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">
                              Chưa có lượt chơi trong khoảng tuần này
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center font-mono">
                          <span className="text-emerald-400 font-bold">
                            {team.rangeCorrect} đúng
                          </span>
                          <span className="text-slate-500 mx-1">/</span>
                          <span className="text-rose-400 font-bold">{team.rangeWrong} sai</span>
                        </td>

                        {/* Response Time in Seconds */}
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-400/40 text-cyan-300 font-mono font-bold">
                            ⏱️ {(team.rangeTimeSec || 0).toFixed(1)} giây
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
                            🧗 {team.rangeHooks} móc
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="font-mono font-bold text-slate-200">
                              {team.accuracy}%
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-black text-base text-amber-400">
                          {team.rangeScore} đ
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
