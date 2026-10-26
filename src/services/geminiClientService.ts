import { GoogleGenAI, Type } from '@google/genai';
import { Question } from '../types';
import {
  resolveVisualDisplayMode,
  getUniformOptionVisuals,
} from '../components/ClassroomGame/QuestionVisualIllustration';

const GEMINI_API_KEY_STORAGE_KEY = 'FOREST_CLIMB_GEMINI_API_KEY_V1';
const LEGACY_API_KEY_STORAGE_KEYS = [
  'FOREST_CLIMB_GEMINI_API_KEY_V1',
  'forest_climb_gemini_api_key',
  'gemini_api_key',
  'GEMINI_API_KEY',
];

/**
 * Danh sách các Model Gemini ổn định và chính xác nhất cho trích xuất PDF & tạo câu hỏi trắc nghiệm cấu trúc JSON.
 * Ưu tiên số 1: gemini-2.5-flash (Model ổn định chính thức, đọc PDF đa phương thức chính xác tuyệt đối).
 * Dự phòng: gemini-3-flash-preview, gemini-2.0-flash.
 */
export const STABLE_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.0-flash',
];

export function getStoredGeminiApiKey(): string {
  try {
    for (const k of LEGACY_API_KEY_STORAGE_KEYS) {
      const val = (localStorage.getItem(k) || '').trim();
      if (val) return val;
    }
    return '';
  } catch {
    return '';
  }
}

export function getStoredApiKey(): string {
  return getStoredGeminiApiKey();
}

export function saveGeminiApiKey(apiKey: string): void {
  try {
    const clean = apiKey.trim();
    if (clean) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, clean);
      localStorage.setItem('gemini_api_key', clean);
    } else {
      for (const k of LEGACY_API_KEY_STORAGE_KEYS) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {
    console.error('Failed to save API Key to localStorage:', e);
  }
}

export function saveStoredApiKey(apiKey: string): void {
  saveGeminiApiKey(apiKey);
}

export function hasConfiguredGeminiApiKey(): boolean {
  return Boolean(getStoredGeminiApiKey());
}

/**
 * Kiểm tra xem lỗi trả về từ Gemini API có phải là lỗi hết hạn mức (QUOTA / 429 / RESOURCE_EXHAUSTED)
 * hoặc lỗi khóa API không hợp lệ hay không.
 */
export function analyzeGeminiError(errOrMsg: any): {
  isQuotaError: boolean;
  isAuthError: boolean;
  formattedMessage: string;
} {
  const raw =
    typeof errOrMsg === 'string'
      ? errOrMsg
      : errOrMsg?.message || errOrMsg?.error || JSON.stringify(errOrMsg || '');
  const lower = String(raw).toLowerCase();

  const isQuotaError =
    lower.includes('429') ||
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('exceeded your current quota') ||
    lower.includes('billing');

  if (isQuotaError) {
    return {
      isQuotaError: true,
      isAuthError: false,
      formattedMessage:
        '⚠️ LỖI HẾT HẠN MỨC (QUOTA) GEMINI API KEY: Khóa API Gemini hiện tại đã hết hạn mức sử dụng (Quota Exhausted / 429). Vui lòng thay đổi sang API KEY GEMINI mới trong mục "Cài Đặt API Key"! (Hệ thống tuyệt đối không tự ý tạo câu hỏi ngẫu nhiên).',
    };
  }

  const isAuthError =
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('invalid api key') ||
    lower.includes('unauthenticated') ||
    lower.includes('permission_denied') ||
    lower.includes('chưa cấu hình gemini_api_key') ||
    lower.includes('chưa được cấu hình');

  if (isAuthError) {
    return {
      isQuotaError: false,
      isAuthError: true,
      formattedMessage:
        '🔑 LỖI KHÓA GEMINI API KEY: Khóa API chưa được cấu hình hoặc không hợp lệ. Vui lòng bấm "Cài Đặt API Key" để nhập hoặc thay đổi API KEY GEMINI mới!',
    };
  }

  return {
    isQuotaError: false,
    isAuthError: false,
    formattedMessage:
      raw ||
      'Không thể tạo bộ câu hỏi từ Gemini AI. Vui lòng kiểm tra kết nối hoặc thay đổi API KEY GEMINI trong mục Cài đặt.',
  };
}

