import { Question } from '../types';

export interface CurriculumLessonEntry {
  subject: 'Công nghệ' | 'Tin học' | 'Kỹ năng số' | 'Trí tuệ nhân tạo';
  grade: number;
  lessonNumber: number;
  fullTitle: string;
  keywords: string[];
  questions: Omit<Question, 'id'>[];
}

/**
 * Ngân hàng bài học và câu hỏi chuẩn Chương trình GDPT 2018 (Bộ sách Kết nối tri thức, Chân trời sáng tạo, Cánh diều)
 * cho 4 môn học chuyên biệt: Công nghệ, Tin học, Kỹ năng số, Trí tuệ nhân tạo (Khối 3, 4, 5).
 * Đảm bảo:
 * - Bám sát 100% bài học và môn học người dùng chọn (tuyệt đối không bao giờ trộn câu hỏi Toán/Tin sang Công nghệ).
 * - Có từ 1 đến 3 câu hỏi nâng cao (isAdvanced: true, difficulty: 'nang_cao').
 * - Ưu tiên cao các câu hỏi có hình ảnh minh họa trực quan (chỉ hiển thị 1 trong 2 nơi: hoặc ở câu hỏi 'question_image', hoặc ở 4 đáp án 'options_image').
 */
export const GDPT2018_CURRICULUM_BANK: CurriculumLessonEntry[] = [
  // ============================================================================
  // MÔN CÔNG NGHỆ — KHỐI 4 (Hoa, cây cảnh, chậu, giá thể, dụng cụ trồng cây & lắp ghép mô hình)
  // ============================================================================
  {
    subject: 'Công nghệ',
    grade: 4,
    lessonNumber: 1,
    fullTitle: 'BÀI 1: HOA VÀ CÂY CẢNH QUANH EM',
    keywords: ['bài 1', 'hoa và cây cảnh quanh em', 'lợi ích của hoa và cây cảnh'],
    questions: [
      {
        question: 'Quan sát hình ảnh bên, chậu hoa tươi đang nở rực rỡ mang lại lợi ích chính nào cho không gian sống?',
        options: [
          'Trang trí làm đẹp cảnh quan và mang lại cảm giác thư giãn, gần gũi thiên nhiên',
          'Làm tăng khói bụi trong phòng học và nhà ở',
          'Thay thế hoàn toàn đèn chiếu sáng vào ban đêm',
          'Làm nhiệt độ trong phòng tăng cao hơn vào mùa hè',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Hoa và cây cảnh giúp làm đẹp cảnh quan, lọc không khí và giúp con người thư giãn.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'plant_flower',
        visualData: 'Chậu hoa tươi trang trí',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Trong các đáp án dưới đây, đâu là cây cảnh lá xanh thường được trồng trong chậu để trang trí và làm sạch không khí?',
        options: [
          'Cây cảnh lá xanh trong chậu',
          'Xẻng nhỏ làm vườn',
          'Bình tưới nước vòi sen',
          'Kéo cắt cành cây',
        ],
        correctIndex: 0,
        explanation: 'Đúng rồi! Cây cảnh lá xanh trong chậu giúp trang trí góc học tập và thanh lọc không khí.',
        visualDisplayMode: 'options_image',
        visualType: 'technology_tool',
        visualData: '',
        optionVisuals: ['bonsai_tree', 'garden_trowel', 'watering_can', 'pruning_shears'],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Nhờ quá trình quang hợp dưới ánh sáng mặt trời (như hình minh họa), cây xanh giúp ích gì cho bầu không khí?',
        options: [
          'Hấp thụ khí các-bô-níc và cung cấp khí ô-xi giúp không khí trong lành',
          'Hấp thụ hết khí ô-xi và thải ra nhiều bụi mịn',
          'Làm bầu không khí khô nóng hơn',
          'Không có tác dụng gì đối với môi trường xung quanh',
        ],
        correctIndex: 0,
        explanation: 'Xuất sắc! Cây xanh quang hợp dưới ánh sáng mặt trời giúp hấp thụ khí các-bô-níc và nhả khí ô-xi.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'sunlight_care',
        visualData: 'Ánh sáng mặt trời và quang hợp',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: '[VẬN DỤNG NÂNG CAO] Vì sao không nên đặt quá nhiều chậu hoa có mùi hương nồng hoặc cây cảnh lớn trong phòng ngủ đóng kín cửa vào ban đêm?',
        options: [
          'Vì ban đêm cây hô hấp lấy khí ô-xi và thải khí các-bô-níc, dễ gây ngạt thở và khó ngủ',
          'Vì ban đêm cây cảnh sẽ tự động rụng hết lá trong phòng ngủ',
          'Vì ban đêm cây cảnh hút hết ánh đèn điện trong nhà',
          'Vì chậu cây làm sàn nhà bị lún xuống',
        ],
        correctIndex: 0,
        explanation: 'Rất giỏi! Ban đêm không có ánh sáng, cây ngừng quang hợp và thực hiện hô hấp (lấy ô-xi, thải các-bô-níc) nên không đặt nhiều trong phòng ngủ kín.',
        visualDisplayMode: 'text_only',
        visualType: 'none',
        visualData: '',
        optionVisuals: [],
        difficulty: 'nang_cao',
        isAdvanced: true,
        points: 10,
      },
    ],
  },
  {
    subject: 'Công nghệ',
    grade: 4,
    lessonNumber: 2,
    fullTitle: 'BÀI 2: MỘT SỐ LOẠI HOA, CÂY CẢNH PHỔ BIẾN',
    keywords: ['bài 2', 'một số loại hoa cây cảnh phổ biến', 'nhận biết hoa và cây cảnh'],
    questions: [
      {
        question: 'Loại cây cảnh trong hình ảnh bên có thân mọng nước, lá biến thành gai nhọn và chịu hạn rất tốt là cây gì?',
        options: [
          'Cây xương rồng',
          'Cây hoa sen',
          'Cây hoa súng',
          'Cây lúa nước',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Cây xương rồng có thân mọng nước, lá biến thành gai để giảm thoát hơi nước và chịu hạn tốt.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'cactus_succulent',
        visualData: 'Cây xương rồng trong chậu',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Trong các đáp án dưới đây, hình nào là chậu hoa đang nở rực rỡ thường được trồng để trang trí ngày Tết và khuôn viên trường?',
        options: [
          'Chậu hoa nở rực rỡ',
          'Cây xương rồng',
          'Cây cảnh lá xanh',
          'Chậu đất nung rỗng',
        ],
        correctIndex: 0,
        explanation: 'Đúng rồi! Chậu hoa nở rực rỡ mang sắc màu tươi tắn trang trí nhà cửa và trường lớp.',
        visualDisplayMode: 'options_image',
        visualType: 'technology_tool',
        visualData: '',
        optionVisuals: ['plant_flower', 'cactus_succulent', 'bonsai_tree', 'flower_pot'],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: '[VẬN DỤNG NÂNG CAO] Gia đình bạn An muốn chọn một loại cây cảnh đặt ở bàn học trong phòng có ít ánh nắng trực tiếp. Theo em, bạn An nên chọn nhóm cây nào để cây phát triển tốt?',
        options: [
          'Nhóm cây ưa bóng râm hoặc chịu bóng tốt như cây trầu bà, cây lưỡi hổ, cây vạn niên thanh',
          'Nhóm cây bắt buộc phải phơi nắng gắt suốt cả ngày như hoa mười giờ, hoa giấy',
          'Nhóm cây cổ thụ có rễ cọc ăn sâu nhiều mét dưới lòng đất',
          'Nhóm cây lương thực trồng ngoài ruộng nước',
        ],
        correctIndex: 0,
        explanation: 'Tuyệt vời! Trong phòng ít nắng trực tiếp, cần chọn các loại cây cảnh ưa bóng hoặc chịu bóng tốt như trầu bà, lưỡi hổ, vạn niên thanh.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'bonsai_tree',
        visualData: 'Cây cảnh trồng trong nhà',
        optionVisuals: [],
        difficulty: 'nang_cao',
        isAdvanced: true,
        points: 10,
      },
    ],
  },
  {
    subject: 'Công nghệ',
    grade: 4,
    lessonNumber: 3,
    fullTitle: 'BÀI 3: VẬT LIỆU VÀ DỤNG CỤ TRỒNG HOA, CÂY CẢNH TRONG CHẬU',
    keywords: [
      'bài 3',
      'vật liệu và dụng cụ trồng hoa',
      'cây cảnh trong chậu',
      'chậu trồng cây',
      'giá thể',
      'dụng cụ làm vườn',
    ],
    questions: [
      {
        question: 'Quan sát hình ảnh bên, vì sao dưới đáy chậu trồng hoa, cây cảnh thường phải có lỗ thoát nước?',
        options: [
          'Giúp thoát lượng nước thừa khi tưới, tránh làm thối rễ và ngập úng cây',
          'Để đất và giá thể trong chậu tự động rơi hết ra ngoài',
          'Chỉ để trang trí cho đáy chậu đẹp mắt hơn',
          'Để côn trùng dễ dàng chui từ dưới đất vào trong chậu',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Lỗ dưới đáy chậu giúp thoát nước thừa, giữ cho giá thể thông thoáng và tránh làm ngập úng, thối rễ cây.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'flower_pot',
        visualData: 'Chậu trồng cây có lỗ thoát nước ở đáy',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Trong các đáp án dưới đây, đâu là dụng cụ "Xẻng nhỏ" dùng để xúc đất và giá thể cho vào chậu trồng cây?',
        options: [
          'Xẻng nhỏ làm vườn',
          'Chĩa ba xới đất',
          'Kéo cắt cành',
          'Bình tưới nước',
        ],
        correctIndex: 0,
        explanation: 'Đúng rồi! Xẻng nhỏ có lòng máng giúp xúc đất và giá thể cho vào chậu một cách dễ dàng, gọn gàng.',
        visualDisplayMode: 'options_image',
        visualType: 'technology_tool',
        visualData: '',
        optionVisuals: ['garden_trowel', 'garden_fork', 'pruning_shears', 'watering_can'],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Vật liệu tơi xốp trong hình ảnh bên (gồm đất trồng, xơ dừa, trấu hun, mùn cưa...) giúp giữ ẩm và cung cấp dinh dưỡng cho rễ cây bám vào gọi là gì?',
        options: [
          'Giá thể trồng cây',
          'Phân bón hóa học dạng lỏng',
          'Chậu gốm sứ tráng men',
          'Dụng cụ xới đất',
        ],
        correctIndex: 0,
        explanation: 'Xuất sắc! Hỗn hợp đất trồng, xơ dừa, trấu hun, mùn cưa... giữ ẩm và thoáng khí cho rễ cây gọi là giá thể trồng cây.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'soil_substrate',
        visualData: 'Giá thể trồng hoa và cây cảnh',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Trong các đáp án dưới đây, dụng cụ nào là "Chĩa ba" dùng để xới đất, làm tơi xốp giá thể trong chậu?',
        options: [
          'Xẻng nhỏ xúc đất',
          'Chĩa ba xới đất',
          'Găng tay làm vườn',
          'Chậu trồng hoa',
        ],
        correctIndex: 1,
        explanation: 'Hoan hô! Chĩa ba có 3 răng nhọn cứng cáp dùng để xới cho đất và giá thể trong chậu tơi xốp, thoáng khí.',
        visualDisplayMode: 'options_image',
        visualType: 'technology_tool',
        visualData: '',
        optionVisuals: ['garden_trowel', 'garden_fork', 'garden_gloves', 'flower_pot'],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Trang bị bảo hộ trong hình ảnh bên có tác dụng gì khi em thực hành trồng hoa và cây cảnh trong chậu?',
        options: [
          'Bảo vệ đôi bàn tay sạch sẽ, tránh bị trầy xước bởi gai nhọn, sỏi đá hoặc dụng cụ sắc',
          'Dùng để chứa nước tưới cho cây cảnh thay bình tưới',
          'Dùng để đo chiều cao của cây hoa trong chậu',
          'Dùng để lót dưới đáy chậu thay cho sỏi dăm',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Đeo găng tay làm vườn giúp giữ vệ sinh và bảo vệ tay không bị trầy xước khi tiếp xúc với đất, gai hoặc dụng cụ.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'garden_gloves',
        visualData: 'Găng tay bảo hộ làm vườn',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Dụng cụ trong hình ảnh bên được sử dụng để thực hiện công việc nào khi trồng và chăm sóc hoa, cây cảnh?',
        options: [
          'Tưới nước dạng tia nhỏ đều đặn giúp giữ ẩm cho giá thể mà không làm xói gốc cây',
          'Xúc đất và trộn phân bón vào chậu trồng cây',
          'Cắt tỉa các cành khô và lá bị sâu bệnh',
          'Đào hố sâu trên nền đất cứng',
        ],
        correctIndex: 0,
        explanation: 'Rất đúng! Bình tưới vòi hoa sen giúp phun các tia nước nhỏ, đều, cung cấp độ ẩm mà không làm bắn đất hay dập lá non.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'watering_can',
        visualData: 'Bình tưới nước vòi hoa sen',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Trong các đáp án dưới đây, đâu là "Kéo cắt cành" dùng để cắt tỉa lá già, cành khô hoặc rễ bị dập khi trồng cây?',
        options: [
          'Kéo cắt cành làm vườn',
          'Bình tưới nước',
          'Xẻng nhỏ làm vườn',
          'Găng tay bảo hộ',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Kéo cắt cành chuyên dụng giúp cắt tỉa gọn các cành khô, lá héo úa hoặc rễ hư hỏng.',
        visualDisplayMode: 'options_image',
        visualType: 'technology_tool',
        visualData: '',
        optionVisuals: ['pruning_shears', 'watering_can', 'garden_trowel', 'garden_gloves'],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Loại giá thể nào dưới đây được tạo ra từ vỏ quả dừa nghiền nhỏ, có khả năng giữ ẩm rất tốt và nhẹ?',
        options: [
          'Giá thể xơ dừa (mụn dừa)',
          'Giá thể sỏi dăm và đá cuội',
          'Cát xây dựng hạt to',
          'Mảnh sành sứ vỡ',
        ],
        correctIndex: 0,
        explanation: 'Đúng rồi! Giá thể xơ dừa được chế biến từ vỏ quả dừa, rất tơi xốp, nhẹ và giữ ẩm cực tốt cho cây trồng trong chậu.',
        visualDisplayMode: 'text_only',
        visualType: 'none',
        visualData: '',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: '[VẬN DỤNG NÂNG CAO] Khi chuẩn bị trồng một cây hoa nhỏ vào chậu, nếu chọn chậu quá to hoặc quá nhỏ so với kích thước cây thì sẽ dẫn đến hậu quả gì?',
        options: [
          'Chậu quá nhỏ làm rễ thiếu chỗ phát triển và thiếu dinh dưỡng; chậu quá to gây lãng phí giá thể và mất cân đối thẩm mỹ',
          'Chậu càng to thì cây càng không cần tưới nước suốt cả năm',
          'Chậu quá nhỏ sẽ giúp cây nở hoa to gấp đôi bình thường',
          'Kích thước chậu hoàn toàn không ảnh hưởng gì đến sự sinh trưởng của cây',
        ],
        correctIndex: 0,
        explanation: 'Xuất sắc! Chọn chậu phải phù hợp với kích thước của cây: chậu quá nhỏ làm bó rễ, thiếu dinh dưỡng; chậu quá lớn gây lãng phí giá thể, dễ đọng ẩm thừa và kém thẩm mỹ.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'flower_pot',
        visualData: 'Lựa chọn chậu phù hợp với cây trồng',
        optionVisuals: [],
        difficulty: 'nang_cao',
        isAdvanced: true,
        points: 10,
      },
      {
        question: '[VẬN DỤNG NÂNG CAO] Trước khi cho giá thể trồng cây vào chậu, người ta thường lót một lớp sỏi dăm hoặc viên đất nung ở đáy chậu nhằm mục đích gì?',
        options: [
          'Giúp che bớt lỗ đáy chậu để giá thể không bị trôi ra ngoài mà nước thừa vẫn thoát đi dễ dàng',
          'Để làm cho chậu cây nặng hơn không ai bê đi được',
          'Để ngăn không cho rễ cây hút được nước trong chậu',
          'Để thay thế hoàn toàn việc bón phân cho cây',
        ],
        correctIndex: 0,
        explanation: 'Tuyệt vời! Lớp sỏi dăm/đất nung dưới đáy chậu vừa giữ giá thể không trôi qua lỗ thoát nước, vừa tạo độ thoáng giúp thoát nước tốt, chống ngập úng rễ.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'soil_substrate',
        visualData: 'Lót sỏi thoát nước dưới lớp giá thể',
        optionVisuals: [],
        difficulty: 'nang_cao',
        isAdvanced: true,
        points: 10,
      },
    ],
  },
  {
    subject: 'Công nghệ',
    grade: 4,
    lessonNumber: 4,
    fullTitle: 'BÀI 4: GIEO HẠT VÀ TRỒNG CÂY CON TRONG CHẬU',
    keywords: ['bài 4', 'gieo hạt và trồng cây con trong chậu', 'các bước gieo hạt', 'trồng cây con'],
    questions: [
      {
        question: 'Quan sát hình ảnh quá trình hạt giống nảy mầm thành cây con, bước đầu tiên trước khi gieo hạt vào chậu là gì?',
        options: [
          'Chuẩn bị vật liệu, dụng cụ và cho giá thể vào chậu (cách miệng chậu khoảng 2 cm - 5 cm)',
          'Tưới ngập nước tràn miệng chậu trước khi có giá thể',
          'Cắt bỏ toàn bộ lá của hạt giống',
          'Đem chậu rỗng phơi nắng 3 ngày rồi mới mua hạt giống',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Bước chuẩn bị cần chọn chậu, hạt giống khỏe mạnh và cho giá thể vào chậu cách miệng chậu 2 - 5 cm.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'seed_sprout',
        visualData: 'Gieo hạt và nảy mầm thành cây con',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Trong các đáp án dưới đây, dụng cụ nào dùng để tưới nước nhẹ nhàng sau khi vừa gieo hạt hoặc trồng cây con xong?',
        options: [
          'Bình tưới nước vòi hoa sen',
          'Kéo cắt cành cây',
          'Chĩa ba xới đất',
          'Cờ-lê vặn ốc',
        ],
        correctIndex: 0,
        explanation: 'Đúng rồi! Sau khi gieo hạt hoặc trồng cây con, cần dùng bình tưới vòi sen hoặc bình xịt phun sương tưới nhẹ để hạt không bị trôi.',
        visualDisplayMode: 'options_image',
        visualType: 'technology_tool',
        visualData: '',
        optionVisuals: ['watering_can', 'pruning_shears', 'garden_fork', 'wrench_screwdriver'],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: '[VẬN DỤNG NÂNG CAO] Khi trồng cây con vào chậu, vì sao sau khi đặt cây đứng thẳng và lấp giá thể kín gốc, ta chỉ nên ấn nhẹ đất quanh gốc mà không nén quá chặt?',
        options: [
          'Để cây đứng vững nhưng không làm đứt rễ non và vẫn giữ được độ thoáng khí cho rễ hô hấp',
          'Vì nếu nén chặt thì chậu nhựa sẽ bị nổ ngay lập tức',
          'Để khi gió thổi cây dễ bị đổ nghiêng sang một bên',
          'Vì rễ cây không cần tiếp xúc với giá thể',
        ],
        correctIndex: 0,
        explanation: 'Xuất sắc! Ấn nhẹ quanh gốc giúp cố định cây đứng thẳng mà không làm dập đứt bộ rễ non, đồng thời giữ độ tơi xốp để nước và không khí thấm xuống rễ.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'plant_flower',
        visualData: 'Trồng cây con đứng thẳng trong chậu',
        optionVisuals: [],
        difficulty: 'nang_cao',
        isAdvanced: true,
        points: 10,
      },
    ],
  },
  {
    subject: 'Công nghệ',
    grade: 4,
    lessonNumber: 5,
    fullTitle: 'BÀI 5: CHĂM SÓC HOA, CÂY CẢNH TRONG CHẬU',
    keywords: ['bài 5', 'chăm sóc hoa cây cảnh trong chậu', 'tưới nước', 'bón phân', 'tỉa cành'],
    questions: [
      {
        question: 'Quan sát hình ảnh bên, việc bón phân định kỳ với lượng vừa phải cho hoa, cây cảnh trong chậu có tác dụng gì?',
        options: [
          'Bổ sung chất dinh dưỡng giúp cây sinh trưởng khỏe mạnh, lá xanh tốt và ra hoa đẹp',
          'Làm cho giá thể trong chậu biến thành sỏi đá',
          'Thay thế hoàn toàn nhu cầu ánh sáng và nước của cây',
          'Làm cây ngừng phát triển chiều cao vĩnh viễn',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Bón phân hợp lý giúp bổ sung dinh dưỡng thiết yếu để cây cảnh trong chậu phát triển tốt và ra hoa đẹp.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'fertilizer_bag',
        visualData: 'Bón phân cung cấp dinh dưỡng cho cây',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Trong các đáp án dưới đây, dụng cụ nào được sử dụng để cắt bỏ các lá vàng úa, cành sâu bệnh khi chăm sóc cây cảnh?',
        options: [
          'Kéo cắt cành',
          'Bình tưới nước',
          'Xẻng xúc đất',
          'Chậu đất nung',
        ],
        correctIndex: 0,
        explanation: 'Đúng rồi! Dùng kéo cắt cành sắc bén để tỉa bỏ cành khô, lá vàng úa giúp cây thông thoáng và tập trung dinh dưỡng nuôi cành khỏe.',
        visualDisplayMode: 'options_image',
        visualType: 'technology_tool',
        visualData: '',
        optionVisuals: ['pruning_shears', 'watering_can', 'garden_trowel', 'flower_pot'],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: '[VẬN DỤNG NÂNG CAO] Vào mùa hè trời nắng gắt vào buổi trưa, thời điểm nào trong ngày là thích hợp nhất để tưới nước cho hoa và cây cảnh trong chậu?',
        options: [
          'Tưới vào buổi sáng sớm hoặc chiều mát để cây hấp thụ nước tốt và tránh bị sốc nhiệt',
          'Tưới thật nhiều nước lạnh vào đúng 12 giờ trưa khi nắng gắt nhất',
          'Chỉ tưới nước vào lúc nửa đêm khi trời tối hẳn',
          'Mùa hè nắng nóng thì tuyệt đối không được tưới nước cho cây',
        ],
        correctIndex: 0,
        explanation: 'Rất giỏi! Tưới cây vào sáng sớm hoặc chiều mát giúp cây hút nước hiệu quả; tưới lúc trưa nắng gắt làm nhiệt độ đất thay đổi đột ngột dễ gây héo rũ, cháy lá.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'watering_can',
        visualData: 'Tưới nước đúng thời điểm cho cây cảnh',
        optionVisuals: [],
        difficulty: 'nang_cao',
        isAdvanced: true,
        points: 10,
      },
    ],
  },
  {
    subject: 'Công nghệ',
    grade: 4,
    lessonNumber: 6,
    fullTitle: 'BÀI 6: ĐỒ CHƠI DÂN GIAN VÀ LẮP GHÉP MÔ HÌNH KỸ THUẬT',
    keywords: ['bài 6', 'bài 7', 'bài 8', 'bài 9', 'đồ chơi dân gian', 'chong chóng', 'lắp ghép mô hình kỹ thuật'],
    questions: [
      {
        question: 'Đồ chơi dân gian trong hình ảnh bên hoạt động quay tròn nhờ năng lượng gì từ thiên nhiên?',
        options: [
          'Nhờ sức gió thổi vào các cánh chong chóng',
          'Nhờ cắm phích điện trực tiếp vào ổ điện trong nhà',
          'Nhờ đốt nhiên liệu xăng dầu bên trong',
          'Nhờ ánh sáng của đèn học chiếu vào',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Chong chóng giấy quay được là nhờ sức gió tác động lên các cánh chong chóng.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'paper_pinwheel',
        visualData: 'Chong chóng giấy quay nhờ sức gió',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Hai dụng cụ trong hình ảnh bên thuộc bộ lắp ghép mô hình kỹ thuật có tên gọi là gì?',
        options: [
          'Cờ-lê và Tua-vít dùng để vặn chặt hoặc tháo ốc vít, đai ốc',
          'Xẻng nhỏ và Chĩa ba dùng để trồng hoa trong chậu',
          'Bàn phím và Chuột dùng để điều khiển máy tính',
          'Kéo cắt giấy và Hồ dán thủ công',
        ],
        correctIndex: 0,
        explanation: 'Xuất sắc! Cờ-lê dùng để giữ đai ốc và tua-vít dùng để vặn vít khi lắp ghép hoặc tháo rời mô hình kỹ thuật.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'wrench_screwdriver',
        visualData: 'Cờ-lê và Tua-vít trong bộ lắp ghép kỹ thuật',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: '[VẬN DỤNG NÂNG CAO] Khi làm chong chóng giấy, nếu ghim đinh quá chặt ép sát cánh chong chóng vào thân que tre thì hiện tượng gì sẽ xảy ra?',
        options: [
          'Ma sát lớn làm cánh chong chóng bị kẹt cứng, rất khó quay hoặc không quay được khi gặp gió',
          'Chong chóng sẽ quay nhanh gấp 10 lần bình thường',
          'Cánh chong chóng tự động phát sáng trong đêm tối',
          'Que cầm chong chóng sẽ tự động dài ra',
        ],
        correctIndex: 0,
        explanation: 'Tuyệt vời! Khi lắp trục chong chóng cần có độ lỏng vừa phải để giảm ma sát, giúp cánh chong chóng quay trơn tru khi đón gió.',
        visualDisplayMode: 'text_only',
        visualType: 'none',
        visualData: '',
        optionVisuals: [],
        difficulty: 'nang_cao',
        isAdvanced: true,
        points: 10,
      },
    ],
  },

  // ============================================================================
  // MÔN CÔNG NGHỆ — KHỐI 3 (Tự nhiên & Công nghệ, Đèn học, Quạt điện, Máy thu thanh, Máy thu hình, Biển báo)
  // ============================================================================
  {
    subject: 'Công nghệ',
    grade: 3,
    lessonNumber: 1,
    fullTitle: 'BÀI 1: TỰ NHIÊN VÀ CÔNG NGHỆ',
    keywords: ['bài 1', 'tự nhiên và công nghệ', 'đối tượng tự nhiên', 'sản phẩm công nghệ'],
    questions: [
      {
        question: 'Trong các đáp án dưới đây, đâu là sản phẩm công nghệ do bàn tay và khối óc con người chế tạo ra để phục vụ đời sống?',
        options: [
          'Đèn học để bàn',
          'Ông mặt trời tự nhiên',
          'Cây xanh trong rừng tự nhiên',
          'Đám mây trên bầu trời',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Đèn học là sản phẩm công nghệ do con người làm ra; mặt trời, cây rừng, đám mây là đối tượng tự nhiên.',
        visualDisplayMode: 'options_image',
        visualType: 'technology_tool',
        visualData: '',
        optionVisuals: ['desk_lamp', 'sunlight_care', 'bonsai_tree', 'cloud_storage'],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Thiết bị công nghệ trong hình ảnh bên mang lại tác dụng gì cho gia đình vào những ngày thời tiết nắng nóng?',
        options: [
          'Tạo ra luồng gió mát giúp lưu thông không khí và làm mát cho con người',
          'Chiếu sáng cho góc học tập vào buổi tối',
          'Dùng để bảo quản kem và đá lạnh không bị tan',
          'Dùng để cắt tỉa cành hoa trong vườn',
        ],
        correctIndex: 0,
        explanation: 'Đúng rồi! Quạt điện là sản phẩm công nghệ giúp tạo gió làm mát trong gia đình và lớp học.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'electric_fan',
        visualData: 'Quạt điện làm mát',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: '[VẬN DỤNG NÂNG CAO] Vì sao chúng ta cần giữ gìn, vệ sinh sạch sẽ và sử dụng cẩn thận các sản phẩm công nghệ trong gia đình?',
        options: [
          'Để sản phẩm công nghệ hoạt động bền bỉ, an toàn, tiết kiệm chi phí sửa chữa cho gia đình',
          'Để các sản phẩm công nghệ tự động biến thành đối tượng tự nhiên',
          'Vì sản phẩm công nghệ chỉ dùng được một lần duy nhất',
          'Để sản phẩm tiêu thụ nhiều điện năng hơn mỗi ngày',
        ],
        correctIndex: 0,
        explanation: 'Rất giỏi! Bảo quản và sử dụng đúng cách giúp các thiết bị công nghệ luôn bền đẹp, an toàn và tiết kiệm.',
        visualDisplayMode: 'text_only',
        visualType: 'none',
        visualData: '',
        optionVisuals: [],
        difficulty: 'nang_cao',
        isAdvanced: true,
        points: 10,
      },
    ],
  },
  {
    subject: 'Công nghệ',
    grade: 3,
    lessonNumber: 2,
    fullTitle: 'BÀI 2: SỬ DỤNG ĐÈN HỌC',
    keywords: ['bài 2', 'sử dụng đèn học', 'cấu tạo đèn học', 'chụp đèn'],
    questions: [
      {
        question: 'Quan sát chiếc đèn học trong hình ảnh bên, bộ phận "Chụp đèn" có tác dụng chính là gì?',
        options: [
          'Bảo vệ bóng đèn, tập trung ánh sáng xuống bàn học và chống chói mắt cho người học',
          'Dùng để cắm vào ổ điện lấy nguồn điện cho đèn',
          'Dùng để giữ cho đèn đứng vững trên mặt bàn',
          'Dùng để bật và tắt đèn học',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Chụp đèn vừa bảo vệ bóng đèn vừa giúp tập trung ánh sáng và tránh làm chói mắt.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'desk_lamp',
        visualData: 'Đèn học để bàn',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: '[VẬN DỤNG NÂNG CAO] Đối với học sinh viết bài bằng tay phải, em nên đặt đèn học ở vị trí nào trên bàn học để ánh sáng không bị tay che khuất gây sập bóng lên trang vở?',
        options: [
          'Đặt đèn học ở phía bên trái người học',
          'Đặt đèn học ở ngay sát khuỷu tay bên phải',
          'Đặt đèn học ở phía sau lưng người học',
          'Đặt đèn học dưới gầm bàn học',
        ],
        correctIndex: 0,
        explanation: 'Xuất sắc! Khi viết bằng tay phải, đặt đèn ở phía bên trái giúp ánh sáng chiếu thẳng vào trang vở mà không bị bóng của bàn tay phải che khuất.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'desk_lamp',
        visualData: 'Đặt đèn học đúng vị trí chống sập bóng',
        optionVisuals: [],
        difficulty: 'nang_cao',
        isAdvanced: true,
        points: 10,
      },
    ],
  },
  {
    subject: 'Công nghệ',
    grade: 3,
    lessonNumber: 3,
    fullTitle: 'BÀI 3: SỬ DỤNG QUẠT ĐIỆN',
    keywords: ['bài 3', 'sử dụng quạt điện', 'lồng quạt', 'cánh quạt'],
    questions: [
      {
        question: 'Quan sát chiếc quạt điện trong hình ảnh bên, bộ phận "Lồng quạt" có vai trò quan trọng nào dưới đây?',
        options: [
          'Bảo vệ cánh quạt và đảm bảo an toàn, ngăn không cho tay hoặc đồ vật chạm vào cánh quạt đang quay',
          'Làm cho cánh quạt quay nhanh hơn gấp đôi',
          'Dùng để điều chỉnh hẹn giờ tắt quạt',
          'Dùng để dẫn điện từ ổ cắm vào động cơ quạt',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Lồng quạt bao quanh cánh quạt để bảo vệ người sử dụng không bị va chạm vào cánh quạt khi quạt đang quay.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'electric_fan',
        visualData: 'Quạt điện và lồng bảo vệ',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Trong các đáp án dưới đây, thiết bị nào là Quạt điện dùng để tạo gió làm mát trong gia đình?',
        options: [
          'Quạt điện',
          'Đèn học để bàn',
          'Máy thu hình (Ti vi)',
          'Máy thu thanh (Radio)',
        ],
        correctIndex: 0,
        explanation: 'Đúng rồi! Đáp án A là quạt điện dùng để tạo gió làm mát.',
        visualDisplayMode: 'options_image',
        visualType: 'technology_tool',
        visualData: '',
        optionVisuals: ['electric_fan', 'desk_lamp', 'television_set', 'radio_set'],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: '[VẬN DỤNG NÂNG CAO] Khi đang sử dụng quạt điện mà phát hiện quạt phát ra tiếng kêu lạ, rung lắc mạnh hoặc có mùi khét, em cần xử lý như thế nào để đảm bảo an toàn?',
        options: [
          'Bấm nút tắt quạt ngay hoặc báo ngay cho người lớn rút phích cắm điện để kiểm tra, tuyệt đối không tự ý tháo quạt',
          'Dùng que sắt chọc vào trong lồng quạt khi cánh quạt vẫn đang quay',
          'Lấy nước dội trực tiếp vào hộp động cơ của quạt điện',
          'Bật số mạnh nhất để quạt quay tiếp',
        ],
        correctIndex: 0,
        explanation: 'Rất giỏi! Khi quạt có dấu hiệu bất thường, phải tắt quạt và báo ngay cho người lớn ngắt điện để kiểm tra an toàn.',
        visualDisplayMode: 'text_only',
        visualType: 'none',
        visualData: '',
        optionVisuals: [],
        difficulty: 'nang_cao',
        isAdvanced: true,
        points: 10,
      },
    ],
  },

  // ============================================================================
  // MÔN CÔNG NGHỆ — KHỐI 5 (Thiết kế, Điện thoại, Tủ lạnh, Năng lượng mặt trời & Điện gió)
  // ============================================================================
  {
    subject: 'Công nghệ',
    grade: 5,
    lessonNumber: 3,
    fullTitle: 'BÀI 3: TÌM HIỂU THIẾT KẾ VÀ SỬ DỤNG CÔNG NGHỆ TRONG ĐỜI SỐNG',
    keywords: ['bài 3', 'tìm hiểu thiết kế', 'sử dụng điện thoại', 'sử dụng tủ lạnh', 'điện mặt trời'],
    questions: [
      {
        question: 'Quan sát hình ảnh bên, khi phát hiện có đám cháy hoặc hỏa hoạn khẩn cấp, em cần gọi ngay đến số điện thoại khẩn cấp nào?',
        options: [
          'Số 114 (Cứu hỏa - Phòng cháy chữa cháy)',
          'Số 115 (Cấp cứu y tế)',
          'Số 113 (Công an)',
          'Số 1900 (Tổng đài tư vấn thương mại)',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Khi xảy ra cháy nổ, hỏa hoạn, cần gọi ngay số khẩn cấp 114 (Cứu hỏa).',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'telephone_emergency',
        visualData: 'Điện thoại gọi số khẩn cấp SOS',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Mô hình kỹ thuật trong hình ảnh bên khai thác nguồn năng lượng sạch nào từ thiên nhiên để tạo ra dòng điện?',
        options: [
          'Năng lượng mặt trời và năng lượng gió',
          'Năng lượng đốt than đá và dầu mỏ',
          'Năng lượng từ củi khô trong rừng',
          'Năng lượng từ pin chì dùng một lần',
        ],
        correctIndex: 0,
        explanation: 'Xuất sắc! Tấm pin mặt trời và tua-bin gió giúp chuyển hóa quang năng và sức gió thành điện năng sạch, thân thiện môi trường.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'solar_wind_model',
        visualData: 'Mô hình điện mặt trời và điện gió',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: '[VẬN DỤNG NÂNG CAO] Khi bảo quản thực phẩm trong tủ lạnh gia đình, vì sao chúng ta cần bọc kín hoặc cho thức ăn chín và thịt cá sống vào các hộp đậy nắp riêng biệt?',
        options: [
          'Để tránh nhiễm khuẩn chéo từ thực phẩm sống sang thức ăn chín và không gây lẫn mùi trong tủ lạnh',
          'Để làm cho tủ lạnh tiêu tốn nhiều điện năng hơn',
          'Để đá trong ngăn đông tan chảy nhanh hơn',
          'Vì tủ lạnh chỉ làm lạnh được những chiếc hộp nhựa',
        ],
        correctIndex: 0,
        explanation: 'Tuyệt vời! Bảo quản riêng biệt thực phẩm sống và chín trong hộp kín giúp đảm bảo vệ sinh an toàn thực phẩm và giữ tủ lạnh sạch sẽ, không lẫn mùi.',
        visualDisplayMode: 'question_image',
        visualType: 'technology_tool',
        visualKey: 'refrigerator',
        visualData: 'Bảo quản thực phẩm an toàn trong tủ lạnh',
        optionVisuals: [],
        difficulty: 'nang_cao',
        isAdvanced: true,
        points: 10,
      },
    ],
  },

  // ============================================================================
  // MÔN TIN HỌC — KHỐI 3, 4, 5
  // ============================================================================
  {
    subject: 'Tin học',
    grade: 4,
    lessonNumber: 1,
    fullTitle: 'BÀI 1: PHẦN CỨNG VÀ PHẦN MỀM MÁY TÍNH',
    keywords: ['bài 1', 'bài 2', 'bài 3', 'phần cứng', 'phần mềm', 'máy tính'],
    questions: [
      {
        question: 'Biểu tượng chữ W màu xanh trong hình ảnh bên là của phần mềm ứng dụng nào trên máy tính?',
        options: [
          'Phần mềm soạn thảo văn bản Microsoft Word',
          'Phần mềm trình chiếu Microsoft PowerPoint',
          'Phần mềm bảng tính Microsoft Excel',
          'Phần mềm vẽ tranh Microsoft Paint',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Biểu tượng chữ W màu xanh dương là của phần mềm soạn thảo văn bản Microsoft Word.',
        visualDisplayMode: 'question_image',
        visualType: 'software_icon',
        visualKey: 'word_icon',
        visualData: 'Microsoft Word',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Trong các đáp án dưới đây, đâu là thiết bị phần cứng máy tính dùng để hiển thị hình ảnh và kết quả làm việc?',
        options: [
          'Màn hình máy tính',
          'Thân máy tính (CPU)',
          'Chuột máy tính',
          'Bàn phím máy tính',
        ],
        correctIndex: 0,
        explanation: 'Đúng rồi! Màn hình máy tính là thiết bị đưa thông tin ra, giúp hiển thị hình ảnh và văn bản cho người dùng quan sát.',
        visualDisplayMode: 'options_image',
        visualType: 'computer_hardware',
        visualData: '',
        optionVisuals: ['monitor', 'cpu_tower', 'mouse', 'keyboard'],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Trong các đáp án dưới đây, biểu tượng nào là của phần mềm trình chiếu PowerPoint giúp tạo bài thuyết trình sinh động?',
        options: [
          'Phần mềm Word',
          'Phần mềm PowerPoint',
          'Phần mềm Excel',
          'Phần mềm Paint',
        ],
        correctIndex: 1,
        explanation: 'Xuất sắc! Biểu tượng chữ P màu cam đỏ là của phần mềm trình chiếu Microsoft PowerPoint.',
        visualDisplayMode: 'options_image',
        visualType: 'software_icon',
        visualData: '',
        optionVisuals: ['word_icon', 'powerpoint_icon', 'excel_icon', 'paint_icon'],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Thiết bị trong hình ảnh bên đóng vai trò như "bộ não" xử lý mọi thông tin của máy tính để bàn có tên là gì?',
        options: [
          'Thân máy tính (chứa bộ xử lý trung tâm CPU)',
          'Loa máy tính phát âm thanh',
          'Bàn di chuột máy tính',
          'Màn hình hiển thị',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Thân máy tính chứa bộ xử lý trung tâm (CPU) và bộ nhớ, điều khiển mọi hoạt động của máy tính.',
        visualDisplayMode: 'question_image',
        visualType: 'computer_hardware',
        visualKey: 'cpu_tower',
        visualData: 'Thân máy tính CPU',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: '[VẬN DỤNG NÂNG CAO] Nếu một chiếc máy tính có đầy đủ màn hình, thân máy, bàn phím, chuột mới tinh nhưng chưa cài đặt Hệ điều hành và các phần mềm thì máy tính đó có làm việc được không? Vì sao?',
        options: [
          'Không làm việc được, vì phần mềm là các chương trình điều khiển phần cứng hoạt động; thiếu phần mềm thì phần cứng không thể phục vụ người dùng',
          'Vẫn soạn thảo văn bản và vẽ tranh bình thường vì chỉ cần cắm điện là đủ',
          'Chỉ cần có chuột máy tính là tự động thay thế được mọi phần mềm',
          'Máy tính sẽ tự động in tài liệu ra giấy mà không cần phần mềm',
        ],
        correctIndex: 0,
        explanation: 'Tuyệt vời! Phần cứng và phần mềm có mối quan hệ gắn bó chặt chẽ: phải có hệ điều hành và phần mềm điều khiển thì phần cứng mới hoạt động được.',
        visualDisplayMode: 'question_image',
        visualType: 'software_icon',
        visualKey: 'software_overview',
        visualData: 'Vai trò của phần mềm điều khiển phần cứng',
        optionVisuals: [],
        difficulty: 'nang_cao',
        isAdvanced: true,
        points: 10,
      },
    ],
  },

  // ============================================================================
  // MÔN KỸ NĂNG SỐ — KHỐI 3, 4, 5
  // ============================================================================
  {
    subject: 'Kỹ năng số',
    grade: 4,
    lessonNumber: 1,
    fullTitle: 'BÀI HỌC KỸ NĂNG SỐ: AN TOÀN THÔNG TIN VÀ ỨNG XỬ VĂN MINH TRÊN MẠNG',
    keywords: ['bài 1', 'bài 2', 'bài 3', 'kỹ năng số', 'an toàn thông tin', 'mật khẩu', 'công dân số'],
    questions: [
      {
        question: 'Quan sát biểu tượng khóa bảo mật trong hình ảnh bên, mật khẩu nào dưới đây được coi là một "Mật khẩu mạnh" và an toàn nhất?',
        options: [
          'HocSinhGioi@2026# (Kết hợp chữ hoa, chữ thường, chữ số và ký tự đặc biệt)',
          '123456 (Dãy số liên tiếp dễ đoán)',
          'abcdef (Các chữ cái liền nhau trên bàn phím)',
          'ngaysinh (Chỉ gồm chữ thường trùng với ngày sinh)',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Mật khẩu mạnh cần có ít nhất 8 ký tự, kết hợp chữ hoa, chữ thường, chữ số và ký tự đặc biệt.',
        visualDisplayMode: 'question_image',
        visualType: 'digital_skill',
        visualKey: 'strong_password',
        visualData: 'Mật khẩu mạnh bảo vệ tài khoản số',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Trong các đáp án dưới đây, biểu tượng nào thể hiện chức năng "Lưu trữ đám mây" giúp sao lưu dữ liệu an toàn trên Internet?',
        options: [
          'Lưu trữ đám mây (Cloud Storage)',
          'Cảnh báo lừa đảo trực tuyến',
          'Mật khẩu bảo mật',
          'Ô tìm kiếm thông tin',
        ],
        correctIndex: 0,
        explanation: 'Đúng rồi! Lưu trữ đám mây (Cloud) giúp lưu giữ và đồng bộ tệp tin an toàn trên không gian mạng.',
        visualDisplayMode: 'options_image',
        visualType: 'digital_skill',
        visualData: '',
        optionVisuals: ['cloud_storage', 'phishing_warning', 'strong_password', 'search_engine'],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: '[VẬN DỤNG NÂNG CAO] Khi đang học trực tuyến, em nhận được một tin nhắn từ người lạ gửi đường link kèm lời nhắn: "Bấm vào đây ngay để nhận quà trúng thưởng miễn phí, hãy nhập mật khẩu và số điện thoại của bố mẹ". Em nên xử lý như thế nào?',
        options: [
          'Tuyệt đối không bấm vào đường link lạ, không cung cấp thông tin cá nhân và báo ngay cho bố mẹ hoặc thầy cô giáo',
          'Nhập ngay mật khẩu và số điện thoại của bố mẹ để nhận phần thưởng',
          'Chia sẻ đường link đó cho tất cả các bạn trong lớp cùng bấm vào',
          'Tắt phần mềm diệt virus trên máy tính để mở đường link nhanh hơn',
        ],
        correctIndex: 0,
        explanation: 'Xuất sắc! Đây là dấu hiệu lừa đảo trực tuyến (Phishing). Tuyệt đối không bấm vào liên kết lạ, không tiết lộ thông tin cá nhân và cần báo cho người lớn.',
        visualDisplayMode: 'question_image',
        visualType: 'digital_skill',
        visualKey: 'phishing_warning',
        visualData: 'Cảnh giác với đường link lạ và lừa đảo trên mạng',
        optionVisuals: [],
        difficulty: 'nang_cao',
        isAdvanced: true,
        points: 10,
      },
    ],
  },

  // ============================================================================
  // MÔN TRÍ TUỆ NHÂN TẠO — KHỐI 3, 4, 5
  // ============================================================================
  {
    subject: 'Trí tuệ nhân tạo',
    grade: 4,
    lessonNumber: 1,
    fullTitle: 'BÀI HỌC TRÍ TUỆ NHÂN TẠO: KHÁM PHÁ AI VÀ ỨNG DỤNG THÔNG MINH QUANH EM',
    keywords: ['bài 1', 'bài 2', 'bài 3', 'trí tuệ nhân tạo', 'ai', 'robot', 'prompt'],
    questions: [
      {
        question: 'Quan sát hình ảnh bên, ứng dụng công nghệ dùng camera để tự động nhận biết khuôn mặt người dùng mở khóa điện thoại hoặc điểm danh là ứng dụng nào của Trí tuệ nhân tạo (AI)?',
        options: [
          'Công nghệ nhận diện khuôn mặt (Thị giác máy tính - Computer Vision)',
          'Công nghệ in văn bản đen trắng trên giấy',
          'Công nghệ quạt gió làm mát cơ học',
          'Công nghệ tưới nước thủ công bằng bình hoa sen',
        ],
        correctIndex: 0,
        explanation: 'Chính xác! Nhận diện khuôn mặt là ứng dụng nổi bật của Thị giác máy tính trong Trí tuệ nhân tạo (AI).',
        visualDisplayMode: 'question_image',
        visualType: 'ai_concept',
        visualKey: 'face_recognition',
        visualData: 'AI Nhận diện khuôn mặt thông minh',
        optionVisuals: [],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: 'Trong các đáp án dưới đây, đâu là hình ảnh "Robot Trí tuệ nhân tạo" có khả năng giao tiếp và hỗ trợ con người học tập, làm việc?',
        options: [
          'Robot Trí tuệ nhân tạo (AI Robot)',
          'Trợ lý ảo giọng nói',
          'Ngôi nhà thông minh',
          'Xe tự hành AI',
        ],
        correctIndex: 0,
        explanation: 'Đúng rồi! Robot tích hợp Trí tuệ nhân tạo có thể nhận biết môi trường, giao tiếp và thực hiện nhiệm vụ thông minh.',
        visualDisplayMode: 'options_image',
        visualType: 'ai_concept',
        visualData: '',
        optionVisuals: ['ai_robot', 'voice_assistant', 'smart_home_iot', 'self_driving_car'],
        difficulty: 'co_ban',
        isAdvanced: false,
        points: 10,
      },
      {
        question: '[VẬN DỤNG NÂNG CAO] Khi sử dụng trợ lý Trí tuệ nhân tạo (AI) để hỗ trợ tìm hiểu bài học, cách làm nào dưới đây thể hiện em là học sinh thông minh và có trách nhiệm?',
        options: [
          'Đặt câu lệnh (Prompt) rõ ràng để AI gợi ý kiến thức, sau đó tự suy nghĩ, kiểm chứng lại với sách giáo khoa thay vì chép nguyên văn thụ động',
          'Nhờ AI làm hộ toàn bộ bài tập về nhà rồi chép lại mà không cần đọc hiểu',
          'Tin tưởng tuyệt đối 100% mọi thông tin AI đưa ra mà không cần đối chiếu với sách giáo khoa',
          'Nhập toàn bộ mật khẩu tài khoản và địa chỉ nhà riêng của gia đình lên các trang AI lạ',
        ],
        correctIndex: 0,
        explanation: 'Tuyệt vời! AI là công cụ hỗ trợ học tập đắc lực, nhưng học sinh cần biết đặt câu lệnh rõ ràng, tự tư duy và kiểm chứng thông tin theo sách giáo khoa.',
        visualDisplayMode: 'question_image',
        visualType: 'ai_concept',
        visualKey: 'chatbot_prompt',
        visualData: 'Sử dụng câu lệnh Prompt với AI có trách nhiệm',
        optionVisuals: [],
        difficulty: 'nang_cao',
        isAdvanced: true,
        points: 10,
      },
    ],
  },
];

/**
 * Tra cứu tên bài học đầy đủ theo Chương trình GDPT 2018 dựa trên Môn học, Khối/Lớp và chuỗi bài học người dùng nhập
 */
export function resolveCurriculumLessonTitle(
  rawLessonInput: string,
  subject: string,
  gradeOrClassName?: string | number
): string {
  const cleanInput = (rawLessonInput || '').trim();
  const upperInput = cleanInput.toUpperCase();
  const normSubj = (subject || '').trim().toLowerCase();

  // Xác định khối lớp (3, 4, 5)
  let detectedGrade = 4;
  const gradeMatch = String(gradeOrClassName || '').match(/[1-9]/);
  if (gradeMatch) {
    detectedGrade = parseInt(gradeMatch[0], 10);
  }

  // Nếu người dùng đã nhập tên bài học chi tiết (> 12 ký tự, không chỉ mỗi "Bài 3")
  if (cleanInput.length > 14 && !/^bài\s*\d+\s*$/i.test(cleanInput)) {
    return upperInput;
  }

  // Kiểm tra số bài (VD: "Bài 3", "bài 3", "Bai 3")
  const lessonNumMatch = cleanInput.match(/bài\s*(\d+)/i) || cleanInput.match(/^(\d+)$/);
  const lessonNum = lessonNumMatch ? parseInt(lessonNumMatch[1], 10) : null;

  if (normSubj.includes('công nghệ')) {
    const congNgheTitlesByGrade: Record<number, Record<number, string>> = {
      3: {
        1: 'BÀI 1: TỰ NHIÊN VÀ CÔNG NGHỆ',
        2: 'BÀI 2: SỬ DỤNG ĐÈN HỌC',
        3: 'BÀI 3: SỬ DỤNG QUẠT ĐIỆN',
        4: 'BÀI 4: SỬ DỤNG MÁY THU THANH',
        5: 'BÀI 5: SỬ DỤNG MÁY THU HÌNH',
        6: 'BÀI 6: AN TOÀN VỚI MÔI TRƯỜNG CÔNG NGHỆ TRONG GIA ĐÌNH',
        7: 'BÀI 7: DỤNG CỤ VÀ VẬT LIỆU LÀM THỦ CÔNG',
        8: 'BÀI 8: LÀM ĐỒ DÙNG HỌC TẬP',
        9: 'BÀI 9: LÀM BIỂN BÁO GIAO THÔNG',
        10: 'BÀI 10: LÀM ĐỒ CHƠI',
      },
      4: {
        1: 'BÀI 1: HOA VÀ CÂY CẢNH QUANH EM',
        2: 'BÀI 2: MỘT SỐ LOẠI HOA, CÂY CẢNH PHỔ BIẾN',
        3: 'BÀI 3: VẬT LIỆU VÀ DỤNG CỤ TRỒNG HOA, CÂY CẢNH TRONG CHẬU',
        4: 'BÀI 4: GIEO HẠT VÀ TRỒNG CÂY CON TRONG CHẬU',
        5: 'BÀI 5: CHĂM SÓC HOA, CÂY CẢNH TRONG CHẬU',
        6: 'BÀI 6: ĐỒ CHƠI DÂN GIAN',
        7: 'BÀI 7: LÀM CHONG CHÓNG',
        8: 'BÀI 8: LÀM ĐÈN LỒNG',
        9: 'BÀI 9: LẮP GHÉP MÔ HÌNH KỸ THUẬT',
        10: 'BÀI 10: LẮP GHÉP MÔ HÌNH ROBOT VÀ CÁI ĐU',
      },
      5: {
        1: 'BÀI 1: CÔNG NGHỆ TRONG ĐỜI SỐNG',
        2: 'BÀI 2: NHÀ SÁNG CHẾ',
        3: 'BÀI 3: TÌM HIỂU THIẾT KẾ SẢN PHẨM CÔNG NGHỆ',
        4: 'BÀI 4: SỬ DỤNG ĐIỆN THOẠI AN TOÀN VÀ HIỆU QUẢ',
        5: 'BÀI 5: SỬ DỤNG TỦ LẠNH',
        6: 'BÀI 6: LẮP ĐẶT MẠCH ĐIỆN VÀ MÔ HÌNH ĐIỆN MẶT TRỜI, ĐIỆN GIÓ',
      },
    };
    const gradeMap = congNgheTitlesByGrade[detectedGrade] || congNgheTitlesByGrade[4];
    if (lessonNum && gradeMap[lessonNum]) {
      return gradeMap[lessonNum];
    }
  }

  if (normSubj.includes('tin học')) {
    const tinHocTitles: Record<number, string> = {
      1: 'BÀI 1: THÔNG TIN VÀ QUYẾT ĐỊNH • PHẦN CỨNG VÀ PHẦN MỀM MÁY TÍNH',
      2: 'BÀI 2: XỬ LÝ THÔNG TIN VÀ CÁC THIẾT BỊ MÁY TÍNH',
      3: 'BÀI 3: THAO TÁC VỚI BÀN PHÍM, CHUỘT VÀ THƯ MỤC TỆP TIN',
      4: 'BÀI 4: TÌM KIẾM THÔNG TIN TRÊN INTERNET',
      5: 'BÀI 5: SOẠN THẢO VĂN BẢN TRÊN MÁY TÍNH',
      6: 'BÀI 6: TẠO BÀI TRÌNH CHIẾU SINH ĐỘNG',
      7: 'BÀI 7: LÀM QUEN VỚI LẬP TRÌNH TRỰC QUAN SCRATCH',
    };
    if (lessonNum && tinHocTitles[lessonNum]) {
      return tinHocTitles[lessonNum];
    }
  }

  if (normSubj.includes('kỹ năng số')) {
    const kyNangSoTitles: Record<number, string> = {
      1: 'BÀI 1: LÀM QUEN VỚI THẾ GIỚI SỐ VÀ CÔNG DÂN SỐ',
      2: 'BÀI 2: BẢO VỆ THÔNG TIN CÁ NHÂN VÀ ĐẶT MẬT KHẨU AN TOÀN',
      3: 'BÀI 3: KHAI THÁC, TÌM KIẾM THÔNG TIN AN TOÀN TRÊN INTERNET',
      4: 'BÀI 4: GIAO TIẾP VĂN MINH VÀ PHÒNG TRÁNH LỪA ĐẢO TRỰC TUYẾN',
      5: 'BÀI 5: SỬ DỤNG THIẾT BỊ SỐ HỢP LÝ, BẢO VỆ SỨC KHỎE',
    };
    if (lessonNum && kyNangSoTitles[lessonNum]) {
      return kyNangSoTitles[lessonNum];
    }
  }

  if (normSubj.includes('trí tuệ nhân tạo')) {
    const aiTitles: Record<number, string> = {
      1: 'BÀI 1: LÀM QUEN VỚI TRÍ TUỆ NHÂN TẠO (AI) QUANH EM',
      2: 'BÀI 2: CÁCH MÁY TÍNH HỌC TẬP VÀ NHẬN DIỆN HÌNH ẢNH, GIỌNG NÓI',
      3: 'BÀI 3: GIAO TIẾP VỚI TRỢ LÝ ẢO VÀ ĐẶT CÂU LỆNH PROMPT HIỆU QUẢ',
      4: 'BÀI 4: ỨNG DỤNG TRÍ TUỆ NHÂN TẠO TRONG HỌC TẬP VÀ ĐỜI SỐNG',
      5: 'BÀI 5: SỬ DỤNG TRÍ TUỆ NHÂN TẠO AN TOÀN, ĐẠO ĐỨC VÀ CÓ TRÁCH NHIỆM',
    };
    if (lessonNum && aiTitles[lessonNum]) {
      return aiTitles[lessonNum];
    }
  }

  return upperInput || 'BÀI HỌC';
}

/**
 * Sinh bộ câu hỏi chuẩn xác 100% theo Môn học, Khối lớp và Bài học (kèm 1-3 câu hỏi nâng cao và hình ảnh minh họa 1 trong 2)
 */
export function buildSubjectCurriculumQuestions(params: {
  lessonTitle: string;
  subject: string;
  gradeOrClassName?: string | number;
  questionCount: number;
}): { resolvedLessonTitle: string; questions: Question[] } {
  const { lessonTitle, subject, gradeOrClassName, questionCount } = params;
  const resolvedLessonTitle = resolveCurriculumLessonTitle(lessonTitle, subject, gradeOrClassName);
  const normSubj = (subject || 'Tin học').trim().toLowerCase();

  let detectedGrade = 4;
  const gradeMatch = String(gradeOrClassName || '').match(/[1-9]/);
  if (gradeMatch) {
    detectedGrade = parseInt(gradeMatch[0], 10);
  }

  const lessonNumMatch = (lessonTitle || '').match(/bài\s*(\d+)/i) || (lessonTitle || '').match(/^(\d+)$/);
  const lessonNum = lessonNumMatch ? parseInt(lessonNumMatch[1], 10) : 3;

  // Lọc các bài học cùng môn học
  const subjectEntries = GDPT2018_CURRICULUM_BANK.filter((entry) =>
    normSubj.includes(entry.subject.toLowerCase())
  );

  // Ưu tiên bài học khớp đúng Khối + Số bài
  const exactEntry =
    subjectEntries.find((e) => e.grade === detectedGrade && e.lessonNumber === lessonNum) ||
    subjectEntries.find((e) => e.lessonNumber === lessonNum) ||
    subjectEntries.find((e) => e.grade === detectedGrade) ||
    subjectEntries[0] ||
    GDPT2018_CURRICULUM_BANK[2]; // Bài 3 Công nghệ 4

  // Thu thập câu hỏi của bài học chính trước, nếu thiếu số lượng (VD: 15-20 câu) thì lấy thêm các câu hỏi cùng môn học
  const primaryPool = [...exactEntry.questions];
  const sameSubjectOtherPool = subjectEntries
    .filter((e) => e !== exactEntry)
    .flatMap((e) => e.questions);

  const basicPool = [
    ...primaryPool.filter((q) => !q.isAdvanced && q.difficulty !== 'nang_cao'),
    ...sameSubjectOtherPool.filter((q) => !q.isAdvanced && q.difficulty !== 'nang_cao'),
  ];
  const advancedPool = [
    ...primaryPool.filter((q) => q.isAdvanced || q.difficulty === 'nang_cao'),
    ...sameSubjectOtherPool.filter((q) => q.isAdvanced || q.difficulty === 'nang_cao'),
  ];

  // Số câu hỏi nâng cao bắt buộc: từ 1 đến 3 câu tùy tổng số câu
  const targetAdvancedCount =
    questionCount <= 5 ? 1 : questionCount <= 10 ? 2 : 3;
  const targetBasicCount = Math.max(1, questionCount - targetAdvancedCount);

  const selectedBasic: Omit<Question, 'id'>[] = Array.from({ length: targetBasicCount }, (_, i) => {
    const src = basicPool[i % Math.max(1, basicPool.length)] || primaryPool[0];
    return {
      ...src,
      difficulty: 'co_ban',
      isAdvanced: false,
    };
  });

  const selectedAdvanced: Omit<Question, 'id'>[] = Array.from({ length: targetAdvancedCount }, (_, i) => {
    const src = advancedPool[i % Math.max(1, advancedPool.length)] || primaryPool[primaryPool.length - 1];
    const cleanQ = src.question.replace(/^\[(?:VẬN DỤNG\s*)?NÂNG CAO\]\s*/i, '').trim();
    return {
      ...src,
      question: cleanQ,
      difficulty: 'nang_cao',
      isAdvanced: true,
      points: 15,
    };
  });

  const combined = [...selectedBasic, ...selectedAdvanced].slice(0, questionCount);

  const questions: Question[] = combined.map((q, idx) => ({
    ...q,
    id: `q-curr-${Date.now()}-${idx + 1}`,
  }));

  return {
    resolvedLessonTitle,
    questions,
  };
}
