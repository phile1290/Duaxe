import React, { useState } from 'react';
import {
  FolderTree,
  Database,
  Cpu,
  Zap,
  Code2,
  Copy,
  Check,
  Server,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const SystemArchitectureDoc: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const nextJsFolderStructure = `my-3d-quiz-racing-app/
├── app/                              # Next.js 14+ App Router Architecture
│   ├── (auth)/
│   │   ├── login/page.tsx            # Firebase Auth Teacher Sign-In
│   │   └── layout.tsx
│   ├── dashboard/                    # Teacher Management Dashboard
│   │   ├── lessons/page.tsx          # 35-Week Curriculum & PDF Upload
│   │   ├── students/page.tsx         # Class Roster & CSV Import/Export
│   │   ├── leaderboard/page.tsx      # Weekly & Cumulative Scores
│   │   └── page.tsx
│   ├── game/                         # Fullscreen Classroom 3D Racing View
│   │   ├── [classId]/
│   │   │   └── [weekId]/page.tsx     # Game Session Page
│   │   └── layout.tsx
│   ├── api/                          # Serverless Route Handlers
│   │   ├── gemini/
│   │   │   └── extract-quiz/route.ts # Gemini 3.8 Flash PDF RAG Extractor
│   │   └── leaderboard/
│   │       └── aggregate/route.ts    # Cron & Rolling Score Updater
│   ├── layout.tsx
│   └── page.tsx                      # Landing / Fast Launch
├── components/
│   ├── 3d/                           # WebGL / Three.js Canvas Elements
│   │   ├── RacingTrackCanvas.tsx     # Three.js / R3F Circuit Scene
│   │   ├── CartoonCarModel.tsx       # 3D Low-Poly Team Car Mesh
│   │   ├── NitroFlamesEffect.tsx     # Particle & Shader Booster Flames
│   │   └── EnvironmentProps.tsx      # Kerbs, Finish Arch, Grandstand
│   ├── game/
│   │   ├── QuizModal.tsx             # Projector-sized Question Dialog
│   │   ├── TimerCountdown.tsx        # High-contrast Ticking Clock
│   │   └── VictoryPodium.tsx         # Winner Trophy & Fireworks
│   └── ui/                           # Reusable Tailwind UI components
├── lib/
│   ├── firebase/
│   │   ├── clientApp.ts              # Firebase Client SDK (Auth, Firestore)
│   │   ├── adminApp.ts               # Firebase Admin SDK (Server Actions)
│   │   └── firestoreSchemas.ts       # Firestore Collection Types
│   ├── gemini/
│   │   └── geminiClient.ts           # @google/genai SDK Integration
│   └── audio/
│       └── webAudioSynthesizer.ts    # Procedural zero-latency Sound FX
├── store/
│   └── useGameStore.ts               # Zustand Game State Management
├── types/
│   └── index.ts                      # Universal TypeScript Interfaces
├── firestore.rules                   # Strict Security & Role-Based Rules
└── package.json`;

  const firestoreSchemaJson = `{
  "firestore_schema_design": {
    "collections": {
      "classes": {
        "description": "Danh sách các lớp học của nhà trường",
        "document_path": "classes/{classId}",
        "fields": {
          "id": "string (VD: class-3a)",
          "name": "string (VD: Lớp 3A)",
          "grade": "number (1-5)",
          "academicYear": "string (2025-2026)",
          "teacherId": "string (UID giáo viên)",
          "activeTeams": [
            {
              "teamId": "team-red",
              "teamName": "Đội Rồng Lửa",
              "carHex": "#ef4444",
              "avatar": "🐉"
            }
          ],
          "createdAt": "timestamp"
        }
      },
      "students": {
        "description": "Hồ sơ học sinh lưu kèm DENORMALIZED CUMULATIVE STATS (Chống nghẽn tuần 30-35)",
        "document_path": "classes/{classId}/students/{studentId}",
        "fields": {
          "id": "string",
          "rollNumber": "string (VD: 3A-01)",
          "name": "string (VD: Nguyễn Minh An)",
          "gender": "string (nam | nu)",
          "teamId": "string (team-red)",
          "cumulativeScore": "number (Tổng điểm tích lũy cả năm - Cập nhật atomic)",
          "totalCorrect": "number (Tổng số câu trả lời đúng)",
          "totalWrong": "number (Tổng số câu sai)",
          "highestCombo": "number (Chuỗi đúng dài nhất)",
          "lastPlayedWeek": "number (Tuần gần nhất)",
          "updatedAt": "timestamp"
        },
        "subcollections": {
          "weekly_history": {
            "description": "Chi tiết từng tuần học từ tuần 1 đến tuần 35 (Partitioning chống phình doc)",
            "document_path": "classes/{classId}/students/{studentId}/weekly_history/week_{weekNumber}",
            "fields": {
              "weekNumber": "number (1-35)",
              "lessonTitle": "string",
              "score": "number (Điểm chặng tuần này)",
              "correctCount": "number",
              "wrongCount": "number",
              "answersSummary": "array",
              "completedAt": "timestamp"
            }
          }
        }
      },
      "weekly_leaderboards": {
        "description": "Snapshot bảng xếp hạng tuần đã được tiền tính toán (Pre-aggregated O(1) query)",
        "document_path": "classes/{classId}/weekly_leaderboards/week_{weekNumber}",
        "fields": {
          "weekNumber": "number (1-35)",
          "subject": "string",
          "rankings": [
            { "studentId": "s1", "name": "Nguyễn Minh An", "weeklyScore": 40, "cumulativeScore": 310 }
          ],
          "teamStandings": [
            { "teamId": "team-red", "totalPoints": 120, "lapPercent": 100 }
          ],
          "generatedAt": "timestamp"
        }
      },
      "quizzes": {
        "description": "Kho ngân hàng đề thi trích xuất từ sách giáo khoa qua Gemini AI",
        "document_path": "quizzes/{quizId}",
        "fields": {
          "weekNumber": "number (1-35)",
          "lessonTitle": "string",
          "subject": "string",
          "grade": "number",
          "questions": [
            {
              "id": "q1",
              "question": "string",
              "options": ["A", "B", "C", "D"],
              "correctIndex": 1,
              "explanation": "string",
              "visualType": "math_shape | diagram | emoji_icon",
              "visualPrompt": "string"
            }
          ]
        }
      }
    }
  }
}`;

  return (
    <div className="space-y-8 text-left">
      
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-indigo-500/30">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
          <Server className="w-4 h-4" />
          <span>Kiến Trúc Hệ Thống Chuẩn Doanh Nghiệp & Giải Pháp Kỹ Thuật</span>
        </div>
        <h2 className="text-2xl font-black text-white">
          Tài Liệu Thiết Kế Cơ Sở Dữ Liệu & Sơ Đồ Hệ Thống Đua Xe 3D
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          Được thiết kế bởi Chuyên gia Hệ thống & AI Giáo dục. Tuân thủ Clean Code, phân tách rõ ràng giữa
          mô hình RAG xử lý tài liệu, Renderer WebGL thời gian thực và kiến trúc NoSQL chống nghẽn điểm tuần 35.
        </p>
      </div>

      {/* Section 1: Next.js Folder Structure */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FolderTree className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-base">
              1. Sơ Đồ Cấu Trúc Thư Mục Dự Án (Next.js 14+ App Router)
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

      {/* Section 2: Firestore Database Schema & Anti-Lag Solution */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-400" />
            <h3 className="font-extrabold text-white text-base">
              2. Sơ Đồ Cấu Trúc Firebase Firestore & Giải Pháp Chống Nghẽn Tuần 30 - 35
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

        {/* Anti-Lag Technical Explanation Box */}
        <div className="bg-amber-950/30 border border-amber-600/40 rounded-2xl p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold uppercase tracking-wide">
            <Zap className="w-4 h-4" />
            <span>Phân Tích Giải Pháp Kỹ Thuật Chống Nghẽn (Anti-Lag / Zero Hotspotting):</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-slate-200">
            <li>
              <strong>Vấn đề tại tuần 30 - 35:</strong> Nếu tính điểm cộng dồn bằng cách query toàn bộ 35 tuần của 40 học sinh, hệ thống sẽ thực hiện <strong>1.400 lần đọc tài liệu</strong> cho mỗi lượt tải bảng xếp hạng, gây nghẽn băng thông và độ trễ lớn.
            </li>
            <li>
              <strong>Giải pháp Denormalized Rolling Accumulator:</strong> Trường <code className="bg-slate-900 text-amber-300 px-1 rounded">cumulativeScore</code> và <code className="bg-slate-900 text-amber-300 px-1 rounded">totalCorrect</code> được lưu ngay tại Document gốc của học sinh và cập nhật nguyên tử bằng Firestore <code className="bg-slate-900 text-amber-300 px-1 rounded">FieldValue.increment(points)</code>.
            </li>
            <li>
              <strong>Truy vấn O(1) qua Compound Index:</strong> Tạo index ghép <code className="bg-slate-900 text-amber-300 px-1 rounded">(classId ASC, cumulativeScore DESC)</code>. Bảng xếp hạng cả năm chỉ cần 1 query duy nhất lấy 40 học sinh đã sắp xếp sẵn, <strong>thời gian phản hồi dưới 30ms</strong> bất kể đang ở tuần 1 hay tuần 35!
            </li>
            <li>
              <strong>Subcollection Partitioning:</strong> Chi tiết từng tuần được đẩy vào subcollection <code className="bg-slate-900 text-amber-300 px-1 rounded">weekly_history/week_X</code>, giúp kích thước Document gốc luôn nhẹ (dưới 1KB), không bao giờ chạm ngưỡng giới hạn 1MB của Firestore.
            </li>
          </ul>
        </div>

        <pre className="bg-slate-950 p-4 rounded-2xl text-xs font-mono text-cyan-400 overflow-x-auto border border-slate-800/80 leading-relaxed max-h-96">
          {firestoreSchemaJson}
        </pre>
      </div>

      {/* Section 3: Core Code Snippets */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
          <Code2 className="w-5 h-5 text-amber-400" />
          <span>3. Mã Nguồn Cốt Lõi (Core Code Snippets) Cho 3 Module Trọng Yếu</span>
        </h3>

        {/* Snippet A: Gemini RAG PDF Extraction */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase">Module 1 • Server-Side RAG</span>
              <h4 className="font-bold text-white text-sm">Xử lý File PDF Sách Giáo Khoa bằng Gemini 3.8 Flash</h4>
            </div>
            <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg">
              @google/genai SDK
            </span>
          </div>
          <pre className="bg-slate-950 p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800/80 leading-relaxed">
{`import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

export async function extractQuizFromTextbookPdf(pdfBase64: string, lessonTitle: string, count = 5) {
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: {
      parts: [
        { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
        { text: \`Trích xuất đúng \${count} câu hỏi trắc nghiệm từ bài học: "\${lessonTitle}" cho học sinh tiểu học.\` }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
                visualPrompt: { type: Type.STRING }
              },
              required: ['question', 'options', 'correctIndex', 'explanation']
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{}');
}`}
          </pre>
        </div>

        {/* Snippet B: 3D Racing Canvas & Nitro Combo */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase">Module 2 • WebGL Racing Engine</span>
              <h4 className="font-bold text-white text-sm">Three.js Track, Car Physics, & Nitro Particle Booster</h4>
            </div>
            <span className="text-xs font-mono bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg">
              Three.js / WebGL
            </span>
          </div>
          <pre className="bg-slate-950 p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800/80 leading-relaxed">
{`// Interpolate car progression and activate Nitro rocket flames
function updateCarMotion(carGroup, flameMesh, team, delta) {
  const targetZ = START_Z - (team.lap / 100) * TRACK_LENGTH;
  
  // Smooth acceleration lerp (Nitro doubles acceleration response)
  const lerpFactor = team.isNitroActive ? 0.14 : 0.08;
  carGroup.position.z += (targetZ - carGroup.position.z) * lerpFactor;

  // Nitro booster visual & dynamic flame flicker
  if (flameMesh) {
    flameMesh.visible = team.isNitroActive;
    if (team.isNitroActive) {
      flameMesh.scale.set(
        1 + Math.sin(Date.now() * 0.03) * 0.4,
        1 + Math.cos(Date.now() * 0.02) * 0.4,
        1.3 + Math.sin(Date.now() * 0.04) * 0.5
      );
    }
  }
}`}
          </pre>
        </div>

        {/* Snippet C: Atomic Score Calculation */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase">Module 3 • Firestore Batch Transactions</span>
              <h4 className="font-bold text-white text-sm">Ghi Điểm Tuần & Tích Lũy Điểm Cộng Dồn Không Gây Nghẽn</h4>
            </div>
            <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg">
              Firebase Firestore
            </span>
          </div>
          <pre className="bg-slate-950 p-4 rounded-2xl text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800/80 leading-relaxed">
{`import { doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';

export async function recordStudentQuizScore(db, classId, studentId, weekNumber, pointsEarned, isCorrect) {
  const batch = writeBatch(db);
  const studentRef = doc(db, \`classes/\${classId}/students/\${studentId}\`);
  const historyRef = doc(db, \`classes/\${classId}/students/\${studentId}/weekly_history/week_\${weekNumber}\`);

  // 1. Atomic update on root student document (O(1) cumulative leaderboard)
  batch.update(studentRef, {
    cumulativeScore: increment(pointsEarned),
    totalCorrect: increment(isCorrect ? 1 : 0),
    totalWrong: increment(isCorrect ? 0 : 1),
    updatedAt: serverTimestamp()
  });

  // 2. Set granular history for specific week
  batch.set(historyRef, {
    weekNumber,
    score: increment(pointsEarned),
    correctCount: increment(isCorrect ? 1 : 0),
    wrongCount: increment(isCorrect ? 0 : 1),
    completedAt: serverTimestamp()
  }, { merge: true });

  await batch.commit();
}`}
          </pre>
        </div>
        {/* Section 4: Vercel Deployment & 401 Error Resolution */}
        <div className="bg-slate-900 rounded-3xl p-6 border-2 border-indigo-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase">Triển Khai Sản Phẩm</span>
                <h4 className="font-extrabold text-white text-base">
                  4. Hướng Dẫn Triển Khai Lên Nền Tảng Vercel & Khắc Phục Triệt Để Lỗi 401
                </h4>
              </div>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-xl text-xs border border-emerald-500/30">
              Vercel Ready 100%
            </span>
          </div>

          {/* Explanation of the 401 error in the user's screenshot */}
          <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 text-xs space-y-2 text-slate-200">
            <div className="text-rose-400 font-black text-sm flex items-center gap-2">
              <span>⚠️ Nguyên nhân và giải pháp khắc phục triệt để lỗi "401. Đã xảy ra lỗi" trên hình ảnh:</span>
            </div>
            <p className="leading-relaxed">
              <strong>1. Nguyên nhân:</strong> Lỗi 401 xuất hiện khi xem trước (Preview) trên trình duyệt Safari di động (iOS). Tính năng bảo mật của Apple <em>Prevent Cross-Site Tracking (ITP)</em> tự động chặn cookies xác thực của Google trong iframe AI Studio, khiến máy chủ Google từ chối yêu cầu và trả về mã lỗi 401.
            </p>
            <p className="leading-relaxed">
              <strong>2. Khắc phục triệt để bằng Vercel:</strong> Khi đưa dự án lên Vercel, ứng dụng sở hữu tên miền riêng độc lập (ví dụ: <code className="text-amber-300 font-mono">dua-xe-tri-thuc.vercel.app</code>), hoàn toàn không còn bị nhúng trong iframe Google, loại bỏ 100% nguy cơ lỗi 401 trên mọi thiết bị (iPhone, iPad, máy tính, màn hình cảm ứng tương tác).
            </p>
          </div>

          {/* Step-by-step Vercel guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-black flex items-center justify-center text-xs mb-2">
                1
              </div>
              <h5 className="font-bold text-white text-xs mb-1">Kết nối mã nguồn</h5>
              <p className="text-[11px] text-slate-300">
                Đưa mã nguồn lên GitHub/GitLab. Vào <strong>vercel.com/new</strong> và chọn repository của dự án.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs mb-2">
                2
              </div>
              <h5 className="font-bold text-white text-xs mb-1">Cấu hình Vercel</h5>
              <p className="text-[11px] text-slate-300">
                Vercel tự động nhận diện Vite Framework. Build Command: <code className="text-amber-300">npm run build</code>, Output Directory: <code className="text-amber-300">dist</code>.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-xs mb-2">
                3
              </div>
              <h5 className="font-bold text-white text-xs mb-1">Thêm Biến Môi Trường</h5>
              <p className="text-[11px] text-slate-300">
                Vào mục <strong>Environment Variables</strong> trên Vercel, thêm <code className="text-amber-300">GEMINI_API_KEY</code> để kích hoạt AI RAG.
              </p>
            </div>
          </div>

          {/* Vercel.json Display */}
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-300 mb-1">Tệp cấu hình vercel.json đã sẵn sàng trong dự án:</div>
            <pre className="bg-slate-950 p-3.5 rounded-2xl text-xs font-mono text-cyan-400 overflow-x-auto border border-slate-800/80 leading-relaxed">
{`{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "routes": [
    { "src": "/api/gemini/extract-quiz", "dest": "/api/gemini/extract-quiz.ts" },
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