export async function testGeminiApiKey(
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    return { success: false, message: 'Khóa API đang để trống!' };
  }
  try {
    const ai = new GoogleGenAI({ apiKey: cleanKey });
    let lastErr: any = null;
    for (const m of STABLE_GEMINI_MODELS) {
      try {
        const res = await ai.models.generateContent({
          model: m,
          contents: 'Trả lời ngắn gọn: OK',
        });
        if (res.text) {
          return {
            success: true,
            message: `Kết nối thành công với Model ổn định (${m})! Khóa API hoạt động tốt.`,
          };
        }
      } catch (err: any) {
        lastErr = err;
        const analysis = analyzeGeminiError(err);
        if (analysis.isQuotaError || analysis.isAuthError) {
          return {
            success: false,
            message: analysis.formattedMessage,
          };
        }
      }
    }
    const finalAnalysis = analyzeGeminiError(lastErr);
    return {
      success: false,
      message: finalAnalysis.formattedMessage,
    };
  } catch (err: any) {
    const analysis = analyzeGeminiError(err);
    return {
      success: false,
      message: analysis.formattedMessage,
    };
  }
}

/**
 * Chuẩn hóa chuỗi câu hỏi để phát hiện trùng lặp nội dung tuyệt đối
 */
export function normalizeQuestionFingerprint(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/^câu\s*(?:hỏi)?\s*\d+\s*[:.)-]?\s*/i, '')
    .replace(/^\[(?:vận dụng\s*)?nâng cao\]\s*/i, '')
    .replace(/[.,?!;:"'()[\]{}“”‘’\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Chuẩn hóa danh sách câu hỏi từ AI:
 * 1. Loại bỏ triệt để các câu hỏi có nội dung trùng lặp (cả trùng trực tiếp và trùng với bộ câu hỏi cũ nếu có).
 * 2. Đảm bảo có từ 1 đến 3 câu hỏi nâng cao (isAdvanced: true, difficulty: 'nang_cao') mang tính chiều sâu.
 * 3. Đảm bảo nguyên tắc hình ảnh minh họa chỉ hiển thị 1 trong 2 vị trí:
 *    - 'question_image': Hình ảnh ở câu hỏi -> 4 đáp án A, B, C, D là văn bản.
 *    - 'options_image': Hình ảnh ở 4 đáp án -> Câu hỏi là văn bản.
 *    - 'text_only': Câu hỏi lý thuyết thuần văn bản.
 */
export function normalizeQuestionVisuals(
  questions: Question[],
  excludeQuestionTexts: string[] = []
): Question[] {
  if (!Array.isArray(questions) || questions.length === 0) return [];

  // Bước 1: Lọc bỏ triệt để các câu hỏi trùng lặp nội dung hoặc trùng đáp án đúng + câu hỏi
  const seenFingerprints = new Set<string>(
    excludeQuestionTexts.map((t) => normalizeQuestionFingerprint(t)).filter(Boolean)
  );
  const seenCorrectAnswerPairs = new Set<string>();
  const uniqueQuestions: Question[] = [];

  for (const q of questions) {
    const fp = normalizeQuestionFingerprint(q.question);
    if (!fp) continue;
    if (seenFingerprints.has(fp)) continue;

    // Kiểm tra thêm tổ hợp (ý chính câu hỏi + nội dung đáp án đúng) để tránh câu hỏi diễn đạt lại trùng ý
    const correctOptText = Array.isArray(q.options)
      ? normalizeQuestionFingerprint(q.options[q.correctIndex ?? 0] || '')
      : '';
    const stemWords = fp.split(' ').slice(0, 10).join(' ');
    const comboKey = `${stemWords}__${correctOptText}`;
    if (correctOptText && seenCorrectAnswerPairs.has(comboKey)) {
      continue;
    }

    seenFingerprints.add(fp);
    if (correctOptText) {
      seenCorrectAnswerPairs.add(comboKey);
    }
    uniqueQuestions.push(q);
  }

  const sourceList = uniqueQuestions.length > 0 ? uniqueQuestions : [];
  if (sourceList.length === 0) return [];

  // Bước 2: Chuẩn hóa từng câu hỏi và kiểm tra quy tắc hình ảnh 1 trong 2
  const normalized = sourceList.map((q, idx) => {
    const cleanOptions =
      Array.isArray(q.options) && q.options.length === 4
        ? q.options.map((o) => String(o).trim())
        : ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'];

    const rawQText = String(q.question || `Câu hỏi ${idx + 1}`).trim();
    const isAdvFromText = /\[(?:vận dụng\s*)?nâng cao\]/i.test(rawQText);
    const cleanQuestionText = rawQText
      .replace(/^câu\s*\d+\s*[:.]?\s*/i, '')
      .replace(/^\[(?:vận dụng\s*)?nâng cao\]\s*/i, '')
      .trim();

    const isAdvanced = Boolean(
      q.isAdvanced || q.difficulty === 'nang_cao' || isAdvFromText
    );

    const draft: Question = {
      ...q,
      id: q.id || `q-${Date.now()}-${idx + 1}`,
      question: cleanQuestionText,
      options: cleanOptions,
      correctIndex:
        typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3
          ? q.correctIndex
          : 0,
      explanation: String(
        q.explanation || 'Chúc mừng em đã trả lời chính xác kiến thức trọng tâm của bài học!'
      ).trim(),
      difficulty: isAdvanced ? 'nang_cao' : 'co_ban',
      isAdvanced,
      points: isAdvanced ? 15 : q.points || 10,
    };

    const resolvedMode = resolveVisualDisplayMode(draft);

    if (resolvedMode === 'question_image') {
      return {
        ...draft,
        visualDisplayMode: 'question_image' as const,
        optionVisuals: [],
        optionSvgs: [],
      };
    }

    if (resolvedMode === 'options_image') {
      const uniformVisuals = getUniformOptionVisuals(draft) || cleanOptions;
      return {
        ...draft,
        visualDisplayMode: 'options_image' as const,
        visualData: '',
        visualKey: '',
        questionSvg: '',
        optionVisuals: uniformVisuals,
      };
    }

    return {
      ...draft,
      visualDisplayMode: 'text_only' as const,
      visualType: 'none' as const,
      visualData: '',
      visualKey: '',
      questionSvg: '',
      optionVisuals: [],
      optionSvgs: [],
    };
  });

  // Bước 3: Đảm bảo trong bộ câu hỏi có từ 1 đến 3 câu hỏi nâng cao
  const total = normalized.length;
  if (total > 0) {
    const minAdvanced = 1;
    const maxAdvanced = Math.min(3, total);
    const desiredAdvanced = total <= 5 ? 1 : total <= 10 ? 2 : Math.min(3, total);

    const currentAdvIndices = normalized
      .map((q, i) => (q.isAdvanced ? i : -1))
      .filter((i) => i !== -1);

    if (currentAdvIndices.length > maxAdvanced) {
      const keepSet = new Set(currentAdvIndices.slice(-maxAdvanced));
      normalized.forEach((q, idx) => {
        const keep = keepSet.has(idx);
        q.isAdvanced = keep;
        q.difficulty = keep ? 'nang_cao' : 'co_ban';
        q.points = keep ? 15 : 10;
      });
    } else if (currentAdvIndices.length < minAdvanced) {
      const needed = Math.min(desiredAdvanced, total);
      for (let k = 0; k < needed; k++) {
        const targetIdx = total - 1 - k;
        if (targetIdx >= 0) {
          normalized[targetIdx].isAdvanced = true;
          normalized[targetIdx].difficulty = 'nang_cao';
          normalized[targetIdx].points = 15;
        }
      }
    }
  }

  return normalized;
}

export function buildQuizGenerationPromptAndSchema(params: {
  lessonTitle: string;
  subject?: string;
  grade?: number;
  className?: string;
  questionCount: number;
  content?: string;
  hasPdf: boolean;
  excludeQuestions?: string[];
}) {
  const {
    lessonTitle,
    subject = 'Công nghệ',
    grade,
    className = '',
    questionCount,
    content = '',
    hasPdf,
    excludeQuestions = [],
  } = params;

  const detectedGrade =
    grade ||
    (className.match(/[1-9]/) ? parseInt(className.match(/[1-9]/)![0], 10) : 4);

  const targetAdvancedCount =
    questionCount <= 5 ? 1 : questionCount <= 10 ? 2 : 3;

  const exclusionBlock =
    excludeQuestions.length > 0
      ? `\nDANH SÁCH CÁC CÂU HỎI ĐÃ TỪNG SỬ DỤNG (TUYỆT ĐỐI KHÔNG ĐƯỢC SỬ DỤNG LẠI HOẶC LẶP LẠI Ý CỦA CÁC CÂU NÀY):\n${excludeQuestions
          .slice(0, 30)
          .map((q, i) => `  - Câu cũ ${i + 1}: "${q}"`)
          .join('\n')}\n`
      : '';

  const systemInstruction = `Bạn là Chuyên gia Giáo dục Tiểu học & THCS hàng đầu Việt Nam (Chương trình GDPT 2018 - Kết nối tri thức với cuộc sống, Chân trời sáng tạo, Cánh diều).
Nhiệm vụ của bạn là đọc kỹ thông tin bài học và tài liệu Sách Giáo Khoa (PDF) do giáo viên cung cấp để biên soạn đúng ${questionCount} câu hỏi trắc nghiệm khách quan hoàn toàn mới, MANG TÍNH CHIỀU SÂU SƯ PHẠM và chính xác tuyệt đối.

CÁC QUY TẮC BẮT BUỘC TUYỆT ĐỐI (KHÔNG ĐƯỢC VI PHẠM):
1. ĐỌC KỸ BÀI HỌC TRONG SÁCH GIÁO KHOA / PDF VÀ BÁM SÁT 100% NỘI DUNG:
   - Môn học: "${subject}"
   - Khối/Lớp: Khối ${detectedGrade} (${className || `Lớp ${detectedGrade}`})
   - Yêu cầu bài học từ giáo viên: "${lessonTitle}"
   - ${
     hasPdf
       ? `Giáo viên ĐÃ TẢI LÊN FILE PDF SÁCH GIÁO KHOA. Bạn BẮT BUỘC phải tìm chính xác bài "${lessonTitle}" trong file PDF sách giáo khoa "${subject} ${detectedGrade}" (tra cứu Mục lục và các trang nội dung của bài học đó trong PDF), trích xuất đầy đủ tên bài học viết IN HOA vào trường "lessonTitle" (ví dụ: "BÀI 3: VẬT LIỆU VÀ DỤNG CỤ TRỒNG HOA, CÂY CẢNH TRONG CHẬU") và đọc TẤT CẢ các mục kiến thức, hình minh họa, khám phá, luyện tập, vận dụng trong bài học đó để tạo bộ câu hỏi.`
       : `Hãy xác định đúng tên đầy đủ của "${lessonTitle}" thuộc môn "${subject}" lớp ${detectedGrade} theo chương trình Sách Giáo Khoa GDPT 2018, xuất tên bài đầy đủ viết IN HOA vào trường "lessonTitle" và tạo bộ câu hỏi bám sát 100% nội dung kiến thức của bài học đó.`
   }
   - NGHIÊM CẤM TUYỆT ĐỐI việc lệch môn học: Toàn bộ ${questionCount} câu hỏi phải thuộc đúng bài học "${lessonTitle}" của môn "${subject}".

2. CÂU HỎI PHẢI MANG TÍNH CHIỀU SÂU & TUYỆT ĐỐI KHÔNG TRÙNG LẶP NỘI DUNG:
   - Mỗi câu hỏi trong ${questionCount} câu phải khai thác một đơn vị kiến thức, tình huống hoặc góc nhìn hoàn toàn khác nhau trong bài học (từ mục Khởi động, Khám phá, Thực hành đến Vận dụng).
   - Câu hỏi phải mang tính CHIỀU SÂU SƯ PHẠM: giúp học sinh hiểu bản chất vấn đề, mối quan hệ nguyên nhân - kết quả ("Vì sao...", "Mục đích chính của bước... là gì?", "Nếu thực hiện sai thao tác... thì điều gì sẽ xảy ra?", "So sánh đặc điểm..."), rèn luyện tư duy phản biện và kỹ năng thực hành thực tế thay vì các câu hỏi máy móc, bề nổi.
   - TUYỆT ĐỐI KHÔNG ĐƯỢC sử dụng lại hoặc diễn đạt lại các câu hỏi có nội dung trùng lặp vì sẽ gây nhàm chán cho học sinh.${exclusionBlock}

3. BẮT BUỘC CÓ TỪ 1 ĐẾN 3 CÂU HỎI NÂNG CAO (difficulty = "nang_cao", isAdvanced = true):
   - Trong tổng số ${questionCount} câu hỏi, BẮT BUỘC phải có đúng ${targetAdvancedCount} câu hỏi nâng cao / vận dụng thực tiễn ("difficulty": "nang_cao", "isAdvanced": true).
   - Các câu hỏi nâng cao đặt học sinh vào tình huống thực tế sâu sắc, giải quyết vấn đề hoặc liên hệ thực tiễn từ bài học.
   - Các câu hỏi còn lại là câu hỏi thông hiểu và nhận biết có chiều sâu ("difficulty": "co_ban", "isAdvanced": false).

4. ƯU TIÊN CÁC CÂU HỎI CÓ HÌNH ẢNH MINH HỌA TRONG CÂU HỎI HOẶC TRONG CÁC ĐÁP ÁN (CHỈ HIỂN THỊ 1 TRONG 2):
   - Ưu tiên các câu hỏi có hình ảnh minh họa trực quan trong câu hỏi hoặc trong các đáp án.
   - QUY TẮC BẮT BUỘC VỀ VỊ TRÍ HÌNH ẢNH (CHỈ HIỂN THỊ 1 TRONG 2 NƠI):
     + Chế độ 1 ("visualDisplayMode": "question_image"): Hình ảnh hiển thị Ở CÂU HỎI -> Khi đó cả 4 đáp án A, B, C, D BẮT BUỘC chỉ là VĂN BẢN (optionVisuals = []).
     + Chế độ 2 ("visualDisplayMode": "options_image"): Hình ảnh hiển thị Ở CẢ 4 ĐÁP ÁN A, B, C, D -> Khi đó câu hỏi BẮT BUỘC chỉ là VĂN BẢN (visualKey = "", visualData = "") và mảng optionVisuals phải có đủ 4 mã hình ảnh khác nhau tương ứng với 4 đáp án.
     + Chế độ 3 ("visualDisplayMode": "text_only"): Câu hỏi lý thuyết thuần văn bản (khi câu hỏi không có hình vẽ tương ứng chính xác trong danh mục dưới đây).
   - CHỈ sử dụng mã hình ảnh ("visualKey" / "optionVisuals") khi thực sự khớp 100% với nội dung câu hỏi:
     * Môn Công nghệ: "flower_pot" (Chậu trồng cây có lỗ thoát nước), "plant_flower" (Chậu hoa đang nở), "cactus_succulent" (Cây xương rồng/sen đá), "bonsai_tree" (Cây cảnh lá xanh), "soil_substrate" (Giá thể trồng cây: đất, xơ dừa, trấu hun), "garden_trowel" (Xẻng nhỏ làm vườn), "garden_fork" (Chĩa ba xới đất), "watering_can" (Bình tưới nước hoa sen), "pruning_shears" (Kéo cắt cành), "garden_gloves" (Găng tay làm vườn), "seed_sprout" (Gieo hạt và cây con), "sunlight_care" (Ánh sáng mặt trời), "fertilizer_bag" (Phân bón cây), "desk_lamp" (Đèn học), "electric_fan" (Quạt điện), "television_set" (Máy thu hình/Ti vi), "radio_set" (Máy thu thanh/Radio), "refrigerator" (Tủ lạnh), "telephone_emergency" (Điện thoại khẩn cấp), "traffic_sign_stop" (Biển báo giao thông), "paper_pinwheel" (Chong chóng đồ chơi dân gian), "wrench_screwdriver" (Cờ-lê và Tua-vít lắp ghép mô hình), "solar_wind_model" (Mô hình điện mặt trời/điện gió).
     * Môn Tin học: "cpu_tower", "monitor", "mouse", "keyboard", "speaker", "printer", "headphones", "usb_drive", "hard_drive", "power_cable", "mousepad", "laptop", "hardware_overview", "word_icon", "powerpoint_icon", "excel_icon", "paint_icon", "scratch_icon", "browser_icon", "windows_icon", "folder_icon", "software_overview".
     * Môn Kỹ năng số: "strong_password", "shield_antivirus", "phishing_warning", "cloud_storage", "search_engine", "digital_citizenship", "ergonomic_posture".
     * Môn Trí tuệ nhân tạo: "ai_robot", "neural_brain", "face_recognition", "voice_assistant", "smart_home_iot", "self_driving_car", "chatbot_prompt".`;

  const promptText = `Hãy phân tích kỹ tài liệu và thông tin bài học sau đây để tạo bộ câu hỏi trắc nghiệm có chiều sâu:
- Môn học: ${subject}
- Khối/Lớp: Khối ${detectedGrade} (${className || `Lớp ${detectedGrade}`})
- Bài học giáo viên yêu cầu: "${lessonTitle}"
${content ? `- Ghi chú bổ sung: ${content}` : ''}
${exclusionBlock}
Yêu cầu xuất JSON chuẩn xác gồm:
1. "lessonTitle": Tên đầy đủ chính xác của bài học trong Sách Giáo Khoa viết IN HOA TOÀN BỘ.
2. "questions": Danh sách đúng ${questionCount} câu hỏi trắc nghiệm KHÁC NHAU HOÀN TOÀN (tuyệt đối không lặp lại câu hỏi hoặc trùng ý), mang tính chiều sâu sư phạm, bám sát 100% nội dung kiến thức trong bài "${lessonTitle}" của môn ${subject} (Khối ${detectedGrade}).
   - Bắt buộc có đúng ${targetAdvancedCount} câu hỏi nâng cao ("isAdvanced": true, "difficulty": "nang_cao").
   - Ưu tiên các câu hỏi có hình ảnh minh họa trực quan trong câu hỏi ("question_image") hoặc trong 4 đáp án ("options_image") — hình ảnh chỉ hiển thị ở 1 trong 2 nơi.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      lessonTitle: {
        type: Type.STRING,
        description: 'Tên đầy đủ chính xác của bài học trong SGK viết IN HOA TOÀN BỘ',
      },
      subject: { type: Type.STRING },
      grade: { type: Type.NUMBER },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            difficulty: {
              type: Type.STRING,
              description: '"co_ban" hoặc "nang_cao" (bắt buộc có từ 1 đến 3 câu "nang_cao")',
            },
            isAdvanced: {
              type: Type.BOOLEAN,
              description: 'true nếu là câu hỏi nâng cao / vận dụng (từ 1 đến 3 câu trong bộ đề)',
            },
            visualDisplayMode: {
              type: Type.STRING,
              description: '"question_image" (hình ở câu hỏi, đáp án là chữ) HOẶC "options_image" (hình ở 4 đáp án, câu hỏi là chữ) HOẶC "text_only"',
            },
            visualKey: {
              type: Type.STRING,
            },
            optionVisuals: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            visualType: { type: Type.STRING },
            visualData: { type: Type.STRING },
            points: { type: Type.INTEGER },
          },
          required: [
            'id',
            'question',
            'options',
            'difficulty',
            'isAdvanced',
            'visualDisplayMode',
            'optionVisuals',
            'correctIndex',
            'explanation',
            'visualType',
            'visualData',
          ],
        },
      },
    },
    required: ['lessonTitle', 'questions'],
  };

  return { systemInstruction, promptText, responseSchema };
}

async function generateQuizDirectlyWithClientKey(
  apiKey: string,
  params: {
    lessonTitle: string;
    subject?: string;
    grade?: number;
    className?: string;
    questionCount: number;
    content?: string;
    pdfBase64?: string | null;
    excludeQuestions?: string[];
  }
): Promise<{
  success: boolean;
  questions?: Question[];
  resolvedLessonTitle?: string;
  isQuotaError?: boolean;
  isAuthError?: boolean;
  errorMessage?: string;
}> {
  const ai = new GoogleGenAI({ apiKey });
  const { systemInstruction, promptText, responseSchema } =
    buildQuizGenerationPromptAndSchema({
      ...params,
      hasPdf: Boolean(params.pdfBase64),
    });

  let contentsPayload: any = promptText;
  if (params.pdfBase64) {
    contentsPayload = {
      parts: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: params.pdfBase64,
          },
        },
        {
          text: promptText,
        },
      ],
    };
  }

  let lastErr: any = null;
  let detectedQuotaErr: any = null;

  for (const modelName of STABLE_GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contentsPayload,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        const finalTitle = String(parsed.lessonTitle || params.lessonTitle || '')
          .trim()
          .toUpperCase();

        const normalizedList = normalizeQuestionVisuals(
          parsed.questions,
          params.excludeQuestions
        );

        if (normalizedList.length > 0) {
          return {
            success: true,
            questions: normalizedList,
            resolvedLessonTitle: finalTitle,
          };
        }
      }
    } catch (err: any) {
      lastErr = err;
      const analysis = analyzeGeminiError(err);
      if (analysis.isQuotaError) {
        detectedQuotaErr = err;
      }
      if (analysis.isAuthError) {
        return {
          success: false,
          isAuthError: true,
          errorMessage: analysis.formattedMessage,
        };
      }
      console.warn(`Client Gemini model ${modelName} attempt failed:`, err);
    }
  }

  const finalAnalysis = analyzeGeminiError(detectedQuotaErr || lastErr);
  return {
    success: false,
    isQuotaError: finalAnalysis.isQuotaError,
    isAuthError: finalAnalysis.isAuthError,
    errorMessage: finalAnalysis.formattedMessage,
  };
}

export async function extractQuizWithGemini(params: {
  lessonTitle: string;
  subject?: string;
  grade?: number;
  className?: string;
  questionCount: number;
  content?: string;
  pdfBase64?: string | null;
  excludeQuestions?: string[];
}): Promise<{
  success: boolean;
  questions?: Question[];
  resolvedLessonTitle?: string;
  isQuotaError?: boolean;
  isAuthError?: boolean;
  message?: string;
}> {
  const userKey = getStoredGeminiApiKey();

  // 1. Nếu giáo viên đã nhập khóa Gemini API trên trình duyệt -> Gọi trực tiếp tới Model ổn định (gemini-2.5-flash)
  if (userKey) {
    const directRes = await generateQuizDirectlyWithClientKey(userKey, params);
    if (directRes.success && directRes.questions && directRes.questions.length > 0) {
      return directRes;
    }

    // Nếu khóa API của người dùng bị hết QUOTA hoặc không hợp lệ -> Báo lỗi NGAY LẬP TỨC yêu cầu thay đổi API KEY GEMINI mới!
    if (directRes.isQuotaError || directRes.isAuthError) {
      return {
        success: false,
        isQuotaError: directRes.isQuotaError,
        isAuthError: directRes.isAuthError,
        message: directRes.errorMessage,
      };
    }

    // Nếu gửi kèm file PDF quá lớn (>20MB giới hạn inlineData của Google) gây lỗi payload, thử gọi lại với thông tin bài học chuẩn
    if (params.pdfBase64) {
      const retryWithoutOversizedPdf = await generateQuizDirectlyWithClientKey(userKey, {
        ...params,
        pdfBase64: null,
      });
      if (
        retryWithoutOversizedPdf.success &&
        retryWithoutOversizedPdf.questions &&
        retryWithoutOversizedPdf.questions.length > 0
      ) {
        return retryWithoutOversizedPdf;
      }
      if (retryWithoutOversizedPdf.isQuotaError || retryWithoutOversizedPdf.isAuthError) {
        return {
          success: false,
          isQuotaError: retryWithoutOversizedPdf.isQuotaError,
          isAuthError: retryWithoutOversizedPdf.isAuthError,
          message: retryWithoutOversizedPdf.errorMessage,
        };
      }
    }
  }

  // 2. Gọi qua Backend Server / Vercel Serverless Function (/api/gemini/extract-quiz)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userKey) {
    headers['x-gemini-api-key'] = userKey;
  }

  const tryServerCall = async (includePdf: boolean) => {
    const response = await fetch('/api/gemini/extract-quiz', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...params,
        pdfBase64: includePdf ? params.pdfBase64 : null,
        apiKey: userKey || undefined,
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const errText = data?.message || data?.error || `HTTP ${response.status}`;
      throw new Error(errText);
    }
    return data;
  };

  try {
    let result: any;
    try {
      const canSendPdfToVercel =
        Boolean(params.pdfBase64) && (params.pdfBase64?.length || 0) <= 3_800_000;
      result = await tryServerCall(canSendPdfToVercel);
    } catch (firstErr: any) {
      const firstAnalysis = analyzeGeminiError(firstErr);
      if (firstAnalysis.isQuotaError || firstAnalysis.isAuthError) {
        return {
          success: false,
          isQuotaError: firstAnalysis.isQuotaError,
          isAuthError: firstAnalysis.isAuthError,
          message: firstAnalysis.formattedMessage,
        };
      }
      if (params.pdfBase64) {
        result = await tryServerCall(false);
      } else {
        throw firstErr;
      }
    }

    if (result?.success && Array.isArray(result.data?.questions) && result.data.questions.length > 0) {
      const normalizedQuestions = normalizeQuestionVisuals(
        result.data.questions,
        params.excludeQuestions
      );
      const resolvedTitle = String(
        result.data.lessonTitle || params.lessonTitle || 'BÀI HỌC'
      )
        .trim()
        .toUpperCase();

      return {
        success: true,
        questions: normalizedQuestions,
        resolvedLessonTitle: resolvedTitle,
      };
    }

    const errAnalysis = analyzeGeminiError(result?.message || result?.error || '');
    return {
      success: false,
      isQuotaError: Boolean(result?.isQuotaError || errAnalysis.isQuotaError),
      isAuthError: Boolean(result?.isAuthError || errAnalysis.isAuthError),
      message: errAnalysis.formattedMessage,
    };
  } catch (err: any) {
    console.error('Gemini API extraction failed:', err);
    const analysis = analyzeGeminiError(err);
    return {
      success: false,
      isQuotaError: analysis.isQuotaError,
      isAuthError: analysis.isAuthError,
      message: analysis.formattedMessage,
    };
  }
}
