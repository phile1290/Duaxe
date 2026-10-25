import React, { useState } from 'react';
import {
  FolderTree,
  Database,
  Zap,
  Code2,
  Copy,
  Check,
  Server,
  ShieldCheck,
} from 'lucide-react';

export const SystemArchitectureDoc: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const nextJsFolderStructure = `ancient-forest-quiz-app/
├── app/                              # Next.js / React Architecture
│   ├── dashboard/                    # Teacher Management & 35-Week Statistics
│   ├── game/                         # Dual-Screen Classroom Game View
│   └── api/                          # Serverless Route Handlers
│       └── gemini/
│           └── extract-quiz.ts       # Gemini 3.8 Flash PDF RAG Extractor
├── components/
│   ├── ClassroomGame/
│   │   ├── ChickPickerArena.tsx      # Bà Già Chống Gậy Bắt Gà Con (Lượt ngẫu nhiên)
│   │   ├── AncientForestRopeClimb.tsx# Rừng Cổ Thụ & Thú Hoang Leo Dây Thừng 10 Móc
│   │   ├── QuestionVisualIllustration.tsx # Hình ảnh câu hỏi & 4 đáp án đồng nhất
│   │   ├── QuestionHUD.tsx           # Bảng câu hỏi trắc nghiệm
│   │   └── VictoryPodium.tsx         # Bục vinh danh chinh phục Móc 10
│   └── TeacherDashboard/
│       └── WeeklyLeaderboard.tsx     # Thống kê Cá Nhân & Đội (Từng tuần & Lũy kế)
├── services/
│   ├── classroomStorageService.ts    # Lưu trữ vĩnh viễn lớp học, bộ câu hỏi & thống kê tuần
│   └── geminiClientService.ts        # @google/genai SDK Integration
├── store/
│   └── gameStore.ts                  # Zustand Game State Management
└── vercel.json`;

  const firestoreSchemaJson = `{
  "firestore_schema_design": {
    "collections": {
      "classes": {
        "description": "Danh sách các lớp học của nhà trường",
        "document_path": "classes/{classId}",
        "fields": {
          "id": "string (VD: class-3a)",
          "name": "string (VD: Lớp 3A)",
          "academicYear": "string (2025-2026)",
          "activeTeams": [
            {
              "teamId": "team-1",
              "teamName": "Đội Sư Tử 🦁",
              "avatar": "🦁"
            }
          ]
        }
      },
      "students": {
        "description": "Hồ sơ học sinh & thống kê lũy kế từ tuần 1 đến tuần hiện tại",
        "document_path": "classes/{classId}/students/{studentId}",
        "fields": {
          "id": "string",
          "name": "string (VD: Nguyễn Minh An)",
          "teamId": "string (team-1)",
          "cumulativeScore": "number",
          "totalCorrect": "number",
          "totalWrong": "number",
          "weeklyScores": "Record<weekNumber, { score, correctCount, wrongCount, hooksClimbed }>"
        }
      }
    }
  }
}`;

  return (
    <div className="space-y-8 text-left">
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-3xl border border-emerald-500/30">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
          <Server className="w-4 h-4" />
          <span>Kiến Trúc Hệ Thống & Giải Pháp Kỹ Thuật</span>
        </div>
        <h2 className="text-2xl font-black text-white">
          Tài Liệu Thiết Kế Cơ Sở Dữ Liệu & Sơ Đồ Hệ Thống Rừng Cổ Thụ 10 Móc
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          Tích hợp Gemini AI trích xuất tài liệu PDF, màn hình kép Bà Già Chống Gậy Bắt Gà & Rừng Cổ Thụ 10 Móc, cùng hệ thống thống kê lũy kế 35 tuần học.
        </p>
      </div>

      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FolderTree className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-base">
              1. Sơ Đồ Cấu Trúc Thư Mục Dự Án
            </h3>
          </div>
          <button
            onClick={() => copyToClipboard(nextJsFolderStructure, 'folder')}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer"
          >
            {copiedKey === 'folder' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Sao chép</span>
          </button>
        </div>
        <pre className="bg-slate-950 p-4 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800/80 leading-relaxed">
          {nextJsFolderStructure}
        </pre>
      </div>

      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-white text-base">
              2. Cấu Trúc Lưu Trữ Thống Kê Cá Nhân & Đội Nhóm (Tuần 1 ➔ Tuần 35)
            </h3>
          </div>
          <button
            onClick={() => copyToClipboard(firestoreSchemaJson, 'schema')}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer"
          >
            {copiedKey === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Sao chép JSON</span>
          </button>
        </div>

        <div className="bg-amber-950/30 border border-amber-600/40 rounded-2xl p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold uppercase tracking-wide">
            <Zap className="w-4 h-4" />
            <span>Giải Pháp Cộng Dồn Kết Quả Lũy Kế Nhiều Tuần:</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-slate-200">
            <li>
              Mỗi lượt trả lời câu hỏi của học sinh hoặc đội nhóm ở bất kỳ tuần nào (Tuần 1 ➔ Tuần 35) đều được lưu ngay lập tức vào bộ nhớ bền vững.
            </li>
            <li>
              Khi giáo viên chọn thống kê từ lúc bắt đầu chơi (ví dụ: Tuần 1) đến thời điểm hiện tại (ví dụ: Tuần 10), hệ thống tự động cộng dồn chính xác toàn bộ điểm số, số câu đúng/sai và số móc dây thừng leo được của từng tuần.
            </li>
          </ul>
        </div>

        <pre className="bg-slate-950 p-4 rounded-2xl text-xs font-mono text-cyan-400 overflow-x-auto border border-slate-800/80 leading-relaxed max-h-96">
          {firestoreSchemaJson}
        </pre>
      </div>

      <div className="bg-slate-900 rounded-3xl p-6 border-2 border-indigo-500/40 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase">Triển Khai Sản Phẩm</span>
              <h4 className="font-extrabold text-white text-base">
                3. Hướng Dẫn Triển Khai Lên Nền Tảng Vercel
              </h4>
            </div>
          </div>
          <span className="bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-xl text-xs border border-emerald-500/30">
            Vercel Ready 100%
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Code2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Dự án đã cấu hình sẵn vercel.json và Serverless Function tại /api/gemini/extract-quiz.ts.</span>
        </div>
      </div>
    </div>
  );
};
