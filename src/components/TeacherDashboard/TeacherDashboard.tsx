import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { AiQuizGenerator } from './AiQuizGenerator';
import { StudentManagement } from './StudentManagement';
import { WeeklyLeaderboard } from './WeeklyLeaderboard';
import { SystemArchitectureDoc } from './SystemArchitectureDoc';
import {
  Sparkles,
  Users,
  Trophy,
  Server,
  Play,
  LogOut,
  GraduationCap,
  Calendar,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import { SettingsModal } from '../SettingsModal';

export const TeacherDashboard: React.FC = () => {
  const { currentClass, selectedWeek, setViewMode, isSettingsOpen, openSettings, closeSettings, openSetup } = useGameStore();

  const [activeTab, setActiveTab] = useState<'ai' | 'students' | 'leaderboard' | 'architecture'>('ai');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
        
        {/* Brand & Class Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-xl shadow-md shadow-orange-500/20">
            🏎️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-white text-base sm:text-lg">
                ĐUA XE TRI THỨC 3D
              </h1>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold px-2 py-0.5 rounded-full border border-indigo-500/30">
                TEACHER HUB
              </span>
            </div>
            <p className="text-xs text-slate-300 flex items-center gap-2">
              <span>{currentClass.name}</span>
              <span>•</span>
              <span>{currentClass.teacherName}</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">Tuần {selectedWeek}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons: Settings Gear + Setup + Classroom Game Mode */}
        <div className="flex items-center gap-2">
          {/* Settings Gear Button */}
          <button
            onClick={openSettings}
            title="Cài đặt khóa API Gemini"
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer shadow-md"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">Cài Đặt API</span>
          </button>

          {/* Setup Race Button */}
          <button
            onClick={() => {
              setViewMode('classroom');
              openSetup();
            }}
            title="Thiết lập bài học, PDF và danh sách đua"
            className="py-2.5 px-3 sm:px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Thiết Lập Bài & Đội</span>
          </button>

          <button
            onClick={() => setViewMode('classroom')}
            className="py-2.5 px-4 sm:px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-orange-500/30 transform hover:scale-102 active:scale-98 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span className="hidden sm:inline">MỞ MÀN HÌNH ĐUA XE TRÌNH CHIẾU</span>
            <span className="sm:hidden">ĐUA XE</span>
          </button>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4 overflow-x-auto py-2.5 no-scrollbar">
          
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'ai'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Tạo Đề Từ Sách (PDF)</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quản Lý Học Sinh & Chia Nhóm</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'leaderboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Sổ Điểm & BXH 35 Tuần</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'architecture'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Kiến Trúc Hệ Thống & Firestore Schema</span>
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {activeTab === 'ai' && <AiQuizGenerator />}
        {activeTab === 'students' && <StudentManagement />}
        {activeTab === 'leaderboard' && <WeeklyLeaderboard />}
        {activeTab === 'architecture' && <SystemArchitectureDoc />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-400">
        Đua Xe Tri Thức 3D • Hệ thống thi đua trắc nghiệm tương tác tiểu học tích hợp AI Gemini & Three.js WebGL
      </footer>

      {/* Global Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
    </div>
  );
};
