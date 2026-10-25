import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      lessonTitle = 'Bài 1',
      subject = '',
      className = '',
      questionCount = 5,
      content = '',
      pdfBase64 = null,
      apiKey: bodyApiKey,
    } = req.body || {};

    const customKey = (req.headers['x-gemini-api-key'] as string) || bodyApiKey;
    const activeApiKey = customKey || process.env.GEMINI_API_KEY || '';

    if (!activeApiKey) {
      return res.status(200).json({
        success: false,
        fallback: true,
        message: 'Chưa cấu hình GEMINI_API_KEY trên Vercel hoặc trình duyệt. Đang chuyển sang bộ đề chuẩn sư phạm.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: activeApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `Bạn là một Chuyên gia Giáo dục và Kiến trúc sư AI hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là soạn đúng ${questionCount} câu hỏi trắc nghiệm ôn tập cho bài học: "${lessonTitle}" ${subject ? `môn ${subject}` : ''} ${className ? `lớp ${className}` : ''}.
YÊU CẦU BẮT BUỘC:
1. TÊN BÀI HỌC CHÍNH XÁC IN HOA (lessonTitle):
   - Người dùng có thể chỉ nhập vắn tắt như "bài 1", "bài 2"...
   - Nếu có file PDF tài liệu sách giáo khoa kèm theo: Hãy tra cứu và tìm đúng tên đầy đủ của bài học tương ứng trong tài liệu PDF và xuất ra trường "lessonTitle" VIẾT IN HOA TOÀN BỘ.
2. BAO QUÁT TOÀN BỘ NỘI DUNG BÀI HỌC:
   - Bộ ${questionCount} câu hỏi phải bao quát toàn bộ nội dung bài học từ đầu đến cuối.
3. NGUYÊN TẮC VỀ HÌNH ẢNH TRỰC QUAN VÀ ĐỘ CHÍNH XÁC TUYỆT ĐỐI (visualDisplayMode):
   - ƯU TIÊN CAO CÁC CÂU HỎI CÓ HÌNH ẢNH MINH HỌA TRỰC QUAN (chiếm khoảng 75% - 85% số câu hỏi) để học sinh hào hứng, sinh động, không nhàm chán.
   - KHÔNG BẮT BUỘC CÂU NÀO CŨNG PHẢI GƯỢNG ÉP CÓ HÌNH: Câu hỏi nào cần hình ảnh thì BẮT BUỘC hình ảnh phải chính xác tuyệt đối với nội dung; câu hỏi nào mang tính lý thuyết/khái niệm trừu tượng không cần hình ảnh thì chọn "text_only" (không gượng ép hình ảnh sai lệch).
   - Mỗi câu hỏi chọn 1 trong 3 chế độ "visualDisplayMode":
     + Chế độ 1 ("visualDisplayMode": "question_image"): KHI CÂU HỎI HIỂN THỊ HÌNH ẢNH THÌ CẢ 4 ĐÁP ÁN A, B, C, D PHẢI LÀ VĂN BẢN THUẦN TÚY (optionVisuals = []).
       Ví dụ: Câu hỏi "Biểu tượng trong hình ảnh là của phần mềm gì?" -> visualDisplayMode = "question_image", visualKey = "word_icon", visualData = "Biểu tượng chữ W màu xanh", options = ["Word", "PowerPoint", "Excel", "Paint"], optionVisuals = [].
     + Chế độ 2 ("visualDisplayMode": "options_image"): KHI ĐÁP ÁN LÀ CÁC HÌNH ẢNH THÌ CÂU HỎI PHẢI LÀ VĂN BẢN THUẦN TÚY (visualData = "", visualKey = "") VÀ CẢ 4 ĐÁP ÁN A, B, C, D ĐỀU PHẢI CÓ HÌNH ẢNH CHÍNH XÁC ĐỒNG NHẤT.
       Ví dụ: Câu hỏi "Trong các đáp án dưới đây, đâu là phần cứng máy tính?" -> visualDisplayMode = "options_image", visualData = "", options = ["Thân máy tính", "Màn hình máy tính", "Chuột máy tính", "Phần mềm PowerPoint"], optionVisuals = ["cpu_tower", "monitor", "mouse", "powerpoint_icon"].
     + Chế độ 3 ("visualDisplayMode": "text_only"): Dành cho câu hỏi lý thuyết/khái niệm không cần hình ảnh minh họa (visualKey = "", visualData = "", optionVisuals = []).
4. ĐỘ CHÍNH XÁC TUYỆT ĐỐI CỦA HÌNH ẢNH VỚI NỘI DUNG:
   - Sử dụng chính xác các mã hình vẽ chuẩn trong "visualKey" hoặc "optionVisuals":
     * Tin học phần cứng: "cpu_tower", "monitor", "mouse", "keyboard", "speaker", "printer", "headphones", "usb_drive", "hard_drive", "power_cable", "mousepad", "laptop", "hardware_overview".
     * Tin học phần mềm: "word_icon", "powerpoint_icon", "excel_icon", "paint_icon", "scratch_icon", "browser_icon", "windows_icon", "folder_icon", "software_overview".
     * Toán học hình học: "shape_triangle", "shape_right_triangle", "shape_square", "shape_circle", "shape_rectangle", "shape_rhombus", "shape_parallelogram", "shape_trapezoid", "shape_quadrilateral", "shape_cube", "shape_rectangular_prism", "shape_cylinder", "shape_sphere", "angle_right", "angle_acute", "angle_obtuse", "segment_midpoint".
     * Tiếng Việt dấu câu: "punc_period", "punc_question", "punc_exclamation", "punc_comma".
     * Khoa học cơ quan: "organ_mouth_teeth", "organ_stomach", "organ_intestine", "organ_esophagus", "organ_heart", "organ_lungs".`;

    const promptText = `Nội dung bài học:
- Tên bài học: ${lessonTitle}
- Môn học: ${subject || 'Kiến thức chung'}
${className ? `- Lớp: ${className}` : ''}
${content ? `Ghi chú: ${content}` : ''}

Yêu cầu xuất JSON gồm "lessonTitle" (VIẾT IN HOA TOÀN BỘ) và danh sách đúng ${questionCount} câu hỏi trắc nghiệm bao quát toàn bộ bài học. Ưu tiên cao các câu hỏi có hình ảnh trực quan chính xác ("question_image" hoặc "options_image"), câu nào không cần hình ảnh thì để "text_only". Tuân thủ nghiêm ngặt quy tắc: Khi câu hỏi hiển thị hình ảnh thì đáp án là văn bản; khi đáp án là các hình ảnh thì câu hỏi là văn bản.`;

    let contentsPayload: any = promptText;
    if (pdfBase64) {
      contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            text: promptText,
          },
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
            lessonTitle: { type: Type.STRING },
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
                  visualDisplayMode: {
                    type: Type.STRING,
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
                required: ['id', 'question', 'options', 'visualDisplayMode', 'optionVisuals', 'correctIndex', 'explanation', 'visualType', 'visualData'],
              },
            },
          },
          required: ['lessonTitle', 'questions'],
        },
      },
    });

    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);
    if (parsedData.lessonTitle) {
      parsedData.lessonTitle = String(parsedData.lessonTitle).trim().toUpperCase();
    } else {
      parsedData.lessonTitle = String(lessonTitle || '').trim().toUpperCase();
    }

    return res.status(200).json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Vercel serverless error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi xử lý Gemini API trên Vercel Serverless Function',
    });
  }
}
