import React, { useState, useEffect } from 'react';
import { GameMode, Question, RaceSetupConfig } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { extractQuizWithGemini, getStoredApiKey, normalizeQuestionVisuals } from '../../services/geminiClientService';
import {
  ALLOWED_SUBJECTS,
  getSavedClassesFromLocalStorage,
  saveClassData,
  deleteClassData,
  SavedClassData,
  SavedTeamConfig,
  getSavedGradeGroupsFromLocalStorage,
  saveGradeGroupData,
  deleteGradeGroupData,
  findGradeGroupForClass,
  SavedGradeGroup,
  getActiveClassId,
  setActiveClassId,
  findSavedQuizForLesson,
  saveQuizForLessonAndClass,
  deleteSavedQuizForLesson,
  SavedLessonQuiz,
  extractGradeFromClass,
  getUniqueSavedQuizzesForGrade,
  normalizeSubjectKey,
} from '../../services/classroomStorageService';
import { SettingsModal } from '../SettingsModal';
import {
  QuestionVisualIllustration,
  OptionVisualIllustration,
  getUniformOptionVisuals,
  resolveVisualDisplayMode,
} from './QuestionVisualIllustration';
import {
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
  AlertCircle,
  Shuffle,
  GraduationCap,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Layers,
} from 'lucide-react';

interface RaceSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (config: RaceSetupConfig, questions: Question[]) => void;
}

