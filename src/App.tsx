import React from 'react';
import { useGameStore } from './store/gameStore';
import { ClassroomGameView } from './components/ClassroomGame/ClassroomGameView';
import { TeacherDashboard } from './components/TeacherDashboard/TeacherDashboard';

export default function App() {
  const { viewMode } = useGameStore();

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {viewMode === 'classroom' ? <ClassroomGameView /> : <TeacherDashboard />}
    </div>
  );
}
