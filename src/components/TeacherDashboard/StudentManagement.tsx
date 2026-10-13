import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Student } from '../../types';
import {
  Users,
  UserPlus,
  Upload,
  Download,
  Shuffle,
  Trash2,
  ShieldAlert,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const {
    currentClass,
    students,
    addStudent,
    importStudentsCsv,
    exportStudentsCsv,
    updateTeamAssignment,
  } = useGameStore();

  const [newName, setNewName] = useState('');
  const [newRollNumber, setNewRollNumber] = useState('');
  const [newGender, setNewGender] = useState<'nam' | 'nu'>('nam');
  const [newTeamId, setNewTeamId] = useState(currentClass.teams[0]?.id || 'team-red');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Add individual student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newRollNumber.trim()) return;

    addStudent({
      classId: currentClass.id,
      name: newName.trim(),
      rollNumber: newRollNumber.trim(),
      gender: newGender,
      teamId: newTeamId,
      avatar: newGender === 'nu' ? '👧' : '👦',
    });

    setNewName('');
    setNewRollNumber('');
  };

  // Import CSV File
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const count = importStudentsCsv(text);
      setImportMessage(`Đã nhập thành công ${count} học sinh từ tệp CSV!`);
      setTimeout(() => setImportMessage(null), 4000);
    };
    reader.readAsText(file);
  };

  // Download Sample CSV template
  const handleDownloadSampleCsv = () => {
    const sampleCsv = `Họ và Tên,Mã Học Sinh,Giới Tính,Đội
Nguyễn Gia Huy,3A-09,Nam,team-red
Lê Bảo Trâm,3A-10,Nu,team-blue
Phan Tuấn Tú,3A-11,Nam,team-yellow
Đặng Khánh An,3A-12,Nu,team-green
Bùi Việt Cường,3A-13,Nam,team-red`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mau_danh_sach_hoc_sinh_3a.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Full current class export
  const handleExportFullCsv = () => {
    const csvData = exportStudentsCsv();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `so_diem_${currentClass.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Auto balance teams (round-robin)
  const handleAutoBalanceTeams = () => {
    const teamIds = currentClass.teams.map((t) => t.id);
    students.forEach((s, idx) => {
      const assignedTeamId = teamIds[idx % teamIds.length];
      updateTeamAssignment(s.id, assignedTeamId);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Actions */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="text-xs uppercase font-bold text-amber-400 mb-1 flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>Quản Lý Học Sinh & Chia Nhóm Đua</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            {currentClass.name} • Tổng cộng {students.length} học sinh
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Giáo viên phụ trách: {currentClass.teacherName} | Năm học: {currentClass.academicYear}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2.5">
          {/* Download Sample CSV */}
          <button
            onClick={handleDownloadSampleCsv}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải CSV Mẫu</span>
          </button>

          {/* Import CSV */}
          <label className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md">
            <Upload className="w-4 h-4" />
            <span>Nhập File Excel/CSV</span>
            <input type="file" accept=".csv" onChange={handleCsvFileUpload} className="hidden" />
          </label>

          {/* Auto Balance */}
          <button
            onClick={handleAutoBalanceTeams}
            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Shuffle className="w-4 h-4" />
            <span>Tự Động Cân Bằng Đội</span>
          </button>

          {/* Export Full CSV */}
          <button
            onClick={handleExportFullCsv}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Báo Cáo Điểm</span>
          </button>
        </div>
      </div>

      {importMessage && (
        <div className="bg-emerald-950/60 border border-emerald-500 p-3 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{importMessage}</span>
        </div>
      )}

      {/* 4 Team Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentClass.teams.map((team) => {
          const teamStudents = students.filter((s) => s.teamId === team.id);
          const totalScore = teamStudents.reduce((acc, curr) => acc + curr.cumulativeScore, 0);

          return (
            <div
              key={team.id}
              className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-lg relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{team.avatar}</span>
                  <span className="font-extrabold text-white text-sm">{team.name}</span>
                </div>
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: team.carHex }}
                />
              </div>

              <div className="flex justify-between items-end mt-4">
                <div>
                  <div className="text-[10px] text-slate-300 uppercase font-bold">Thành viên</div>
                  <div className="text-lg font-black text-white">{teamStudents.length} học sinh</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-300 uppercase font-bold">Tổng điểm đội</div>
                  <div className="text-base font-black text-amber-400 font-mono">{totalScore} đ</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Student Form & Roster Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Add Student Manually (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Thêm Học Sinh Thủ Công</span>
          </h3>

          <form onSubmit={handleAddStudent} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Họ và Tên:
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="VD: Nguyễn Văn Nam"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Mã / Số thứ tự:
              </label>
              <input
                type="text"
                required
                value={newRollNumber}
                onChange={(e) => setNewRollNumber(e.target.value)}
                placeholder="VD: 3A-17"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Giới tính:
                </label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value as 'nam' | 'nu')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs"
                >
                  <option value="nam">Nam</option>
                  <option value="nu">Nữ</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Phân vào đội:
                </label>
                <select
                  value={newTeamId}
                  onChange={(e) => setNewTeamId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs"
                >
                  {currentClass.teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>THÊM VÀO DANH SÁCH</span>
            </button>
          </form>
        </div>

        {/* Right: Students Table (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h3 className="font-extrabold text-white text-sm">
              Danh Sách Học Sinh Lớp ({students.length})
            </h3>
            <span className="text-xs text-slate-300">
              Có thể đổi đội trực tiếp trên bảng
            </span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[460px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 uppercase font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Mã HS</th>
                  <th className="py-2.5 px-3">Họ và Tên</th>
                  <th className="py-2.5 px-3">Đội Đua</th>
                  <th className="py-2.5 px-3 text-right">Điểm Cộng Dồn</th>
                  <th className="py-2.5 px-3 text-right">Đúng / Sai</th>
                  <th className="py-2.5 px-3 text-center">Combo Cao Nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((st) => {
                  return (
                    <tr key={st.id} className="hover:bg-slate-800/40 text-slate-200">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{st.rollNumber}</td>
                      <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-1.5">
                        <span>{st.avatar}</span>
                        <span>{st.name}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={st.teamId}
                          onChange={(e) => updateTeamAssignment(st.id, e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
                        >
                          {currentClass.teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-amber-300">
                        {st.cumulativeScore} đ
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span className="text-emerald-400 font-bold">{st.totalCorrect}</span> /{' '}
                        <span className="text-rose-400">{st.totalWrong}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded-md font-mono">
                          🔥 {st.highestCombo}
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
    </div>
  );
};
