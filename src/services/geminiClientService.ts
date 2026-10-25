import { GoogleGenAI, Type } from '@google/genai';
import { Question } from '../types';
import { resolveVisualDisplayMode } from '../components/ClassroomGame/QuestionVisualIllustration';

const STORAGE_KEY = 'gemini_user_api_key';

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function saveStoredApiKey(apiKey: string): void {
  if (typeof window === 'undefined') return;
  if (!apiKey.trim()) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, apiKey.trim());
  }
}

export async function testGeminiApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Ping',
    });
    if (response && response.text) {
      return { success: true, message: 'Kết nối thành công với Google Gemini AI (Model: gemini-3.8-flash)!' };
    }
    return { success: false, message: 'Không nhận được phản hồi từ Gemini API.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Khóa API không hợp lệ hoặc đã hết hạn.' };
  }
}

/**
 * Chuẩn hóa quy tắc bắt buộc cho từng câu hỏi:
 * - Khi câu hỏi hiển thị hình ảnh ('question_image') -> Đáp án BẮT BUỘC là văn bản (optionVisuals = []).
 * - Khi đáp án là các hình ảnh ('options_image') -> Câu hỏi BẮT BUỘC là văn bản (visualData = '', visualKey = '') và cả 4 đáp án đều có hình ảnh đồng nhất.
 */
export function normalizeQuestionVisuals(questions: Question[]): Question[] {
  return questions.map((q) => {
    const resolvedMode = resolveVisualDisplayMode(q);

    if (resolvedMode === 'options_image') {
      const uniformOptionVisuals = q.options.map((opt, idx) => q.optionVisuals?.[idx] || opt);
      return {
        ...q,
        visualDisplayMode: 'options_image',
        visualData: '',
        visualKey: '',
        questionSvg: undefined,
        optionVisuals: uniformOptionVisuals,
      };
    }

    if (resolvedMode === 'text_only') {
      return {
        ...q,
        visualDisplayMode: 'text_only',
        visualData: '',
        visualKey: '',
        optionVisuals: [],
      };
    }

    // Mode 'question_image': Câu hỏi có hình ảnh -> 4 đáp án chỉ hiển thị văn bản
    return {
      ...q,
      visualDisplayMode: 'question_image',
      optionVisuals: [],
      optionSvgs: undefined,
    };
  });
}

