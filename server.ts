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
  let ai: GoogleGenAI | null = null;
  if (geminiApiKey) {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

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
        grade,
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

      const systemInstruction = `Bạn là một Chuyên gia Giáo dục Tiểu học và Kiến trúc sư AI hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là đọc nội dung bài học từ Sách Giáo Khoa (qua văn bản hoặc file PDF trích xuất) cho bài học: "${lessonTitle}", môn ${subject}, khối lớp ${grade}.
Hãy tạo chính xác ${questionCount} câu hỏi trắc nghiệm vui tươi, phù hợp tâm lý học sinh tiểu học, kích thích tư duy, hình ảnh sinh động.
Mỗi câu hỏi có 4 lựa chọn (A, B, C, D) với 1 đáp án đúng duy nhất, có lời giải thích khen ngợi dễ thương, và gợi ý hình ảnh minh họa (visual prompt và loại biểu tượng đồ họa SVG/Icon).`;

      const promptText = `Nội dung trích xuất bài học:
${content ? content : `Trọng tâm kiến thức: ${lessonTitle} - Môn ${subject} Lớp ${grade}`}

Yêu cầu xuất JSON danh sách ${questionCount} câu hỏi theo đúng cấu trúc.`;

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
              lessonTitle: { type: Type.STRING },
              subject: { type: Type.STRING },
              grade: { type: Type.NUMBER },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING, description: 'Nội dung câu hỏi rõ ràng, dễ hiểu cho học sinh tiểu học' },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: '4 phương án lựa chọn A, B, C, D',
                    },
                    correctIndex: { type: Type.INTEGER, description: 'Chỉ số phương án đúng: 0, 1, 2, hoặc 3' },
                    explanation: { type: Type.STRING, description: 'Giải thích ngắn gọn, dễ thương' },
                    visualType: { type: Type.STRING, description: 'Loại hình: math_shape, diagram, emoji_icon, badge, hoặc animal' },
                    visualPrompt: { type: Type.STRING, description: 'Mô tả hình ảnh trực quan' },
                    points: { type: Type.INTEGER, description: 'Số điểm thường là 10' },
                  },
                  required: ['id', 'question', 'options', 'correctIndex', 'explanation', 'visualType', 'visualPrompt'],
                },
              },
            },
            required: ['questions'],
          },
        },
      });

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);

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
    console.log(`Đua Xe Tri Thức 3D server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
});
