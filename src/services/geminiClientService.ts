import { GoogleGenAI, Type } from '@google/genai';
import { Question } from '../types';
import {
  resolveVisualDisplayMode,
  getUniformOptionVisuals,
} from '../components/ClassroomGame/QuestionVisualIllustration';
import {
  resolveCurriculumLessonTitle,
  buildSubjectCurriculumQuestions,
} from './curriculumFallbackBank';

const GEMINI_API_KEY_STORAGE_KEY = 'FOREST_CLIMB_GEMINI_API_KEY_V1';
const LEGACY_API_KEY_STORAGE_KEYS = [
  'FOREST_CLIMB_GEMINI_API_KEY_V1',
  'forest_climb_gemini_api_key',
  'gemini_api_key',
  'GEMINI_API_KEY',
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

export async function testGeminiApiKey(
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    return { success: false, message: 'Khóa API đang để trống!' };
  }
  try {
    const ai = new GoogleGenAI({ apiKey: cleanKey });
    const modelsToTry = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
    for (const m of modelsToTry) {
      try {
        const res = await ai.models.generateContent({
          model: m,
          contents: 'Trả lời ngắn gọn: OK',
        });
        if (res.text) {
          return {
            success: true,
            message: 'Kết nối Gemini AI thành công! Khóa API hoạt động tốt.',
          };
        }
      } catch {
        // try next model
      }
    }
    return {
      success: false,
      message: 'Không thể xác thực khóa API. Vui lòng kiểm tra lại khóa AIzaSy...',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi kết nối: ${err?.message || 'Khóa API không hợp lệ'}`,
    };
  }
}

/**
 * Chuẩn hóa danh sách câu hỏi đảm bảo:
 * 1. Trong bộ câu hỏi BẮT BUỘC có từ 1 đến 3 câu hỏi nâng cao (isAdvanced: true, difficulty: 'nang_cao').
 * 2. Ưu tiên các câu hỏi có hình ảnh minh họa trực quan trong câu hỏi HOẶC trong các đáp án (hình ảnh CHỈ hiển thị 1 trong 2 nơi):
 *    - 'question_image': Câu hỏi hiển thị hình ảnh -> 4 đáp án A, B, C, D là VĂN BẢN THUẦN TÚY (optionVisuals = [], optionSvgs = []).
 *    - 'options_image': 4 đáp án A, B, C, D là các hình ảnh đồng nhất -> Câu hỏi là VĂN BẢN THUẦN TÚY (visualData = '', visualKey = '', questionSvg = '').
 *    - 'text_only': Câu hỏi lý thuyết không cần hình ảnh -> Không ép hình ảnh sai lệch.
 */
export function normalizeQuestionVisuals(questions: Question[]): Question[] {
  if (!Array.isArray(questions) || questions.length === 0) return [];

  const normalized = questions.map((q, idx) => {
    const cleanOptions =
      Array.isArray(q.options) && q.options.length === 4
        ? q.options.map((o) => String(o).trim())
        : ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'];

    const rawQText = String(q.question || `Câu hỏi ${idx + 1}`).trim();
    const isAdvFromText = /\[(?:vận dụng\s*)?nâng cao\]/i.test(rawQText);
    const cleanQuestionText = rawQText.replace(/^\[(?:vận dụng\s*)?nâng cao\]\s*/i, '').trim();

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
        q.explanation || 'Chúc mừng em đã nắm vững kiến thức bài học!'
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

  // Đảm bảo số lượng câu hỏi nâng cao trong bộ đề luôn nằm trong khoảng từ 1 đến 3 câu
  const total = normalized.length;
  const minAdvanced = 1;
  const maxAdvanced = Math.min(3, total);
  const desiredAdvanced = total <= 5 ? 1 : total <= 10 ? 2 : Math.min(3, total);

  let currentAdvIndices = normalized
    .map((q, i) => (q.isAdvanced ? i : -1))
    .filter((i) => i !== -1);

  // Nếu có nhiều hơn 3 câu nâng cao -> chỉ giữ lại 3 câu nâng cao cuối cùng
  if (currentAdvIndices.length > maxAdvanced) {
    const keepSet = new Set(currentAdvIndices.slice(-maxAdvanced));
    normalized.forEach((q, idx) => {
      const keep = keepSet.has(idx);
      q.isAdvanced = keep;
      q.difficulty = keep ? 'nang_cao' : 'co_ban';
      q.points = keep ? 15 : 10;
    });
  } else if (currentAdvIndices.length < minAdvanced) {
    // Nếu chưa có câu nâng cao nào -> chọn từ 1 đến desiredAdvanced câu ở cuối bộ đề làm câu hỏi nâng cao
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
}) {
  const {
    lessonTitle,
    subject = 'Công nghệ',
    grade,
    className = '',
    questionCount,
    content = '',
    hasPdf,
  } = params;

  const detectedGrade =
    grade ||
    (className.match(/[1-9]/) ? parseInt(className.match(/[1-9]/)![0], 10) : 4);

  const suggestedCurriculumTitle = resolveCurriculumLessonTitle(
    lessonTitle,
    subject,
    detectedGrade
  );

  const targetAdvancedCount =
    questionCount <= 5 ? 1 : questionCount <= 10 ? 2 : 3;

  const systemInstruction = `Bạn là Chuyên gia Giáo dục Tiểu học & THCS hàng đầu Việt Nam (Chương trình GDPT 2018 - các bộ sách Kết nối tri thức với cuộc sống, Chân trời sáng tạo, Cánh diều).
Nhiệm vụ của bạn là đọc kỹ thông tin bài học và tài liệu Sách Giáo Khoa (PDF) do giáo viên cung cấp để biên soạn đúng ${questionCount} câu hỏi trắc nghiệm khách quan.

CÁC QUY TẮC BẮT BUỘC TUYỆT ĐỐI (KHÔNG ĐƯỢC VI PHẠM):
1. XÁC ĐỊNH ĐÚNG BÀI HỌC VÀ ĐỌC TOÀN BỘ KIẾN THỨC TRONG BÀI:
   - Giáo viên đang chọn:
     + Môn học: "${subject}"
     + Khối/Lớp: "Khối ${detectedGrade}" (${className || `Lớp ${detectedGrade}`})
     + Yêu cầu bài học: "${lessonTitle}" (Gợi ý chương trình GDPT 2018: "${suggestedCurriculumTitle}")
   - ${
     hasPdf
       ? `Giáo viên ĐÃ TẢI LÊN FILE PDF SÁCH GIÁO KHOA. Bạn BẮT BUỘC phải tìm xem "${lessonTitle}" trong file PDF sách giáo khoa "${subject} ${detectedGrade}" đó là bài học gì (tra cứu Mục lục hoặc tiêu đề bài học trong PDF), trích xuất đầy đủ tên bài học viết IN HOA vào trường "lessonTitle" (ví dụ: "BÀI 3: VẬT LIỆU VÀ DỤNG CỤ TRỒNG HOA, CÂY CẢNH TRONG CHẬU") và đọc TẤT CẢ các nội dung kiến thức, hình vẽ, hộp kiến thức, luyện tập, vận dụng trong bài học đó để tạo bộ câu hỏi.`
       : `Hãy xác định đúng tên đầy đủ của "${lessonTitle}" thuộc môn "${subject}" lớp ${detectedGrade} theo chương trình GDPT 2018, xuất tên bài đầy đủ viết IN HOA vào trường "lessonTitle" (ví dụ: "${suggestedCurriculumTitle}") và tạo bộ câu hỏi bám sát 100% nội dung bài học đó.`
   }
   - NGHIÊM CẤM TUYỆT ĐỐI việc lệch môn học: Khi môn học là "${subject}", 100% câu hỏi phải thuộc bài học "${lessonTitle}" của môn "${subject}". Tuyệt đối KHÔNG ĐƯỢC sinh câu hỏi môn Toán (đồng hồ, phép tính...) hay môn Tin học khi người dùng đang chọn môn Công nghệ!

2. BẮT BUỘC CÓ TỪ 1 ĐẾN 3 CÂU HỎI NÂNG CAO (difficulty = "nang_cao", isAdvanced = true):
   - Trong tổng số ${questionCount} câu hỏi, BẮT BUỘC phải có đúng ${targetAdvancedCount} câu hỏi nâng cao / vận dụng thực tiễn (đặt "difficulty": "nang_cao" và "isAdvanced": true).
   - Các câu hỏi nâng cao tập trung vào vận dụng kiến thức trong bài học để giải quyết tình huống thực tế, giải thích nguyên nhân "Vì sao...", hoặc xử lý tình huống thực hành.
   - Các câu hỏi còn lại là câu hỏi nhận biết và thông hiểu ("difficulty": "co_ban", "isAdvanced": false).

3. ƯU TIÊN CÁC CÂU HỎI CÓ HÌNH ẢNH MINH HỌA TRONG CÂU HỎI HOẶC TRONG CÁC ĐÁP ÁN (HÌNH ẢNH CHỈ HIỂN THỊ 1 TRONG 2):
   - Ưu tiên cao các câu hỏi có hình ảnh minh họa trực quan (chiếm khoảng 75% - 85% tổng số câu hỏi) để học sinh hứng thú.
   - QUY TẮC BẮT BUỘC VỀ VỊ TRÍ HÌNH ẢNH (CHỈ HIỂN THỊ 1 TRONG 2 NƠI):
     + Chế độ 1 ("visualDisplayMode": "question_image"): Hình ảnh hiển thị Ở CÂU HỎI -> Khi đó cả 4 đáp án A, B, C, D BẮT BUỘC chỉ là VĂN BẢN (optionVisuals = []).
     + Chế độ 2 ("visualDisplayMode": "options_image"): Hình ảnh hiển thị Ở CẢ 4 ĐÁP ÁN A, B, C, D -> Khi đó câu hỏi BẮT BUỘC chỉ là VĂN BẢN (visualKey = "", visualData = "") và mảng optionVisuals phải có đủ 4 mã hình ảnh tương ứng với 4 đáp án.
     + Chế độ 3 ("visualDisplayMode": "text_only"): Câu hỏi thuần văn bản (khi nội dung lý thuyết không cần hình).
   - Danh mục mã hình vẽ chuẩn ("visualKey" / "optionVisuals") theo từng môn:
     * Môn Công nghệ (Trồng hoa, cây cảnh, dụng cụ & thiết bị):
       "flower_pot" (Chậu trồng cây có lỗ thoát nước), "plant_flower" (Chậu hoa đang nở), "cactus_succulent" (Cây xương rồng/sen đá), "bonsai_tree" (Cây cảnh lá xanh), "soil_substrate" (Giá thể trồng cây: đất, xơ dừa, trấu hun), "garden_trowel" (Xẻng nhỏ làm vườn), "garden_fork" (Chĩa ba xới đất), "watering_can" (Bình tưới nước hoa sen), "pruning_shears" (Kéo cắt cành), "garden_gloves" (Găng tay làm vườn), "seed_sprout" (Gieo hạt và cây con), "sunlight_care" (Ánh sáng mặt trời), "fertilizer_bag" (Phân bón cây), "desk_lamp" (Đèn học), "electric_fan" (Quạt điện), "television_set" (Máy thu hình/Ti vi), "radio_set" (Máy thu thanh/Radio), "refrigerator" (Tủ lạnh), "telephone_emergency" (Điện thoại khẩn cấp), "traffic_sign_stop" (Biển báo giao thông), "paper_pinwheel" (Chong chóng đồ chơi dân gian), "wrench_screwdriver" (Cờ-lê và Tua-vít lắp ghép mô hình), "solar_wind_model" (Mô hình điện mặt trời/điện gió).
     * Môn Tin học:
       "cpu_tower", "monitor", "mouse", "keyboard", "speaker", "printer", "headphones", "usb_drive", "hard_drive", "power_cable", "mousepad", "laptop", "hardware_overview", "word_icon", "powerpoint_icon", "excel_icon", "paint_icon", "scratch_icon", "browser_icon", "windows_icon", "folder_icon", "software_overview".
     * Môn Kỹ năng số:
       "strong_password", "shield_antivirus", "phishing_warning", "cloud_storage", "search_engine", "digital_citizenship", "ergonomic_posture".
     * Môn Trí tuệ nhân tạo:
       "ai_robot", "neural_brain", "face_recognition", "voice_assistant", "smart_home_iot", "self_driving_car", "chatbot_prompt".`;

  const promptText = `Hãy phân tích kỹ tài liệu và thông tin sau đây:
- Môn học: ${subject}
- Khối/Lớp: Khối ${detectedGrade} (${className || `Lớp ${detectedGrade}`})
- Bài học người dùng nhập: "${lessonTitle}" (Tên bài chuẩn tham chiếu nếu trùng: "${suggestedCurriculumTitle}")
${content ? `- Ghi chú bổ sung: ${content}` : ''}

Yêu cầu xuất JSON chuẩn xác gồm:
1. "lessonTitle": Tên đầy đủ của bài học viết IN HOA TOÀN BỘ (ví dụ: "${suggestedCurriculumTitle}"). Không được chỉ ghi mỗi chữ "${lessonTitle.toUpperCase()}" nếu xác định được tên bài học trong sách giáo khoa.
2. "questions": Danh sách đúng ${questionCount} câu hỏi trắc nghiệm bám sát 100% kiến thức trong bài học của môn ${subject} (tuyệt đối không lạc sang môn học khác).
   - Có đúng ${targetAdvancedCount} câu hỏi nâng cao ("isAdvanced": true, "difficulty": "nang_cao").
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

  return { systemInstruction, promptText, responseSchema, suggestedCurriculumTitle };
}

const GEMINI_MODEL_CHAIN = [
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash',
];

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
  }
): Promise<{
  success: boolean;
  questions?: Question[];
  resolvedLessonTitle?: string;
}> {
  const ai = new GoogleGenAI({ apiKey });
  const { systemInstruction, promptText, responseSchema, suggestedCurriculumTitle } =
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

  for (const modelName of GEMINI_MODEL_CHAIN) {
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
        const rawResolved = String(parsed.lessonTitle || '').trim().toUpperCase();
        const finalTitle =
          rawResolved && rawResolved.length > params.lessonTitle.trim().length
            ? rawResolved
            : suggestedCurriculumTitle;

        return {
          success: true,
          questions: normalizeQuestionVisuals(parsed.questions),
          resolvedLessonTitle: finalTitle,
        };
      }
    } catch (err) {
      console.warn(`Client Gemini model ${modelName} attempt failed:`, err);
    }
  }

  return { success: false };
}

