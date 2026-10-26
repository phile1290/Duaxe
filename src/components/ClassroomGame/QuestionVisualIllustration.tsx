import React from 'react';
import { Question, VisualDisplayMode } from '../../types';

interface QuestionVisualIllustrationProps {
  question: Question;
  index?: number;
  compact?: boolean;
}

export interface OptionVisualIllustrationProps {
  optionText: string;
  visualSpec?: string;
  optionSvg?: string;
  optionIndex: number;
  visualType?: Question['visualType'];
  questionText?: string;
}

/**
 * Kiểm tra từ/cụm từ tiếng Việt theo ranh giới từ nguyên vẹn (whole-word boundary).
 * Tuyệt đối ngăn chặn lỗi khớp chuỗi con sai lệch như:
 * - "cá" khớp nhầm vào "các", "dây cáp", "cách", "cánh"
 * - "bàn" khớp nhầm vào "bàn giao", v.v.
 */
function hasWholeWord(text: string, phrase: string): boolean {
  const cleanText = text.toLowerCase().trim();
  const cleanPhrase = phrase.toLowerCase().trim();
  if (!cleanText || !cleanPhrase) return false;
  const escaped = cleanPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:^|[\\s,.;:!?()'"/\\-_\\[\\]])${escaped}(?:$|[\\s,.;:!?()'"/\\-_\\[\\]])`, 'i');
  return regex.test(cleanText);
}

function hasAnyWholeWord(text: string, phrases: string[]): boolean {
  return phrases.some((p) => hasWholeWord(text, p));
}

export type SemanticTopicKey =
  // Tin học - Phần cứng máy tính
  | 'cpu_tower'
  | 'monitor'
  | 'mouse'
  | 'keyboard'
  | 'speaker'
  | 'printer'
  | 'headphones'
  | 'usb_drive'
  | 'hard_drive'
  | 'power_cable'
  | 'mousepad'
  | 'laptop'
  | 'hardware_overview'
  // Tin học - Phần mềm & Biểu tượng
  | 'word_icon'
  | 'powerpoint_icon'
  | 'excel_icon'
  | 'paint_icon'
  | 'scratch_icon'
  | 'browser_icon'
  | 'windows_icon'
  | 'folder_icon'
  | 'software_overview'
  // Công nghệ - Hoa, cây cảnh, chậu, giá thể & dụng cụ làm vườn (Công nghệ 4)
  | 'flower_pot'
  | 'plant_flower'
  | 'cactus_succulent'
  | 'bonsai_tree'
  | 'soil_substrate'
  | 'garden_trowel'
  | 'garden_fork'
  | 'watering_can'
  | 'pruning_shears'
  | 'garden_gloves'
  | 'seed_sprout'
  | 'sunlight_care'
  | 'fertilizer_bag'
  // Công nghệ - Thiết bị gia đình, thủ công & mô hình kỹ thuật (Công nghệ 3, 4, 5)
  | 'desk_lamp'
  | 'electric_fan'
  | 'television_set'
  | 'radio_set'
  | 'refrigerator'
  | 'telephone_emergency'
  | 'traffic_sign_stop'
  | 'paper_pinwheel'
  | 'wrench_screwdriver'
  | 'solar_wind_model'
  // Kỹ năng số - An toàn mạng & Công dân số
  | 'strong_password'
  | 'shield_antivirus'
  | 'phishing_warning'
  | 'cloud_storage'
  | 'search_engine'
  | 'digital_citizenship'
  | 'ergonomic_posture'
  // Trí tuệ nhân tạo (AI)
  | 'ai_robot'
  | 'neural_brain'
  | 'face_recognition'
  | 'voice_assistant'
  | 'smart_home_iot'
  | 'self_driving_car'
  | 'chatbot_prompt'
  // Toán học - Hình học
  | 'shape_triangle'
  | 'shape_right_triangle'
  | 'shape_square'
  | 'shape_circle'
  | 'shape_rectangle'
  | 'shape_rhombus'
  | 'shape_parallelogram'
  | 'shape_trapezoid'
  | 'shape_quadrilateral'
  | 'shape_pentagon'
  | 'shape_hexagon'
  | 'shape_cube'
  | 'shape_rectangular_prism'
  | 'shape_cylinder'
  | 'shape_sphere'
  | 'angle_right'
  | 'angle_acute'
  | 'angle_obtuse'
  | 'segment_midpoint'
  // Tiếng Việt - Dấu câu
  | 'punc_period'
  | 'punc_question'
  | 'punc_exclamation'
  | 'punc_comma'
  // Khoa học - Cơ quan cơ thể
  | 'organ_mouth_teeth'
  | 'organ_stomach'
  | 'organ_intestine'
  | 'organ_esophagus'
  | 'organ_heart'
  | 'organ_lungs';

/**
 * Nhận diện chính xác chủ đề hình vẽ SVG chuyên biệt từ văn bản câu hỏi/đáp án
 */
export function detectSemanticTopicKey(rawText: string, fallbackKey?: string): SemanticTopicKey | null {
  const combined = `${rawText || ''} ${fallbackKey || ''}`.toLowerCase().trim();
  if (!combined) return null;

  // 0. Nếu fallbackKey trùng khớp trực tiếp
  const directKeys: SemanticTopicKey[] = [
    'cpu_tower',
    'monitor',
    'mouse',
    'keyboard',
    'speaker',
    'printer',
    'headphones',
    'usb_drive',
    'hard_drive',
    'power_cable',
    'mousepad',
    'laptop',
    'hardware_overview',
    'word_icon',
    'powerpoint_icon',
    'excel_icon',
    'paint_icon',
    'scratch_icon',
    'browser_icon',
    'windows_icon',
    'folder_icon',
    'software_overview',
    'flower_pot',
    'plant_flower',
    'cactus_succulent',
    'bonsai_tree',
    'soil_substrate',
    'garden_trowel',
    'garden_fork',
    'watering_can',
    'pruning_shears',
    'garden_gloves',
    'seed_sprout',
    'sunlight_care',
    'fertilizer_bag',
    'desk_lamp',
    'electric_fan',
    'television_set',
    'radio_set',
    'refrigerator',
    'telephone_emergency',
    'traffic_sign_stop',
    'paper_pinwheel',
    'wrench_screwdriver',
    'solar_wind_model',
    'strong_password',
    'shield_antivirus',
    'phishing_warning',
    'cloud_storage',
    'search_engine',
    'digital_citizenship',
    'ergonomic_posture',
    'ai_robot',
    'neural_brain',
    'face_recognition',
    'voice_assistant',
    'smart_home_iot',
    'self_driving_car',
    'chatbot_prompt',
    'shape_triangle',
    'shape_right_triangle',
    'shape_square',
    'shape_circle',
    'shape_rectangle',
    'shape_rhombus',
    'shape_parallelogram',
    'shape_trapezoid',
    'shape_quadrilateral',
    'shape_pentagon',
    'shape_hexagon',
    'shape_cube',
    'shape_rectangular_prism',
    'shape_cylinder',
    'shape_sphere',
    'angle_right',
    'angle_acute',
    'angle_obtuse',
    'segment_midpoint',
    'punc_period',
    'punc_question',
    'punc_exclamation',
    'punc_comma',
    'organ_mouth_teeth',
    'organ_stomach',
    'organ_intestine',
    'organ_esophagus',
    'organ_heart',
    'organ_lungs',
  ];
  for (const k of directKeys) {
    if (fallbackKey === k || hasWholeWord(combined, k)) return k;
  }

  // 1. MÔN CÔNG NGHỆ: Trồng hoa, cây cảnh trong chậu, dụng cụ làm vườn, thiết bị gia đình, mô hình kỹ thuật
  if (
    hasAnyWholeWord(combined, [
      'bình tưới cây',
      'bình tưới nước',
      'bình tưới hoa sen',
      'bình xịt tưới cây',
      'bình tưới',
      'tưới nước cho cây',
    ])
  ) {
    return 'watering_can';
  }
  if (
    hasAnyWholeWord(combined, [
      'xẻng nhỏ',
      'xẻng làm vườn',
      'xẻng xúc đất',
      'xẻng xúc giá thể',
      'cái xẻng',
    ])
  ) {
    return 'garden_trowel';
  }
  if (
    hasAnyWholeWord(combined, [
      'chĩa ba',
      'cào đất',
      'dụng cụ xới đất',
      'chĩa làm vườn',
    ])
  ) {
    return 'garden_fork';
  }
  if (
    hasAnyWholeWord(combined, [
      'kéo cắt cành',
      'kéo tỉa lá',
      'kéo tỉa cành',
      'kéo làm vườn',
    ])
  ) {
    return 'pruning_shears';
  }
  if (
    hasAnyWholeWord(combined, [
      'găng tay làm vườn',
      'găng tay bảo hộ',
      'đeo găng tay',
      'đôi găng tay',
    ])
  ) {
    return 'garden_gloves';
  }
  if (
    hasAnyWholeWord(combined, [
      'giá thể trồng cây',
      'giá thể',
      'xơ dừa',
      'trấu hun',
      'mùn cưa',
      'đất trồng cây',
      'sỏi dăm',
    ])
  ) {
    return 'soil_substrate';
  }
  if (
    hasAnyWholeWord(combined, [
      'chậu trồng cây',
      'chậu trồng hoa',
      'chậu đất nung',
      'chậu sứ',
      'chậu nhựa',
      'lỗ thoát nước ở đáy chậu',
      'đáy chậu',
    ])
  ) {
    return 'flower_pot';
  }
  if (
    hasAnyWholeWord(combined, [
      'cây xương rồng',
      'xương rồng',
      'cây sen đá',
      'sen đá',
    ])
  ) {
    return 'cactus_succulent';
  }
  if (
    hasAnyWholeWord(combined, [
      'cây cảnh lá',
      'cây trầu bà',
      'cây lưỡi hổ',
      'cây vạn niên thanh',
      'cây bonsai',
      'cây xanh trong chậu',
    ])
  ) {
    return 'bonsai_tree';
  }
  if (
    hasAnyWholeWord(combined, [
      'chậu hoa',
      'cây hoa hồng',
      'cây hoa cúc',
      'hoa đồng tiền',
      'hoa mười giờ',
      'hoa dạ yến thảo',
      'hoa trạng nguyên',
      'hoa đào',
      'hoa mai',
    ])
  ) {
    return 'plant_flower';
  }
  if (
    hasAnyWholeWord(combined, [
      'gieo hạt',
      'hạt giống',
      'cây con',
      'nảy mầm',
      'trồng cây con',
    ])
  ) {
    return 'seed_sprout';
  }
  if (
    hasAnyWholeWord(combined, [
      'bón phân',
      'phân bón',
      'phân hữu cơ',
      'phân vi sinh',
    ])
  ) {
    return 'fertilizer_bag';
  }
  if (
    hasAnyWholeWord(combined, [
      'đèn học',
      'chụp đèn',
      'bóng đèn học',
      'công tắc đèn',
      'sử dụng đèn học',
    ])
  ) {
    return 'desk_lamp';
  }
  if (
    hasAnyWholeWord(combined, [
      'quạt điện',
      'cánh quạt',
      'lồng quạt',
      'quạt bàn',
      'quạt cây',
      'sử dụng quạt điện',
    ])
  ) {
    return 'electric_fan';
  }
  if (
    hasAnyWholeWord(combined, [
      'máy thu hình',
      'ti vi',
      'tivi',
      'truyền hình',
    ])
  ) {
    return 'television_set';
  }
  if (
    hasAnyWholeWord(combined, [
      'máy thu thanh',
      'đài radio',
      'radio',
      'phát thanh',
    ])
  ) {
    return 'radio_set';
  }
  if (
    hasAnyWholeWord(combined, [
      'tủ lạnh',
      'ngăn đá',
      'ngăn mát',
      'bảo quản thực phẩm trong tủ lạnh',
    ])
  ) {
    return 'refrigerator';
  }
  if (
    hasAnyWholeWord(combined, [
      'số điện thoại khẩn cấp',
      'gọi 113',
      'gọi 114',
      'gọi 115',
      'gọi 111',
      'sử dụng điện thoại',
    ])
  ) {
    return 'telephone_emergency';
  }
  if (
    hasAnyWholeWord(combined, [
      'biển báo giao thông',
      'biển báo cấm',
      'biển báo nguy hiểm',
      'biển hiệu lệnh',
      'biển chỉ dẫn',
    ])
  ) {
    return 'traffic_sign_stop';
  }
  if (
    hasAnyWholeWord(combined, [
      'chong chóng',
      'làm chong chóng',
      'đồ chơi dân gian',
      'đèn lồng giấy',
    ])
  ) {
    return 'paper_pinwheel';
  }
  if (
    hasAnyWholeWord(combined, [
      'cờ-lê',
      'cờ lê',
      'tua-vít',
      'tua vít',
      'ốc vít',
      'bộ lắp ghép mô hình kỹ thuật',
      'lắp ghép mô hình',
    ])
  ) {
    return 'wrench_screwdriver';
  }
  if (
    hasAnyWholeWord(combined, [
      'điện mặt trời',
      'pin mặt trời',
      'điện gió',
      'tua bin gió',
      'năng lượng tái tạo',
    ])
  ) {
    return 'solar_wind_model';
  }

  // 2. MÔN TRÍ TUỆ NHÂN TẠO (AI) & KỸ NĂNG SỐ
  if (
    hasAnyWholeWord(combined, [
      'robot thông minh',
      'robot ai',
      'người máy thông minh',
      'robot trí tuệ nhân tạo',
      'con robot',
      'robot',
    ])
  ) {
    return 'ai_robot';
  }
  if (
    hasAnyWholeWord(combined, [
      'nhận diện khuôn mặt',
      'mở khóa khuôn mặt',
      'camera ai',
      'thị giác máy tính',
    ])
  ) {
    return 'face_recognition';
  }
  if (
    hasAnyWholeWord(combined, [
      'trợ lý ảo giọng nói',
      'nhận diện giọng nói',
      'ra lệnh bằng giọng nói',
      'loa thông minh',
    ])
  ) {
    return 'voice_assistant';
  }
  if (
    hasAnyWholeWord(combined, [
      'nhà thông minh',
      'ngôi nhà thông minh',
      'smart home',
    ])
  ) {
    return 'smart_home_iot';
  }
  if (
    hasAnyWholeWord(combined, [
      'xe tự hành',
      'ô tô tự lái',
      'xe thông minh',
    ])
  ) {
    return 'self_driving_car';
  }
  if (
    hasAnyWholeWord(combined, [
      'câu lệnh prompt',
      'viết prompt',
      'trò chuyện với ai',
      'chatbot ai',
    ])
  ) {
    return 'chatbot_prompt';
  }
  if (
    hasAnyWholeWord(combined, [
      'bộ não nhân tạo',
      'mạng nơ-ron',
      'học máy',
      'trí tuệ nhân tạo ai',
    ])
  ) {
    return 'neural_brain';
  }
  if (
    hasAnyWholeWord(combined, [
      'mật khẩu mạnh',
      'đặt mật khẩu',
      'khóa bảo mật',
      'mật khẩu an toàn',
    ])
  ) {
    return 'strong_password';
  }
  if (
    hasAnyWholeWord(combined, [
      'khiên bảo mật',
      'diệt virus',
      'bảo vệ thông tin cá nhân',
      'an toàn thông tin',
    ])
  ) {
    return 'shield_antivirus';
  }
  if (
    hasAnyWholeWord(combined, [
      'lừa đảo trực tuyến',
      'liên kết lạ',
      'tin nhắn giả mạo',
      'cảnh báo nguy hiểm trên mạng',
    ])
  ) {
    return 'phishing_warning';
  }
  if (
    hasAnyWholeWord(combined, [
      'lưu trữ đám mây',
      'đám mây số',
      'sao lưu dữ liệu',
    ])
  ) {
    return 'cloud_storage';
  }
  if (
    hasAnyWholeWord(combined, [
      'máy tìm kiếm',
      'từ khóa tìm kiếm',
      'ô tìm kiếm',
    ])
  ) {
    return 'search_engine';
  }
  if (
    hasAnyWholeWord(combined, [
      'ứng xử văn minh trên mạng',
      'công dân số',
      'giao tiếp văn minh',
    ])
  ) {
    return 'digital_citizenship';
  }
  if (
    hasAnyWholeWord(combined, [
      'tư thế ngồi máy tính',
      'ngồi học đúng tư thế',
      'khoảng cách từ mắt đến màn hình',
    ])
  ) {
    return 'ergonomic_posture';
  }

  // 3. TIN HỌC: Phần mềm & Biểu tượng ứng dụng (Ưu tiên kiểm tra tên phần mềm cụ thể trước)
  if (
    hasAnyWholeWord(combined, [
      'microsoft word',
      'phần mềm word',
      'biểu tượng word',
      'chữ w màu xanh',
      'biểu tượng chữ w',
      'soạn thảo văn bản word',
      'soạn thảo word',
      'word',
    ])
  ) {
    return 'word_icon';
  }
  if (
    hasAnyWholeWord(combined, [
      'powerpoint',
      'power point',
      'trình chiếu powerpoint',
      'phần mềm trình chiếu',
      'biểu tượng chữ p',
      'chữ p màu cam',
      'chữ p màu đỏ',
    ])
  ) {
    return 'powerpoint_icon';
  }
  if (
    hasAnyWholeWord(combined, [
      'microsoft excel',
      'phần mềm excel',
      'bảng tính excel',
      'biểu tượng chữ x',
      'chữ x màu xanh',
      'excel',
    ])
  ) {
    return 'excel_icon';
  }
  if (
    hasAnyWholeWord(combined, [
      'phần mềm paint',
      'vẽ tranh paint',
      'biểu tượng paint',
      'công cụ paint',
      'paint',
      'phần mềm vẽ',
    ])
  ) {
    return 'paint_icon';
  }
  if (hasAnyWholeWord(combined, ['scratch', 'lập trình scratch'])) {
    return 'scratch_icon';
  }
  if (
    hasAnyWholeWord(combined, [
      'trình duyệt',
      'google chrome',
      'cốc cốc',
      'microsoft edge',
      'safari',
      'firefox',
      'internet',
    ])
  ) {
    return 'browser_icon';
  }
  if (hasAnyWholeWord(combined, ['hệ điều hành windows', 'windows 10', 'windows 11', 'hệ điều hành'])) {
    return 'windows_icon';
  }
  if (hasAnyWholeWord(combined, ['thư mục', 'folder', 'tệp tin'])) {
    return 'folder_icon';
  }

  // 4. TIN HỌC: Thiết bị & Phần cứng máy tính cụ thể (Kiểm tra bàn di chuột trước chuột máy tính!)
  if (hasAnyWholeWord(combined, ['bàn di chuột', 'tấm lót chuột', 'miếng lót chuột', 'mousepad'])) {
    return 'mousepad';
  }
  if (hasAnyWholeWord(combined, ['dây cáp', 'dây nguồn', 'cáp kết nối', 'dây điện', 'phích cắm'])) {
    return 'power_cable';
  }
  if (
    hasAnyWholeWord(combined, [
      'thân máy tính',
      'thân máy',
      'case máy tính',
      'vỏ máy tính',
      'thùng máy',
      'bộ xử lý trung tâm',
      'cpu',
    ])
  ) {
    return 'cpu_tower';
  }
  if (hasAnyWholeWord(combined, ['màn hình máy tính', 'màn hình', 'monitor'])) {
    return 'monitor';
  }
  if (hasAnyWholeWord(combined, ['chuột máy tính', 'con chuột máy tính', 'chuột quang', 'chuột không dây'])) {
    return 'mouse';
  }
  // Nếu trong ngữ cảnh câu hỏi máy tính mà đáp án ghi ngắn gọn "Chuột"
  if (hasWholeWord(combined, 'chuột') && !hasAnyWholeWord(combined, ['con chuột đồng', 'mèo bắt chuột', 'chuột nhắt'])) {
    return 'mouse';
  }
  if (hasAnyWholeWord(combined, ['bàn phím máy tính', 'bàn phím', 'keyboard', 'phím bấm'])) {
    return 'keyboard';
  }
  if (hasAnyWholeWord(combined, ['loa máy tính', 'cặp loa', 'loa ngoài', 'loa'])) {
    return 'speaker';
  }
  if (hasAnyWholeWord(combined, ['máy in', 'printer'])) {
    return 'printer';
  }
  if (hasAnyWholeWord(combined, ['tai nghe', 'headphone', 'headphones'])) {
    return 'headphones';
  }
  if (hasAnyWholeWord(combined, ['usb', 'thẻ nhớ', 'bộ nhớ flash'])) {
    return 'usb_drive';
  }
  if (hasAnyWholeWord(combined, ['ổ cứng', 'ổ đĩa cứng', 'hdd', 'ssd'])) {
    return 'hard_drive';
  }
  if (hasAnyWholeWord(combined, ['máy tính xách tay', 'laptop'])) {
    return 'laptop';
  }
  if (hasAnyWholeWord(combined, ['các phần mềm máy tính', 'nhóm phần mềm máy tính'])) {
    return 'software_overview';
  }
  if (hasAnyWholeWord(combined, ['các bộ phận của máy tính để bàn', 'bộ máy tính để bàn'])) {
    return 'hardware_overview';
  }

  // 5. TOÁN HỌC: Hình học phẳng & không gian
  if (hasAnyWholeWord(combined, ['tam giác vuông', 'hình tam giác vuông'])) return 'shape_right_triangle';
  if (hasAnyWholeWord(combined, ['tam giác', 'hình tam giác', '3 cạnh'])) return 'shape_triangle';
  if (hasAnyWholeWord(combined, ['khối lập phương', 'hình lập phương'])) return 'shape_cube';
  if (hasAnyWholeWord(combined, ['khối hộp chữ nhật', 'hình hộp chữ nhật'])) return 'shape_rectangular_prism';
  if (hasAnyWholeWord(combined, ['khối trụ', 'hình trụ'])) return 'shape_cylinder';
  if (hasAnyWholeWord(combined, ['khối cầu', 'hình cầu'])) return 'shape_sphere';
  if (hasAnyWholeWord(combined, ['hình vuông', '4 cạnh bằng nhau và 4 góc vuông'])) return 'shape_square';
  if (hasAnyWholeWord(combined, ['hình chữ nhật'])) return 'shape_rectangle';
  if (hasAnyWholeWord(combined, ['hình tròn', 'đường tròn', 'tâm và bán kính', 'đường kính'])) return 'shape_circle';
  if (hasAnyWholeWord(combined, ['hình thoi'])) return 'shape_rhombus';
  if (hasAnyWholeWord(combined, ['hình bình hành'])) return 'shape_parallelogram';
  if (hasAnyWholeWord(combined, ['hình thang'])) return 'shape_trapezoid';
  if (hasAnyWholeWord(combined, ['hình tứ giác', 'tứ giác'])) return 'shape_quadrilateral';
  if (hasAnyWholeWord(combined, ['hình ngũ giác', 'ngũ giác'])) return 'shape_pentagon';
  if (hasAnyWholeWord(combined, ['hình lục giác', 'lục giác'])) return 'shape_hexagon';
  if (hasAnyWholeWord(combined, ['góc vuông', 'ê ke', 'ê-ke'])) return 'angle_right';
  if (hasAnyWholeWord(combined, ['góc nhọn'])) return 'angle_acute';
  if (hasAnyWholeWord(combined, ['góc tù'])) return 'angle_obtuse';
  if (hasAnyWholeWord(combined, ['trung điểm', 'điểm ở giữa', 'đoạn thẳng'])) return 'segment_midpoint';

  // 6. TIẾNG VIỆT: Dấu câu
  if (hasAnyWholeWord(combined, ['dấu chấm hỏi', 'câu hỏi (?)'])) return 'punc_question';
  if (hasAnyWholeWord(combined, ['dấu chấm than', 'dấu cảm', '(!)'])) return 'punc_exclamation';
  if (hasAnyWholeWord(combined, ['dấu phẩy', '(,)'])) return 'punc_comma';
  if (hasAnyWholeWord(combined, ['dấu chấm (.)', 'dấu chấm'])) return 'punc_period';

  // 7. KHOA HỌC: Cơ quan cơ thể
  if (hasAnyWholeWord(combined, ['khoang miệng', 'răng', 'nhai thức ăn'])) return 'organ_mouth_teeth';
  if (hasAnyWholeWord(combined, ['dạ dày', 'bao tử'])) return 'organ_stomach';
  if (hasAnyWholeWord(combined, ['ruột non', 'ruột già', 'đường ruột'])) return 'organ_intestine';
  if (hasAnyWholeWord(combined, ['thực quản'])) return 'organ_esophagus';
  if (hasAnyWholeWord(combined, ['quả tim', 'trái tim', 'hệ tuần hoàn'])) return 'organ_heart';
  if (hasAnyWholeWord(combined, ['lá phổi', 'cơ quan hô hấp', 'hệ hô hấp'])) return 'organ_lungs';

  return null;
}

/**
 * Nhận diện biểu tượng vật thể/con vật/đồ vật cụ thể (chỉ khớp từ nguyên vẹn whole-word!)
 */
export function detectConcreteObjectIcon(text: string): { icon: string; color: string; label: string } | null {
  const t = text.toLowerCase().trim();
  if (!t) return null;

  const rules: { phrases: string[]; icon: string; color: string; label: string }[] = [
    // Đồ ăn / Trái cây
    { phrases: ['bánh quy', 'chiếc bánh', 'cái bánh'], icon: '🍪', color: '#f59e0b', label: 'Bánh quy' },
    { phrases: ['quả trứng', 'vỉ trứng', 'trứng gà'], icon: '🥚', color: '#fde68a', label: 'Quả trứng' },
    { phrases: ['quả táo', 'trái táo'], icon: '🍎', color: '#ef4444', label: 'Quả táo' },
    { phrases: ['quả cam', 'trái cam'], icon: '🍊', color: '#f97316', label: 'Quả cam' },
    { phrases: ['quả xoài', 'trái xoài'], icon: '🥭', color: '#eab308', label: 'Quả xoài' },
    { phrases: ['dưa hấu'], icon: '🍉', color: '#10b981', label: 'Dưa hấu' },
    { phrases: ['quả chuối', 'nải chuối'], icon: '🍌', color: '#facc15', label: 'Quả chuối' },
    { phrases: ['dâu tây', 'quả dâu'], icon: '🍓', color: '#f43f5e', label: 'Dâu tây' },
    { phrases: ['rau xanh', 'rau củ', 'bông cải', 'súp lơ'], icon: '🥦', color: '#22c55e', label: 'Rau xanh' },
    { phrases: ['cà rốt', 'củ cà rốt'], icon: '🥕', color: '#f97316', label: 'Cà rốt' },
    { phrases: ['chiên dầu', 'khoai tây chiên', 'đồ chiên'], icon: '🍟', color: '#f59e0b', label: 'Đồ chiên dầu' },
    { phrases: ['kẹo ngọt', 'viên kẹo', 'cái kẹo'], icon: '🍬', color: '#ec4899', label: 'Kẹo ngọt' },
    { phrases: ['mì gói', 'mì tôm', 'bát phở'], icon: '🍜', color: '#f59e0b', label: 'Mì gói' },
    { phrases: ['nước ngọt', 'nước có ga'], icon: '🧃', color: '#ef4444', label: 'Nước ngọt' },
    { phrases: ['lít nước', 'uống nước', 'nước ấm', 'nước lọc', 'giọt nước'], icon: '💧', color: '#38bdf8', label: 'Nước sạch' },
    { phrases: ['cốc sữa', 'hộp sữa', 'ly sữa'], icon: '🥛', color: '#e2e8f0', label: 'Sữa' },

    // Động vật (chỉ khớp cụm từ rõ ràng hoặc từ nguyên vẹn, tuyệt đối không khớp "cá" vào "các"/"cáp")
    { phrases: ['con mèo', 'chú mèo', 'mèo con'], icon: '🐱', color: '#fb923c', label: 'Con mèo' },
    { phrases: ['con chó', 'chú chó', 'cún con'], icon: '🐶', color: '#d97706', label: 'Con chó' },
    { phrases: ['con gà', 'gà trống', 'gà mái', 'gà con', 'chú gà'], icon: '🐔', color: '#f59e0b', label: 'Con gà' },
    { phrases: ['con vịt', 'chú vịt'], icon: '🦆', color: '#eab308', label: 'Con vịt' },
    { phrases: ['con thỏ', 'chú thỏ'], icon: '🐰', color: '#f472b6', label: 'Con thỏ' },
    { phrases: ['con cá', 'chú cá', 'cá vàng', 'cá chép', 'bể cá'], icon: '🐟', color: '#38bdf8', label: 'Con cá' },
    { phrases: ['con chim', 'chú chim', 'chim sâu', 'chim sẻ'], icon: '🐦', color: '#60a5fa', label: 'Con chim' },
    { phrases: ['con nhện', 'chú nhện'], icon: '🕷️', color: '#94a3b8', label: 'Con nhện' },
    { phrases: ['con ong', 'chú ong', 'ong mật'], icon: '🐝', color: '#facc15', label: 'Con ong' },
    { phrases: ['con bướm', 'bươm bướm'], icon: '🦋', color: '#a855f7', label: 'Con bướm' },
    { phrases: ['con voi', 'chú voi'], icon: '🐘', color: '#94a3b8', label: 'Con voi' },
    { phrases: ['con hổ', 'chú hổ'], icon: '🐯', color: '#f97316', label: 'Con hổ' },
    { phrases: ['sư tử'], icon: '🦁', color: '#f59e0b', label: 'Sư tử' },
    { phrases: ['con gấu', 'gấu bông'], icon: '🐻', color: '#b45309', label: 'Con gấu' },
    { phrases: ['con khỉ', 'chú khỉ'], icon: '🐵', color: '#d97706', label: 'Con khỉ' },
    { phrases: ['con bò', 'bò sữa'], icon: '🐮', color: '#facc15', label: 'Con bò' },
    { phrases: ['con lợn', 'con heo'], icon: '🐷', color: '#f472b6', label: 'Con lợn' },

    // Đồ dùng học tập & Đời sống
    { phrases: ['quyển vở', 'cuốn vở', 'quyển sách', 'cuốn sách', 'sách giáo khoa'], icon: '📚', color: '#60a5fa', label: 'Sách vở' },
    { phrases: ['bút chì', 'cây bút', 'chiếc bút'], icon: '✏️', color: '#facc15', label: 'Bút chì' },
    { phrases: ['thước kẻ', 'cây thước'], icon: '📏', color: '#fbbf24', label: 'Thước kẻ' },
    { phrases: ['cặp sách', 'ba lô', 'balo'], icon: '🎒', color: '#f43f5e', label: 'Cặp sách' },
    { phrases: ['mặt trời', 'ông mặt trời'], icon: '☀️', color: '#facc15', label: 'Mặt trời' },
    { phrases: ['mặt trăng', 'ông trăng'], icon: '🌙', color: '#fde047', label: 'Mặt trăng' },
    { phrases: ['ngôi sao', 'ông sao'], icon: '⭐', color: '#facc15', label: 'Ngôi sao' },
    { phrases: ['đám mây', 'bầu trời'], icon: '☁️', color: '#38bdf8', label: 'Đám mây' },
    { phrases: ['cơn mưa', 'trời mưa'], icon: '🌧️', color: '#60a5fa', label: 'Trời mưa' },
    { phrases: ['cầu vồng', 'ánh nắng'], icon: '🌈', color: '#fb7185', label: 'Cầu vồng' },
    { phrases: ['bông hoa', 'đóa hoa', 'hoa hồng', 'hoa hướng dương'], icon: '🌻', color: '#facc15', label: 'Bông hoa' },
    { phrases: ['cái cây', 'cây xanh', 'rừng cây'], icon: '🌳', color: '#22c55e', label: 'Cây xanh' },
  ];

  for (const r of rules) {
    if (hasAnyWholeWord(t, r.phrases)) {
      return { icon: r.icon, color: r.color, label: r.label };
    }
  }

  return null;
}

/**
 * Kiểm tra xem một phương án trả lời có phải là đối tượng trực quan cụ thể để vẽ thành hình ảnh đáp án hay không
 */
function isOptionVisuallyRepresentable(optText: string, visualSpec?: string, optionSvg?: string): boolean {
  if (optionSvg && optionSvg.includes('<svg')) return true;
  const combined = `${optText || ''} ${visualSpec || ''}`.trim();
  if (!combined) return false;

  // Nếu câu trả lời là một mệnh đề định nghĩa dài (> 55 ký tự) thì nó là đáp án VĂN BẢN, không phải đáp án hình ảnh
  if (optText.trim().length > 55) return false;

  if (detectSemanticTopicKey(optText, visualSpec)) return true;
  if (detectConcreteObjectIcon(combined)) return true;

  return false;
}

/**
 * Kiểm tra xem bản thân câu hỏi có thực sự sở hữu một hình ảnh minh họa chính xác, trực quan hay không.
 * Nếu câu hỏi không cần hình ảnh hoặc không có hình ảnh chính xác tương ứng thì trả về false
 * để hệ thống hiển thị văn bản thuần túy, tuyệt đối không gắn hình ảnh gượng ép hoặc sai lệch.
 */
export function hasAccurateQuestionVisual(question: Question): boolean {
  const qText = (question.question || '').trim();
  const rawVisualData = (question.visualData || '').trim();
  const combinedQuestionContext = `${qText} ${rawVisualData} ${question.visualKey || ''}`;

  if (
    question.questionSvg &&
    question.questionSvg.trim().startsWith('<svg') &&
    question.questionSvg.trim().endsWith('</svg>')
  ) {
    return true;
  }

  // 1. Đồng hồ
  const kimMatch = qText.match(/kim ngắn chỉ số\s*(\d{1,2}).*kim dài chỉ số\s*(\d{1,2})/i);
  if (question.visualType === 'clock' || kimMatch || qText.toLowerCase().includes('đồng hồ')) {
    return true;
  }

  // 2. Chủ đề SVG chuyên biệt (Tin học, Hình học, Dấu câu, Cơ quan Khoa học...)
  if (
    detectSemanticTopicKey(qText, question.visualKey) ||
    detectSemanticTopicKey(rawVisualData, question.visualKey)
  ) {
    return true;
  }

  // 3. Phân số
  const fractionMatch =
    qText.match(/\b(\d+)\s*\/\s*(\d+)\b/) || rawVisualData.match(/\b(\d+)\s*\/\s*(\d+)\b/);
  if (question.visualType === 'fraction' || fractionMatch) {
    return true;
  }

  // 4. Vật thể/con vật/đồ vật cụ thể
  if (detectConcreteObjectIcon(combinedQuestionContext)) {
    return true;
  }

  // 5. Phép tính toán học trực quan
  const equationInQuestion = qText.match(
    /(\d+|\?)\s*([+\-×x*:÷/])\s*(\d+|\?)(?:\s*=\s*(\d+|\?))?/
  );
  const textMultMatch = qText.match(/(\d+)\s*nhân\s*(?:với\s*)?(\d+)/i);
  const textDivMatch = qText.match(/(\d+)\s*chia\s*(?:cho\s*)?(\d+)/i);
  if (equationInQuestion || textMultMatch || textDivMatch) {
    return true;
  }

  // 6. Emoji minh họa cụ thể trong visualData
  const emojisInVisualData = Array.from(
    rawVisualData.matchAll(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu)
  ).map((m) => m[0]);
  if (emojisInVisualData.length > 0) {
    return true;
  }

  return false;
}

/**
 * NGUYÊN TẮC VÀ QUY TẮC BẮT BUỘC:
 * 1. Khi câu hỏi hiển thị hình ảnh ('question_image') -> Đáp án A, B, C, D BẮT BUỘC là VĂN BẢN (không có hình ở đáp án).
 * 2. Khi đáp án A, B, C, D là các hình ảnh ('options_image') -> Câu hỏi BẮT BUỘC là VĂN BẢN (không có hình ở câu hỏi).
 * 3. Không bắt buộc câu hỏi nào cũng phải có hình ảnh: Câu hỏi nào cần hình ảnh thì hiển thị hình ảnh chính xác tuyệt đối;
 *    câu hỏi lý thuyết/khái niệm không cần hình ảnh thì hiển thị văn bản ('text_only'), tuyệt đối không hiển thị hình sai lệch.
 */
export function resolveVisualDisplayMode(question: Question): VisualDisplayMode {
  const qText = (question.question || '').toLowerCase().trim();
  const options = question.options || [];

  // 1. Các câu hỏi mà bản thân đề bài yêu cầu quan sát hình ảnh trong câu hỏi:
  // Ví dụ: "Biểu tượng trong hình ảnh là của phần mềm gì?", "Quan sát hình bên...", "Đồng hồ chỉ mấy giờ...", phép tính toán học
  const isExplicitlyAskingAboutQuestionImage =
    hasAnyWholeWord(qText, [
      'trong hình ảnh',
      'trong hình bên',
      'hình bên',
      'hình trên',
      'quan sát hình',
      'nhìn hình',
      'biểu tượng trong hình',
      'hình ảnh dưới đây là của',
      'đồng hồ chỉ mấy giờ',
      'đồng hồ bên',
    ]) ||
    question.visualType === 'clock' ||
    question.visualType === 'fraction' ||
    /\d+\s*[+\-×x*:÷/]\s*(?:\d+|\?)/.test(qText);

  const hasValidQVisual = hasAccurateQuestionVisual(question);

  if (isExplicitlyAskingAboutQuestionImage && hasValidQVisual) {
    return 'question_image';
  }

  // 2. Kiểm tra xem cả 4 đáp án A, B, C, D có phải là 4 đối tượng hình ảnh trực quan (ví dụ: Thân máy, Màn hình, Chuột, PowerPoint; hoặc 4 hình học)
  const allOptionsHaveConcreteVisuals =
    options.length === 4 &&
    options.every((opt, idx) =>
      isOptionVisuallyRepresentable(opt, question.optionVisuals?.[idx], question.optionSvgs?.[idx])
    );

  // Kiểm tra các câu hỏi dạng "Trong các đáp án dưới đây đâu là...", "Hình nào dưới đây...", "Thiết bị nào dưới đây..."
  const isAskingToPickVisualOption = hasAnyWholeWord(qText, [
    'trong các đáp án dưới đây',
    'hình nào dưới đây',
    'đâu là',
    'thiết bị nào',
    'bộ phận nào',
    'biểu tượng nào',
    'con vật nào',
    'đồ vật nào',
    'loại quả nào',
  ]);

  if (question.visualDisplayMode === 'options_image' && allOptionsHaveConcreteVisuals) {
    return 'options_image';
  }

  if (isAskingToPickVisualOption && allOptionsHaveConcreteVisuals) {
    return 'options_image';
  }

  // 3. Nếu câu hỏi được đánh dấu là thuần văn bản ('text_only') và không bắt buộc quan sát hình
  if (question.visualDisplayMode === 'text_only' || question.visualType === 'none') {
    return 'text_only';
  }

  // 4. Nếu câu hỏi có hình ảnh minh họa chính xác (và không phải dạng chọn 4 hình đáp án)
  if (question.visualDisplayMode === 'question_image' && hasValidQVisual) {
    return 'question_image';
  }

  // 5. Nếu cả 4 phương án đều là các thực thể hình ảnh ngắn gọn rõ ràng (VD: 4 thiết bị phần cứng/phần mềm, 4 hình học)
  if (
    allOptionsHaveConcreteVisuals &&
    options.every((o) => o.trim().length <= 32) &&
    !detectSemanticTopicKey(question.visualData || '', question.visualKey)
  ) {
    return 'options_image';
  }

  // 6. Nếu câu hỏi có hình minh họa chính xác thì hiển thị hình ở câu hỏi ('question_image')
  if (hasValidQVisual) {
    return 'question_image';
  }

  // 7. Nếu câu hỏi không cần hình ảnh hoặc không có hình ảnh chính xác tương ứng -> Hiển thị văn bản thuần túy ('text_only')
  return 'text_only';
}

/**
 * Trả về danh sách 4 mô tả hình ảnh cho 4 đáp án CHỈ KHI câu hỏi ở chế độ 'options_image'.
 * Nếu câu hỏi đã hiển thị hình ảnh ('question_image') hoặc 'text_only', hàm trả về null để đáp án chỉ hiển thị VĂN BẢN!
 */
export function getUniformOptionVisuals(question: Question): string[] | null {
  if (!question.options || question.options.length === 0) return null;

  const mode = resolveVisualDisplayMode(question);
  if (mode !== 'options_image') {
    return null;
  }

  return question.options.map((opt, idx) => {
    const rawSpec = question.optionVisuals?.[idx];
    if (rawSpec && String(rawSpec).trim().length > 0) {
      return String(rawSpec).trim();
    }
    return opt;
  });
}

/**
 * Thư viện vẽ Vector SVG sắc nét, chuẩn xác 100% theo từng chủ đề (Tin học, Toán học, Khoa học, Tiếng Việt)
 */
export const CustomTopicSvgRenderer: React.FC<{
  topicKey: SemanticTopicKey;
  className?: string;
}> = ({ topicKey, className = 'w-28 h-24 sm:w-32 sm:h-28' }) => {
  switch (topicKey) {
    // ================= TIN HỌC: PHẦN CỨNG MÁY TÍNH =================
    case 'cpu_tower':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Thân máy tính để bàn (System Unit / Case CPU) */}
          <rect x="45" y="10" width="70" height="100" rx="8" fill="#1e293b" stroke="#94a3b8" strokeWidth="3" />
          <rect x="52" y="18" width="56" height="14" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
          <circle cx="98" cy="25" r="2.5" fill="#22c55e" />
          <rect x="58" y="23" width="28" height="4" rx="1.5" fill="#64748b" />
          <rect x="52" y="37" width="56" height="12" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
          {/* Nút nguồn phát sáng */}
          <circle cx="80" cy="64" r="9" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          <path d="M80 58 L80 64" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          {/* Cổng USB mặt trước */}
          <rect x="64" y="80" width="12" height="5" rx="1" fill="#38bdf8" />
          <rect x="84" y="80" width="12" height="5" rx="1" fill="#38bdf8" />
          {/* Khe tản nhiệt */}
          <line x1="56" y1="93" x2="104" y2="93" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="56" y1="99" x2="104" y2="99" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'monitor':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Màn hình máy tính (Computer Monitor) */}
          <rect x="22" y="12" width="116" height="74" rx="8" fill="#1e293b" stroke="#cbd5e1" strokeWidth="3" />
          <rect x="29" y="19" width="102" height="58" rx="4" fill="#0284c7" />
          {/* Giao diện màn hình */}
          <path d="M29 62 L62 42 L88 58 L108 45 L131 62 L131 77 L29 77 Z" fill="#38bdf8" opacity="0.55" />
          <circle cx="50" cy="34" r="7" fill="#fde047" />
          {/* Chân đế màn hình */}
          <rect x="71" y="86" width="18" height="14" fill="#94a3b8" />
          <path d="M50 100 L110 100 L118 107 L42 107 Z" fill="#cbd5e1" />
        </svg>
      );

    case 'mouse':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Dây chuột */}
          <path d="M80 22 C80 8, 102 10, 106 3" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          {/* Thân chuột máy tính */}
          <rect x="52" y="22" width="56" height="84" rx="28" fill="#1e293b" stroke="#e2e8f0" strokeWidth="3" />
          {/* Đường chia nút trái/phải */}
          <line x1="52" y1="54" x2="108" y2="54" stroke="#64748b" strokeWidth="2.5" />
          <line x1="80" y1="22" x2="80" y2="54" stroke="#64748b" strokeWidth="2.5" />
          {/* Con lăn chuột (Scroll wheel) */}
          <rect x="75" y="31" width="10" height="16" rx="5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />
        </svg>
      );

    case 'keyboard':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Bàn phím máy tính */}
          <rect x="14" y="32" width="132" height="62" rx="8" fill="#1e293b" stroke="#cbd5e1" strokeWidth="3" />
          {/* Hàng phím 1 */}
          {[24, 40, 56, 72, 88, 104, 120].map((x) => (
            <rect key={`r1-${x}`} x={x} y="41" width="11" height="10" rx="2" fill="#e2e8f0" />
          ))}
          {/* Hàng phím 2 */}
          {[24, 40, 56, 72, 88, 104, 120].map((x) => (
            <rect key={`r2-${x}`} x={x} y="56" width="11" height="10" rx="2" fill="#cbd5e1" />
          ))}
          {/* Hàng phím 3 + Thanh Spacebar */}
          <rect x="24" y="71" width="18" height="11" rx="2" fill="#94a3b8" />
          <rect x="47" y="71" width="62" height="11" rx="3" fill="#38bdf8" />
          <rect x="114" y="71" width="17" height="11" rx="2" fill="#94a3b8" />
        </svg>
      );

    case 'speaker':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Cặp loa máy tính */}
          <rect x="26" y="20" width="44" height="82" rx="7" fill="#1e293b" stroke="#94a3b8" strokeWidth="2.5" />
          <circle cx="48" cy="42" r="9" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="48" cy="74" r="15" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="48" cy="74" r="5" fill="#38bdf8" />

          <rect x="90" y="20" width="44" height="82" rx="7" fill="#1e293b" stroke="#94a3b8" strokeWidth="2.5" />
          <circle cx="112" cy="42" r="9" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="112" cy="74" r="15" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="112" cy="74" r="5" fill="#38bdf8" />
        </svg>
      );

    case 'printer':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Giấy nạp phía trên */}
          <rect x="46" y="12" width="68" height="28" rx="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
          {/* Thân máy in */}
          <rect x="24" y="36" width="112" height="48" rx="9" fill="#334155" stroke="#cbd5e1" strokeWidth="2.5" />
          <circle cx="118" cy="52" r="4" fill="#22c55e" />
          <rect x="42" y="68" width="76" height="16" fill="#0f172a" />
          {/* Trang giấy in ra */}
          <rect x="48" y="74" width="64" height="34" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
          <line x1="56" y1="84" x2="104" y2="84" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
          <line x1="56" y1="93" x2="94" y2="93" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'headphones':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <path d="M36 68 A44 44 0 0 1 124 68" fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
          <rect x="24" y="60" width="20" height="36" rx="9" fill="#1e293b" stroke="#e2e8f0" strokeWidth="2.5" />
          <rect x="116" y="60" width="20" height="36" rx="9" fill="#1e293b" stroke="#e2e8f0" strokeWidth="2.5" />
        </svg>
      );

    case 'usb_drive':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <rect x="30" y="42" width="32" height="36" rx="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="2.5" />
          <rect x="38" y="49" width="8" height="8" fill="#1e293b" />
          <rect x="38" y="63" width="8" height="8" fill="#1e293b" />
          <rect x="62" y="34" width="68" height="52" rx="12" fill="#2563eb" stroke="#93c5fd" strokeWidth="2.5" />
          <circle cx="116" cy="60" r="5" fill="#0f172a" />
        </svg>
      );

    case 'hard_drive':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <rect x="36" y="14" width="88" height="92" rx="10" fill="#1e293b" stroke="#94a3b8" strokeWidth="3" />
          <circle cx="80" cy="54" r="28" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
          <circle cx="80" cy="54" r="9" fill="#1e293b" />
          <path d="M80 54 L102 86 L90 92 Z" fill="#f59e0b" />
        </svg>
      );

    case 'power_cable':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Phích cắm và dây cáp */}
          <rect x="24" y="42" width="14" height="6" rx="2" fill="#cbd5e1" />
          <rect x="24" y="62" width="14" height="6" rx="2" fill="#cbd5e1" />
          <rect x="38" y="34" width="26" height="42" rx="6" fill="#334155" stroke="#94a3b8" strokeWidth="2.5" />
          <path
            d="M64 55 C92 55, 86 25, 112 25 C136 25, 136 85, 106 85 C88 85, 96 98, 134 98"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'mousepad':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Tấm bàn di chuột */}
          <rect x="20" y="24" width="120" height="76" rx="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
          <rect x="28" y="32" width="104" height="60" rx="10" fill="#1e293b" />
          {/* Chuột nhỏ đặt trên tấm lót */}
          <rect x="92" y="44" width="24" height="36" rx="12" fill="#475569" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="104" y1="44" x2="104" y2="58" stroke="#38bdf8" strokeWidth="2" />
        </svg>
      );

    case 'laptop':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <rect x="32" y="18" width="96" height="62" rx="6" fill="#1e293b" stroke="#cbd5e1" strokeWidth="3" />
          <rect x="38" y="24" width="84" height="50" rx="3" fill="#0284c7" />
          <path d="M16 80 L144 80 L152 94 L8 94 Z" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="68" y="84" width="24" height="5" rx="2" fill="#475569" />
        </svg>
      );

    case 'hardware_overview':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Màn hình */}
          <rect x="18" y="18" width="76" height="52" rx="5" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2.5" />
          <rect x="23" y="23" width="66" height="40" rx="2" fill="#0284c7" />
          <rect x="49" y="70" width="14" height="10" fill="#94a3b8" />
          <rect x="36" y="80" width="40" height="5" rx="2" fill="#cbd5e1" />
          {/* Thân máy CPU */}
          <rect x="104" y="16" width="38" height="69" rx="5" fill="#1e293b" stroke="#94a3b8" strokeWidth="2.5" />
          <circle cx="123" cy="56" r="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          {/* Bàn phím + Chuột */}
          <rect x="16" y="92" width="78" height="16" rx="3" fill="#334155" stroke="#cbd5e1" strokeWidth="2" />
          <rect x="106" y="91" width="16" height="20" rx="8" fill="#334155" stroke="#cbd5e1" strokeWidth="2" />
        </svg>
      );

    // ================= TIN HỌC: BIỂU TƯỢNG PHẦN MỀM =================
    case 'word_icon':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Trang tài liệu nền xanh dương */}
          <rect x="48" y="12" width="78" height="96" rx="10" fill="#2563eb" stroke="#93c5fd" strokeWidth="2.5" />
          <line x1="78" y1="30" x2="114" y2="30" stroke="#bfdbfe" strokeWidth="4" strokeLinecap="round" />
          <line x1="78" y1="46" x2="114" y2="46" stroke="#bfdbfe" strokeWidth="4" strokeLinecap="round" />
          <line x1="78" y1="62" x2="114" y2="62" stroke="#bfdbfe" strokeWidth="4" strokeLinecap="round" />
          <line x1="78" y1="78" x2="114" y2="78" stroke="#bfdbfe" strokeWidth="4" strokeLinecap="round" />
          <line x1="78" y1="92" x2="104" y2="92" stroke="#bfdbfe" strokeWidth="4" strokeLinecap="round" />
          {/* Ô biểu tượng chữ W màu xanh đậm chuẩn Microsoft Word */}
          <rect x="26" y="30" width="56" height="60" rx="10" fill="#1d4ed8" stroke="#ffffff" strokeWidth="3" />
          <text
            x="54"
            y="72"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="36"
            fontWeight="900"
            fontFamily="Arial, sans-serif"
          >
            W
          </text>
        </svg>
      );

    case 'powerpoint_icon':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Slide trình chiếu nền cam đỏ */}
          <rect x="48" y="12" width="78" height="96" rx="10" fill="#ea580c" stroke="#fdba74" strokeWidth="2.5" />
          <circle cx="96" cy="52" r="18" fill="#fed7aa" />
          <path d="M96 52 L96 34 A18 18 0 0 1 114 52 Z" fill="#9a3412" />
          <line x1="76" y1="84" x2="114" y2="84" stroke="#fed7aa" strokeWidth="4" strokeLinecap="round" />
          {/* Ô biểu tượng chữ P màu đỏ cam chuẩn PowerPoint */}
          <rect x="26" y="30" width="56" height="60" rx="10" fill="#c2410c" stroke="#ffffff" strokeWidth="3" />
          <text
            x="54"
            y="72"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="36"
            fontWeight="900"
            fontFamily="Arial, sans-serif"
          >
            P
          </text>
        </svg>
      );

    case 'excel_icon':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Bảng tính nền xanh lá */}
          <rect x="48" y="12" width="78" height="96" rx="10" fill="#16a34a" stroke="#86efac" strokeWidth="2.5" />
          {/* Các ô bảng tính */}
          <rect x="78" y="26" width="16" height="12" rx="2" fill="#bbf7d0" />
          <rect x="98" y="26" width="16" height="12" rx="2" fill="#86efac" />
          <rect x="78" y="44" width="16" height="12" rx="2" fill="#86efac" />
          <rect x="98" y="44" width="16" height="12" rx="2" fill="#bbf7d0" />
          <rect x="78" y="62" width="16" height="12" rx="2" fill="#bbf7d0" />
          <rect x="98" y="62" width="16" height="12" rx="2" fill="#86efac" />
          <rect x="78" y="80" width="16" height="12" rx="2" fill="#86efac" />
          <rect x="98" y="80" width="16" height="12" rx="2" fill="#bbf7d0" />
          {/* Ô biểu tượng chữ X màu xanh lá đậm chuẩn Excel */}
          <rect x="26" y="30" width="56" height="60" rx="10" fill="#15803d" stroke="#ffffff" strokeWidth="3" />
          <text
            x="54"
            y="72"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="36"
            fontWeight="900"
            fontFamily="Arial, sans-serif"
          >
            X
          </text>
        </svg>
      );

    case 'paint_icon':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Bảng pha màu của họa sĩ (Phần mềm Paint) */}
          <path
            d="M80 14 C44 14, 22 38, 22 66 C22 92, 46 106, 72 106 C84 106, 92 98, 92 88 C92 80, 86 76, 86 68 C86 60, 94 56, 104 56 L114 56 C130 56, 138 44, 138 34 C138 20, 112 14, 80 14 Z"
            fill="#fde68a"
            stroke="#f59e0b"
            strokeWidth="3"
          />
          <circle cx="48" cy="48" r="9" fill="#ef4444" />
          <circle cx="72" cy="34" r="9" fill="#3b82f6" />
          <circle cx="102" cy="36" r="9" fill="#22c55e" />
          <circle cx="48" cy="76" r="9" fill="#a855f7" />
          <circle cx="70" cy="88" r="7" fill="#0f172a" />
          {/* Cọ vẽ */}
          <path d="M102 74 L138 106" stroke="#b45309" strokeWidth="7" strokeLinecap="round" />
          <path d="M90 64 C96 60, 106 66, 104 76 C96 78, 88 72, 90 64 Z" fill="#ec4899" />
        </svg>
      );

    case 'scratch_icon':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <rect x="28" y="20" width="104" height="80" rx="16" fill="#f97316" stroke="#fed7aa" strokeWidth="3" />
          <text
            x="80"
            y="74"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="40"
            fontWeight="900"
            fontFamily="Arial, sans-serif"
          >
            S
          </text>
        </svg>
      );

    case 'browser_icon':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <circle cx="80" cy="60" r="44" fill="#0284c7" stroke="#bae6fd" strokeWidth="3" />
          <ellipse cx="80" cy="60" rx="22" ry="44" fill="none" stroke="#bae6fd" strokeWidth="2.5" />
          <line x1="36" y1="60" x2="124" y2="60" stroke="#bae6fd" strokeWidth="2.5" />
          <line x1="44" y1="40" x2="116" y2="40" stroke="#bae6fd" strokeWidth="2" />
          <line x1="44" y1="80" x2="116" y2="80" stroke="#bae6fd" strokeWidth="2" />
        </svg>
      );

    case 'windows_icon':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <rect x="38" y="18" width="38" height="38" rx="4" fill="#0ea5e9" />
          <rect x="84" y="18" width="38" height="38" rx="4" fill="#38bdf8" />
          <rect x="38" y="64" width="38" height="38" rx="4" fill="#38bdf8" />
          <rect x="84" y="64" width="38" height="38" rx="4" fill="#0284c7" />
        </svg>
      );

    case 'folder_icon':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <path
            d="M24 30 L64 30 L76 42 L136 42 L136 96 L24 96 Z"
            fill="#facc15"
            stroke="#fde047"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <rect x="24" y="46" width="112" height="50" rx="6" fill="#eab308" />
        </svg>
      );

    case 'software_overview':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Cửa sổ phần mềm gồm Word, PowerPoint, Excel, Paint */}
          <rect x="18" y="12" width="124" height="96" rx="12" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="32" cy="24" r="3.5" fill="#ef4444" />
          <circle cx="44" cy="24" r="3.5" fill="#facc15" />
          <circle cx="56" cy="24" r="3.5" fill="#22c55e" />
          {/* 4 icon ứng dụng bên trong */}
          <rect x="34" y="38" width="38" height="26" rx="6" fill="#1d4ed8" />
          <text x="53" y="57" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="900">
            W
          </text>
          <rect x="88" y="38" width="38" height="26" rx="6" fill="#c2410c" />
          <text x="107" y="57" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="900">
            P
          </text>
          <rect x="34" y="72" width="38" height="26" rx="6" fill="#15803d" />
          <text x="53" y="91" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="900">
            X
          </text>
          <rect x="88" y="72" width="38" height="26" rx="6" fill="#7c3aed" />
          <circle cx="107" cy="85" r="8" fill="#fde047" />
        </svg>
      );

    // ================= TOÁN HỌC: HÌNH HỌC =================
    case 'shape_triangle':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <polygon
            points="80,14 138,104 22,104"
            fill="rgba(251, 191, 36, 0.28)"
            stroke="#fbbf24"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <circle cx="80" cy="14" r="4.5" fill="#fde68a" />
          <circle cx="138" cy="104" r="4.5" fill="#fde68a" />
          <circle cx="22" cy="104" r="4.5" fill="#fde68a" />
        </svg>
      );

    case 'shape_right_triangle':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <polygon
            points="34,16 34,102 134,102"
            fill="rgba(56, 189, 248, 0.28)"
            stroke="#38bdf8"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <rect x="34" y="86" width="16" height="16" fill="none" stroke="#fde047" strokeWidth="3" />
        </svg>
      );

    case 'shape_square':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <rect
            x="36"
            y="16"
            width="88"
            height="88"
            rx="4"
            fill="rgba(52, 211, 153, 0.25)"
            stroke="#34d399"
            strokeWidth="5"
          />
          <rect x="36" y="16" width="12" height="12" fill="none" stroke="#a7f3d0" strokeWidth="2" />
          <rect x="112" y="16" width="12" height="12" fill="none" stroke="#a7f3d0" strokeWidth="2" />
          <rect x="36" y="92" width="12" height="12" fill="none" stroke="#a7f3d0" strokeWidth="2" />
          <rect x="112" y="92" width="12" height="12" fill="none" stroke="#a7f3d0" strokeWidth="2" />
        </svg>
      );

    case 'shape_circle':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <circle
            cx="80"
            cy="60"
            r="45"
            fill="rgba(96, 165, 250, 0.25)"
            stroke="#60a5fa"
            strokeWidth="5"
          />
          <circle cx="80" cy="60" r="4" fill="#fde047" />
          <line x1="80" y1="60" x2="125" y2="60" stroke="#fde047" strokeWidth="2.5" strokeDasharray="4 3" />
        </svg>
      );

    case 'shape_rectangle':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <rect
            x="20"
            y="26"
            width="120"
            height="68"
            rx="4"
            fill="rgba(167, 139, 250, 0.25)"
            stroke="#a78bfa"
            strokeWidth="5"
          />
        </svg>
      );

    case 'shape_rhombus':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <polygon
            points="80,12 138,60 80,108 22,60"
            fill="rgba(244, 114, 182, 0.25)"
            stroke="#f472b6"
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'shape_parallelogram':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <polygon
            points="44,24 142,24 116,96 18,96"
            fill="rgba(45, 212, 191, 0.25)"
            stroke="#2dd4bf"
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'shape_trapezoid':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <polygon
            points="50,24 110,24 138,96 22,96"
            fill="rgba(251, 146, 60, 0.25)"
            stroke="#fb923c"
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'shape_quadrilateral':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <polygon
            points="36,20 126,28 138,98 22,92"
            fill="rgba(56, 189, 248, 0.25)"
            stroke="#38bdf8"
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'shape_pentagon':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <polygon
            points="80,12 132,48 112,104 48,104 28,48"
            fill="rgba(250, 204, 21, 0.25)"
            stroke="#facc15"
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'shape_hexagon':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <polygon
            points="80,12 128,36 128,84 80,108 32,84 32,36"
            fill="rgba(56, 189, 248, 0.25)"
            stroke="#38bdf8"
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'shape_cube':
    case 'shape_rectangular_prism':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <polygon points="56,20 124,20 100,44 32,44" fill="rgba(56,189,248,0.4)" stroke="#38bdf8" strokeWidth="3.5" />
          <rect x="32" y="44" width="68" height="58" fill="rgba(56,189,248,0.25)" stroke="#38bdf8" strokeWidth="3.5" />
          <polygon points="100,44 124,20 124,78 100,102" fill="rgba(2,132,199,0.45)" stroke="#38bdf8" strokeWidth="3.5" />
        </svg>
      );

    case 'shape_cylinder':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <path d="M44,32 L44,88 A36,14 0 0,0 116,88 L116,32" fill="rgba(167,139,250,0.28)" stroke="#a78bfa" strokeWidth="4" />
          <ellipse cx="80" cy="32" rx="36" ry="14" fill="rgba(167,139,250,0.45)" stroke="#a78bfa" strokeWidth="4" />
        </svg>
      );

    case 'shape_sphere':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <circle cx="80" cy="60" r="44" fill="rgba(244,114,182,0.3)" stroke="#f472b6" strokeWidth="4" />
          <ellipse cx="80" cy="60" rx="44" ry="16" fill="none" stroke="#fbcfe8" strokeWidth="2.5" strokeDasharray="4 3" />
        </svg>
      );

    case 'angle_right':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <polyline points="42,20 42,96 128,96" fill="none" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
          <rect x="42" y="76" width="20" height="20" fill="rgba(250,204,21,0.3)" stroke="#facc15" strokeWidth="3" />
        </svg>
      );

    case 'angle_acute':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <polyline points="116,24 36,96 132,96" fill="none" stroke="#34d399" strokeWidth="5" strokeLinecap="round" />
          <path d="M66,96 A30,30 0 0,0 58,76" fill="none" stroke="#fde047" strokeWidth="3" />
        </svg>
      );

    case 'angle_obtuse':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <polyline points="22,30 68,96 142,96" fill="none" stroke="#fb923c" strokeWidth="5" strokeLinecap="round" />
          <path d="M96,96 A28,28 0 0,0 52,73" fill="none" stroke="#fde047" strokeWidth="3" />
        </svg>
      );

    case 'segment_midpoint':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <line x1="22" y1="64" x2="138" y2="64" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
          <circle cx="22" cy="64" r="6" fill="#facc15" />
          <circle cx="80" cy="64" r="7" fill="#ef4444" stroke="#fff" strokeWidth="2" />
          <circle cx="138" cy="64" r="6" fill="#facc15" />
          <text x="22" y="46" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="900">
            A
          </text>
          <text x="80" y="44" textAnchor="middle" fill="#fde047" fontSize="16" fontWeight="900">
            M
          </text>
          <text x="138" y="46" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="900">
            B
          </text>
        </svg>
      );

    // ================= TIẾNG VIỆT: DẤU CÂU =================
    case 'punc_period':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <rect x="44" y="18" width="72" height="84" rx="18" fill="#1e293b" stroke="#38bdf8" strokeWidth="3.5" />
          <circle cx="80" cy="70" r="12" fill="#fde047" />
        </svg>
      );

    case 'punc_question':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <rect x="44" y="18" width="72" height="84" rx="18" fill="#1e293b" stroke="#f472b6" strokeWidth="3.5" />
          <text x="80" y="82" textAnchor="middle" fill="#f472b6" fontSize="64" fontWeight="900">
            ?
          </text>
        </svg>
      );

    case 'punc_exclamation':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <rect x="44" y="18" width="72" height="84" rx="18" fill="#1e293b" stroke="#fb923c" strokeWidth="3.5" />
          <text x="80" y="82" textAnchor="middle" fill="#fb923c" fontSize="64" fontWeight="900">
            !
          </text>
        </svg>
      );

    case 'punc_comma':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <rect x="44" y="18" width="72" height="84" rx="18" fill="#1e293b" stroke="#34d399" strokeWidth="3.5" />
          <text x="80" y="72" textAnchor="middle" fill="#34d399" fontSize="72" fontWeight="900">
            ,
          </text>
        </svg>
      );

    // ================= KHOA HỌC: CƠ QUAN CƠ THỂ =================
    case 'organ_mouth_teeth':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <path d="M26 60 Q80 24 134 60 Q80 102 26 60 Z" fill="#e11d48" stroke="#fda4af" strokeWidth="4" />
          <rect x="48" y="45" width="14" height="14" rx="3" fill="#ffffff" />
          <rect x="65" y="43" width="14" height="15" rx="3" fill="#ffffff" />
          <rect x="82" y="43" width="14" height="15" rx="3" fill="#ffffff" />
          <rect x="99" y="45" width="14" height="14" rx="3" fill="#ffffff" />
        </svg>
      );

    case 'organ_stomach':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <path
            d="M68 18 L68 38 C52 44, 42 64, 52 84 C62 102, 96 104, 112 84 C124 68, 116 40, 94 36 C86 35, 80 42, 78 52"
            fill="#fb7185"
            stroke="#ffe4e6"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'organ_intestine':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <path
            d="M48 34 H112 C122 34, 122 52, 112 52 H48 C38 52, 38 70, 48 70 H112 C122 70, 122 88, 112 88 H64"
            fill="none"
            stroke="#f472b6"
            strokeWidth="14"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'organ_esophagus':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <rect x="70" y="14" width="20" height="92" rx="10" fill="#fda4af" stroke="#f43f5e" strokeWidth="3.5" />
        </svg>
      );

    case 'organ_heart':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <path
            d="M80 98 C80 98, 30 68, 30 40 C30 24, 44 16, 58 16 C68 16, 76 22, 80 30 C84 22, 92 16, 102 16 C116 16, 130 24, 130 40 C130 68, 80 98, 80 98 Z"
            fill="#ef4444"
            stroke="#fecaca"
            strokeWidth="3.5"
          />
        </svg>
      );

    case 'organ_lungs':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <path d="M80 16 V48 M80 38 L62 52 M80 38 L98 52" stroke="#bae6fd" strokeWidth="5" strokeLinecap="round" />
          <path d="M68 32 C42 32, 30 58, 34 86 C36 98, 64 98, 68 84 Z" fill="#fb7185" stroke="#fecdd3" strokeWidth="3" />
          <path d="M92 32 C118 32, 130 58, 126 86 C124 98, 96 98, 92 84 Z" fill="#fb7185" stroke="#fecdd3" strokeWidth="3" />
        </svg>
      );

    // ================= CÔNG NGHỆ: TRỒNG HOA, CÂY CẢNH, DỤNG CỤ LÀM VƯỜN =================
    case 'flower_pot':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Chậu trồng hoa cây cảnh có vành chậu và lỗ thoát nước ở đáy */}
          <rect x="38" y="24" width="84" height="14" rx="5" fill="#d97706" stroke="#fde68a" strokeWidth="2.5" />
          <polygon points="44,38 116,38 104,96 56,96" fill="#b45309" stroke="#fcd34d" strokeWidth="2.5" />
          {/* Lỗ thoát nước ở đáy chậu */}
          <ellipse cx="80" cy="90" rx="10" ry="3.5" fill="#0f172a" stroke="#fde047" strokeWidth="1.5" />
          {/* Đĩa lót dưới đáy chậu */}
          <rect x="48" y="98" width="64" height="7" rx="3.5" fill="#92400e" stroke="#fbbf24" strokeWidth="2" />
        </svg>
      );

    case 'plant_flower':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Chậu hoa đang nở */}
          <line x1="80" y1="36" x2="80" y2="70" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" />
          <path d="M80 56 C62 48, 56 36, 72 44" fill="#22c55e" stroke="#86efac" strokeWidth="2" />
          <path d="M80 54 C98 46, 104 34, 88 42" fill="#22c55e" stroke="#86efac" strokeWidth="2" />
          {/* Cánh hoa */}
          <circle cx="80" cy="18" r="9" fill="#f43f5e" />
          <circle cx="94" cy="28" r="9" fill="#fb7185" />
          <circle cx="89" cy="43" r="9" fill="#f43f5e" />
          <circle cx="71" cy="43" r="9" fill="#fb7185" />
          <circle cx="66" cy="28" r="9" fill="#f43f5e" />
          <circle cx="80" cy="31" r="8" fill="#facc15" stroke="#fef08a" strokeWidth="2" />
          {/* Chậu cây */}
          <rect x="48" y="68" width="64" height="10" rx="3" fill="#d97706" />
          <polygon points="52,78 108,78 100,108 60,108" fill="#b45309" stroke="#fde68a" strokeWidth="2" />
        </svg>
      );

    case 'cactus_succulent':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Cây xương rồng / sen đá trong chậu */}
          <rect x="68" y="20" width="24" height="52" rx="12" fill="#16a34a" stroke="#86efac" strokeWidth="2.5" />
          <path d="M68 46 H54 C48 46, 48 30, 54 30 C58 30, 58 38, 58 40" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />
          <path d="M92 40 H106 C112 40, 112 26, 106 26 C102 26, 102 34, 102 36" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />
          <circle cx="80" cy="16" r="6" fill="#f472b6" />
          <rect x="48" y="70" width="64" height="9" rx="3" fill="#d97706" />
          <polygon points="52,79 108,79 100,108 60,108" fill="#b45309" stroke="#fcd34d" strokeWidth="2" />
        </svg>
      );

    case 'bonsai_tree':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Cây cảnh lá xanh trong chậu */}
          <path d="M76 72 C76 54, 84 48, 80 34" fill="none" stroke="#92400e" strokeWidth="7" strokeLinecap="round" />
          <circle cx="64" cy="38" r="16" fill="#15803d" stroke="#86efac" strokeWidth="2" />
          <circle cx="96" cy="38" r="16" fill="#16a34a" stroke="#86efac" strokeWidth="2" />
          <circle cx="80" cy="24" r="18" fill="#22c55e" stroke="#bbf7d0" strokeWidth="2" />
          <rect x="46" y="72" width="68" height="10" rx="3" fill="#0284c7" />
          <polygon points="50,82 110,82 102,108 58,108" fill="#0369a1" stroke="#7dd3fc" strokeWidth="2" />
        </svg>
      );

    case 'soil_substrate':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Giá thể trồng cây: Đất mùn, xơ dừa, trấu hun */}
          <path d="M22 92 Q80 28 138 92 Z" fill="#78350f" stroke="#d97706" strokeWidth="3" />
          <circle cx="62" cy="74" r="4" fill="#fbbf24" />
          <circle cx="84" cy="64" r="3.5" fill="#fde68a" />
          <circle cx="98" cy="78" r="4" fill="#d97706" />
          <circle cx="72" cy="84" r="3" fill="#a16207" />
          {/* Mầm cây nhỏ mọc trên giá thể */}
          <line x1="80" y1="54" x2="80" y2="32" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="70" cy="32" rx="9" ry="5" fill="#22c55e" />
          <ellipse cx="90" cy="32" rx="9" ry="5" fill="#4ade80" />
        </svg>
      );

    case 'garden_trowel':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Xẻng nhỏ làm vườn xúc đất, giá thể */}
          <rect x="26" y="50" width="42" height="18" rx="8" fill="#ef4444" stroke="#fca5a5" strokeWidth="2.5" />
          <line x1="68" y1="59" x2="86" y2="59" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
          <path d="M84 36 L138 59 L84 82 Z" fill="#cbd5e1" stroke="#f8fafc" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      );

    case 'garden_fork':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Chĩa ba làm vườn xới đất */}
          <rect x="24" y="50" width="42" height="18" rx="8" fill="#f59e0b" stroke="#fde68a" strokeWidth="2.5" />
          <line x1="66" y1="59" x2="94" y2="59" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
          <line x1="94" y1="40" x2="94" y2="78" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
          <line x1="94" y1="42" x2="134" y2="42" stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round" />
          <line x1="94" y1="59" x2="136" y2="59" stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round" />
          <line x1="94" y1="76" x2="134" y2="76" stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );

    case 'watering_can':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Bình tưới nước vòi hoa sen */}
          <path d="M48 44 A22 20 0 1 0 48 86" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
          <rect x="46" y="42" width="54" height="50" rx="10" fill="#0284c7" stroke="#7dd3fc" strokeWidth="2.5" />
          <path d="M100 68 L130 42" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
          <ellipse cx="132" cy="40" rx="6" ry="10" transform="rotate(-35 132 40)" fill="#facc15" stroke="#fef08a" strokeWidth="2" />
          {/* Giọt nước phun ra */}
          <circle cx="144" cy="30" r="3" fill="#7dd3fc" />
          <circle cx="148" cy="42" r="3" fill="#7dd3fc" />
          <circle cx="142" cy="52" r="3" fill="#7dd3fc" />
        </svg>
      );

    case 'pruning_shears':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Kéo cắt cành làm vườn */}
          <path d="M34 38 L78 58" stroke="#ef4444" strokeWidth="10" strokeLinecap="round" />
          <path d="M34 82 L78 62" stroke="#ef4444" strokeWidth="10" strokeLinecap="round" />
          <path d="M78 58 Q114 38 130 48 Q110 62 78 62 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
          <path d="M78 62 Q114 82 130 72 Q110 58 78 58 Z" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
          <circle cx="80" cy="60" r="5" fill="#facc15" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );

    case 'garden_gloves':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Đôi găng tay làm vườn bảo hộ */}
          <rect x="44" y="42" width="44" height="52" rx="14" fill="#22c55e" stroke="#bbf7d0" strokeWidth="2.5" />
          <rect x="46" y="18" width="9" height="28" rx="4.5" fill="#22c55e" stroke="#bbf7d0" strokeWidth="2" />
          <rect x="57" y="14" width="9" height="32" rx="4.5" fill="#22c55e" stroke="#bbf7d0" strokeWidth="2" />
          <rect x="68" y="16" width="9" height="30" rx="4.5" fill="#22c55e" stroke="#bbf7d0" strokeWidth="2" />
          <rect x="79" y="22" width="9" height="24" rx="4.5" fill="#22c55e" stroke="#bbf7d0" strokeWidth="2" />
          <path d="M44 62 L28 50 C24 46, 30 38, 36 44 L46 54" fill="#22c55e" stroke="#bbf7d0" strokeWidth="2.5" />
          <rect x="42" y="86" width="48" height="14" rx="4" fill="#15803d" stroke="#86efac" strokeWidth="2" />
        </svg>
      );

    case 'seed_sprout':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Hạt giống nảy mầm thành cây con */}
          <path d="M20 88 H140" stroke="#a16207" strokeWidth="8" strokeLinecap="round" />
          <ellipse cx="48" cy="86" rx="10" ry="7" fill="#fde047" stroke="#ca8a04" strokeWidth="2" />
          <path d="M80 86 V48" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="70" cy="52" rx="10" ry="6" fill="#4ade80" />
          <path d="M116 86 V28" stroke="#16a34a" strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="102" cy="36" rx="13" ry="7" fill="#22c55e" />
          <ellipse cx="130" cy="32" rx="13" ry="7" fill="#4ade80" />
        </svg>
      );

    case 'sunlight_care':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <circle cx="80" cy="60" r="24" fill="#facc15" stroke="#fef08a" strokeWidth="3" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={80 + 30 * Math.cos(rad)}
                y1={60 + 30 * Math.sin(rad)}
                x2={80 + 44 * Math.cos(rad)}
                y2={60 + 44 * Math.sin(rad)}
                stroke="#fde047"
                strokeWidth="4"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      );

    case 'fertilizer_bag':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Bao phân bón hữu cơ cho cây */}
          <rect x="44" y="20" width="72" height="84" rx="12" fill="#15803d" stroke="#86efac" strokeWidth="3" />
          <circle cx="80" cy="56" r="18" fill="#fef08a" />
          <path d="M80 44 C72 52, 72 64, 80 68 C88 64, 88 52, 80 44 Z" fill="#16a34a" />
          <text x="80" y="92" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">
            PHÂN BÓN
          </text>
        </svg>
      );

    case 'desk_lamp':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Đèn học để bàn (Công nghệ 3) */}
          <polygon points="64,22 104,14 114,42 54,42" fill="#f59e0b" stroke="#fde68a" strokeWidth="2.5" />
          <circle cx="84" cy="44" r="8" fill="#fef08a" />
          <path d="M72 22 C46 36, 48 76, 66 96" fill="none" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
          <rect x="44" y="94" width="68" height="12" rx="6" fill="#334155" stroke="#cbd5e1" strokeWidth="2.5" />
          <circle cx="92" cy="100" r="3" fill="#22c55e" />
        </svg>
      );

    case 'electric_fan':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Quạt điện (Công nghệ 3) */}
          <circle cx="80" cy="46" r="32" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
          <ellipse cx="80" cy="28" rx="8" ry="14" fill="#38bdf8" />
          <ellipse cx="64" cy="56" rx="14" ry="8" transform="rotate(-30 64 56)" fill="#38bdf8" />
          <ellipse cx="96" cy="56" rx="14" ry="8" transform="rotate(30 96 56)" fill="#38bdf8" />
          <circle cx="80" cy="46" r="7" fill="#facc15" />
          <rect x="74" y="78" width="12" height="20" fill="#64748b" />
          <rect x="52" y="96" width="56" height="12" rx="6" fill="#334155" stroke="#cbd5e1" strokeWidth="2" />
        </svg>
      );

    case 'television_set':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Máy thu hình / Ti vi */}
          <rect x="20" y="16" width="120" height="72" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
          <rect x="26" y="22" width="108" height="60" rx="4" fill="#1e3a8a" />
          <circle cx="56" cy="44" r="10" fill="#facc15" />
          <path d="M26 70 L64 50 L96 68 L118 54 L134 68 L134 82 L26 82 Z" fill="#22c55e" opacity="0.75" />
          <line x1="64" y1="88" x2="52" y2="104" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
          <line x1="96" y1="88" x2="108" y2="104" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'radio_set':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Máy thu thanh / Đài Radio */}
          <line x1="42" y1="38" x2="112" y2="14" stroke="#cbd5e1" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="112" cy="14" r="4" fill="#facc15" />
          <rect x="28" y="38" width="104" height="64" rx="10" fill="#b45309" stroke="#fde68a" strokeWidth="3" />
          <circle cx="58" cy="70" r="18" fill="#1e293b" stroke="#fbbf24" strokeWidth="2.5" />
          <rect x="86" y="50" width="34" height="16" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="94" cy="82" r="6" fill="#fde047" />
          <circle cx="112" cy="82" r="6" fill="#fde047" />
        </svg>
      );

    case 'refrigerator':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Tủ lạnh (Công nghệ 5) */}
          <rect x="46" y="12" width="68" height="96" rx="8" fill="#0284c7" stroke="#bae6fd" strokeWidth="3" />
          <line x1="46" y1="48" x2="114" y2="48" stroke="#e0f2fe" strokeWidth="3" />
          <line x1="56" y1="26" x2="56" y2="40" stroke="#fde047" strokeWidth="4" strokeLinecap="round" />
          <line x1="56" y1="58" x2="56" y2="82" stroke="#fde047" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'telephone_emergency':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Điện thoại & số khẩn cấp */}
          <rect x="50" y="12" width="60" height="96" rx="12" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
          <rect x="56" y="22" width="48" height="68" rx="6" fill="#0f172a" />
          <circle cx="80" cy="48" r="16" fill="#ef4444" />
          <text x="80" y="53" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900">
            SOS
          </text>
          <circle cx="80" cy="99" r="4" fill="#94a3b8" />
        </svg>
      );

    case 'traffic_sign_stop':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Biển báo giao thông */}
          <rect x="76" y="64" width="8" height="46" fill="#94a3b8" />
          <circle cx="80" cy="42" r="28" fill="#ef4444" stroke="#ffffff" strokeWidth="4" />
          <rect x="62" y="37" width="36" height="10" rx="2" fill="#ffffff" />
        </svg>
      );

    case 'paper_pinwheel':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Chong chóng giấy dân gian */}
          <line x1="80" y1="52" x2="80" y2="110" stroke="#fde047" strokeWidth="5" strokeLinecap="round" />
          <polygon points="80,52 52,20 80,28" fill="#ef4444" />
          <polygon points="80,52 112,24 104,52" fill="#3b82f6" />
          <polygon points="80,52 108,84 80,76" fill="#22c55e" />
          <polygon points="80,52 48,80 56,52" fill="#facc15" />
          <circle cx="80" cy="52" r="5" fill="#ffffff" />
        </svg>
      );

    case 'wrench_screwdriver':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Bộ dụng cụ lắp ghép mô hình kỹ thuật: Cờ-lê và Tua-vít */}
          <line x1="36" y1="88" x2="114" y2="28" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
          <circle cx="118" cy="24" r="12" fill="#0f172a" stroke="#cbd5e1" strokeWidth="5" />
          <line x1="40" y1="26" x2="120" y2="90" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
          <rect x="28" y="16" width="30" height="16" rx="6" transform="rotate(38 43 24)" fill="#f59e0b" stroke="#fde68a" strokeWidth="2" />
        </svg>
      );

    case 'solar_wind_model':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Mô hình điện mặt trời & điện gió */}
          <circle cx="40" cy="30" r="14" fill="#facc15" />
          <polygon points="30,86 78,86 68,60 40,60" fill="#0284c7" stroke="#7dd3fc" strokeWidth="2.5" />
          <line x1="54" y1="86" x2="54" y2="104" stroke="#94a3b8" strokeWidth="4" />
          <line x1="114" y1="48" x2="114" y2="104" stroke="#e2e8f0" strokeWidth="4" />
          <line x1="114" y1="48" x2="114" y2="20" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
          <line x1="114" y1="48" x2="138" y2="64" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
          <line x1="114" y1="48" x2="90" y2="64" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
          <circle cx="114" cy="48" r="4" fill="#facc15" />
        </svg>
      );

    // ================= KỸ NĂNG SỐ & TRÍ TUỆ NHÂN TẠO (AI) =================
    case 'strong_password':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <path d="M62 46 V32 A18 18 0 0 1 98 32 V46" fill="none" stroke="#facc15" strokeWidth="6" strokeLinecap="round" />
          <rect x="46" y="46" width="68" height="54" rx="10" fill="#1e293b" stroke="#facc15" strokeWidth="3" />
          <text x="80" y="79" textAnchor="middle" fill="#4ade80" fontSize="22" fontWeight="900">
            ***
          </text>
        </svg>
      );

    case 'shield_antivirus':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <path
            d="M80 14 L126 30 V58 C126 84, 104 102, 80 110 C56 102, 34 84, 34 58 V30 Z"
            fill="#0284c7"
            stroke="#7dd3fc"
            strokeWidth="3.5"
          />
          <polyline points="62,62 75,75 100,46" fill="none" stroke="#fde047" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'phishing_warning':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <polygon points="80,14 136,102 24,102" fill="#dc2626" stroke="#fde047" strokeWidth="4" strokeLinejoin="round" />
          <text x="80" y="88" textAnchor="middle" fill="#ffffff" fontSize="46" fontWeight="900">
            !
          </text>
        </svg>
      );

    case 'cloud_storage':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <path
            d="M46 88 H116 A20 20 0 0 0 120 50 A28 28 0 0 0 66 42 A22 22 0 0 0 46 88 Z"
            fill="#0284c7"
            stroke="#bae6fd"
            strokeWidth="3.5"
          />
          <path d="M80 78 V54 M70 64 L80 54 L90 64" fill="none" stroke="#fde047" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'search_engine':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <rect x="18" y="40" width="124" height="40" rx="20" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
          <circle cx="116" cy="58" r="10" fill="none" stroke="#fde047" strokeWidth="3.5" />
          <line x1="123" y1="65" x2="132" y2="74" stroke="#fde047" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="36" y1="60" x2="90" y2="60" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'digital_citizenship':
    case 'ergonomic_posture':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          <circle cx="80" cy="36" r="16" fill="#38bdf8" stroke="#bae6fd" strokeWidth="2.5" />
          <path d="M52 94 C52 70, 108 70, 108 94" fill="#0284c7" stroke="#bae6fd" strokeWidth="2.5" />
          <circle cx="116" cy="32" r="10" fill="#22c55e" />
          <polyline points="111,32 115,36 122,28" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'ai_robot':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Robot Trí tuệ nhân tạo AI */}
          <line x1="80" y1="12" x2="80" y2="26" stroke="#38bdf8" strokeWidth="4" />
          <circle cx="80" cy="10" r="5" fill="#facc15" />
          <rect x="44" y="26" width="72" height="56" rx="16" fill="#1e293b" stroke="#38bdf8" strokeWidth="3.5" />
          <circle cx="64" cy="50" r="8" fill="#38bdf8" />
          <circle cx="96" cy="50" r="8" fill="#38bdf8" />
          <rect x="62" y="66" width="36" height="6" rx="3" fill="#4ade80" />
          <rect x="34" y="42" width="10" height="22" rx="4" fill="#0284c7" />
          <rect x="116" y="42" width="10" height="22" rx="4" fill="#0284c7" />
          <rect x="56" y="86" width="48" height="22" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
        </svg>
      );

    case 'neural_brain':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Mạng nơ-ron & Trí tuệ nhân tạo */}
          <circle cx="44" cy="36" r="8" fill="#a855f7" stroke="#e9d5ff" strokeWidth="2" />
          <circle cx="44" cy="84" r="8" fill="#a855f7" stroke="#e9d5ff" strokeWidth="2" />
          <circle cx="80" cy="24" r="9" fill="#38bdf8" stroke="#bae6fd" strokeWidth="2" />
          <circle cx="80" cy="60" r="10" fill="#facc15" stroke="#fef08a" strokeWidth="2" />
          <circle cx="80" cy="96" r="9" fill="#38bdf8" stroke="#bae6fd" strokeWidth="2" />
          <circle cx="116" cy="44" r="8" fill="#22c55e" stroke="#bbf7d0" strokeWidth="2" />
          <circle cx="116" cy="78" r="8" fill="#22c55e" stroke="#bbf7d0" strokeWidth="2" />
          <line x1="52" y1="36" x2="72" y2="26" stroke="#94a3b8" strokeWidth="2" />
          <line x1="52" y1="36" x2="70" y2="58" stroke="#94a3b8" strokeWidth="2" />
          <line x1="52" y1="84" x2="70" y2="62" stroke="#94a3b8" strokeWidth="2" />
          <line x1="52" y1="84" x2="72" y2="94" stroke="#94a3b8" strokeWidth="2" />
          <line x1="89" y1="26" x2="108" y2="42" stroke="#94a3b8" strokeWidth="2" />
          <line x1="90" y1="60" x2="108" y2="46" stroke="#94a3b8" strokeWidth="2" />
          <line x1="90" y1="60" x2="108" y2="76" stroke="#94a3b8" strokeWidth="2" />
          <line x1="89" y1="94" x2="108" y2="80" stroke="#94a3b8" strokeWidth="2" />
        </svg>
      );

    case 'face_recognition':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Nhận diện khuôn mặt bằng AI */}
          <path d="M36 36 V22 H52 M124 36 V22 H108 M36 84 V98 H52 M124 84 V98 H108" fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
          <circle cx="80" cy="60" r="26" fill="#1e293b" stroke="#4ade80" strokeWidth="3" />
          <circle cx="71" cy="54" r="3.5" fill="#38bdf8" />
          <circle cx="89" cy="54" r="3.5" fill="#38bdf8" />
          <path d="M70 68 Q80 76 90 68" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'voice_assistant':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Trợ lý ảo giọng nói */}
          <rect x="68" y="20" width="24" height="44" rx="12" fill="#38bdf8" stroke="#bae6fd" strokeWidth="2.5" />
          <path d="M54 46 A26 26 0 0 0 106 46" fill="none" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
          <line x1="80" y1="72" x2="80" y2="96" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
          <line x1="62" y1="96" x2="98" y2="96" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'smart_home_iot':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Ngôi nhà thông minh AI */}
          <polygon points="80,18 130,56 30,56" fill="#0284c7" stroke="#7dd3fc" strokeWidth="3" strokeLinejoin="round" />
          <rect x="44" y="56" width="72" height="48" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
          <rect x="70" y="72" width="20" height="32" rx="3" fill="#facc15" />
        </svg>
      );

    case 'self_driving_car':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Xe tự hành AI */}
          <path d="M36 70 L50 44 H110 L124 70 Z" fill="#0284c7" stroke="#bae6fd" strokeWidth="2.5" />
          <rect x="24" y="68" width="112" height="24" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="48" cy="92" r="12" fill="#0f172a" stroke="#cbd5e1" strokeWidth="3" />
          <circle cx="112" cy="92" r="12" fill="#0f172a" stroke="#cbd5e1" strokeWidth="3" />
          <path d="M80 34 A18 12 0 0 1 104 34" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'chatbot_prompt':
      return (
        <svg viewBox="0 0 160 120" className={className}>
          {/* Giao tiếp câu lệnh Prompt với AI */}
          <rect x="26" y="24" width="108" height="64" rx="14" fill="#1e293b" stroke="#a855f7" strokeWidth="3" />
          <polygon points="56,88 44,104 74,88" fill="#1e293b" stroke="#a855f7" strokeWidth="3" />
          <text x="80" y="64" textAnchor="middle" fill="#e9d5ff" fontSize="22" fontWeight="900">
            AI ✨
          </text>
        </svg>
      );
  }
};

