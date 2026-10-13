import { GoogleGenAI, Type } from '@google/genai';
import { Question } from '../types';

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

export async function extractQuizWithGemini({
  lessonTitle,
  subject,
  grade,
  questionCount = 5,
  content = '',
  pdfBase64 = null,
}: {
  lessonTitle: string;
  subject: string;
  grade: number;
  questionCount: number;
  content?: string;
  pdfBase64?: string | null;
}): Promise<{ success: boolean; questions?: Question[]; message?: string }> {
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
        questionCount,
        content,
        pdfBase64,
        apiKey: userKey || undefined,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.questions) {
        return { success: true, questions: json.data.questions };
      }
    }
  } catch (serverErr) {
    console.warn('Backend endpoint unreachable, attempting client-side generation...', serverErr);
  }

  // Strategy 2: If server failed or not available, but user has saved API Key in browser Settings
  if (userKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: userKey });
      const systemInstruction = `Bạn là một Chuyên gia Giáo dục Tiểu học tại Việt Nam.
Nhiệm vụ: Đọc nội dung bài học "${lessonTitle}", môn ${subject}, khối lớp ${grade}.
Tạo đúng ${questionCount} câu hỏi trắc nghiệm vui tươi, phù hợp tâm lý học sinh tiểu học.
Mỗi câu hỏi có 4 lựa chọn (A, B, C, D) với 1 đáp án đúng, kèm giải thích dễ thương và loại biểu tượng hình ảnh minh họa (math_shape, animal, emoji_icon, diagram, badge).`;

      const promptText = `Nội dung bài học:
${content ? content : `Trọng tâm kiến thức: ${lessonTitle} - Môn ${subject} Lớp ${grade}`}
Xuất đúng ${questionCount} câu hỏi trắc nghiệm chuẩn sư phạm.`;

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
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
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

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.questions && parsed.questions.length > 0) {
        return { success: true, questions: parsed.questions };
      }
    } catch (clientErr: any) {
      console.error('Lỗi khi gọi Gemini trực tiếp với khóa API người dùng:', clientErr);
      return { success: false, message: clientErr.message || 'Lỗi gọi Gemini API trực tiếp.' };
    }
  }

  return {
    success: false,
    message: 'Chưa có kết quả từ AI, sẽ dùng bộ câu hỏi đề xuất sư phạm thay thế.',
  };
}