export async function extractQuizWithGemini(params: {
  lessonTitle: string;
  subject?: string;
  grade?: number;
  className?: string;
  questionCount: number;
  content?: string;
  pdfBase64?: string | null;
}): Promise<{
  success: boolean;
  questions?: Question[];
  resolvedLessonTitle?: string;
  fallback?: boolean;
  message?: string;
}> {
  const userKey = getStoredGeminiApiKey();
  const suggestedTitle = resolveCurriculumLessonTitle(
    params.lessonTitle,
    params.subject || 'Công nghệ',
    params.grade || params.className
  );

  // 1. Nếu người dùng đã cấu hình API Key trên trình duyệt -> Gọi trực tiếp GoogleGenAI từ trình duyệt trước
  // (Giúp đọc trực tiếp file PDF dung lượng lớn lên tới 20MB+ mà không bị giới hạn 4.5MB body của Vercel Serverless)
  if (userKey) {
    const directRes = await generateQuizDirectlyWithClientKey(userKey, params);
    if (directRes.success && directRes.questions && directRes.questions.length > 0) {
      return directRes;
    }
  }

  // 2. Gọi qua API Server (/api/gemini/extract-quiz)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userKey) {
    headers['x-gemini-api-key'] = userKey;
  }

  // Lưu ý: Trên Vercel Serverless, body vượt quá ~4.2MB sẽ bị lỗi 413 Payload Too Large.
  // Nếu file PDF nhỏ hơn 3.2MB base64 thì gửi trực tiếp; nếu lớn hơn hoặc bị lỗi 413 thì tự động gửi yêu cầu kèm thông tin bài học chuẩn để Server Gemini vẫn xử lý mượt mà.
  const isPdfSmallEnoughForServerless =
    !params.pdfBase64 || params.pdfBase64.length <= 3_200_000;

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
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  };

  try {
    let result: any;
    try {
      result = await tryServerCall(isPdfSmallEnoughForServerless);
    } catch (firstErr) {
      if (params.pdfBase64 && isPdfSmallEnoughForServerless) {
        // Thử lại không đính kèm base64 nặng nếu gặp lỗi 413 trên Vercel
        result = await tryServerCall(false);
      } else {
        throw firstErr;
      }
    }

    if (result?.success && result.data?.questions?.length > 0) {
      const normalizedQuestions = normalizeQuestionVisuals(result.data.questions);
      const rawServerTitle = String(result.data.lessonTitle || '').trim().toUpperCase();
      const resolvedTitle =
        rawServerTitle && rawServerTitle.length > params.lessonTitle.trim().length
          ? rawServerTitle
          : suggestedTitle;

      return {
        success: true,
        questions: normalizedQuestions,
        resolvedLessonTitle: resolvedTitle,
      };
    }
  } catch (err: any) {
    console.warn('Server Gemini API fallback triggered:', err);
  }

  // 3. Nếu chưa có API Key hoặc mất kết nối -> Sử dụng Ngân hàng bài học Chương trình GDPT 2018 đúng 100% Môn học & Bài học
  const fallbackCurriculum = buildSubjectCurriculumQuestions({
    lessonTitle: params.lessonTitle,
    subject: params.subject || 'Công nghệ',
    gradeOrClassName: params.grade || params.className,
    questionCount: params.questionCount,
  });

  return {
    success: true,
    fallback: true,
    questions: normalizeQuestionVisuals(fallbackCurriculum.questions),
    resolvedLessonTitle: fallbackCurriculum.resolvedLessonTitle,
    message: `Đã trích xuất bộ câu hỏi chuẩn Chương trình GDPT 2018 cho bài "${fallbackCurriculum.resolvedLessonTitle}"!`,
  };
}
