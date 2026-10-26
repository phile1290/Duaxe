import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

const GEMINI_MODEL_CHAIN = [
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gemini-api-key'
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
      subject = 'Công nghệ',
      grade,
      className = '',
      questionCount = 5,
      content = '',
      pdfBase64 = null,
      apiKey: bodyApiKey,
    } = req.body || {};

    const customKey = (req.headers['x-gemini-api-key'] as string) || bodyApiKey;
    const activeApiKey = (customKey || process.env.GEMINI_API_KEY || '').trim();

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

    const detectedGrade =
      grade ||
      (String(className).match(/[1-9]/) ? parseInt(String(className).match(/[1-9]/)![0], 10) : 4);
    const targetAdvancedCount =
      questionCount <= 5 ? 1 : questionCount <= 10 ? 2 : 3;

    const systemInstruction = `Bạn là một Chuyên gia Giáo dục và Kiến trúc sư AI hàng đầu tại Việt Nam (Chương trình GDPT 2018 - Kết nối tri thức với cuộc sống, Chân trời sáng tạo, Cánh diều).
Nhiệm vụ của bạn là đọc kỹ bài học "${lessonTitle}" thuộc môn "${subject}" (Khối ${detectedGrade} ${className ? `- Lớp ${className}` : ''}) và tài liệu Sách Giáo Khoa PDF đính kèm (nếu có) để biên soạn đúng ${questionCount} câu hỏi trắc nghiệm khách quan.

YÊU CẦU BẮT BUỘC TUYỆT ĐỐI:
1. TRA CỨU ĐÚNG BÀI HỌC TRONG SÁCH GIÁO KHOA / PDF VÀ BÁM SÁT 100% NỘI DUNG BÀI HỌC:
   - Nếu người dùng nhập vắn tắt như "Bài 1", "Bài 2", "Bài 3"... và tải lên file PDF sách giáo khoa: Hãy tìm trong Mục lục và các trang nội dung của file PDF xem "${lessonTitle}" là bài học gì, đọc TẤT CẢ các nội dung kiến thức trong bài học đó để tạo bộ câu hỏi trắc nghiệm.
   - Xuất trường "lessonTitle" là tên đầy đủ, chính xác của bài học VIẾT IN HOA TOÀN BỘ (Ví dụ môn Công nghệ 4 Bài 3: "BÀI 3: VẬT LIỆU VÀ DỤNG CỤ TRỒNG HOA, CÂY CẢNH TRONG CHẬU").
   - BÁM SÁT 100% MÔN HỌC "${subject}": Toàn bộ câu hỏi phải kiểm tra kiến thức của bài học đó trong môn "${subject}". NGHIÊM CẤM TUYỆT ĐỐI việc sinh câu hỏi lệch sang môn Tin học hay môn Toán khi người dùng đang chọn môn Công nghệ!

2. BẮT BUỘC CÓ TỪ 1 ĐẾN 3 CÂU HỎI NÂNG CAO (difficulty = "nang_cao", isAdvanced = true):
   - Trong bộ ${questionCount} câu hỏi phải có đúng ${targetAdvancedCount} câu hỏi nâng cao / vận dụng thực tế (đặt "difficulty": "nang_cao", "isAdvanced": true).
   - Các câu hỏi nâng cao đặt học sinh vào tình huống thực hành, giải thích "Vì sao...", hoặc vận dụng kiến thức trong bài học vào thực tiễn đời sống.
   - Các câu hỏi còn lại đặt "difficulty": "co_ban", "isAdvanced": false.

3. ƯU TIÊN CÁC CÂU HỎI CÓ HÌNH ẢNH MINH HỌA TRONG CÂU HỎI HOẶC TRONG CÁC ĐÁP ÁN (HÌNH ẢNH CHỈ HIỂN THỊ 1 TRONG 2):
   - Ưu tiên các câu hỏi có hình ảnh minh họa trực quan (chiếm 75% - 85% số câu hỏi).
   - Hình ảnh CHỈ ĐƯỢC HIỂN THỊ Ở 1 TRONG 2 NƠI:
     + Chế độ 1 ("visualDisplayMode": "question_image"): Hình ảnh nằm ở câu hỏi -> 4 đáp án A, B, C, D BẮT BUỘC là văn bản thuần túy (optionVisuals = []).
     + Chế độ 2 ("visualDisplayMode": "options_image"): Hình ảnh nằm ở cả 4 đáp án A, B, C, D -> Câu hỏi BẮT BUỘC là văn bản thuần túy (visualKey = "", visualData = "") và optionVisuals có đủ 4 mã hình ảnh cho 4 đáp án.
     + Chế độ 3 ("visualDisplayMode": "text_only"): Câu hỏi lý thuyết thuần văn bản (visualKey = "", visualData = "", optionVisuals = []).
   - Danh mục mã hình ảnh chuẩn ("visualKey" / "optionVisuals"):
     * Môn Công nghệ: "flower_pot", "plant_flower", "cactus_succulent", "bonsai_tree", "soil_substrate", "garden_trowel", "garden_fork", "watering_can", "pruning_shears", "garden_gloves", "seed_sprout", "sunlight_care", "fertilizer_bag", "desk_lamp", "electric_fan", "television_set", "radio_set", "refrigerator", "telephone_emergency", "traffic_sign_stop", "paper_pinwheel", "wrench_screwdriver", "solar_wind_model".
     * Môn Tin học: "cpu_tower", "monitor", "mouse", "keyboard", "speaker", "printer", "headphones", "usb_drive", "hard_drive", "power_cable", "mousepad", "laptop", "hardware_overview", "word_icon", "powerpoint_icon", "excel_icon", "paint_icon", "scratch_icon", "browser_icon", "windows_icon", "folder_icon", "software_overview".
     * Môn Kỹ năng số: "strong_password", "shield_antivirus", "phishing_warning", "cloud_storage", "search_engine", "digital_citizenship", "ergonomic_posture".
     * Môn Trí tuệ nhân tạo: "ai_robot", "neural_brain", "face_recognition", "voice_assistant", "smart_home_iot", "self_driving_car", "chatbot_prompt".`;

    const promptText = `Thông tin bài học cần tạo câu hỏi:
- Tên bài học người dùng nhập: "${lessonTitle}"
- Môn học: ${subject}
- Khối/Lớp: Khối ${detectedGrade} ${className ? `(Lớp ${className})` : ''}
${content ? `- Nội dung / Ghi chú: ${content}` : ''}

Hãy tìm đúng bài học "${lessonTitle}" của môn ${subject} (Khối ${detectedGrade}) trong tài liệu PDF / sách giáo khoa, đọc tất cả nội dung kiến thức trong bài và xuất JSON gồm:
1. "lessonTitle" đầy đủ viết IN HOA.
2. "questions": Đúng ${questionCount} câu hỏi trắc nghiệm bám sát 100% bài học môn ${subject}, trong đó có ${targetAdvancedCount} câu hỏi nâng cao ("isAdvanced": true, "difficulty": "nang_cao"), và ưu tiên các câu hỏi có hình ảnh minh họa trong câu hỏi hoặc trong các đáp án (chỉ hiển thị 1 trong 2).`;

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

    const responseSchema = {
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
              difficulty: { type: Type.STRING },
              isAdvanced: { type: Type.BOOLEAN },
              visualDisplayMode: { type: Type.STRING },
              visualKey: { type: Type.STRING },
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

    let lastError: any = null;
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

        const responseText = response.text || '{}';
        const parsedData = JSON.parse(responseText);
        if (parsedData && Array.isArray(parsedData.questions) && parsedData.questions.length > 0) {
          parsedData.lessonTitle = String(parsedData.lessonTitle || lessonTitle || '')
            .trim()
            .toUpperCase();
          return res.status(200).json({
            success: true,
            data: parsedData,
          });
        }
      } catch (err) {
        lastError = err;
        console.warn(`Vercel Gemini model ${modelName} failed, trying next:`, err);
      }
    }

    throw lastError || new Error('All Gemini models failed');
  } catch (error: any) {
    console.error('Vercel serverless error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi xử lý Gemini API trên Vercel Serverless Function',
    });
  }
}