export async function extractQuizWithGemini({
  lessonTitle,
  subject = '',
  grade = 3,
  className = '',
  questionCount = 5,
  content = '',
  pdfBase64 = null,
}: {
  lessonTitle: string;
  subject?: string;
  grade?: number;
  className?: string;
  questionCount: number;
  content?: string;
  pdfBase64?: string | null;
}): Promise<{
  success: boolean;
  resolvedLessonTitle?: string;
  questions?: Question[];
  message?: string;
}> {
  const userKey = getStoredApiKey();

  // Strategy 1: Try Server/Vercel endpoint first, forwarding custom userKey if present
  try {
    const res = await fetch('/api/gemini/extract-quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userKey ? { 'x-gemini-api-key': userKey } : {}),
      },
      body: JSON.stringify({
        lessonTitle,
        subject,
        grade,
        className,
        questionCount,
        content,
        pdfBase64,
        apiKey: userKey || undefined,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.questions) {
        const resolvedTitle = (json.data.lessonTitle || lessonTitle).trim().toUpperCase();
        return {
          success: true,
          resolvedLessonTitle: resolvedTitle,
          questions: normalizeQuestionVisuals(json.data.questions),
        };
      }
    }
  } catch (serverErr) {
    console.warn('Backend endpoint unreachable, attempting client-side generation...', serverErr);
  }

  // Strategy 2: If server failed or not available, but user has saved API Key in browser Settings
  if (userKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: userKey });
      const systemInstruction = `Bạn là một Chuyên gia Giáo dục hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là soạn đúng ${questionCount} câu hỏi trắc nghiệm ôn tập cho bài học "${lessonTitle}" ${subject ? `môn ${subject}` : ''} ${className ? `dành cho ${className}` : ''}.
YÊU CẦU BẮT BUỘC & QUY TẮC TUYỆT ĐỐI:
1. HIỂN THỊ TÊN BÀI HỌC CHÍNH XÁC IN HOA (lessonTitle):
   - Người dùng có thể chỉ nhập vắn tắt như "bài 1", "bài 2"...
   - Nếu có file PDF sách giáo khoa đính kèm: Hãy tìm chính xác tên đầy đủ của "${lessonTitle}" trong tài liệu PDF và xuất ra trường "lessonTitle" hoàn toàn IN HOA.
   - Nếu không có file PDF: Hãy xác định tên bài học đầy đủ theo chương trình môn ${subject || 'học'} và viết IN HOA toàn bộ.
2. BAO QUÁT TOÀN BỘ NỘI DUNG BÀI HỌC:
   - Bộ ${questionCount} câu hỏi phải được phân bổ đều từ đầu bài đến cuối bài, đảm bảo bao quát trọn vẹn 100% nội dung bài học.
3. NGUYÊN TẮC VỀ HÌNH ẢNH TRỰC QUAN VÀ ĐỘ CHÍNH XÁC TUYỆT ĐỐI (visualDisplayMode):
   - ƯU TIÊN CAO CÁC CÂU HỎI CÓ HÌNH ẢNH MINH HỌA TRỰC QUAN (chiếm khoảng 75% - 85% số câu hỏi) để học sinh hào hứng, sinh động, không nhàm chán.
   - KHÔNG BẮT BUỘC CÂU NÀO CŨNG PHẢI GƯỢNG ÉP CÓ HÌNH: Câu hỏi nào cần hình ảnh thì BẮT BUỘC hình ảnh phải chính xác tuyệt đối với nội dung; câu hỏi nào mang tính lý thuyết/khái niệm trừu tượng không cần hình ảnh thì chọn "text_only" (không gượng ép hình ảnh sai lệch).
   - Mỗi câu hỏi chọn 1 trong 3 chế độ "visualDisplayMode":
     + Chế độ 1 ("visualDisplayMode": "question_image"): KHI CÂU HỎI HIỂN THỊ HÌNH ẢNH THÌ CẢ 4 ĐÁP ÁN A, B, C, D PHẢI LÀ VĂN BẢN THUẦN TÚY (để trống optionVisuals = []).
       Ví dụ: Câu hỏi "Biểu tượng trong hình ảnh là của phần mềm gì?" -> visualDisplayMode = "question_image", visualKey = "word_icon", visualData = "Biểu tượng chữ W màu xanh", options = ["Word", "PowerPoint", "Excel", "Paint"], optionVisuals = [].
     + Chế độ 2 ("visualDisplayMode": "options_image"): KHI ĐÁP ÁN LÀ CÁC HÌNH ẢNH THÌ CÂU HỎI PHẢI LÀ VĂN BẢN THUẦN TÚY (để trống visualData = "", visualKey = "") VÀ CẢ 4 ĐÁP ÁN A, B, C, D ĐỀU PHẢI CÓ HÌNH ẢNH CHÍNH XÁC ĐỒNG NHẤT.
       Ví dụ: Câu hỏi "Trong các đáp án dưới đây, đâu là phần cứng máy tính?" hoặc "Thiết bị nào dưới đây là chuột máy tính?" -> visualDisplayMode = "options_image", visualData = "", options = ["Thân máy tính", "Màn hình máy tính", "Chuột máy tính", "Phần mềm PowerPoint"], optionVisuals = ["cpu_tower", "monitor", "mouse", "powerpoint_icon"].
     + Chế độ 3 ("visualDisplayMode": "text_only"): Dành cho câu hỏi lý thuyết/khái niệm không cần hình ảnh minh họa (visualKey = "", visualData = "", optionVisuals = []).
4. ĐỘ CHÍNH XÁC TUYỆT ĐỐI CỦA HÌNH ẢNH VỚI NỘI DUNG:
   - Hãy sử dụng chính xác các mã hình vẽ chuẩn sau trong "visualKey" (cho câu hỏi) hoặc "optionVisuals" (cho 4 đáp án) khi nội dung tương ứng:
     * Tin học phần cứng: "cpu_tower" (Thân máy tính/CPU), "monitor" (Màn hình máy tính), "mouse" (Chuột máy tính), "keyboard" (Bàn phím máy tính), "speaker" (Loa máy tính), "printer" (Máy in), "headphones" (Tai nghe), "usb_drive" (USB), "hard_drive" (Ổ cứng), "power_cable" (Dây cáp nguồn), "mousepad" (Bàn di chuột), "laptop" (Máy tính xách tay), "hardware_overview" (Các bộ phận phần cứng máy tính).
     * Tin học phần mềm: "word_icon" (Biểu tượng chữ W màu xanh - Microsoft Word), "powerpoint_icon" (Biểu tượng chữ P màu cam đỏ - PowerPoint), "excel_icon" (Biểu tượng chữ X màu xanh lá - Excel), "paint_icon" (Bảng màu vẽ tranh - Paint), "scratch_icon" (Scratch), "browser_icon" (Trình duyệt Web/Internet), "windows_icon" (Hệ điều hành Windows), "folder_icon" (Thư mục), "software_overview" (Các phần mềm máy tính).
     * Toán học hình học: "shape_triangle" (Hình tam giác), "shape_right_triangle" (Tam giác vuông), "shape_square" (Hình vuông), "shape_circle" (Hình tròn), "shape_rectangle" (Hình chữ nhật), "shape_rhombus" (Hình thoi), "shape_parallelogram" (Hình bình hành), "shape_trapezoid" (Hình thang), "shape_quadrilateral" (Hình tứ giác), "shape_cube" (Khối lập phương), "shape_rectangular_prism" (Khối hộp chữ nhật), "shape_cylinder" (Khối trụ), "shape_sphere" (Khối cầu), "angle_right" (Góc vuông), "angle_acute" (Góc nhọn), "angle_obtuse" (Góc tù), "segment_midpoint" (Đoạn thẳng/Trung điểm).
     * Tiếng Việt dấu câu: "punc_period" (Dấu chấm), "punc_question" (Dấu chấm hỏi), "punc_exclamation" (Dấu chấm than), "punc_comma" (Dấu phẩy).
     * Khoa học cơ quan: "organ_mouth_teeth" (Khoang miệng và răng), "organ_stomach" (Dạ dày), "organ_intestine" (Ruột), "organ_esophagus" (Thực quản), "organ_heart" (Tim), "organ_lungs" (Phổi).`;

      const promptText = `Yêu cầu trích xuất và bao quát toàn bộ kiến thức bài học:
- Tên bài học người dùng nhập: ${lessonTitle}
- Môn học: ${subject || 'Kiến thức bài học'}
${className ? `- Lớp học: ${className}` : ''}
${content ? `- Ghi chú nội dung: ${content}` : ''}
Hãy xuất JSON gồm:
1. "lessonTitle": Tên bài học đầy đủ, chính xác, VIẾT IN HOA TOÀN BỘ.
2. "questions": Đúng ${questionCount} câu hỏi trắc nghiệm bao quát toàn bộ bài học. Ưu tiên cao các câu hỏi có hình ảnh trực quan chính xác ("question_image" hoặc "options_image"), câu nào không cần hình ảnh thì để "text_only". Tuân thủ nghiêm ngặt quy tắc: Khi câu hỏi hiển thị hình ảnh thì đáp án là văn bản; khi đáp án là các hình ảnh thì câu hỏi là văn bản.`;

      let contentsPayload: any = promptText;
      if (pdfBase64) {
        contentsPayload = {
          parts: [
            { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
            { text: promptText },
          ],
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsPayload,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lessonTitle: {
                type: Type.STRING,
                description: 'Tên đầy đủ và chính xác của bài học viết IN HOA TOÀN BỘ',
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    visualDisplayMode: {
                      type: Type.STRING,
                      description: '"question_image" (câu hỏi có hình, đáp án là chữ), "options_image" (đáp án là 4 hình, câu hỏi là chữ), hoặc "text_only" (câu hỏi lý thuyết không cần hình)',
                    },
                    visualKey: {
                      type: Type.STRING,
                      description: 'Mã hình ảnh chính xác của câu hỏi khi visualDisplayMode = question_image',
                    },
                    optionVisuals: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Mảng 4 mã hình ảnh chính xác cho 4 phương án A, B, C, D khi visualDisplayMode = options_image; để mảng rỗng [] khi visualDisplayMode = question_image hoặc text_only',
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
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.questions && parsed.questions.length > 0) {
        const resolvedTitle = (parsed.lessonTitle || lessonTitle).trim().toUpperCase();
        return {
          success: true,
          resolvedLessonTitle: resolvedTitle,
          questions: normalizeQuestionVisuals(parsed.questions),
        };
      }
    } catch (clientErr: any) {
      console.error('Lỗi khi gọi Gemini trực tiếp với khóa API người dùng:', clientErr);
      return { success: false, message: clientErr.message || 'Lỗi gọi Gemini API trực tiếp.' };
    }
  }

  return {
    success: false,
    resolvedLessonTitle: lessonTitle.trim().toUpperCase(),
    message: 'Chưa có kết quả từ AI, sẽ dùng bộ câu hỏi đề xuất sư phạm bao quát bài học thay thế.',
  };
}
