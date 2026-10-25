import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Comprehensive CORS and frame headers for AI Studio and external previews
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.removeHeader('X-Frame-Options');
    next();
  });

  // Initialize Gemini AI Client with telemetry header
  const geminiApiKey = process.env.GEMINI_API_KEY || '';

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(geminiApiKey),
      time: new Date().toISOString(),
    });
  });

  // API: Gemini PDF/Lesson RAG Extraction
  app.post('/api/gemini/extract-quiz', async (req, res) => {
    try {
      const {
        lessonTitle,
        subject,
        questionCount = 5,
        content = '',
        pdfBase64 = null,
        apiKey: bodyApiKey,
      } = req.body;

      const customApiKey = (req.headers['x-gemini-api-key'] as string) || bodyApiKey || geminiApiKey;

      if (!customApiKey) {
        return res.status(200).json({
          success: false,
          fallback: true,
          message: 'Chưa cấu hình GEMINI_API_KEY trên server hoặc trình duyệt. Đang dùng bộ đề chuẩn sư phạm.',
        });
      }

      const activeAi = new GoogleGenAI({
        apiKey: customApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `Bạn là một Chuyên gia Giáo dục và Kiến trúc sư AI hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là đọc toàn bộ nội dung bài học từ Sách Giáo Khoa (qua văn bản hoặc file PDF trích xuất) cho bài học: "${lessonTitle}" ${subject ? `, môn ${subject}` : ''}.
YÊU CẦU QUAN TRỌNG BẮT BUỘC:
1. TÊN BÀI HỌC CHÍNH XÁC IN HOA (lessonTitle):
   - Nếu có file PDF đính kèm và người dùng chỉ nhập "bài 1", "bài 2"... hãy tra cứu đúng tên đầy đủ của bài đó trong PDF và viết IN HOA TOÀN BỘ (ví dụ: "BÀI 1: PHẦN CỨNG VÀ PHẦN MỀM MÁY TÍNH").
   - Luôn trả về "lessonTitle" ở dạng CHỮ IN HOA TOÀN BỘ.
2. BAO QUÁT TOÀN BỘ NỘI DUNG BÀI HỌC:
   - Bộ ${questionCount} câu hỏi phải bao quát trọn vẹn 100% nội dung bài học từ đầu đến cuối (Khởi động/Khám phá, Kiến thức mới/Quy tắc, Thực hành - Luyện tập, Vận dụng).
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
   - Sử dụng chính xác các mã hình vẽ chuẩn trong "visualKey" (khi visualDisplayMode = "question_image") hoặc "optionVisuals" (khi visualDisplayMode = "options_image"):
     * Tin học phần cứng: "cpu_tower" (Thân máy tính/CPU), "monitor" (Màn hình máy tính), "mouse" (Chuột máy tính), "keyboard" (Bàn phím máy tính), "speaker" (Loa máy tính), "printer" (Máy in), "headphones" (Tai nghe), "usb_drive" (USB), "hard_drive" (Ổ cứng), "power_cable" (Dây cáp nguồn), "mousepad" (Bàn di chuột), "laptop" (Máy tính xách tay), "hardware_overview" (Các bộ phận phần cứng máy tính).
     * Tin học phần mềm: "word_icon" (Biểu tượng chữ W màu xanh - Microsoft Word), "powerpoint_icon" (Biểu tượng chữ P màu cam đỏ - PowerPoint), "excel_icon" (Biểu tượng chữ X màu xanh lá - Excel), "paint_icon" (Bảng màu vẽ tranh - Paint), "scratch_icon" (Scratch), "browser_icon" (Trình duyệt Web/Internet), "windows_icon" (Hệ điều hành Windows), "folder_icon" (Thư mục), "software_overview" (Các phần mềm máy tính).
     * Toán học hình học: "shape_triangle", "shape_right_triangle", "shape_square", "shape_circle", "shape_rectangle", "shape_rhombus", "shape_parallelogram", "shape_trapezoid", "shape_quadrilateral", "shape_cube", "shape_rectangular_prism", "shape_cylinder", "shape_sphere", "angle_right", "angle_acute", "angle_obtuse", "segment_midpoint".
     * Tiếng Việt dấu câu: "punc_period", "punc_question", "punc_exclamation", "punc_comma".
     * Khoa học cơ quan: "organ_mouth_teeth", "organ_stomach", "organ_intestine", "organ_esophagus", "organ_heart", "organ_lungs".`;

      const promptText = `Nội dung trích xuất bài học:
${content ? content : `Trọng tâm kiến thức: ${lessonTitle} - Môn ${subject || 'Kiến thức bài học'}`}

Yêu cầu xuất JSON danh sách ${questionCount} câu hỏi bao quát toàn bộ bài học, kèm tên bài học IN HOA (lessonTitle). Ưu tiên cao các câu hỏi có hình ảnh trực quan chính xác ("question_image" hoặc "options_image"), câu nào không cần hình ảnh thì để "text_only". Tuân thủ nghiêm ngặt quy tắc: Khi câu hỏi hiển thị hình ảnh thì đáp án là văn bản; khi đáp án là các hình ảnh thì câu hỏi là văn bản.`;

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

      const response = await activeAi.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsPayload,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lessonTitle: { type: Type.STRING, description: 'Tên bài học đầy đủ viết IN HOA TOÀN BỘ' },
              subject: { type: Type.STRING },
              grade: { type: Type.NUMBER },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING, description: 'Nội dung câu hỏi rõ ràng, bao quát nội dung bài học' },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: '4 phương án lựa chọn A, B, C, D',
                    },
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
                    correctIndex: { type: Type.INTEGER, description: 'Chỉ số phương án đúng: 0, 1, 2, hoặc 3' },
                    explanation: { type: Type.STRING, description: 'Giải thích ngắn gọn, dễ hiểu' },
                    visualType: { type: Type.STRING, description: 'Loại hình minh họa: math_shape, diagram, emoji_icon, badge, animal, clock, number_line, fraction, balance_scale, experiment, computer_hardware, software_icon' },
                    visualData: { type: Type.STRING, description: 'Biểu tượng/sơ đồ/con số trực quan hiển thị trong hình minh họa của câu hỏi' },
                    points: { type: Type.INTEGER, description: 'Số điểm thường là 10' },
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

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.error('Lỗi gọi Gemini API:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Không thể tạo câu hỏi qua Gemini',
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rừng Cổ Thụ 10 Móc & Bà Già Bắt Gà server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
});