/**
 * Hiển thị hình ảnh minh họa cho TỪNG ĐÁP ÁN A, B, C, D
 * (Chỉ được gọi khi câu hỏi ở chế độ 'options_image' — khi đó câu hỏi là văn bản thuần túy)
 */
export const OptionVisualIllustration: React.FC<OptionVisualIllustrationProps> = ({
  optionText,
  visualSpec,
  optionSvg,
  visualType,
  questionText = '',
}) => {
  const combinedSpec = `${optionText || ''} ${visualSpec || ''}`.trim();

  // 0. Nếu có SVG trực tiếp từ AI và hợp lệ
  if (optionSvg && optionSvg.trim().startsWith('<svg') && optionSvg.trim().endsWith('</svg>')) {
    return (
      <div
        className="w-full h-24 sm:h-28 rounded-xl bg-slate-950/85 border border-white/25 flex items-center justify-center p-2 overflow-hidden shadow-inner [&>svg]:max-h-full [&>svg]:w-auto"
        dangerouslySetInnerHTML={{ __html: optionSvg }}
      />
    );
  }

  // 1. Kiểm tra trong thư viện Vector SVG chuyên biệt (Tin học, Toán Hình học, Dấu câu, Cơ quan Khoa học...)
  const topicKey = detectSemanticTopicKey(optionText, visualSpec);
  if (topicKey) {
    return (
      <div className="w-full h-24 sm:h-28 rounded-xl bg-slate-950/85 border border-white/25 flex items-center justify-center p-1.5 overflow-hidden shadow-inner">
        <CustomTopicSvgRenderer topicKey={topicKey} className="w-28 h-22 sm:w-32 sm:h-24" />
      </div>
    );
  }

  // 2. Nếu là đồng hồ ở từng đáp án
  const clockMatch = optionText.match(/(\d{1,2})\s*(?:giờ|:)\s*(\d{1,2})?/i);
  if (visualType === 'clock' && clockMatch) {
    const h = parseInt(clockMatch[1], 10) % 12;
    const m = clockMatch[2] ? parseInt(clockMatch[2], 10) % 60 : 0;
    const hourAngle = h * 30 + m * 0.5;
    const minuteAngle = m * 6;
    return (
      <div className="w-full h-24 sm:h-28 rounded-xl bg-slate-950/85 border border-white/25 flex items-center justify-center p-1.5 overflow-hidden shadow-inner">
        <svg viewBox="0 0 100 100" className="w-20 h-20 sm:w-24 sm:h-24">
          <circle cx="50" cy="50" r="42" fill="#0f172a" stroke="#38bdf8" strokeWidth="4" />
          {[12, 3, 6, 9].map((num) => {
            const rad = ((num * 30 - 90) * Math.PI) / 180;
            return (
              <text
                key={num}
                x={50 + 31 * Math.cos(rad)}
                y={50 + 31 * Math.sin(rad) + 3.5}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="10"
                fontWeight="900"
              >
                {num}
              </text>
            );
          })}
          <line
            x1="50"
            y1="50"
            x2={50 + 20 * Math.cos(((hourAngle - 90) * Math.PI) / 180)}
            y2={50 + 20 * Math.sin(((hourAngle - 90) * Math.PI) / 180)}
            stroke="#f43f5e"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="50"
            y1="50"
            x2={50 + 29 * Math.cos(((minuteAngle - 90) * Math.PI) / 180)}
            y2={50 + 29 * Math.sin(((minuteAngle - 90) * Math.PI) / 180)}
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="50" cy="50" r="3.5" fill="#fbbf24" />
        </svg>
      </div>
    );
  }

  // 3. Nếu là đối tượng cụ thể (Quả táo, Bánh quy, Con mèo, Quyển vở...)
  const concreteObj =
    detectConcreteObjectIcon(combinedSpec) || detectConcreteObjectIcon(questionText);
  const numberInOption = optionText.match(/\d+/);

  if (concreteObj) {
    const countVal = numberInOption ? parseInt(numberInOption[0], 10) : null;
    if (countVal !== null && countVal > 0 && countVal <= 10) {
      return (
        <div className="w-full h-24 sm:h-28 rounded-xl bg-slate-950/85 border border-white/25 flex flex-wrap items-center justify-center gap-1.5 p-2 overflow-hidden shadow-inner">
          {Array.from({ length: countVal }).map((_, i) => (
            <span key={i} className="text-xl sm:text-2xl drop-shadow">
              {concreteObj.icon}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="w-full h-24 sm:h-28 rounded-xl bg-slate-950/85 border border-white/25 flex items-center justify-center gap-2 p-2 overflow-hidden shadow-inner">
        <span className="text-4xl sm:text-5xl drop-shadow-md">{concreteObj.icon}</span>
        {countVal !== null && (
          <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">×{countVal}</span>
        )}
      </div>
    );
  }

  // 4. Nếu visualSpec có chứa emoji hợp lệ
  const emojiMatches = Array.from(
    (visualSpec || '').matchAll(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu)
  ).map((m) => m[0]);

  if (emojiMatches.length > 0) {
    return (
      <div className="w-full h-24 sm:h-28 rounded-xl bg-slate-950/85 border border-white/25 flex items-center justify-center gap-2 p-2 overflow-hidden shadow-inner">
        <span className="text-4xl sm:text-5xl drop-shadow-md">{emojiMatches[0]}</span>
      </div>
    );
  }

  // 5. Fallback thẻ trực quan rõ ràng
  return (
    <div className="w-full h-24 sm:h-28 rounded-xl bg-slate-950/85 border border-white/25 flex items-center justify-center p-2 overflow-hidden shadow-inner">
      <span className="text-base sm:text-lg font-black text-amber-300 text-center line-clamp-2 px-2">
        {optionText}
      </span>
    </div>
  );
};

/**
 * Hiển thị HÌNH ẢNH MINH HỌA CỦA CÂU HỎI.
 * Nguyên tắc bắt buộc:
 * - Chỉ hiển thị khi resolveVisualDisplayMode(question) === 'question_image'.
 * - Nếu đáp án là các hình ảnh ('options_image') hoặc câu hỏi thuần văn bản ('text_only'),
 *   component này trả về null để CÂU HỎI CHỈ LÀ VĂN BẢN!
 */
export const QuestionVisualIllustration: React.FC<QuestionVisualIllustrationProps> = ({
  question,
  compact = false,
}) => {
  const mode = resolveVisualDisplayMode(question);
  if (mode !== 'question_image') {
    return null;
  }

  const qText = question.question || '';
  const rawVisualData = (question.visualData || '').trim();
  const combinedQuestionContext = `${qText} ${rawVisualData} ${question.visualKey || ''}`;

  const containerHeight = compact ? 'h-24 sm:h-28' : 'h-32 sm:h-36';

  // 0. Nếu câu hỏi có SVG trực tiếp từ AI
  if (
    question.questionSvg &&
    question.questionSvg.trim().startsWith('<svg') &&
    question.questionSvg.trim().endsWith('</svg>')
  ) {
    return (
      <div
        className={`w-full ${containerHeight} rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-900 border-2 border-indigo-400/50 p-2 flex items-center justify-center shadow-lg overflow-hidden [&>svg]:max-h-full [&>svg]:w-auto`}
        dangerouslySetInnerHTML={{ __html: question.questionSvg }}
      />
    );
  }

  // 1. Kiểm tra đồng hồ (Clock)
  const clockMatch =
    qText.match(/(\d{1,2})\s*(?:giờ|:)\s*(\d{1,2})?/i) ||
    rawVisualData.match(/(\d{1,2})\s*(?:giờ|:|\s)\s*(\d{1,2})/i);
  const kimMatch = qText.match(/kim ngắn chỉ số\s*(\d{1,2}).*kim dài chỉ số\s*(\d{1,2})/i);

  if (question.visualType === 'clock' || kimMatch || qText.toLowerCase().includes('đồng hồ')) {
    let hour = 8;
    let minute = 15;
    if (kimMatch) {
      hour = parseInt(kimMatch[1], 10) % 12;
      minute = (parseInt(kimMatch[2], 10) * 5) % 60;
    } else if (clockMatch) {
      hour = parseInt(clockMatch[1], 10) % 12;
      minute = clockMatch[2] ? parseInt(clockMatch[2], 10) % 60 : 0;
    }
    const hourAngle = hour * 30 + minute * 0.5;
    const minuteAngle = minute * 6;

    return (
      <div
        className={`w-full ${containerHeight} rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-900 border-2 border-amber-400/60 p-2 flex items-center justify-center shadow-lg overflow-hidden`}
      >
        <svg viewBox="0 0 120 120" className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow">
          <circle cx="60" cy="60" r="52" fill="#0f172a" stroke="#fbbf24" strokeWidth="5" />
          {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => {
            const rad = ((n * 30 - 90) * Math.PI) / 180;
            return (
              <text
                key={n}
                x={60 + 39 * Math.cos(rad)}
                y={60 + 39 * Math.sin(rad) + 4}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="11"
                fontWeight="900"
              >
                {n}
              </text>
            );
          })}
          {/* Kim giờ */}
          <line
            x1="60"
            y1="60"
            x2={60 + 24 * Math.cos(((hourAngle - 90) * Math.PI) / 180)}
            y2={60 + 24 * Math.sin(((hourAngle - 90) * Math.PI) / 180)}
            stroke="#f43f5e"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Kim phút */}
          <line
            x1="60"
            y1="60"
            x2={60 + 35 * Math.cos(((minuteAngle - 90) * Math.PI) / 180)}
            y2={60 + 35 * Math.sin(((minuteAngle - 90) * Math.PI) / 180)}
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="60" cy="60" r="4.5" fill="#fbbf24" />
        </svg>
      </div>
    );
  }

  // 2. Kiểm tra trong thư viện Vector SVG chuyên biệt (Tin học: Word, PowerPoint, Excel, Paint, CPU, Màn hình, Chuột, Bàn phím; Hình học; Khoa học...)
  const semanticTopic =
    detectSemanticTopicKey(qText, question.visualKey) ||
    detectSemanticTopicKey(rawVisualData, question.visualKey);

  if (semanticTopic) {
    return (
      <div
        className={`w-full ${containerHeight} rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-900 border-2 border-indigo-400/50 p-2 flex items-center justify-center shadow-lg overflow-hidden`}
      >
        <CustomTopicSvgRenderer
          topicKey={semanticTopic}
          className={compact ? 'w-32 h-22 sm:w-36 sm:h-24' : 'w-36 h-28 sm:w-40 sm:h-32'}
        />
      </div>
    );
  }

  // 3. Kiểm tra Phân số (Fraction: VD "1/4", "3/5")
  const fractionMatch =
    qText.match(/\b(\d+)\s*\/\s*(\d+)\b/) || rawVisualData.match(/\b(\d+)\s*\/\s*(\d+)\b/);
  if (question.visualType === 'fraction' || fractionMatch) {
    const num = fractionMatch ? Math.max(1, parseInt(fractionMatch[1], 10)) : 1;
    const den = fractionMatch ? Math.min(12, Math.max(num, parseInt(fractionMatch[2], 10))) : 4;
    return (
      <div
        className={`w-full ${containerHeight} rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-900 border-2 border-emerald-400/50 p-2.5 flex items-center justify-center gap-3 shadow-lg overflow-hidden`}
      >
        <div className="grid grid-flow-col auto-cols-fr gap-1 w-36 sm:w-44 h-12 bg-slate-950 p-1.5 rounded-xl border border-slate-700">
          {Array.from({ length: den }).map((_, i) => (
            <div
              key={i}
              className={`rounded-md ${
                i < num ? 'bg-emerald-400 shadow-inner' : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>
        <div className="flex flex-col items-center font-mono font-black text-amber-300 text-lg sm:text-xl leading-none">
          <span>{num}</span>
          <span className="w-5 h-0.5 bg-amber-300 my-0.5" />
          <span>{den}</span>
        </div>
      </div>
    );
  }

  // 4. Kiểm tra bài toán có đồ vật/con vật cụ thể (VD: "2 chiếc bánh quy × 8 bạn", "5 con mèo", "6 quả trứng")
  const concreteObj = detectConcreteObjectIcon(combinedQuestionContext);
  const equationInQuestion = qText.match(
    /(\d+|\?)\s*([+\-×x*:÷/])\s*(\d+|\?)(?:\s*=\s*(\d+|\?))?/
  );

  if (concreteObj) {
    const nums = Array.from(qText.matchAll(/\d+/g)).map((m) => parseInt(m[0], 10));
    if (nums.length >= 2 && nums[0] <= 8 && nums[1] <= 8) {
      const perGroup = nums[0];
      const groups = Math.min(nums[1], 6);
      return (
        <div
          className={`w-full ${containerHeight} rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-900 border-2 border-amber-400/50 p-2 flex items-center justify-center gap-2 shadow-lg overflow-hidden`}
        >
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {Array.from({ length: groups }).map((_, gIdx) => (
              <div
                key={gIdx}
                className="bg-slate-950/85 border border-amber-400/40 rounded-lg px-1.5 py-1 flex items-center gap-0.5"
              >
                {Array.from({ length: Math.min(perGroup, 6) }).map((__, iIdx) => (
                  <span key={iIdx} className="text-base sm:text-lg">
                    {concreteObj.icon}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`w-full ${containerHeight} rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-900 border-2 border-amber-400/50 p-2 flex items-center justify-center gap-3 shadow-lg overflow-hidden`}
      >
        <span className="text-5xl sm:text-6xl drop-shadow-md">{concreteObj.icon}</span>
        {nums.length >= 2 && (
          <div className="bg-slate-950/90 border border-amber-400/50 px-3 py-1.5 rounded-xl font-mono font-black text-amber-300 text-base sm:text-xl">
            {nums[0]} × {nums[1]} = ?
          </div>
        )}
      </div>
    );
  }

  // 5. Nếu câu hỏi là phép tính số học (VD: "5 nhân với 6 bằng bao nhiêu?", "2 × ? = 18", "25 + 25 = ?")
  const textMultMatch = qText.match(/(\d+)\s*nhân\s*(?:với\s*)?(\d+)/i);
  const textDivMatch = qText.match(/(\d+)\s*chia\s*(?:cho\s*)?(\d+)/i);
  if (equationInQuestion || textMultMatch || textDivMatch) {
    let displayEq = '';
    if (equationInQuestion) {
      const a = equationInQuestion[1];
      const op = equationInQuestion[2].replace('x', '×').replace('*', '×').replace('/', ':');
      const b = equationInQuestion[3];
      const c = equationInQuestion[4] || '?';
      displayEq = `${a} ${op} ${b} = ${c}`;
    } else if (textMultMatch) {
      displayEq = `${textMultMatch[1]} × ${textMultMatch[2]} = ?`;
    } else if (textDivMatch) {
      displayEq = `${textDivMatch[1]} : ${textDivMatch[2]} = ?`;
    }

    return (
      <div
        className={`w-full ${containerHeight} rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-900 border-2 border-amber-400/60 p-2 flex items-center justify-center shadow-lg overflow-hidden`}
      >
        <div className="bg-slate-950/95 border-2 border-amber-400/70 rounded-xl px-4 py-2.5 shadow-inner">
          <span className="font-mono font-black text-xl sm:text-2xl md:text-3xl text-amber-300 tracking-wider">
            {displayEq}
          </span>
        </div>
      </div>
    );
  }

  // 6. Nếu rawVisualData có chứa emoji hợp lệ
  const emojisInVisualData = Array.from(
    rawVisualData.matchAll(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu)
  ).map((m) => m[0]);

  if (emojisInVisualData.length > 0) {
    return (
      <div
        className={`w-full ${containerHeight} rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-900 border-2 border-indigo-400/50 p-2 flex items-center justify-center gap-3 shadow-lg overflow-hidden`}
      >
        {emojisInVisualData.slice(0, 3).map((em, idx) => (
          <span key={idx} className="text-4xl sm:text-5xl drop-shadow-md">
            {em}
          </span>
        ))}
      </div>
    );
  }

  // 7. Nếu câu hỏi hoàn toàn không có biểu tượng cụ thể nào -> không hiển thị hình sai lệch
  return null;
};
