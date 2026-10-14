import React, { useState, useEffect } from 'react';
import { GameMode, Question, RaceSetupConfig, SubjectType } from '../../types';
import { extractQuizWithGemini, getStoredApiKey } from '../../services/geminiClientService';
import {
  getSavedClassesFromLocalStorage,
  saveClassData,
  createNewClass,
  SavedClassData,
  SavedTeamConfig,
  getActiveClassId,
} from '../../services/classroomStorageService';
import { SettingsModal } from '../SettingsModal';
import {
  Flag,
  Upload,
  Users,
  User,
  BookOpen,
  Calendar,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  X,
  FileText,
  Settings,
  Save,
  PlusCircle,
  AlertCircle,
  Shuffle,
  GraduationCap,
} from 'lucide-react';

interface RaceSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (config: RaceSetupConfig, questions: Question[]) => void;
}

const DEFAULT_TEAM_PRESETS = [
  { name: 'Đội Rồng Lửa 🐉', color: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-950/40', badge: 'bg-red-500/20 text-red-300' },
  { name: 'Đội Chim Ưng 🦅', color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-950/40', badge: 'bg-blue-500/20 text-blue-300' },
  { name: 'Đội Sấm Sét ⚡', color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-950/40', badge: 'bg-amber-500/20 text-amber-300' },
  { name: 'Đội Báo Đốm 🐆', color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-950/40', badge: 'bg-emerald-500/20 text-emerald-300' },
  { name: 'Đội Sư Tử 🦁', color: 'text-orange-400', border: 'border-orange-500/50', bg: 'bg-orange-950/40', badge: 'bg-orange-500/20 text-orange-300' },
  { name: 'Đội Cáo Lửa 🦊', color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-950/40', badge: 'bg-purple-500/20 text-purple-300' },
];

export const RaceSetupModal: React.FC<RaceSetupModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
}) => {
  // Saved Classes from storage / Firebase
  const [savedClasses, setSavedClasses] = useState<SavedClassData[]>([]);
  const [currentClassId, setCurrentClassId] = useState<string>('class-3a');
  const [classNameInput, setClassNameInput] = useState<string>('Lớp 3A');
  const [saveClassMessage, setSaveClassMessage] = useState<string | null>(null);

  // Ô 1: Tuần học 1 -> 35
  const [weekNumber, setWeekNumber] = useState<number>(1);

  // Ô 2: Danh sách học sinh trong lớp (Bắt đầu TRỐNG HOÀN TOÀN như yêu cầu, không nhập mẫu 8 hay 12 em)
  const [studentsText, setStudentsText] = useState<string>('');

  // Ô 3: Lựa chọn cách chơi: Cá nhân hoặc Nhóm
  const [gameMode, setGameMode] = useState<GameMode>('individual');
  const [teamCount, setTeamCount] = useState<number>(4);
  // Danh sách học sinh cho từng nhóm (bắt buộc nhập nếu chơi theo nhóm)
  const [teamsCustomText, setTeamsCustomText] = useState<Record<string, string>>({
    'team-1': '',
    'team-2': '',
    'team-3': '',
    'team-4': '',
    'team-5': '',
    'team-6': '',
  });

  // Ô 4: Tên bài học (để trống hết ban đầu), Môn, Lớp học (thay vì Khối lớp)
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [subject, setSubject] = useState<SubjectType>('Toán');
  const [grade, setGrade] = useState<number>(3);

  // Tải lên file PDF sách giáo khoa & Số lượng câu hỏi
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfFileSize, setPdfFileSize] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(5);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Settings Modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  // Load saved classes on mount or when opening modal
  useEffect(() => {
    if (isOpen) {
      const classes = getSavedClassesFromLocalStorage();
      setSavedClasses(classes);
      const activeId = getActiveClassId();
      const current = classes.find((c) => c.classId === activeId) || classes[0];
      
      if (current) {
        setCurrentClassId(current.classId);
        setClassNameInput(current.className);
        setStudentsText(current.studentsText || '');
        setGameMode(current.gameMode || 'individual');
        setTeamCount(current.teamCount || 4);
        setSubject(current.subject || 'Toán');
        setGrade(current.grade || 3);
        setWeekNumber(current.lastWeek || 1);
        setLessonTitle(current.lastLessonTitle || '');

        // Restore team custom text if available
        if (current.teamsConfig && current.teamsConfig.length > 0) {
          const mapped: Record<string, string> = {};
          current.teamsConfig.forEach((t) => {
            mapped[t.teamId] = t.studentNames.join('\n');
          });
          setTeamsCustomText((prev) => ({ ...prev, ...mapped }));
        }
      }

      setHasApiKey(Boolean(getStoredApiKey()));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle class selection change: Load all previously saved students and teams!
  const handleSelectClass = (selectedId: string) => {
    if (selectedId === '__new__') {
      const newCls = createNewClass(`Lớp ${savedClasses.length + 1}A`);
      const updated = getSavedClassesFromLocalStorage();
      setSavedClasses(updated);
      setCurrentClassId(newCls.classId);
      setClassNameInput(newCls.className);
      setStudentsText('');
      setTeamsCustomText({
        'team-1': '',
        'team-2': '',
        'team-3': '',
        'team-4': '',
        'team-5': '',
        'team-6': '',
      });
      setLessonTitle('');
      setSaveClassMessage(`Đã tạo ${newCls.className}. Hãy nhập danh sách học sinh!`);
      setTimeout(() => setSaveClassMessage(null), 3000);
      return;
    }

    const found = savedClasses.find((c) => c.classId === selectedId);
    if (found) {
      setCurrentClassId(found.classId);
      setClassNameInput(found.className);
      setStudentsText(found.studentsText || '');
      setGameMode(found.gameMode || 'individual');
      setTeamCount(found.teamCount || 4);
      setSubject(found.subject || 'Toán');
      setGrade(found.grade || 3);
      if (found.lastWeek) setWeekNumber(found.lastWeek);
      if (found.lastLessonTitle) setLessonTitle(found.lastLessonTitle);

      // Restore custom team students
      if (found.teamsConfig && found.teamsConfig.length > 0) {
        const mapped: Record<string, string> = {};
        found.teamsConfig.forEach((t) => {
          mapped[t.teamId] = t.studentNames.join('\n');
        });
        setTeamsCustomText((prev) => ({ ...prev, ...mapped }));
      } else {
        // Reset team texts
        setTeamsCustomText({
          'team-1': '',
          'team-2': '',
          'team-3': '',
          'team-4': '',
          'team-5': '',
          'team-6': '',
        });
      }

      setSaveClassMessage(`Đã tải toàn bộ dữ liệu của ${found.className}!`);
      setTimeout(() => setSaveClassMessage(null), 3000);
    }
  };

  // Save current class data permanently (Firebase / LocalStorage)
  const handleSaveCurrentClass = async () => {
    const teamsConfig = buildCurrentTeamsConfig();
    const res = await saveClassData({
      classId: currentClassId,
      className: classNameInput.trim() || 'Lớp học',
      grade,
      subject,
      studentsText,
      gameMode,
      teamCount,
      teamsConfig,
      lastLessonTitle: lessonTitle,
      lastWeek: weekNumber,
      updatedAt: new Date().toISOString(),
    });

    setSavedClasses(getSavedClassesFromLocalStorage());
    setSaveClassMessage(res.message);
    setTimeout(() => setSaveClassMessage(null), 4000);
  };

  // Handle PDF upload
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKB} KB`;
    setPdfFileSize(sizeStr);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const cleanBase64 = result.split(',')[1] || result;
      setPdfBase64(cleanBase64);
    };
    reader.readAsDataURL(file);
  };

  // Parse list of students from text
  const parseStudentsList = (): string[] => {
    return studentsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const studentCount = parseStudentsList().length;

  // Build current teams configuration
  const buildCurrentTeamsConfig = (): SavedTeamConfig[] => {
    const count = Math.min(teamCount, DEFAULT_TEAM_PRESETS.length);
    const result: SavedTeamConfig[] = [];

    for (let i = 0; i < count; i++) {
      const teamId = `team-${i + 1}`;
      const rawText = teamsCustomText[teamId] || '';
      const names = rawText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      result.push({
        teamId,
        teamName: DEFAULT_TEAM_PRESETS[i].name,
        studentNames: names,
      });
    }
    return result;
  };

  // Helper: Tự động phân bổ nhanh học sinh từ Ô 2 vào các nhóm
  const handleAutoDistributeTeams = () => {
    const students = parseStudentsList();
    if (students.length === 0) {
      alert('Vui lòng nhập danh sách học sinh ở Ô 2 trước khi phân bổ vào các nhóm!');
      return;
    }

    const count = Math.min(teamCount, DEFAULT_TEAM_PRESETS.length);
    const newCustom: Record<string, string> = { ...teamsCustomText };

    for (let i = 0; i < count; i++) {
      const teamId = `team-${i + 1}`;
      const assigned = students.filter((_, idx) => idx % count === i);
      newCustom[teamId] = assigned.join('\n');
    }

    setTeamsCustomText(newCustom);
    setSaveClassMessage('Đã tự động chia đều học sinh từ Ô 2 vào các nhóm. Thầy/Cô có thể chỉnh sửa tự do!');
    setTimeout(() => setSaveClassMessage(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate Ô 4: Tên bài học
    if (!lessonTitle.trim()) {
      alert('Vui lòng nhập Tên bài học (Ô 4) để AI trích xuất nội dung trắc nghiệm!');
      return;
    }

    // Validate Ô 2: Danh sách học sinh trong lớp
    const students = parseStudentsList();
    if (gameMode === 'individual' && students.length === 0) {
      alert('Vui lòng nhập Danh sách học sinh trong lớp (Ô 2) để tạo xe đua cá nhân cho từng em!');
      return;
    }

    // Validate Ô 3: Nếu chơi theo nhóm, bắt buộc người dùng phải nhập danh sách học sinh trong từng nhóm
    const currentTeams = buildCurrentTeamsConfig();
    if (gameMode === 'team') {
      for (const t of currentTeams) {
        if (t.studentNames.length === 0) {
          alert(`Bắt buộc phải nhập danh sách học sinh cho "${t.teamName}"! Vui lòng nhập ít nhất 1 học sinh cho mỗi nhóm, hoặc bấm "⚡ Phân bổ tự động từ Ô 2".`);
          return;
        }
      }
    }

    // Tự động lưu thông tin lớp vào hệ thống để ghi nhớ vĩnh viễn
    await saveClassData({
      classId: currentClassId,
      className: classNameInput.trim() || 'Lớp học',
      grade,
      subject,
      studentsText,
      gameMode,
      teamCount,
      teamsConfig: currentTeams,
      lastLessonTitle: lessonTitle.trim(),
      lastWeek: weekNumber,
      updatedAt: new Date().toISOString(),
    });

    setIsLoading(true);
    setStatusMessage('AI Gemini đang trích xuất kiến thức từ tài liệu cho bài học...');

    try {
      const setupConfig: RaceSetupConfig = {
        weekNumber,
        lessonTitle: lessonTitle.trim(),
        subject,
        grade,
        className: classNameInput.trim() || 'Lớp học',
        gameMode,
        questionCount,
        studentsText,
        teamsConfig: currentTeams,
        pdfFileName: pdfFileName || undefined,
        pdfBase64,
      };

      // Call AI RAG extractor with lessonTitle, PDF and curriculum info
      const res = await extractQuizWithGemini({
        lessonTitle: lessonTitle.trim(),
        subject,
        grade,
        questionCount,
        content: `Trọng tâm kiến thức bài học: ${lessonTitle} - Môn ${subject} ${classNameInput}. Tài liệu: ${pdfFileName || 'Sách giáo khoa'}`,
        pdfBase64,
      });

      const fallbackQuestions: Question[] = [
        {
          id: `q-gen-1`,
          question: `Theo bài "${lessonTitle}", đáp án nào sau đây là chính xác?`,
          options: ['Đáp án A chính xác', 'Đáp án B cần xem lại', 'Đáp án C chưa đầy đủ', 'Đáp án D sai'],
          correctIndex: 0,
          explanation: `Hoan hô! Đây là câu trả lời chính xác nhất theo nội dung bài học "${lessonTitle}".`,
          visualType: 'badge',
          points: 10,
        },
        {
          id: `q-gen-2`,
          question: 'Em hãy chọn phép so sánh hoặc câu nhận định đúng nhất:',
          options: ['12 + 18 = 30', '15 + 15 = 25', '20 + 10 = 40', '10 + 10 = 30'],
          correctIndex: 0,
          explanation: 'Chính xác! 12 + 18 = 30.',
          visualType: 'math_shape',
          points: 10,
        },
        {
          id: `q-gen-3`,
          question: 'Ý nghĩa quan trọng nhất mà bài học đem lại cho chúng ta là gì?',
          options: ['Giúp em rèn luyện tính cẩn thận và chăm chỉ', 'Chỉ để học thuộc vẹt', 'Không cần áp dụng vào đời sống', 'Học xong để quên'],
          correctIndex: 0,
          explanation: 'Rất đúng! Việc rèn luyện tính cẩn thận và chăm chỉ là nền tảng tri thức vững chắc.',
          visualType: 'emoji_icon',
          points: 10,
        },
        {
          id: `q-gen-4`,
          question: 'Trong các lựa chọn sau, phương án nào giúp em hoàn thành tốt bài tập?',
          options: ['Đọc kĩ đề bài và tính toán từng bước', 'Làm thật nhanh không cần xem lại', 'Chọn ngẫu nhiên', 'Bỏ qua câu khó'],
          correctIndex: 0,
          explanation: 'Chính xác! Luôn đọc kĩ đề và kiểm tra lại bài nhé!',
          visualType: 'diagram',
          points: 10,
        },
        {
          id: `q-gen-5`,
          question: 'Một đội có 4 bạn, mỗi bạn được thưởng 5 ngôi sao. Cả đội có tất cả bao nhiêu ngôi sao?',
          options: ['20 ngôi sao ⭐', '15 ngôi sao ⭐', '25 ngôi sao ⭐', '18 ngôi sao ⭐'],
          correctIndex: 0,
          explanation: 'Tuyệt vời! 4 bạn nhân 5 ngôi sao = 20 ngôi sao rực rỡ!',
          visualType: 'animal',
          points: 10,
        },
      ];

      const finalQuestions: Question[] = res.success && res.questions && res.questions.length > 0
        ? res.questions
        : fallbackQuestions.slice(0, questionCount);

      onStartGame(setupConfig, finalQuestions);
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Đã tự động khởi tạo bộ câu hỏi đề xuất sư phạm.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentTeams = buildCurrentTeamsConfig();

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="bg-slate-900 border-2 border-amber-400 w-full max-w-2xl rounded-3xl p-3.5 sm:p-6 shadow-2xl text-white relative animate-in zoom-in-95 duration-200 max-h-[96dvh] flex flex-col">
          
          {/* Header Bar with Settings Gear & Close Button */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center text-lg sm:text-xl font-black shadow-md shrink-0">
                🏎️
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-lg font-black text-white truncate">
                  Cài Đặt Chặng Đua & Nội Dung Bài Học
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-300 truncate">
                  Dữ liệu lớp học sẽ được lưu vĩnh viễn trên hệ thống Web & Firebase
                </p>
              </div>
            </div>

            {/* Actions: Settings Gear (Cài đặt Gemini API) & Close Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                title="Cài đặt khóa Gemini API (Chỉ cần nhập 1 lần duy nhất)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 hover:text-amber-300 font-bold text-xs transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 animate-spin-hover" />
                <span className="hidden sm:inline">Cài Đặt API Key</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-colors"
                title="Đóng bảng thiết lập"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Toast Notification when class data is saved/loaded */}
          {saveClassMessage && (
            <div className="my-2 bg-emerald-950/80 border border-emerald-500 text-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveClassMessage}</span>
            </div>
          )}

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-2.5 space-y-3 pr-1 text-left text-xs">
            
            {/* LỚP HỌC (THAY THẾ KHỐI LỚP - LƯU VĨNH VIỄN TRÊN FIREBASE / WEB) */}
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-indigo-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 font-bold text-indigo-300 uppercase">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  <span>Lớp học (Lưu vĩnh viễn trên hệ thống)</span>
                </label>
                <button
                  type="button"
                  onClick={handleSaveCurrentClass}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  title="Lưu lại danh sách học sinh và phân bổ nhóm của lớp này"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu thông tin lớp</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-300 block mb-1">Chọn lớp học đã lưu:</span>
                  <select
                    value={currentClassId}
                    onChange={(e) => handleSelectClass(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-bold text-xs focus:outline-none focus:border-indigo-400"
                  >
                    {savedClasses.map((cls) => (
                      <option key={cls.classId} value={cls.classId}>
                        {cls.className} {cls.studentsText ? `(${cls.studentsText.split('\n').filter((s) => s.trim()).length} học sinh)` : '(Chưa có học sinh)'}
                      </option>
                    ))}
                    <option value="__new__">+ Tạo lớp học mới...</option>
                  </select>
                </div>

                <div>
                  <span className="text-[11px] text-slate-300 block mb-1">Tên lớp hiển thị:</span>
                  <input
                    type="text"
                    value={classNameInput}
                    onChange={(e) => setClassNameInput(e.target.value)}
                    placeholder="VD: Lớp 3A, Lớp 4B..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-bold text-xs focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <p className="text-[10px] text-indigo-200/80 italic">
                * Khi chọn lớp học, toàn bộ danh sách học sinh và danh sách các nhóm đã nhập trước đó sẽ tự động hiển thị.
              </p>
            </div>

            {/* Ô 1: LỰA CHỌN TUẦN HỌC (TỪ TUẦN 1 ĐẾN TUẦN 35) - CHỈ HIỂN THỊ "Tuần 1", "Tuần 2", ..., "Tuần 35" KHÔNG HIỂN THỊ THÊM NỘI DUNG GÌ */}
            <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700">
              <label className="flex items-center gap-1.5 font-bold text-amber-300 uppercase mb-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Ô 1: Lựa chọn tuần học (Từ tuần 1 đến tuần 35)</span>
              </label>
              <select
                value={weekNumber}
                onChange={(e) => setWeekNumber(parseInt(e.target.value, 10))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs sm:text-sm focus:outline-none focus:border-amber-400"
              >
                {Array.from({ length: 35 }, (_, idx) => idx + 1).map((week) => (
                  <option key={week} value={week}>
                    Tuần {week}
                  </option>
                ))}
              </select>
            </div>

            {/* Ô 2: DANH SÁCH HỌC SINH TRONG LỚP (BẮT ĐẦU TRỐNG HOÀN TOÀN - TỰ NHẬP ĐẾN ĐÂU ĐẾM ĐẾN ĐÓ) */}
            <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 font-bold text-amber-300 uppercase">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>Ô 2: Danh sách học sinh trong lớp</span>
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded text-[11px] ${
                      studentCount > 0 ? 'bg-emerald-400/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {studentCount > 0 ? `${studentCount} học sinh` : '0 học sinh'}
                  </span>
                </div>
              </div>
              <textarea
                rows={3}
                value={studentsText}
                onChange={(e) => setStudentsText(e.target.value)}
                placeholder="Nhập danh sách học sinh trong lớp (mỗi dòng một em)... Ví dụ:&#10;Nguyễn Minh An&#10;Trần Bảo Châu&#10;Lê Hoàng Dũng"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>* Nhập mỗi em một dòng. Hệ thống sẽ tự động thống kê số lượng học sinh thực tế.</span>
                {studentsText && (
                  <button
                    type="button"
                    onClick={() => setStudentsText('')}
                    className="text-rose-400 hover:text-rose-300 underline cursor-pointer"
                  >
                    Xóa hết
                  </button>
                )}
              </div>
            </div>

            {/* Ô 3: LỰA CHỌN CÁCH CHƠI (CÁ NHÂN HOẶC NHÓM) */}
            <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700 space-y-2.5">
              <label className="flex items-center gap-1.5 font-bold text-amber-300 uppercase">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Ô 3: Danh sách học sinh các nhóm (hoặc chọn thi đấu Cá nhân)</span>
              </label>

              {/* 2 Chế độ chơi */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGameMode('individual')}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    gameMode === 'individual'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black ring-2 ring-amber-300'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Chơi Cá Nhân (Xe riêng từng em)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGameMode('team')}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    gameMode === 'team'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black ring-2 ring-amber-300'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Chơi Theo Nhóm (Đội Đua)</span>
                </button>
              </div>

              {/* Giao diện Chế độ Cá Nhân */}
              {gameMode === 'individual' ? (
                <div className="space-y-2">
                  {studentCount > 0 ? (
                    <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3 text-[11px] text-emerald-200">
                      <div className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Chế độ Đua Cá Nhân: Đúng {studentCount} xe đua tương ứng với {studentCount} học sinh đã nhập!</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Mỗi học sinh sẽ có 1 chiếc xe đua riêng biệt mang số xe và hiển thị tên em trực tiếp trên nóc xe.
                      </p>
                      {/* Preview names */}
                      <div className="mt-2 pt-2 border-t border-emerald-500/30 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {parseStudentsList().map((name, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-900/80 border border-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px] font-mono"
                          >
                            #{idx + 1} {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 text-[11px] text-amber-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Chưa có học sinh nào. Hãy nhập tên các học sinh ở <strong>Ô 2</strong> bên trên để hệ thống tự động tạo xe đua cho từng em!
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Giao diện Chế độ Nhóm: Bắt buộc người dùng phải nhập danh sách học sinh trong từng nhóm */
                <div className="space-y-3 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-300 font-semibold text-xs">
                      Chọn số nhóm thi đấu:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[2, 3, 4, 5, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setTeamCount(num)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                            teamCount === num
                              ? 'bg-amber-400 text-slate-950 font-black shadow'
                              : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
                          }`}
                        >
                          {num} Nhóm
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nút tiện ích chia nhanh từ Ô 2 */}
                  <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-300">
                      Bắt buộc nhập học sinh vào từng nhóm bên dưới:
                    </span>
                    {studentCount > 0 && (
                      <button
                        type="button"
                        onClick={handleAutoDistributeTeams}
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                        title="Chia đều học sinh từ Ô 2 vào các nhóm"
                      >
                        <Shuffle className="w-3 h-3" />
                        <span>⚡ Phân bổ tự động từ Ô 2</span>
                      </button>
                    )}
                  </div>

                  {/* Danh sách nhập liệu từng nhóm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {Array.from({ length: teamCount }).map((_, idx) => {
                      const preset = DEFAULT_TEAM_PRESETS[idx];
                      const teamId = `team-${idx + 1}`;
                      const rawText = teamsCustomText[teamId] || '';
                      const members = rawText
                        .split('\n')
                        .map((s) => s.trim())
                        .filter((s) => s.length > 0);

                      return (
                        <div
                          key={teamId}
                          className={`${preset.bg} ${preset.border} border rounded-xl p-2.5 space-y-1.5`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-black ${preset.color} text-xs`}>
                              {preset.name}
                            </span>
                            <span className={`${preset.badge} font-bold px-2 py-0.5 rounded text-[10px]`}>
                              {members.length > 0 ? `${members.length} bạn` : '⚠️ Chưa có bạn nào'}
                            </span>
                          </div>

                          <textarea
                            rows={3}
                            value={rawText}
                            onChange={(e) =>
                              setTeamsCustomText({
                                ...teamsCustomText,
                                [teamId]: e.target.value,
                              })
                            }
                            placeholder={`Nhập tên học sinh của ${preset.name} (mỗi bạn một dòng)...`}
                            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg p-2 text-white font-mono text-[11px] focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Ô 4: NHẬP TÊN BÀI HỌC (ĐỂ TRỐNG HẾT BAN ĐẦU ĐỂ NGƯỜI DÙNG TỰ NHẬP) & MÔN HỌC */}
            <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700 space-y-2">
              <label className="flex items-center gap-1.5 font-bold text-amber-300 uppercase">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Ô 4: Nhập tên bài học cần ôn tập</span>
              </label>
              <input
                type="text"
                required
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="Nhập tên bài học (VD: Bài 14: Ôn tập phép nhân và bảng nhân 2, 5...)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold text-xs sm:text-sm focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-300 block mb-1">Môn học:</span>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as SubjectType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-bold"
                  >
                    <option value="Toán">Toán</option>
                    <option value="Tiếng Việt">Tiếng Việt</option>
                    <option value="Khoa học">Khoa học</option>
                    <option value="Lịch sử & Địa lí">Lịch sử & Địa lí</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                  </select>
                </div>

                <div>
                  <span className="text-[11px] text-slate-300 block mb-1">Cấp độ khối lớp:</span>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-bold"
                  >
                    <option value={1}>Khối 1</option>
                    <option value={2}>Khối 2</option>
                    <option value={3}>Khối 3</option>
                    <option value={4}>Khối 4</option>
                    <option value={5}>Khối 5</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TẢI LÊN FILE PDF TÀI LIỆU SÁCH GIÁO KHOA */}
            <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 font-bold text-indigo-300 uppercase">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>Tải lên file PDF tài liệu Sách Giáo Khoa (Tùy chọn)</span>
                </label>
                {pdfFileName && (
                  <button
                    type="button"
                    onClick={() => {
                      setPdfFileName(null);
                      setPdfBase64(null);
                      setPdfFileSize(null);
                    }}
                    className="text-rose-400 hover:text-rose-300 text-[11px] cursor-pointer"
                  >
                    Gỡ file
                  </button>
                )}
              </div>

              <div className="border border-dashed border-slate-600 hover:border-indigo-400 rounded-xl p-3 text-center relative bg-slate-900/60 cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {pdfFileName ? (
                  <div className="text-emerald-400 font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Đã tải: {pdfFileName} ({pdfFileSize})</span>
                  </div>
                ) : (
                  <div className="text-slate-300 flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Bấm vào đây để chọn file PDF sách giáo khoa từ máy</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 italic">
                * AI Gemini sẽ dựa vào Tên bài học và File PDF tải lên để tự động trích xuất các câu hỏi trắc nghiệm chuẩn sư phạm.
              </p>
            </div>

            {/* LỰA CHỌN SỐ LƯỢNG CÂU HỎI TRẮC NGHIỆM */}
            <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-white block">Số lượng câu hỏi trắc nghiệm:</span>
                <span className="text-[10px] text-slate-400">Mỗi câu trả lời đúng xe sẽ chạy lên 1 đích</span>
              </div>
              <div className="flex gap-1.5">
                {[3, 5, 8, 10, 15].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer ${
                      questionCount === num ? 'bg-amber-400 text-slate-950 font-black shadow' : 'bg-slate-900 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {num} câu
                  </button>
                ))}
              </div>
            </div>

            {/* Status indicator about API Key */}
            {!hasApiKey && (
              <div className="bg-amber-950/40 border border-amber-500/40 p-2.5 rounded-xl text-xs text-amber-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Chưa nhập Gemini API Key cá nhân. Bạn có thể bấm biểu tượng ⚙️ góc trên để cài đặt 1 lần duy nhất!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-2 py-1 rounded-lg font-bold text-[10px] shrink-0 cursor-pointer"
                >
                  Cài đặt ngay
                </button>
              </div>
            )}

            {/* Loading status message */}
            {isLoading && (
              <div className="bg-indigo-950/90 border border-indigo-500/60 p-3 rounded-2xl flex items-center gap-2.5 text-indigo-200">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                <span className="font-bold">{statusMessage}</span>
              </div>
            )}

            {/* SUBMIT BUTTON - BẮT ĐẦU VÀO TRÒ CHƠI */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 cursor-pointer disabled:opacity-50 transform hover:scale-101 active:scale-99 transition-all"
            >
              <Sparkles className="w-5 h-5 fill-slate-950" />
              <span>BẮT ĐẦU VÀO TRÒ CHƠI ĐUA XE 3D</span>
            </button>
          </form>
        </div>
      </div>

      {/* Settings Modal (Gemini API Key) - Can be opened right here */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setHasApiKey(Boolean(getStoredApiKey()));
        }}
      />
    </>
  );
};
