import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
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
      lessonTitle = 'Bài học ôn tập',
      subject = 'Toán',
      grade = 3,
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

    const systemInstruction = `Bạn là một Chuyên gia Giáo dục Tiểu học và Kiến trúc sư AI hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là đọc nội dung bài học từ Sách Giáo Khoa cho bài học: "${lessonTitle}", môn ${subject}, khối lớp ${grade}.
Hãy tạo chính xác ${questionCount} câu hỏi trắc nghiệm vui tươi, kích thích tư duy, hình ảnh sinh động.
Mỗi câu hỏi có 4 lựa chọn (A, B, C, D) với 1 đáp án đúng duy nhất, có lời giải thích khen ngợi dễ thương, và gợi ý hình ảnh minh họa (visual prompt).`;

    const promptText = `Nội dung bài học:
${content ? content : `Trọng tâm kiến thức: ${lessonTitle} - Môn ${subject} Lớp ${grade}`}

Yêu cầu xuất JSON danh sách ${questionCount} câu hỏi trắc nghiệm.`;

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
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  visualType: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING },
                  points: { type: Type.INTEGER },
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
