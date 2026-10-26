import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { QuizSet, Question, SubjectType } from '../../types';
import { extractQuizWithGemini, normalizeQuestionVisuals } from '../../services/geminiClientService';
import { ALLOWED_SUBJECTS } from '../../services/classroomStorageService';
import {
  QuestionVisualIllustration,
  OptionVisualIllustration,
  getUniformOptionVisuals,
  resolveVisualDisplayMode,
} from '../ClassroomGame/QuestionVisualIllustration';
import {
  Sparkles,
  Upload,
  CheckCircle,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Settings,
} from 'lucide-react';

export const AiQuizGenerator: React.FC = () => {
  const { selectedWeek, addGeneratedQuiz, setViewMode, openSettings } = useGameStore();

  const [lessonTitle, setLessonTitle] = useState('');
  const [subject, setSubject] = useState<SubjectType>(ALLOWED_SUBJECTS[0]);
  const [grade, setGrade] = useState<number>(4);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [rawText, setRawText] = useState<string>('');
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Handle PDF file selection
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Clean = result.split(',')[1] || result;
      setPdfBase64(base64Clean);
    };
    reader.readAsDataURL(file);
  };

  // Call Gemini API via stable gemini-2.5-flash model
  const handleGenerate = async () => {
    if (!lessonTitle.trim()) {
      setStatusMessage('Vui lòng nhập tên bài học hoặc số bài (ví dụ: Bài 3) trước khi tạo câu hỏi!');
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const result = await extractQuizWithGemini({
        lessonTitle: lessonTitle.trim(),
        subject,
        grade,
        questionCount,
        content: rawText,
        pdfBase64,
      });

      if (result.success && result.questions && result.questions.length > 0) {
        const resolvedUpperTitle = (
          result.resolvedLessonTitle ||
          lessonTitle ||
          'BÀI HỌC'
        )
          .trim()
          .toUpperCase();
        setLessonTitle(resolvedUpperTitle);
        setGeneratedQuestions(normalizeQuestionVisuals(result.questions));
        setStatusMessage(
          `Đã tạo thành công bộ ${result.questions.length} câu hỏi môn ${subject} (Khối ${grade}) bám sát bài "${resolvedUpperTitle}" bằng Model ổn định (gemini-2.5-flash)!`
        );
      } else {
        setStatusMessage(
          result.message ||
            'Không thể tạo bộ câu hỏi từ Gemini AI. Vui lòng kiểm tra kết nối hoặc Cài đặt API Key!'
        );
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(
        err?.message ||
          'Lỗi kết nối tới máy chủ Gemini AI. Vui lòng thử lại hoặc kiểm tra khóa API!'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Apply Questions to Game Session
  const handleApplyToRace = () => {
    if (generatedQuestions.length === 0) return;
    const upperTitle = (lessonTitle || 'BÀI HỌC').trim().toUpperCase();

    const newQuizSet: QuizSet = {
      id: `quiz-gen-week-${selectedWeek}-${Date.now()}`,
      weekNumber: selectedWeek,
      lessonTitle: upperTitle,
      subject,
      grade,
      description: `BÀI HỌC: ${upperTitle}`,
      questions: generatedQuestions,
      createdAt: new Date().toISOString(),
    };

    addGeneratedQuiz(newQuizSet);
    setViewMode('classroom');
  };

  const advancedCount = generatedQuestions.filter(
    (q) => q.isAdvanced || q.difficulty === 'nang_cao'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 p-6 rounded-3xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Gemini RAG Module • Trích xuất sách giáo khoa chuẩn GDPT 2018</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Tạo Câu Hỏi Trắc Nghiệm Tự Động Từ Sách Giáo Khoa (PDF)
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Tải lên tài liệu PDF hoặc nhập số bài học (VD: Bài 3). Hệ thống tự động tìm đúng bài học trong SGK của môn học đã chọn, sinh bộ câu hỏi kèm từ 1 đến 3 câu hỏi nâng cao và ưu tiên hình ảnh minh họa (hiển thị 1 trong 2 vị trí).
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={openSettings}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span>Cài Đặt API Key</span>
          </button>
          <div className="bg-indigo-950/80 px-4 py-2 rounded-2xl border border-indigo-500/40 text-center w-full sm:w-auto">
            <div className="text-[10px] text-indigo-300 font-bold">Đang gán cho:</div>
            <div className="text-base font-black text-amber-400">Tuần {selectedWeek}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Thông Tin Bài Học & Nguồn Dữ Liệu</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
              Tên bài học hoặc số bài:
            </label>
            <input
              type="text"
              value={lessonTitle}
              onChange={(e) => setLessonTitle(e.target.value)}
              placeholder='Ví dụ: "Bài 3" hoặc tên bài học...'
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                Môn học (4 lựa chọn):
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-indigo-500"
              >
                {ALLOWED_SUBJECTS.map((subjItem) => (
                  <option key={subjItem} value={subjItem}>
                    {subjItem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                Khối lớp:
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-indigo-500"
              >
                {[3, 4, 5].map((g) => (
                  <option key={g} value={g}>
                    Khối {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
              Số lượng câu hỏi cần sinh:
            </label>
            <div className="flex gap-1.5">
              {[3, 5, 8, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    questionCount === num
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {num} câu
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
              Tải lên Sách Giáo Khoa (PDF):
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-800/40 relative">
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              {pdfFileName ? (
                <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>{pdfFileName}</span>
                </div>
              ) : (
                <>
                  <div className="text-xs font-bold text-slate-200">Bấm để tải tệp PDF sách giáo khoa</div>
                  <div className="text-[11px] text-slate-300 mt-1">Hỗ trợ PDF bộ sách Kết nối tri thức, Chân trời, Cánh diều</div>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
              Hoặc dán đoạn trích kiến thức bài học (tùy chọn):
            </label>
            <textarea
              rows={3}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Dán nội dung sách giáo khoa hoặc ghi chú trọng tâm bài học (nếu có)..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>AI Đang Phân Tích Bài Học & Sinh Câu Hỏi...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>KÍCH HOẠT GEMINI TRÍCH XUẤT</span>
              </>
            )}
          </button>

          {statusMessage && (
            <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800 p-2.5 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Right Column: Generated Questions Preview (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 gap-2 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-white text-base">
                  Xem Trước Bộ Câu Hỏi Trắc Nghiệm ({generatedQuestions.length} câu)
                </h3>
                {generatedQuestions.length > 0 && (
                  <span className="text-xs font-black bg-purple-600/90 border border-purple-300/60 text-white px-2.5 py-0.5 rounded-lg">
                    🌟 {advancedCount} câu nâng cao
                  </span>
                )}
              </div>
              {lessonTitle && (
                <div className="text-xs font-black text-amber-300 uppercase mt-0.5">
                  MÔN {subject.toUpperCase()} (KHỐI {grade}) • {lessonTitle.toUpperCase()}
                </div>
              )}
              <p className="text-xs text-slate-300">
                Ưu tiên minh họa trực quan (chỉ hiển thị 1 trong 2 vị trí: ở câu hỏi hoặc ở 4 đáp án) • Có từ 1 đến 3 câu nâng cao
              </p>
            </div>

            {generatedQuestions.length > 0 && (
              <button
                onClick={handleApplyToRace}
                className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-400/20 cursor-pointer"
              >
                <span>NẠP VÀO TRÒ CHƠI</span>
              </button>
            )}
          </div>

          {generatedQuestions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-300 border-2 border-dashed border-slate-800 rounded-2xl">
              <HelpCircle className="w-12 h-12 text-slate-400 mb-3" />
              <p className="text-sm font-semibold">Chưa có câu hỏi nào được tạo</p>
              <p className="text-xs text-slate-300 max-w-sm mt-1">
                Chọn môn học, nhập tên bài học bên trái và bấm "Kích hoạt Gemini trích xuất" để AI tạo bộ câu hỏi ngay tức thì.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 overflow-y-auto max-h-[520px] pr-1">
              {generatedQuestions.map((q, qIdx) => {
                const qMode = resolveVisualDisplayMode(q);
                const showQImg = qMode === 'question_image';
                const uniformOpts = qMode === 'options_image' ? getUniformOptionVisuals(q) : null;
                const isAdv = Boolean(q.isAdvanced || q.difficulty === 'nang_cao');
                return (
                  <div
                    key={q.id || qIdx}
                    className={`rounded-2xl p-4 border text-left space-y-2.5 ${
                      isAdv
                        ? 'bg-gradient-to-br from-purple-950/60 via-slate-800/90 to-slate-900 border-purple-400/70'
                        : 'bg-slate-800/80 border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md">
                          Câu {qIdx + 1}
                        </span>
                        {isAdv && (
                          <span className="text-[11px] font-black bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2.5 py-0.5 rounded-md shadow">
                            🌟 CÂU HỎI NÂNG CAO
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-300 bg-slate-900/90 border border-slate-700 px-2 py-0.5 rounded-md">
                        {showQImg
                          ? '🖼️ Hình trong câu hỏi'
                          : uniformOpts
                          ? '🖼️ Hình trong 4 đáp án'
                          : '📝 Câu hỏi kiến thức'}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {q.question}
                    </h4>

                    {showQImg && <QuestionVisualIllustration question={q} index={qIdx + 1} compact />}

                    {/* Options: pure text if question has image; uniform 4 images if options_image */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-xl text-xs flex flex-col gap-1.5 border ${
                            oIdx === q.correctIndex
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                              : 'bg-slate-900/60 border-slate-700 text-slate-300'
                          }`}
                        >
                          {uniformOpts && (
                            <OptionVisualIllustration
                              optionText={opt}
                              visualSpec={uniformOpts[oIdx]}
                              optionSvg={q.optionSvgs?.[oIdx]}
                              optionIndex={oIdx}
                              visualType={q.visualType}
                              questionText={q.question}
                            />
                          )}
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center font-bold text-[10px]">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="truncate">{opt}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-amber-300/90 bg-amber-950/30 p-2 rounded-xl border border-amber-900/30">
                      💡 <strong>Giải thích:</strong> {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