const DEFAULT_TEAM_PRESETS = [
  { name: 'Đội Sư Tử 🦁', color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-950/40', badge: 'bg-amber-500/20 text-amber-300' },
  { name: 'Đội Hổ Vằn 🐯', color: 'text-orange-400', border: 'border-orange-500/50', bg: 'bg-orange-950/40', badge: 'bg-orange-500/20 text-orange-300' },
  { name: 'Đội Báo Đốm 🐆', color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-950/40', badge: 'bg-emerald-500/20 text-emerald-300' },
  { name: 'Đội Gấu Rừng 🐻', color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-950/40', badge: 'bg-blue-500/20 text-blue-300' },
  { name: 'Đội Sói Xám 🐺', color: 'text-cyan-400', border: 'border-cyan-500/50', bg: 'bg-cyan-950/40', badge: 'bg-cyan-500/20 text-cyan-300' },
  { name: 'Đội Khỉ Vàng 🐒', color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-950/40', badge: 'bg-purple-500/20 text-purple-300' },
];

const ensureAllowedSubject = (subj?: string): string => {
  if (!subj) return ALLOWED_SUBJECTS[0];
  const norm = normalizeSubjectKey(subj);
  if (norm === 'tin_hoc') return 'Tin học';
  if (norm === 'cong_nghe') return 'Công nghệ';
  if (norm === 'ky_nang_so') return 'Kỹ năng số';
  if (norm === 'tri_tue_nhan_tao') return 'Trí tuệ nhân tạo';
  return ALLOWED_SUBJECTS[0];
};

export const RaceSetupModal: React.FC<RaceSetupModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
}) => {
  // Saved Grade Groups (Khối lớp)
  const [savedGradeGroups, setSavedGradeGroups] = useState<SavedGradeGroup[]>([]);
  const [currentGradeGroupId, setCurrentGradeGroupId] = useState<string>('');
  const [gradeNameInput, setGradeNameInput] = useState<string>('');
  const [gradeMemberClassIds, setGradeMemberClassIds] = useState<string[]>([]);

  // Saved Classes from storage (NO mock classes, clean slate!)
  const [savedClasses, setSavedClasses] = useState<SavedClassData[]>([]);
  const [currentClassId, setCurrentClassId] = useState<string>('');
  const [classNameInput, setClassNameInput] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Ô 1: Tuần học 1 -> 35
  const [weekNumber, setWeekNumber] = useState<number>(1);

  // Ô 2: Danh sách học sinh trong lớp (Bắt đầu TRỐNG HOÀN TOÀN)
  const [studentsText, setStudentsText] = useState<string>('');

  // Ô 3: Lựa chọn cách chơi: Cá nhân hoặc Nhóm
  const [gameMode, setGameMode] = useState<GameMode>('individual');
  const [teamCount, setTeamCount] = useState<number>(4);
  const [teamsCustomText, setTeamsCustomText] = useState<Record<string, string>>({
    'team-1': '',
    'team-2': '',
    'team-3': '',
    'team-4': '',
    'team-5': '',
    'team-6': '',
  });

  // Ô 4: Tên bài học & Môn học (Menu xổ xuống 4 lựa chọn: Tin học, Công nghệ, Kỹ năng số, Trí tuệ nhân tạo)
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [subject, setSubject] = useState<string>(ALLOWED_SUBJECTS[0]);

  // Tải lên file PDF sách giáo khoa & Số lượng câu hỏi
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfFileSize, setPdfFileSize] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Saved Quiz detection & Grade-level Shared Quiz pool (strictly scoped by Khối lớp + Môn học)
  const [detectedSavedQuiz, setDetectedSavedQuiz] = useState<SavedLessonQuiz | null>(null);
  const [gradeSavedQuizzes, setGradeSavedQuizzes] = useState<SavedLessonQuiz[]>([]);
  const [useSavedQuiz, setUseSavedQuiz] = useState<boolean>(true);
  const [showSavedPreview, setShowSavedPreview] = useState<boolean>(false);

  // Preview before launching game
  const [previewQuestions, setPreviewQuestions] = useState<Question[] | null>(null);
  const [pendingConfig, setPendingConfig] = useState<RaceSetupConfig | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [apiErrorBanner, setApiErrorBanner] = useState<{
    isQuotaError: boolean;
    message: string;
  } | null>(null);

  // Settings Modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load saved grade groups & saved classes on mount or when opening modal
  useEffect(() => {
    if (isOpen) {
      const classes = getSavedClassesFromLocalStorage();
      const gradeGroups = getSavedGradeGroupsFromLocalStorage();
      setSavedClasses(classes);
      setSavedGradeGroups(gradeGroups);

      const activeId = getActiveClassId();
      const current = classes.find((c) => c.classId === activeId) || classes[0];

      if (current) {
        setCurrentClassId(current.classId);
        setClassNameInput(current.className || '');
        setStudentsText(current.studentsText || '');
        setGameMode(current.gameMode || 'individual');
        setTeamCount(current.teamCount || 4);

        const matchedGrp = findGradeGroupForClass(
          current.classId,
          current.className,
          current.gradeGroupId
        );
        const resolvedGrpId = matchedGrp?.gradeId || '';
        setCurrentGradeGroupId(resolvedGrpId);
        setGradeNameInput(matchedGrp?.gradeName || '');
        setGradeMemberClassIds(matchedGrp?.classIds || []);

        const initialSubject = ensureAllowedSubject(current.subject);
        setSubject(initialSubject);

        const sharedQuizzes = getUniqueSavedQuizzesForGrade(
          current.classId,
          current.className,
          initialSubject,
          resolvedGrpId
        );
        setGradeSavedQuizzes(sharedQuizzes);

        const targetWeek = current.lastWeek || sharedQuizzes[0]?.weekNumber || 1;
        const quizInSubject = sharedQuizzes.find((q) => q.weekNumber === targetWeek) || sharedQuizzes[0];
        const targetLesson = quizInSubject?.lessonTitle || '';

        setWeekNumber(targetWeek);
        setLessonTitle(targetLesson);

        if (current.teamsConfig && current.teamsConfig.length > 0) {
          const mapped: Record<string, string> = {};
          current.teamsConfig.forEach((t) => {
            mapped[t.teamId] = t.studentNames.join('\n');
          });
          setTeamsCustomText((prev) => ({ ...prev, ...mapped }));
        }
      } else {
        setCurrentClassId('');
        setClassNameInput('');
        setStudentsText('');
        setSubject(ALLOWED_SUBJECTS[0]);
        setLessonTitle('');
        setGameMode('individual');
        setTeamCount(4);
        setGradeSavedQuizzes([]);
        if (gradeGroups.length > 0) {
          setCurrentGradeGroupId(gradeGroups[0].gradeId);
          setGradeNameInput(gradeGroups[0].gradeName);
          setGradeMemberClassIds(gradeGroups[0].classIds);
        } else {
          setCurrentGradeGroupId('');
          setGradeNameInput('');
          setGradeMemberClassIds([]);
        }
        setTeamsCustomText({
          'team-1': '',
          'team-2': '',
          'team-3': '',
          'team-4': '',
          'team-5': '',
          'team-6': '',
        });
      }

      setHasApiKey(Boolean(getStoredApiKey()));
      setPreviewQuestions(null);
      setPendingConfig(null);
    }
  }, [isOpen]);

  // Tự động kiểm tra bộ câu hỏi đã lưu theo đúng (KHỐI LỚP + MÔN HỌC + Tên bài học / Tuần học)
  // Đảm bảo chuyển Khối lớp khác hoặc Môn học khác TUYỆT ĐỐI KHÔNG hiển thị câu hỏi của môn khác / khối khác!
  useEffect(() => {
    const sharedList = getUniqueSavedQuizzesForGrade(
      currentClassId,
      classNameInput,
      subject,
      currentGradeGroupId
    );
    setGradeSavedQuizzes(sharedList);

    if ((currentClassId || classNameInput.trim() || currentGradeGroupId) && (lessonTitle.trim() || weekNumber)) {
      const found = findSavedQuizForLesson(
        currentClassId,
        lessonTitle,
        classNameInput,
        weekNumber,
        subject,
        currentGradeGroupId
      );
      setDetectedSavedQuiz(found);
      if (found) {
        setUseSavedQuiz(true);
        if (!lessonTitle.trim() && found.lessonTitle) {
          setLessonTitle(found.lessonTitle);
        }
      }
    } else {
      setDetectedSavedQuiz(null);
    }
  }, [currentClassId, classNameInput, lessonTitle, weekNumber, subject, currentGradeGroupId, savedGradeGroups]);

  if (!isOpen) return null;

  // Chọn Khối lớp từ menu xổ xuống
  const handleSelectGradeGroup = (selectedGradeId: string) => {
    if (!selectedGradeId || selectedGradeId === '__new__') {
      setCurrentGradeGroupId('');
      setGradeNameInput('');
      setGradeMemberClassIds([]);
      setDetectedSavedQuiz(null);
      setGradeSavedQuizzes([]);
      showToast(
        'Nhập tên Khối lớp (VD: Khối lớp 3), chọn các lớp học hiện có (3A, 3B, 3C...) rồi bấm "💾 Lưu thông tin khối lớp"!',
        'info'
      );
      return;
    }

    const foundGrp = savedGradeGroups.find((g) => g.gradeId === selectedGradeId);
    if (foundGrp) {
      setCurrentGradeGroupId(foundGrp.gradeId);
      setGradeNameInput(foundGrp.gradeName);
      setGradeMemberClassIds(foundGrp.classIds || []);

      // Nếu lớp đang chọn không nằm trong Khối lớp mới chọn, tự động chuyển sang lớp đầu tiên thuộc Khối lớp này (nếu có)
      if (foundGrp.classIds.length > 0 && !foundGrp.classIds.includes(currentClassId)) {
        const firstMember = savedClasses.find((c) => foundGrp.classIds.includes(c.classId));
        if (firstMember) {
          handleSelectClass(firstMember.classId, foundGrp.gradeId);
          return;
        }
      }

      // Cập nhật lại kho câu hỏi theo đúng (Khối lớp mới + Môn học hiện tại)
      const nextShared = getUniqueSavedQuizzesForGrade(
        currentClassId,
        classNameInput,
        subject,
        foundGrp.gradeId
      );
      setGradeSavedQuizzes(nextShared);
      const quizInWeek = nextShared.find((q) => q.weekNumber === weekNumber) || nextShared[0] || null;
      setDetectedSavedQuiz(quizInWeek);
      setLessonTitle(quizInWeek ? quizInWeek.lessonTitle : '');

      showToast(`Đã chọn "${foundGrp.gradeName}"!`, 'info');
    }
  };

  // Bật/tắt thêm lớp học hiện tại vào Khối lớp đang khai báo
  const handleToggleClassInGradeGroup = (targetClassId: string) => {
    setGradeMemberClassIds((prev) =>
      prev.includes(targetClassId)
        ? prev.filter((id) => id !== targetClassId)
        : [...prev, targetClassId]
    );
  };

  // Lưu thông tin Khối lớp & Gán các lớp học đã chọn vào Khối lớp
  const handleSaveCurrentGradeGroup = () => {
    const cleanGradeName = gradeNameInput.trim();
    if (!cleanGradeName) {
      showToast('Vui lòng nhập tên Khối lớp (VD: Khối lớp 3, Khối 4...) trước khi bấm Lưu thông tin khối lớp!', 'error');
      return;
    }

    const res = saveGradeGroupData({
      gradeId: currentGradeGroupId && currentGradeGroupId !== '__new__' ? currentGradeGroupId : undefined,
      gradeName: cleanGradeName,
      classIds: gradeMemberClassIds,
    });

    const refreshedClasses = getSavedClassesFromLocalStorage();
    setSavedClasses(refreshedClasses);
    setSavedGradeGroups(res.allGrades);
    setCurrentGradeGroupId(res.savedGrade.gradeId);
    setGradeNameInput(res.savedGrade.gradeName);
    setGradeMemberClassIds(res.savedGrade.classIds);
    showToast(res.message, 'success');
  };

  // Xóa Khối lớp hiện tại
  const handleDeleteCurrentGradeGroup = () => {
    if (!currentGradeGroupId || currentGradeGroupId === '__new__') {
      showToast('Chưa chọn Khối lớp nào để xóa!', 'error');
      return;
    }
    const remaining = deleteGradeGroupData(currentGradeGroupId);
    const refreshedClasses = getSavedClassesFromLocalStorage();
    setSavedGradeGroups(remaining);
    setSavedClasses(refreshedClasses);

    if (remaining.length > 0) {
      setCurrentGradeGroupId(remaining[0].gradeId);
      setGradeNameInput(remaining[0].gradeName);
      setGradeMemberClassIds(remaining[0].classIds);
    } else {
      setCurrentGradeGroupId('');
      setGradeNameInput('');
      setGradeMemberClassIds([]);
    }
    showToast('Đã xóa Khối lớp thành công!', 'info');
  };

  // Thay đổi Môn học từ menu xổ xuống 4 lựa chọn (Tin học, Công nghệ, Kỹ năng số, Trí tuệ nhân tạo)
  const handleSelectSubject = (nextSubject: string) => {
    setSubject(nextSubject);
    const nextShared = getUniqueSavedQuizzesForGrade(
      currentClassId,
      classNameInput,
      nextSubject,
      currentGradeGroupId
    );
    setGradeSavedQuizzes(nextShared);

    // Kiểm tra xem ở môn học mới này, tuần hiện tại có bộ câu hỏi nào đã lưu không
    const quizForWeekInNextSubj = nextShared.find((q) => q.weekNumber === weekNumber) || null;
    if (quizForWeekInNextSubj) {
      setLessonTitle(quizForWeekInNextSubj.lessonTitle);
      setDetectedSavedQuiz(quizForWeekInNextSubj);
      setUseSavedQuiz(true);
    } else {
      // Nếu tên bài học trước đó là của bộ câu hỏi đã lưu ở môn học cũ -> Xóa ngay để không nhầm lẫn giữa các môn!
      if (detectedSavedQuiz && lessonTitle.trim().toUpperCase() === detectedSavedQuiz.lessonTitle.trim().toUpperCase()) {
        setLessonTitle('');
      }
      setDetectedSavedQuiz(null);
    }
  };

  // Handle class selection change
  const handleSelectClass = (selectedId: string, overrideGradeGroupId?: string) => {
    if (selectedId === '__new__' || !selectedId) {
      setCurrentClassId('');
      setClassNameInput('');
      setStudentsText('');
      setTeamsCustomText({
        'team-1': '',
        'team-2': '',
        'team-3': '',
        'team-4': '',
        'team-5': '',
        'team-6': '',
      });
      showToast(
        'Đã chuyển sang chế độ tạo lớp mới. Sau khi lưu lớp, bạn có thể thêm lớp vào Khối lớp để dùng chung bộ câu hỏi của khối!',
        'info'
      );
      return;
    }

    const found = savedClasses.find((c) => c.classId === selectedId);
    if (found) {
      const prevGrp = findGradeGroupForClass(currentClassId, classNameInput, currentGradeGroupId);
      const nextGrp = findGradeGroupForClass(
        found.classId,
        found.className,
        overrideGradeGroupId || found.gradeGroupId
      );
      const isSameGradeGroup =
        prevGrp !== null && nextGrp !== null && prevGrp.gradeId === nextGrp.gradeId;

      setCurrentClassId(found.classId);
      setActiveClassId(found.classId);
      setClassNameInput(found.className);
      setStudentsText(found.studentsText || '');
      setGameMode(found.gameMode || 'individual');
      setTeamCount(found.teamCount || 4);

      if (nextGrp) {
        setCurrentGradeGroupId(nextGrp.gradeId);
        setGradeNameInput(nextGrp.gradeName);
        setGradeMemberClassIds(nextGrp.classIds);
      } else {
        setCurrentGradeGroupId('');
        setGradeNameInput('');
        setGradeMemberClassIds([]);
      }

      const activeSubj = isSameGradeGroup
        ? subject
        : ensureAllowedSubject(found.subject || subject);
      setSubject(activeSubj);

      const sharedForNext = getUniqueSavedQuizzesForGrade(
        found.classId,
        found.className,
        activeSubj,
        nextGrp?.gradeId
      );
      setGradeSavedQuizzes(sharedForNext);

      if (isSameGradeGroup && lessonTitle.trim()) {
        // Giữ nguyên bài học & tuần học khi chuyển giữa các lớp trong cùng 1 Khối lớp (VD: 3A -> 3B trong Khối lớp 3)
      } else {
        const nextWeek = found.lastWeek || sharedForNext[0]?.weekNumber || weekNumber;
        const matchedQuiz = sharedForNext.find((q) => q.weekNumber === nextWeek) || sharedForNext[0] || null;
        setWeekNumber(nextWeek);
        setLessonTitle(matchedQuiz ? matchedQuiz.lessonTitle : '');
        setDetectedSavedQuiz(matchedQuiz);
      }

      if (found.teamsConfig && found.teamsConfig.length > 0) {
        const mapped: Record<string, string> = {};
        found.teamsConfig.forEach((t) => {
          mapped[t.teamId] = t.studentNames.join('\n');
        });
        setTeamsCustomText((prev) => ({ ...prev, ...mapped }));
      } else {
        setTeamsCustomText({
          'team-1': '',
          'team-2': '',
          'team-3': '',
          'team-4': '',
          'team-5': '',
          'team-6': '',
        });
      }

      const gradeInfo = nextGrp ? ` (Thuộc "${nextGrp.gradeName}" - Môn ${activeSubj})` : '';
      showToast(`Đã tải thông tin ${found.className}${gradeInfo}!`, 'success');
    }
  };

  // Save current class data explicitly to LocalStorage / Firebase
  const handleSaveCurrentClass = async () => {
    const cleanName = classNameInput.trim();
    if (!cleanName) {
      showToast('Vui lòng nhập "Tên lớp hiển thị" (VD: Lớp 3A, Lớp 3B...) trước khi lưu!', 'error');
      return;
    }

    const teamsConfig = buildCurrentTeamsConfig();
    const effectiveClassId = currentClassId && currentClassId !== '__new__' ? currentClassId : `class-${Date.now()}`;
    const activeGrp = savedGradeGroups.find((g) => g.gradeId === currentGradeGroupId);

    const res = await saveClassData({
      classId: effectiveClassId,
      className: cleanName,
      gradeGroupId: activeGrp?.gradeId,
      gradeGroupName: activeGrp?.gradeName,
      subject,
      studentsText,
      gameMode,
      teamCount,
      teamsConfig,
      lastLessonTitle: lessonTitle,
      lastWeek: weekNumber,
      updatedAt: new Date().toISOString(),
    });

    const refreshed = getSavedClassesFromLocalStorage();
    const refreshedGroups = getSavedGradeGroupsFromLocalStorage();
    setSavedClasses(refreshed);
    setSavedGradeGroups(refreshedGroups);
    setCurrentClassId(res.savedClass.classId);
    if (activeGrp && !gradeMemberClassIds.includes(res.savedClass.classId)) {
      setGradeMemberClassIds((prev) => [...prev, res.savedClass.classId]);
    }
    showToast(res.message, res.success ? 'success' : 'error');
  };

  // Delete current class
  const handleDeleteCurrentClass = () => {
    if (!currentClassId || currentClassId === '__new__') {
      showToast('Chưa chọn lớp học nào để xóa!', 'error');
      return;
    }

    const remaining = deleteClassData(currentClassId);
    const refreshedGroups = getSavedGradeGroupsFromLocalStorage();
    setSavedClasses(remaining);
    setSavedGradeGroups(refreshedGroups);

    if (remaining.length > 0) {
      handleSelectClass(remaining[0].classId);
    } else {
      handleSelectClass('');
    }

    showToast(`Đã xóa lớp học thành công!`, 'info');
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

  // Distribute students from Ô 2 into teams
  const handleAutoDistributeTeams = () => {
    const students = parseStudentsList();
    if (students.length === 0) {
      showToast('Vui lòng nhập danh sách học sinh ở Ô 2 trước khi phân bổ vào các nhóm!', 'error');
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
    showToast('Đã tự động chia đều học sinh từ Ô 2 vào các nhóm!', 'success');
  };

  // Form submit: Extract questions or use saved quiz
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate Ô 4: Tên bài học
    if (!lessonTitle.trim()) {
      showToast('Vui lòng nhập tên bài học ở Ô 4 (chỉ cần nhập "bài 1" hoặc "bài 2"...)!', 'error');
      return;
    }

    // Validate Ô 2: Danh sách học sinh trong lớp nếu chơi cá nhân
    const students = parseStudentsList();
    if (gameMode === 'individual' && students.length === 0) {
      showToast('Vui lòng nhập Danh sách học sinh trong lớp (Ô 2) để tạo dây thừng riêng cho từng em!', 'error');
      return;
    }

    // Validate Ô 3: Nếu chơi theo nhóm, bắt buộc người dùng phải nhập danh sách học sinh trong từng nhóm
    const currentTeams = buildCurrentTeamsConfig();
    if (gameMode === 'team') {
      for (const t of currentTeams) {
        if (t.studentNames.length === 0) {
          showToast(
            `Bắt buộc nhập danh sách học sinh cho "${t.teamName}"! Vui lòng nhập học sinh hoặc bấm "⚡ Phân bổ tự động từ Ô 2".`,
            'error'
          );
          return;
        }
      }
    }

    // Ensure class is saved to persistence
    const effectiveClassId = currentClassId && currentClassId !== '__new__' ? currentClassId : `class-${Date.now()}`;
    const cleanClassName = classNameInput.trim() || 'Lớp học';
    const rawLessonInput = lessonTitle.trim();
    const upperLessonInput = rawLessonInput.toUpperCase();
    const activeGrp = savedGradeGroups.find((g) => g.gradeId === currentGradeGroupId);

    await saveClassData({
      classId: effectiveClassId,
      className: cleanClassName,
      gradeGroupId: activeGrp?.gradeId,
      gradeGroupName: activeGrp?.gradeName,
      subject,
      studentsText,
      gameMode,
      teamCount,
      teamsConfig: currentTeams,
      lastLessonTitle: upperLessonInput,
      lastWeek: weekNumber,
      updatedAt: new Date().toISOString(),
    });

    const setupConfig: RaceSetupConfig = {
      weekNumber,
      lessonTitle: detectedSavedQuiz && useSavedQuiz
        ? detectedSavedQuiz.lessonTitle.toUpperCase()
        : upperLessonInput,
      subject,
      className: cleanClassName,
      gameMode,
      questionCount,
      studentsText,
      teamsConfig: currentTeams,
      pdfFileName: pdfFileName || undefined,
      pdfBase64,
    };

    // Case 1: Use previously saved questions for this lesson (normalized to obey strict visual rules)!
    if (detectedSavedQuiz && useSavedQuiz && detectedSavedQuiz.questions.length > 0) {
      onStartGame(setupConfig, normalizeQuestionVisuals(detectedSavedQuiz.questions));
      return;
    }

    // Case 2: Extract new questions with Gemini AI / PDF covering 100% of lesson content with visual illustrations
    setIsLoading(true);
    const detectedGradeNum =
      extractGradeFromClass(activeGrp?.gradeName || cleanClassName) || 4;
    setStatusMessage(
      `AI Gemini (gemini-2.5-flash) đang đọc kỹ nội dung "${upperLessonInput}" (Môn ${subject} - Khối ${detectedGradeNum}) và biên soạn ${questionCount} câu hỏi mới...`
    );

    try {
      const res = await extractQuizWithGemini({
        lessonTitle: rawLessonInput,
        subject,
        grade: detectedGradeNum,
        className: cleanClassName,
        questionCount,
        content: `Bám sát 100% nội dung bài học "${upperLessonInput}" của môn ${subject} (Khối ${detectedGradeNum} - Lớp ${cleanClassName}). Tài liệu tải lên: ${pdfFileName || 'Sách giáo khoa GDPT 2018'}. Bắt buộc tạo ${questionCount} câu hỏi hoàn toàn khác nhau (không lặp lại), có từ 1 đến 3 câu hỏi nâng cao và ưu tiên hình ảnh minh họa (chỉ hiển thị 1 trong 2 nơi: ở câu hỏi hoặc ở 4 đáp án).`,
        pdfBase64,
      });

      if (res.success && res.questions && res.questions.length > 0) {
        const resolvedUpperTitle = (res.resolvedLessonTitle || upperLessonInput)
          .trim()
          .toUpperCase();
        const finalQuestions = normalizeQuestionVisuals(res.questions);

        setLessonTitle(resolvedUpperTitle);
        setPreviewQuestions(finalQuestions);
        setPendingConfig({
          ...setupConfig,
          grade: detectedGradeNum,
          lessonTitle: resolvedUpperTitle,
        });
      } else {
        showToast(
          res.message ||
            'Chưa thể tạo câu hỏi từ Gemini AI. Vui lòng bấm "Cài Đặt API Key" (biểu tượng bánh răng) để kiểm tra khóa API!',
          'error'
        );
      }
    } catch (err: any) {
      console.error(err);
      showToast(
        err?.message ||
          'Lỗi kết nối khi tạo bộ câu hỏi với Gemini AI. Vui lòng thử lại hoặc kiểm tra khóa API!',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Delete saved quiz for current lesson, subject & grade group
  const handleDeleteSavedQuiz = () => {
    const effectiveClassId = currentClassId || getActiveClassId();
    if (!effectiveClassId && !currentGradeGroupId) return;

    const targetName = detectedSavedQuiz?.lessonTitle || lessonTitle.trim().toUpperCase();
    const res = deleteSavedQuizForLesson(
      effectiveClassId,
      lessonTitle,
      classNameInput,
      weekNumber,
      subject,
      currentGradeGroupId
    );
    const updatedShared = getUniqueSavedQuizzesForGrade(
      effectiveClassId,
      classNameInput,
      subject,
      currentGradeGroupId
    );
    setGradeSavedQuizzes(updatedShared);
    setDetectedSavedQuiz(null);
    setUseSavedQuiz(false);
    setShowSavedPreview(false);
    showToast(res.message || `Đã xóa bộ câu hỏi đã lưu của bài "${targetName}"!`, 'info');
  };

  // Teacher evaluates questions and clicks SAVE & START
  const handleSaveAndStartGame = () => {
    if (!previewQuestions || !pendingConfig) return;

    const effectiveClassId = currentClassId || `class-${Date.now()}`;
    const upperTitle = pendingConfig.lessonTitle.toUpperCase();
    const res = saveQuizForLessonAndClass(
      effectiveClassId,
      upperTitle,
      previewQuestions,
      pendingConfig.subject,
      lessonTitle,
      pendingConfig.weekNumber,
      pendingConfig.className,
      currentGradeGroupId
    );

    showToast(res.message, 'success');
    setTimeout(() => {
      onStartGame({ ...pendingConfig, lessonTitle: upperTitle }, previewQuestions);
    }, 400);
  };

  // Teacher starts game without saving
  const handleStartWithoutSaving = () => {
    if (!previewQuestions || !pendingConfig) return;
    onStartGame(
      { ...pendingConfig, lessonTitle: pendingConfig.lessonTitle.toUpperCase() },
      previewQuestions
    );
  };

  const activeGradeGroupObj = findGradeGroupForClass(
    currentClassId,
    classNameInput,
    currentGradeGroupId
  );

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="bg-slate-900 border-2 border-amber-400 w-full max-w-2xl rounded-3xl p-3.5 sm:p-6 shadow-2xl text-white relative animate-in zoom-in-95 duration-200 max-h-[96dvh] flex flex-col">
          {/* Header Bar with Settings Gear & Close Button */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0 gap-2">
            <button
              type="button"
              onClick={() => {
                useGameStore.getState().resetRace();
                useGameStore.getState().setViewMode('classroom');
                onClose();
              }}
              title="Bấm vào biểu tượng ứng dụng để quay lại màn hình chính khi bắt đầu trò chơi"
              className="group flex items-center gap-2.5 min-w-0 text-left cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center text-lg sm:text-xl font-black shadow-md shrink-0 group-hover:scale-105 transition-transform">
                🌳
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-lg font-black text-white group-hover:text-amber-300 tracking-wide truncate transition-colors">
                  CHINH PHỤC ĐỈNH TRI THỨC
                </h3>
                <p className="text-[11px] sm:text-xs font-bold text-amber-300 truncate">
                  Ứng dụng được phát triển bởi thầy giáo Lê Văn Phi
                </p>
              </div>
            </button>

            {/* Actions: Settings Gear (Cài đặt Gemini API) & Close Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                title="Cài đặt khóa Gemini API (Chỉ cần nhập 1 lần duy nhất)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 hover:text-amber-300 font-bold text-xs transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
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

          {/* Toast Notification when class data or quiz is saved/loaded */}
          {toastMessage && (
            <div
              className={`my-2 border px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 animate-in fade-in ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                  : toastMessage.type === 'error'
                  ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                  : 'bg-indigo-950/80 border-indigo-500 text-indigo-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toastMessage.text}</span>
            </div>
          )}

          {/* Prominent Gemini API Key Quota / Error Banner (Yêu cầu thay đổi API KEY GEMINI khi hết Quota) */}
          {apiErrorBanner && (
            <div className="my-2 bg-rose-950/95 border-2 border-rose-400 p-3 rounded-2xl text-xs text-rose-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shrink-0 shadow-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-black text-rose-300 uppercase">
                    {apiErrorBanner.isQuotaError
                      ? '⚠️ CẢNH BÁO HẾT HẠN MỨC (QUOTA) GEMINI API KEY'
                      : '🔑 YÊU CẦU KIỂM TRA / THAY ĐỔI GEMINI API KEY'}
                  </div>
                  <p className="font-semibold text-rose-100 leading-snug">
                    {apiErrorBanner.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shrink-0 shadow cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Thay Đổi API KEY GEMINI</span>
              </button>
            </div>
          )}

          {/* If previewing generated questions to evaluate & save */}
          {previewQuestions && pendingConfig ? (
            <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-left">
              <div className="bg-indigo-950/80 border-2 border-amber-400/70 p-3.5 rounded-2xl space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-emerald-300 uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    ĐÃ TẠO BỘ {previewQuestions.length} CÂU HỎI ({pendingConfig.subject}):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="bg-purple-600/90 border border-purple-300/60 text-white px-2 py-0.5 rounded-lg font-black">
                      🌟 {previewQuestions.filter((q) => q.isAdvanced || q.difficulty === 'nang_cao').length} câu nâng cao
                    </span>
                    <span className="text-slate-300">
                      {activeGradeGroupObj ? (
                        <>
                          Khối: <strong className="text-amber-300">{activeGradeGroupObj.gradeName}</strong> •{' '}
                        </>
                      ) : null}
                      Lớp: <strong className="text-white">{pendingConfig.className}</strong>
                    </span>
                  </div>
                </div>

                {/* ACCURATE UPPERCASE LESSON TITLE DISPLAY */}
                <div className="bg-slate-950/90 border border-amber-400/50 rounded-xl px-3 py-2">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">
                    TÊN BÀI HỌC CHÍNH XÁC (IN HOA) — MÔN {pendingConfig.subject.toUpperCase()}:
                  </div>
                  <div className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-wide">
                    {pendingConfig.lessonTitle.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Questions list with strict mutual exclusivity: Question Image -> Text Options; Options Image -> Text Question */}
              <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                {previewQuestions.map((q, idx) => {
                  const qMode = resolveVisualDisplayMode(q);
                  const showQImg = qMode === 'question_image';
                  const uniformOpts = qMode === 'options_image' ? getUniformOptionVisuals(q) : null;
                  const isAdv = Boolean(q.isAdvanced || q.difficulty === 'nang_cao');
                  return (
                    <div
                      key={q.id || idx}
                      className={`p-3 rounded-2xl space-y-2 text-xs border ${
                        isAdv
                          ? 'bg-gradient-to-br from-purple-950/70 via-slate-800/95 to-slate-900 border-purple-400/70'
                          : 'bg-slate-800/90 border-slate-700'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-amber-400 text-slate-950 text-[10px] px-2 py-0.5 rounded font-black shrink-0">
                            Câu {idx + 1}
                          </span>
                          {isAdv && (
                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-2 py-0.5 rounded-md font-black shrink-0 shadow">
                              🌟 CÂU HỎI NÂNG CAO
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 bg-slate-900/90 border border-slate-700 px-2 py-0.5 rounded-md">
                          {showQImg
                            ? '🖼️ Minh họa trong câu hỏi'
                            : uniformOpts
                            ? '🖼️ Minh họa trong 4 đáp án'
                            : '📝 Câu hỏi kiến thức'}
                        </span>
                      </div>

                      <div className="text-white font-extrabold text-xs sm:text-sm leading-snug">
                        {q.question}
                      </div>

                      {showQImg && (
                        <div className="pl-2 sm:pl-6">
                          <QuestionVisualIllustration question={q} index={idx + 1} compact />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2 sm:pl-6">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-xl text-[11px] flex flex-col gap-1.5 ${
                              optIdx === q.correctIndex
                                ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200 font-bold'
                                : 'bg-slate-900/60 text-slate-300 border border-slate-800'
                            }`}
                          >
                            {uniformOpts && (
                              <OptionVisualIllustration
                                optionText={opt}
                                visualSpec={uniformOpts[optIdx]}
                                optionSvg={q.optionSvgs?.[optIdx]}
                                optionIndex={optIdx}
                                visualType={q.visualType}
                                questionText={q.question}
                              />
                            )}
                            <div className="flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center shrink-0">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                              {optIdx === q.correctIndex && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons for Preview */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleSaveAndStartGame}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Save className="w-4 h-4 fill-slate-950" />
                  <span>
                    💾 LƯU VÀO {activeGradeGroupObj ? activeGradeGroupObj.gradeName.toUpperCase() : 'KHỐI LỚP'} ({pendingConfig.subject.toUpperCase()}) & BẮT ĐẦU
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleStartWithoutSaving}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  Vào chơi ngay (Chưa lưu)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewQuestions(null);
                    setPendingConfig(null);
                  }}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold border border-slate-800 cursor-pointer"
                >
                  Quay lại chỉnh sửa
                </button>
              </div>
            </div>
          ) : (
            /* Scrollable Form Body */
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-2.5 space-y-3 pr-1 text-left text-xs">
              {/* KHAI BÁO & LƯU THÔNG TIN KHỐI LỚP (GÁN CÁC LỚP 3A, 3B, 3C... VÀO KHỐI LỚP ĐỂ DÙNG CHUNG BỘ CÂU HỎI) */}
              <div className="bg-slate-800/90 p-3 rounded-2xl border border-amber-500/50 space-y-2.5 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <label className="flex items-center gap-1.5 font-bold text-amber-300 uppercase">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Khối lớp (Lưu bộ câu hỏi dùng chung cho các lớp trong khối)</span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    {currentGradeGroupId && currentGradeGroupId !== '__new__' && (
                      <button
                        type="button"
                        onClick={handleDeleteCurrentGradeGroup}
                        className="px-2 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-300 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                        title="Xóa khối lớp này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa khối</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveCurrentGradeGroup}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-black text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                      title="Lưu thông tin khối lớp và danh sách các lớp thuộc khối này"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>💾 Lưu thông tin khối lớp</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-300 block mb-1">Chọn khối lớp đã lưu:</span>
                    <select
                      value={currentGradeGroupId}
                      onChange={(e) => handleSelectGradeGroup(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-bold text-xs focus:outline-none focus:border-amber-400"
                    >
                      {savedGradeGroups.length === 0 ? (
                        <option value="">-- Chưa có khối lớp nào (Nhập bên phải để lưu) --</option>
                      ) : (
                        savedGradeGroups.map((grp) => {
                          const memberNames = savedClasses
                            .filter((c) => grp.classIds.includes(c.classId))
                            .map((c) => c.className)
                            .join(', ');
                          return (
                            <option key={grp.gradeId} value={grp.gradeId}>
                              {grp.gradeName} {memberNames ? `(${memberNames})` : '(Chưa gán lớp)'}
                            </option>
                          );
                        })
                      )}
                      <option value="__new__">+ Nhập và tạo khối lớp mới...</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-300 block mb-1">Tên khối lớp khai báo:</span>
                    <input
                      type="text"
                      value={gradeNameInput}
                      onChange={(e) => setGradeNameInput(e.target.value)}
                      placeholder="Nhập tên khối lớp (VD: Khối lớp 3, Khối 4...)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-bold text-xs focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Chọn các lớp học đã có hiện tại để thêm vào Khối lớp */}
                <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-[11px] font-bold text-slate-200">
                      Thêm các lớp học đã có hiện tại vào {gradeNameInput.trim() ? `"${gradeNameInput.trim()}"` : 'khối lớp này'}:
                    </span>
                    <span className="text-[10px] text-amber-300">
                      Tích chọn các lớp (VD: 3A, 3B, 3C) rồi bấm "💾 Lưu thông tin khối lớp"
                    </span>
                  </div>

                  {savedClasses.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic">
                      Chưa có lớp học nào được lưu. Hãy nhập và lưu các lớp học (VD: 3A, 3B, 3C) ở mục Lớp học bên dưới, sau đó tích chọn vào khối lớp!
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {savedClasses.map((cls) => {
                        const isChecked = gradeMemberClassIds.includes(cls.classId);
                        const otherGrp = savedGradeGroups.find(
                          (g) => g.gradeId !== currentGradeGroupId && g.classIds.includes(cls.classId)
                        );
                        return (
                          <button
                            key={cls.classId}
                            type="button"
                            onClick={() => handleToggleClassInGradeGroup(cls.classId)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                              isChecked
                                ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-400/60 hover:text-white'
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                isChecked
                                  ? 'bg-slate-950 border-slate-950 text-amber-400'
                                  : 'border-slate-500'
                              }`}
                            >
                              {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span>{cls.className}</span>
                            {otherGrp && !isChecked && (
                              <span className="text-[9px] text-slate-400 font-normal">
                                ({otherGrp.gradeName})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* LỚP HỌC (HOÀN TOÀN KHÔNG DỮ LIỆU MẪU - TỰ NHẬP VÀO RỒI BẤM LƯU - CÓ NÚT XÓA LỚP) */}
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-indigo-500/40 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <label className="flex items-center gap-1.5 font-bold text-indigo-300 uppercase">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <span>Lớp học (Lưu vĩnh viễn khi bấm Lưu)</span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    {currentClassId && currentClassId !== '__new__' && (
                      <button
                        type="button"
                        onClick={handleDeleteCurrentClass}
                        className="px-2 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-300 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                        title="Xóa vĩnh viễn lớp học này khỏi danh sách đã lưu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa lớp này</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveCurrentClass}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                      title="Lưu lại danh sách học sinh và phân bổ nhóm của lớp này"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>💾 Lưu thông tin lớp</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-300 block mb-1">Chọn lớp học đã lưu:</span>
                    <select
                      value={currentClassId}
                      onChange={(e) => handleSelectClass(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-bold text-xs focus:outline-none focus:border-indigo-400"
                    >
                      {savedClasses.length === 0 ? (
                        <option value="">-- Chưa có lớp học nào (Nhập bên dưới để lưu) --</option>
                      ) : (
                        savedClasses.map((cls) => {
                          const count = cls.studentsText ? cls.studentsText.split('\n').filter((s) => s.trim()).length : 0;
                          const grp = findGradeGroupForClass(cls.classId, cls.className, cls.gradeGroupId);
                          return (
                            <option key={cls.classId} value={cls.classId}>
                              {cls.className} {grp ? `[${grp.gradeName}]` : ''} {count > 0 ? `(${count} HS)` : '(0 HS)'}
                            </option>
                          );
                        })
                      )}
                      <option value="__new__">+ Nhập và tạo lớp mới...</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-300 block mb-1">Tên lớp hiển thị:</span>
                    <input
                      type="text"
                      value={classNameInput}
                      onChange={(e) => setClassNameInput(e.target.value)}
                      placeholder="Nhập tên lớp (VD: 3A, 3B, 3C...)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-bold text-xs focus:outline-none focus:border-indigo-400 placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Ô 1: LỰA CHỌN TUẦN HỌC (TỪ TUẦN 1 ĐẾN TUẦN 35) */}
              <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700">
                <label className="flex items-center gap-1.5 font-bold text-amber-300 uppercase mb-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Ô 1: Lựa chọn tuần học (Từ tuần 1 đến tuần 35)</span>
                </label>
                <select
                  value={weekNumber}
                  onChange={(e) => {
                    const selectedW = parseInt(e.target.value, 10);
                    setWeekNumber(selectedW);
                    // Chỉ nạp bộ câu hỏi đã lưu nếu thuộc đúng (Khối lớp + Môn học) hiện tại!
                    const quizForWeek = gradeSavedQuizzes.find((q) => q.weekNumber === selectedW);
                    if (quizForWeek) {
                      setLessonTitle(quizForWeek.lessonTitle);
                      setDetectedSavedQuiz(quizForWeek);
                      setUseSavedQuiz(true);
                    } else {
                      if (detectedSavedQuiz && lessonTitle.trim().toUpperCase() === detectedSavedQuiz.lessonTitle.trim().toUpperCase()) {
                        setLessonTitle('');
                      }
                      setDetectedSavedQuiz(null);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                >
                  {Array.from({ length: 35 }, (_, idx) => idx + 1).map((week) => {
                    const savedInGradeAndSubject = gradeSavedQuizzes.find((q) => q.weekNumber === week);
                    const scopeTitle = activeGradeGroupObj?.gradeName || 'Khối hiện tại';
                    return (
                      <option key={week} value={week}>
                        Tuần {week}
                        {savedInGradeAndSubject
                          ? ` — ★ Đã lưu [${scopeTitle} - Môn ${subject}]: ${savedInGradeAndSubject.lessonTitle} (${savedInGradeAndSubject.questions.length} câu)`
                          : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Ô 2: DANH SÁCH HỌC SINH TRONG LỚP */}
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
                  placeholder="Nhập danh sách học sinh trong lớp (mỗi dòng một em)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>* Nhập mỗi em một dòng. Trên đầu mỗi chú gà con sẽ hiển thị đúng họ và tên của học sinh.</span>
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
                    <span>Chơi Cá Nhân (Dây thừng riêng từng em)</span>
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
                    <span>Chơi Theo Nhóm (Đội Thú Hoang)</span>
                  </button>
                </div>

                {/* Giao diện Chế độ Cá Nhân */}
                {gameMode === 'individual' ? (
                  <div className="space-y-2">
                    {studentCount > 0 ? (
                      <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3 text-[11px] text-emerald-200">
                        <div className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Chế độ Cá Nhân: Đúng {studentCount} dây thừng 10 móc tương ứng với {studentCount} học sinh!</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          Bà già chống gậy sẽ chạy bắt ngẫu nhiên các chú gà con mang họ tên học sinh. Trả lời đúng leo lên +1 móc, trả lời sai tụt xuống -1 móc!
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 text-[11px] text-amber-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          Chưa có học sinh nào. Hãy nhập tên các học sinh ở <strong>Ô 2</strong> bên trên để hệ thống tạo dây thừng 10 móc cho từng em!
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Giao diện Chế độ Nhóm */
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-slate-300 font-semibold text-xs">
                        Chọn số đội thú hoang thi đấu:
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
                            {num} Đội
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-300">
                        Nhập học sinh vào từng đội (Bà già bắt trúng học sinh đội nào thì tính điểm cho đội đó):
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
                                {members.length > 0 ? `${members.length} bạn` : '⚠️ Bắt buộc nhập học sinh'}
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

              {/* Ô 4: NHẬP TÊN BÀI HỌC & MENU XỔ XUỐNG 4 LỰA CHỌN MÔN HỌC */}
              <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label className="flex items-center gap-1.5 font-bold text-amber-300 uppercase">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>Ô 4: Nhập tên bài học & Chọn môn học</span>
                  </label>
                  <span className="text-[10px] text-emerald-300 font-bold">
                    {activeGradeGroupObj
                      ? `Đang dùng kho "${activeGradeGroupObj.gradeName}" • Môn ${subject}`
                      : `Môn ${subject}`}
                  </span>
                </div>

                {/* DANH SÁCH BỘ CÂU HỎI DÙNG CHUNG CỦA ĐÚNG (KHỐI LỚP + MÔN HỌC) HIỆN TẠI */}
                {gradeSavedQuizzes.length > 0 && (
                  <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-2 space-y-1.5">
                    <div className="text-[10px] font-bold text-indigo-300 flex items-center justify-between">
                      <span>
                        📚 Kho bộ câu hỏi dùng chung của{' '}
                        <strong className="text-amber-300">
                          {activeGradeGroupObj ? activeGradeGroupObj.gradeName : classNameInput || 'Khối hiện tại'}
                        </strong>{' '}
                        — Môn <strong className="text-emerald-300">{subject}</strong> ({gradeSavedQuizzes.length} bộ đã lưu):
                      </span>
                      <span className="text-slate-400">Bấm chọn để sử dụng ngay</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {gradeSavedQuizzes.map((sq, idx) => {
                        const isSelected =
                          detectedSavedQuiz?.lessonTitle === sq.lessonTitle && useSavedQuiz;
                        return (
                          <button
                            key={`${sq.lessonTitle}-${idx}`}
                            type="button"
                            onClick={() => {
                              setLessonTitle(sq.lessonTitle);
                              if (sq.weekNumber) setWeekNumber(sq.weekNumber);
                              setDetectedSavedQuiz(sq);
                              setUseSavedQuiz(true);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 font-black shadow'
                                : 'bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            <span>
                              {sq.weekNumber ? `[Tuần ${sq.weekNumber}] ` : ''}
                              {sq.lessonTitle} ({sq.questions.length} câu)
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[11px] text-slate-300 block mb-1">
                      Môn học (4 môn học chuyên biệt) <strong className="text-amber-400">*</strong>:
                    </span>
                    <select
                      value={subject}
                      onChange={(e) => handleSelectSubject(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                    >
                      {ALLOWED_SUBJECTS.map((subjItem) => (
                        <option key={subjItem} value={subjItem}>
                          {subjItem}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-300 block mb-1">
                      Tên bài học <strong className="text-amber-400">*</strong>:
                    </span>
                    <input
                      type="text"
                      required
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      placeholder='Nhập "bài 1", "bài 2" hoặc tên bài...'
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-xs sm:text-sm focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* THÔNG BÁO BỘ CÂU HỎI ĐÃ LƯU TRƯỚC ĐÓ CHO ĐÚNG (KHỐI LỚP + MÔN HỌC) NÀY + NÚT XÓA */}
                {detectedSavedQuiz && (
                  <div className="bg-emerald-950/80 border border-emerald-500 rounded-xl p-2.5 space-y-2 animate-in fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-black text-emerald-300 uppercase truncate">
                            ĐÃ LƯU BỘ CÂU HỎI DÙNG CHUNG{' '}
                            {activeGradeGroupObj
                              ? `[${activeGradeGroupObj.gradeName.toUpperCase()} - MÔN ${subject.toUpperCase()}]`
                              : `[MÔN ${subject.toUpperCase()}]`}{' '}
                            ({detectedSavedQuiz.questions.length} CÂU) — {detectedSavedQuiz.lessonTitle.toUpperCase()}
                          </div>
                          <div className="text-[10px] text-slate-300">
                            {activeGradeGroupObj
                              ? `Tất cả các lớp thuộc "${activeGradeGroupObj.gradeName}" đều dùng chung bộ câu hỏi môn ${subject} này!`
                              : `Bộ câu hỏi đã lưu cho môn ${subject}.`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowSavedPreview(!showSavedPreview)}
                          className="px-2 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {showSavedPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showSavedPreview ? 'Ẩn câu hỏi' : 'Xem câu hỏi'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDeleteSavedQuiz}
                          className="px-2 py-1 bg-rose-900 hover:bg-rose-800 border border-rose-500 text-rose-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Xóa vĩnh viễn bộ câu hỏi đã lưu của bài học này"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Xóa bộ câu hỏi đã lưu</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-emerald-500/30 text-[11px]">
                      <label className="flex items-center gap-1.5 cursor-pointer font-bold text-amber-300">
                        <input
                          type="radio"
                          name="quizSourceChoice"
                          checked={useSavedQuiz}
                          onChange={() => setUseSavedQuiz(true)}
                          className="text-amber-400"
                        />
                        <span>Sử dụng lại bộ câu hỏi đã lưu ({detectedSavedQuiz.questions.length} câu)</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                        <input
                          type="radio"
                          name="quizSourceChoice"
                          checked={!useSavedQuiz}
                          onChange={() => setUseSavedQuiz(false)}
                        />
                        <span>Tạo mới bằng AI Gemini / PDF</span>
                      </label>
                    </div>

                    {showSavedPreview && (
                      <div className="mt-2 pt-2 border-t border-emerald-500/30 max-h-48 overflow-y-auto space-y-2 pr-1">
                        {detectedSavedQuiz.questions.map((q, idx) => (
                          <div key={idx} className="bg-slate-900/90 p-2.5 rounded-xl text-[10px] text-slate-300 space-y-1.5">
                            <span className="font-bold text-amber-300 block">
                              Câu {idx + 1}: {q.question}
                            </span>
                            <QuestionVisualIllustration question={q} index={idx + 1} compact />
                            <span className="block text-emerald-400 font-bold">
                              ✓ Đáp án đúng: {q.options[q.correctIndex]}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
              </div>

              {/* LỰA CHỌN SỐ LƯỢNG CÂU HỎI TRẮC NGHIỆM (CÓ THÊM LỰA CHỌN 20 CÂU) */}
              <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-white block">Số lượng câu hỏi trắc nghiệm:</span>
                  <span className="text-[10px] text-slate-400">Trả lời đúng leo lên +1 móc, trả lời sai tụt xuống -1 móc</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[3, 5, 8, 10, 15, 20].map((num) => (
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
                <span>
                  {detectedSavedQuiz && useSavedQuiz
                    ? 'SỬ DỤNG BỘ CÂU HỎI ĐÃ LƯU & BẮT ĐẦU CHƠI'
                    : 'BẮT ĐẦU TRÒ CHƠI RỪNG CỔ THỤ 10 MÓC'}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Settings Modal (Gemini API Key) */}
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
