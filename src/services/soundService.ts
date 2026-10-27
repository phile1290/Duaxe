class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmTimer: number | null = null;
  private isBgmPlaying: boolean = false;
  private activeNodes: AudioNode[] = [];
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private speechQueueTimer: number | null = null;
  private currentSpeechSessionId: number = 0;
  // Tốc độ đọc mặc định: 0.72 (Chậm rãi, to, rõ ràng từng chữ cho học sinh nghe)
  private speechRate: number = 0.72;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        try {
          const list = window.speechSynthesis.getVoices();
          if (list && list.length > 0) {
            this.cachedVoices = list;
          }
        } catch {}
      };
      loadVoices();
      try {
        window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
      } catch {
        (window.speechSynthesis as any).onvoiceschanged = loadVoices;
      }
    }
  }

  public setSpeechRate(rate: number): void {
    this.speechRate = Math.max(0.55, Math.min(1.0, rate));
  }

  public getSpeechRate(): number {
    return this.speechRate;
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopCelebrationMusic();
      this.stopSpeech();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public isCelebrationMusicPlaying(): boolean {
    return this.isBgmPlaying && !this.isMuted;
  }

  /**
   * Bảng phát âm chuẩn các chữ cái Tiếng Anh khi đọc từ viết tắt (Acronyms: AI, CPU, USB, HTML, URL...)
   */
  private static readonly ENGLISH_LETTER_PHONETICS: Record<string, string> = {
    A: 'Ây',
    B: 'Bi',
    C: 'Xi',
    D: 'Đi',
    E: 'I',
    F: 'Ép',
    G: 'Gi',
    H: 'Hết',
    I: 'Ai',
    J: 'Giây',
    K: 'Cây',
    L: 'Eo',
    M: 'Em',
    N: 'En',
    O: 'Âu',
    P: 'Pi',
    Q: 'Kiu',
    R: 'A',
    S: 'Ét',
    T: 'Ti',
    U: 'Iu',
    V: 'Vi',
    W: 'Đắp Bồ Iu',
    X: 'Ích',
    Y: 'Oai',
    Z: 'Dét',
  };

  /**
   * Kiểm tra một từ không dấu có cấu trúc âm tiết thuần Việt hay là từ Tiếng Anh
   */
  private isPureUnaccentedVietnameseWord(word: string): boolean {
    const lower = word.toLowerCase();
    const commonViUnaccented = new Set([
      'va', 'la', 'co', 'khong', 'trong', 'cua', 'cho', 'voi', 'nhung', 'cac',
      'mot', 'hai', 'ba', 'bon', 'nam', 'sau', 'bay', 'tam', 'chin', 'muoi',
      'em', 'anh', 'chi', 'ban', 'thay', 'co', 'hoc', 'sinh', 'lop', 'truong',
      'bai', 'mon', 'tin', 'cong', 'nghe', 'ky', 'nang', 'so', 'tri', 'tue',
      'nhan', 'tao', 'may', 'tinh', 'dien', 'thoai', 'mang', 'anh', 'hinh',
      'chu', 'so', 'chon', 'dap', 'an', 'dung', 'sai', 'cau', 'hoi', 'nao',
      'giup', 'dung', 'de', 'lam', 'gi', 'khi', 'nao', 'o', 'dau', 'nhu',
      'the', 'nao', 'vi', 'sao', 'tai', 'sao', 'bao', 'nhieu', 'hay', 'hoac',
      'neu', 'thi', 'ma', 'ra', 'vao', 'len', 'xuong', 'trai', 'phai', 'tren',
      'duoi', 'giua', 'truoc', 'sau', 'ngoai', 'بن', 'ben', 'canh', 'goc',
      'nut', 'bam', 'nhay', 'chuot', 'ban', 'phim', 'man', 'loa', 'tai', 'nghe',
      'day', 'cap', 'nguon', 'pin', 'sac', 'mo', 'tat', 'bat', 'luu', 'xoa',
      'sua', 'them', 'bot', 'tim', 'kiem', 'xem', 'nghe', 'doc', 'viet', 've',
      'to', 'mau', 'cat', 'dan', 'sao', 'chep', 'di', 'chuyen', 'doi', 'ten',
    ]);
    if (commonViUnaccented.has(lower)) return true;

    // Nếu chứa các ký tự không có trong tiếng Việt (f, j, w, z) -> Chắc chắn là tiếng Anh
    if (/[fjwz]/i.test(lower)) return false;

    // Kiểm tra cấu trúc âm tiết Tiếng Việt chuẩn: [Phụ âm đầu] + [Nguyên âm] + [Phụ âm cuối]
    const viSyllableRegex =
      /^(ngh|ng|nh|ch|gh|gi|kh|ph|qu|th|tr|[bcdghklmnpqrstvx])?(a|e|i|o|u|y|ai|ao|au|ay|au|eo|eu|ia|ie|iu|oa|oe|oi|oo|ua|ue|ui|uo|uu|uy|uya|uye|uoi|uou)(c|ch|m|n|ng|nh|p|t)?$/i;
    return viSyllableRegex.test(lower);
  }

  /**
   * Bộ chuyển đổi Quy tắc Ngữ âm Tiếng Anh sang Tiếng Việt (English Grapheme-to-Phoneme Transducer)
   * Dùng cho bất kỳ từ Tiếng Anh mới nào chưa có trong từ điển cố định để máy luôn đọc lưu loát, chuẩn xác!
   */
  private transduceUnknownEnglishWord(word: string): string {
    // 1. Nếu là từ viết tắt IN HOA (2 đến 5 ký tự, VD: DBMS, BIOS, SMTP, API, SDK, SQL, RGB, LED)
    if (/^[A-Z]{2,5}$/.test(word) && !this.isPureUnaccentedVietnameseWord(word)) {
      return word
        .split('')
        .map((ch) => SoundSynthesizer.ENGLISH_LETTER_PHONETICS[ch] || ch)
        .join(' ');
    }

    const lower = word.toLowerCase();
    // Nếu là từ thuần Việt không dấu hoặc quá ngắn (1 ký tự) thì giữ nguyên
    if (lower.length <= 1 || this.isPureUnaccentedVietnameseWord(lower)) {
      return word;
    }

    // 2. Chuyển đổi các cụm âm tiết Tiếng Anh phổ biến sang phiên âm Tiếng Việt tự nhiên
    let p = lower;
    p = p
      .replace(/tion\b/g, ' sần')
      .replace(/sion\b/g, ' dần')
      .replace(/ture\b/g, ' chờ')
      .replace(/ment\b/g, ' mần')
      .replace(/ness\b/g, ' nít')
      .replace(/able\b/g, ' ơ bồ')
      .replace(/ible\b/g, ' ơ bồ')
      .replace(/less\b/g, ' lít')
      .replace(/ful\b/g, ' phun')
      .replace(/ing\b/g, ' inh')
      .replace(/ed\b/g, '')
      .replace(/er\b/g, ' ơ')
      .replace(/or\b/g, ' ơ')
      .replace(/ar\b/g, ' a')
      .replace(/le\b/g, ' ồ')
      .replace(/igh/g, 'ai')
      .replace(/ough/g, 'ao')
      .replace(/au/g, 'o')
      .replace(/aw/g, 'o')
      .replace(/oo/g, 'u')
      .replace(/ee/g, 'i')
      .replace(/ea/g, 'i')
      .replace(/oa/g, 'âu')
      .replace(/ou/g, 'ao')
      .replace(/ow/g, 'ao')
      .replace(/ai/g, 'ây')
      .replace(/ay/g, 'ây')
      .replace(/oi/g, 'oi')
      .replace(/oy/g, 'oi')
      .replace(/ew/g, 'iu')
      .replace(/^kn/g, 'n')
      .replace(/^wr/g, 'r')
      .replace(/^wh/g, 'gu')
      .replace(/sh/g, 's')
      .replace(/ch/g, 'ch')
      .replace(/th/g, 'th')
      .replace(/ph/g, 'ph')
      .replace(/ck/g, 'c')
      .replace(/qu/g, 'qu')
      .replace(/^w/g, 'gu')
      .replace(/w/g, 'u')
      .replace(/^j/g, 'gi')
      .replace(/j/g, 'd')
      .replace(/f/g, 'ph')
      .replace(/z/g, 'd')
      .replace(/v/g, 'v')
      .replace(/x/g, 'x');

    // Xử lý phụ âm cuối tiếng Anh để bộ đọc tiếng Việt không bị nghẹn âm
    p = p
      .replace(/k\b/g, 'c')
      .replace(/d\b/g, 't')
      .replace(/b\b/g, 'p')
      .replace(/g\b/g, 'c')
      .replace(/l\b/g, 'n')
      .replace(/[srfv]\b/g, '');

    return p.replace(/\s+/g, ' ').trim() || word;
  }

  /**
   * Từ điển phiên âm chuẩn xác các từ vựng & thuật ngữ Tiếng Anh (Tin học, Công nghệ, Kỹ năng số, Trí tuệ nhân tạo, Giao tiếp)
   * giúp bộ đọc phát âm chuẩn xác tuyệt đối và lưu loát cả Tiếng Anh lẫn Tiếng Việt (VD: "ChatGPT", "YouTube", "PowerPoint", "Word", "Google"...)
   */
  private applyEnglishPhoneticsForVietnameseTTS(input: string): string {
    let text = input;

    // 0. Tách các từ ghép CamelCase hoặc Chữ+Số dính liền (VD: ChatGPT4 -> ChatGPT 4, YouTubeKids -> YouTube Kids, iPhone15 -> iPhone 15)
    text = text
      .replace(/chat\s*[-_.]?\s*gpt/gi, 'ChatGPT')
      .replace(/you\s*[-_.]?\s*tube/gi, 'YouTube')
      .replace(/power\s*[-_.]?\s*point/gi, 'PowerPoint')
      .replace(/open\s*[-_.]?\s*ai/gi, 'OpenAI')
      .replace(/one\s*[-_.]?\s*drive/gi, 'OneDrive')
      .replace(/tik\s*[-_.]?\s*tok/gi, 'TikTok')
      .replace(/cap\s*[-_.]?\s*cut/gi, 'CapCut')
      .replace(/face\s*[-_.]?\s*book/gi, 'Facebook')
      .replace(/([A-Za-z])(\d)/g, '$1 $2')
      .replace(/(\d)([A-Za-z])/g, '$1 $2');

    // 1. Xử lý các tổ hợp phím tắt thông dụng (Ctrl + C, Ctrl + V, Alt + F4...)
    text = text
      .replace(/\b(ctrl|control)\s*\+\s*([a-zA-Z])\b/gi, (_, _ctrl, key) => {
        const upper = String(key).toUpperCase();
        const keyPhonetic = SoundSynthesizer.ENGLISH_LETTER_PHONETICS[upper] || upper;
        return `Cơn trôn cộng ${keyPhonetic}`;
      })
      .replace(/\balt\s*\+\s*f(\d+)\b/gi, 'An cộng Ép $1')
      .replace(/\bshift\s*\+\s*([a-zA-Z])\b/gi, (_, key) => {
        const upper = String(key).toUpperCase();
        const keyPhonetic = SoundSynthesizer.ENGLISH_LETTER_PHONETICS[upper] || upper;
        return `Síp cộng ${keyPhonetic}`;
      });

    // 2. Xử lý tên miền / địa chỉ web (.com, .vn, .edu.vn, .org, .net)
    text = text
      .replace(/\.edu\.vn\b/gi, ' chấm ê đu chấm vi en')
      .replace(/\.gov\.vn\b/gi, ' chấm gốp chấm vi en')
      .replace(/\.com\.vn\b/gi, ' chấm com chấm vi en')
      .replace(/\.vn\b/gi, ' chấm vi en')
      .replace(/\.com\b/gi, ' chấm com')
      .replace(/\.org\b/gi, ' chấm o rờ gờ')
      .replace(/\.net\b/gi, ' chấm nét');

    // 3. Xử lý từ "AI" (Trí tuệ nhân tạo) khi viết hoa "AI" hoặc đi kèm ngữ cảnh công nghệ
    text = text.replace(
      /\b(trí tuệ nhân tạo|công nghệ|ứng dụng|mô hình|trợ lý|trợ lý ảo|hệ thống|công cụ|phần mềm|thời đại|chatbot|robot|camera|loa|tính năng|sử dụng|học)\s+ai\b/gi,
      '$1 Ây Ai'
    );
    text = text.replace(/\bAI\b/g, 'Ây Ai');
    text = text.replace(/\bA\.I\.?\b/gi, 'Ây Ai');

    // 4. Danh sách cụm từ tiếng Anh nhiều từ (ưu tiên thay thế trước)
    // Lưu ý: Trong giọng đọc Tiếng Việt chuẩn, âm /juː/ ("You") phải viết là "Iu" ("Iu Túp") để không bị đọc thành âm /z/ ("Ziu Túp")
    const multiWordMap: Array<[RegExp, string]> = [
      [/\bchat\s*gpt\b/gi, 'Chát Gi Pi Ti'],
      [/\bopen\s*ai\b/gi, 'Ô Pân Ây Ai'],
      [/\byou\s*tube\s+kids\b/gi, 'Iu Túp Kít'],
      [/\byou\s*tube\b/gi, 'Iu Túp'],
      [/\bmicrosoft\s+word\b/gi, 'Mai Crô Sóp Guớt'],
      [/\bmicrosoft\s+excel\b/gi, 'Mai Crô Sóp Ếch Xeo'],
      [/\bmicrosoft\s+powerpoint\b/gi, 'Mai Crô Sóp Pao Ơ Pôi'],
      [/\bmicrosoft\s+paint\b/gi, 'Mai Crô Sóp Pên'],
      [/\bmicrosoft\s+edge\b/gi, 'Mai Crô Sóp Ét'],
      [/\bmicrosoft\s+teams\b/gi, 'Mai Crô Sóp Tim'],
      [/\bmicrosoft\s+windows\b/gi, 'Mai Crô Sóp Uyn Đâu'],
      [/\bpower\s+point\b/gi, 'Pao Ơ Pôi'],
      [/\bgoogle\s+chrome\b/gi, 'Gu Gồ Crôm'],
      [/\bgoogle\s+search\b/gi, 'Gu Gồ Sớt'],
      [/\bgoogle\s+drive\b/gi, 'Gu Gồ Đờ Rai'],
      [/\bgoogle\s+docs\b/gi, 'Gu Gồ Đốc'],
      [/\bgoogle\s+sheets\b/gi, 'Gu Gồ Sít'],
      [/\bgoogle\s+slides\b/gi, 'Gu Gồ Xờ Lai'],
      [/\bgoogle\s+meet\b/gi, 'Gu Gồ Mít'],
      [/\bgoogle\s+maps\b/gi, 'Gu Gồ Máp'],
      [/\bgoogle\s+translate\b/gi, 'Gu Gồ Tran Xờ Lết'],
      [/\bgoogle\s+earth\b/gi, 'Gu Gồ Ớt'],
      [/\bsmart\s+home\b/gi, 'Smát Hôm'],
      [/\bsmart\s+phone\b/gi, 'Smát Phôn'],
      [/\bsmart\s+tv\b/gi, 'Smát Ti Vi'],
      [/\bsmart\s+watch\b/gi, 'Smát Guót'],
      [/\bmachine\s+learning\b/gi, 'Mơ Sin Lơn Ninh'],
      [/\bdeep\s+learning\b/gi, 'Đíp Lơn Ninh'],
      [/\bartificial\s+intelligence\b/gi, 'A Ti Phi Sồ In Te Li Giần'],
      [/\bbig\s+data\b/gi, 'Bích Đây Ta'],
      [/\bvirtual\s+reality\b/gi, 'Vơ Chu Ồ Ri A Li Ti'],
      [/\baugmented\s+reality\b/gi, 'Óc Men Tựt Ri A Li Ti'],
      [/\bcyber\s+security\b/gi, 'Sai Bơ Si Kiu Ri Ti'],
      [/\bsocial\s+media\b/gi, 'Xô Sồ Mi Đi A'],
      [/\bvideo\s+call\b/gi, 'Vi Đi Ô Côn'],
      [/\bqr\s+code\b/gi, 'Quy A Cốt'],
      [/\bface\s+id\b/gi, 'Phây Ai Đi'],
      [/\btouch\s+id\b/gi, 'Tắt Ai Đi'],
      [/\bdouble\s+click\b/gi, 'Đắp Bồ Cờ Lích'],
      [/\bright\s+click\b/gi, 'Rai Cờ Lích'],
      [/\bleft\s+click\b/gi, 'Lép Cờ Lích'],
      [/\bdrag\s+and\s+drop\b/gi, 'Đờ Rác En Đờ Róp'],
      [/\bspace\s+bar\b/gi, 'Xờ Pây Ba'],
      [/\bhard\s+drive\b/gi, 'Hát Đờ Rai'],
      [/\bhard\s+disk\b/gi, 'Hát Đít'],
      [/\brecycle\s+bin\b/gi, 'Ri Sai Cồ Bin'],
      [/\bcontrol\s+panel\b/gi, 'Cơn Trôn Pa Nô'],
      [/\bfile\s+explorer\b/gi, 'Phai Ích Pờ Lo Rơ'],
      [/\bwindows\s+explorer\b/gi, 'Uyn Đâu Ích Pờ Lo Rơ'],
      [/\btask\s+manager\b/gi, 'Tát Ma Nơ Giơ'],
      [/\bstart\s+menu\b/gi, 'Xờ Tát Mê Nu'],
      [/\bsearch\s+engine\b/gi, 'Sớt En Gin'],
      [/\bhello\s+world\b/gi, 'Hê Lô Guơ'],
      [/\bgreen\s+flag\b/gi, 'Gờ Rin Phờ Lác'],
      [/\bsolar\s+panel\b/gi, 'Xô La Pa Nô'],
      [/\bwind\s+turbine\b/gi, 'Uyn Tơ Bin'],
      [/\bwi\s*-\s*fi\b/gi, 'Oai Phai'],
      [/\be\s*-\s*mail\b/gi, 'I Mêu'],
      [/\bblu\s*-\s*ray\b/gi, 'Bờ Lu Rây'],
    ];

    for (const [pattern, replacement] of multiWordMap) {
      text = text.replace(pattern, replacement);
    }

    // 5. Từ điển từ đơn tiếng Anh & thuật ngữ SGK Tin học - Công nghệ - Kỹ năng số - Trí tuệ nhân tạo
    const singleWordDictionary: Record<string, string> = {
      chatgpt: 'Chát Gi Pi Ti',
      gpt: 'Gi Pi Ti',
      youtube: 'Iu Túp',
      youtuber: 'Iu Túp Bơ',
      youtubekids: 'Iu Túp Kít',
      google: 'Gu Gồ',
      chrome: 'Crôm',
      chromium: 'Crô Mi Um',
      microsoft: 'Mai Crô Sóp',
      windows: 'Uyn Đâu',
      window: 'Uyn Đâu',
      powerpoint: 'Pao Ơ Pôi',
      word: 'Guớt',
      excel: 'Ếch Xeo',
      access: 'Ắc Xét',
      outlook: 'Ao Lúc',
      onenote: 'Oăn Nốt',
      onedrive: 'Oăn Đờ Rai',
      sharepoint: 'Se Pôi',
      scratch: 'Xcờ Rát',
      python: 'Pai Thon',
      javascript: 'Gia Va Xcờ Ríp',
      java: 'Gia Va',
      paint: 'Pên',
      canva: 'Can Va',
      capcut: 'Cáp Cắt',
      photoshop: 'Phô Tô Sóp',
      illustrator: 'I Lút Xờ Trây Tơ',
      premiere: 'Pờ Rê Mi E',
      audacity: 'O Đa Xi Ti',
      unikey: 'Iu Ni Ki',
      vietkey: 'Việt Ki',
      telex: 'Tê Lếch',
      vni: 'Vi En Ai',
      unicode: 'Iu Ni Cốt',
      coccoc: 'Cốc Cốc',
      firefox: 'Phai Phóc',
      safari: 'Sa Pha Ri',
      edge: 'Ét',
      opera: 'Ô Pê Ra',
      brave: 'Bờ Rây',
      explorer: 'Ích Pờ Lo Rơ',
      internet: 'In Tơ Nét',
      intranet: 'In Tra Nét',
      ethernet: 'I Thơ Nét',
      website: 'Guép Sai',
      websites: 'Guép Sai',
      web: 'Guép',
      webpage: 'Guép Pây',
      browser: 'Bờ Rao Dơ',
      browsers: 'Bờ Rao Dơ',
      email: 'I Mêu',
      emails: 'I Mêu',
      gmail: 'Gờ Mêu',
      yahoo: 'Da Hu',
      icloud: 'Ai Cờ Lao',
      wifi: 'Oai Phai',
      wireless: 'Oai Lít',
      bluetooth: 'Bờ Lu Tút',
      airdrop: 'E Đờ Róp',
      hotspot: 'Hót Xờ Pót',
      facebook: 'Phây Búc',
      tiktok: 'Tích Tốc',
      instagram: 'In Xờ Ta Gờ Ram',
      messenger: 'Mét Xen Giơ',
      whatsapp: 'Guốt Áp',
      telegram: 'Tê Lê Gờ Ram',
      viber: 'Vai Bơ',
      zalo: 'Da Lô',
      zoom: 'Dum',
      teams: 'Tim',
      skype: 'Xờ Cai',
      discord: 'Đít Co',
      twitter: 'Tuýt Tơ',
      linkedin: 'Linh In',
      pinterest: 'Pin Tơ Rét',
      spotify: 'Xờ Pót Ti Phai',
      netflix: 'Nét Phờ Lích',
      shopee: 'Sóp Pi',
      lazada: 'La Da Đa',
      tiki: 'Ti Ki',
      grab: 'Gờ Ráp',
      openai: 'Ô Pân Ây Ai',
      gemini: 'Gie Mi Nai',
      copilot: 'Cô Pai Lợt',
      claude: 'Cờ Lốt',
      midjourney: 'Mít Giơ Ni',
      dalle: 'Đan I',
      sora: 'Xô Ra',
      deepseek: 'Đíp Xíc',
      meta: 'Mê Ta',
      apple: 'Áp Pồ',
      samsung: 'Sam Sung',
      sony: 'Xô Ni',
      intel: 'In Teo',
      amd: 'Ây Em Đi',
      nvidia: 'En Vi Đi A',
      asus: 'ây Sút',
      acer: 'Ây Sơ',
      lenovo: 'Lê Nô Vô',
      dell: 'Đeo',
      hp: 'Hết Pi',
      canon: 'Ca Nông',
      epson: 'Ép Sơn',
      siri: 'Xi Ri',
      alexa: 'A Lếch Xa',
      cortana: 'Co Ta Na',
      bixby: 'Bích Bi',
      chatbot: 'Chát Bót',
      chatbots: 'Chát Bót',
      chat: 'Chát',
      bot: 'Bót',
      prompt: 'Pờ Rom',
      prompts: 'Pờ Rom',
      deepfake: 'Đíp Phếch',
      algorithm: 'An Gô Ri Đầm',
      algorithms: 'An Gô Ri Đầm',
      robot: 'Rô Bốt',
      robots: 'Rô Bốt',
      robotics: 'Rô Bốt Tích',
      drone: 'Đờ Rôn',
      sensor: 'Sen Sơ',
      sensors: 'Sen Sơ',
      motor: 'Mô Tơ',
      autopilot: 'O Tô Pai Lợt',
      iot: 'Ai Ô Ti',
      smart: 'Smát',
      smartphone: 'Smát Phôn',
      smartphones: 'Smát Phôn',
      smarthome: 'Smát Hôm',
      smartwatch: 'Smát Guót',
      smarttv: 'Smát Ti Vi',
      laptop: 'Láp Tóp',
      laptops: 'Láp Tóp',
      desktop: 'Đét Tóp',
      pc: 'Pi Xi',
      macbook: 'Mác Búc',
      imac: 'Ai Mác',
      tablet: 'Táp Lét',
      tablets: 'Táp Lét',
      ipad: 'Ai Pát',
      iphone: 'Ai Phôn',
      ipod: 'Ai Pót',
      android: 'An Đờ Roi',
      ios: 'Ai Ô Ét',
      linux: 'Li Núc',
      ubuntu: 'U Bun Tu',
      macos: 'Mác Ô Ét',
      cpu: 'Xi Pi Iu',
      gpu: 'Gi Pi Iu',
      ram: 'Ram',
      rom: 'Rom',
      ssd: 'Ét Ét Đi',
      hdd: 'Hết Đi Đi',
      usb: 'Iu Ét Bi',
      hdmi: 'Hết Đi Em Ai',
      vga: 'Vi Gi Ây',
      led: 'Lét',
      lcd: 'Eo Xi Đi',
      oled: 'Ô Lét',
      lan: 'Lan',
      wan: 'Oan',
      wlan: 'Đắp Bồ Iu Lan',
      modem: 'Mô Đem',
      router: 'Rao Tơ',
      switch: 'Suýt',
      hub: 'Hắp',
      server: 'Sơ Vơ',
      servers: 'Sơ Vơ',
      client: 'Cờ Lai Ân',
      cloud: 'Cờ Lao',
      database: 'Đây Ta Bây',
      data: 'Đây Ta',
      bigdata: 'Bích Đây Ta',
      file: 'Phai',
      files: 'Phai',
      folder: 'Phôn Đơ',
      folders: 'Phôn Đơ',
      directory: 'Đai Rếch Tơ Ri',
      drive: 'Đờ Rai',
      disk: 'Đít',
      icon: 'Ai Cơn',
      icons: 'Ai Cơn',
      shortcut: 'Sót Cắt',
      taskbar: 'Tát Ba',
      toolbar: 'Tun Ba',
      menubar: 'Mê Nu Ba',
      statusbar: 'Xờ Ta Tút Ba',
      ribbon: 'Ríp Bơn',
      menu: 'Mê Nu',
      start: 'Xờ Tát',
      stop: 'Xờ Tóp',
      mouse: 'Mao',
      mousepad: 'Mao Pát',
      touchpad: 'Tắt Pát',
      touchscreen: 'Tắt Xcờ Rin',
      keyboard: 'Ki Bo',
      keypad: 'Ki Pát',
      key: 'Ki',
      keys: 'Ki',
      monitor: 'Mô Ni Tơ',
      screen: 'Xcờ Rin',
      display: 'Đít Pờ Lây',
      printer: 'Pờ Rin Tơ',
      scanner: 'Xcờ Ken Nơ',
      speaker: 'Xờ Píc Cơ',
      speakers: 'Xờ Píc Cơ',
      headphone: 'Hét Phôn',
      headphones: 'Hét Phôn',
      headset: 'Hét Sét',
      earphone: 'Ia Phôn',
      airpods: 'E Pót',
      microphone: 'Mai Crô Phôn',
      mic: 'Míc',
      webcam: 'Guép Cam',
      camera: 'Ca Mê Ra',
      projector: 'Pờ Rô Giếch Tơ',
      cable: 'Cây Bồ',
      adapter: 'Ơ Đáp Tơ',
      charger: 'Cha Giơ',
      battery: 'Bát Tơ Ri',
      power: 'Pao Ơ',
      button: 'Bắt Tần',
      buttons: 'Bắt Tần',
      click: 'Cờ Lích',
      doubleclick: 'Đắp Bồ Cờ Lích',
      rightclick: 'Rai Cờ Lích',
      scroll: 'Xcờ Rôn',
      drag: 'Đờ Rác',
      drop: 'Đờ Róp',
      enter: 'En Tơ',
      shift: 'Síp',
      ctrl: 'Cơn Trôn',
      control: 'Cơn Trôn',
      alt: 'An',
      space: 'Xờ Pây',
      spacebar: 'Xờ Pây Ba',
      backspace: 'Bách Xờ Pây',
      delete: 'Đi Lít',
      del: 'Đeo',
      insert: 'In Sớt',
      esc: 'Ét Kếp',
      escape: 'Ét Kếp',
      tab: 'Táp',
      capslock: 'Cáp Lốc',
      numlock: 'Num Lốc',
      home: 'Hôm',
      end: 'En',
      pageup: 'Pây Ắp',
      pagedown: 'Pây Đao',
      copy: 'Cóp Pi',
      paste: 'Pết',
      cut: 'Cắt',
      undo: 'Ăn Đu',
      redo: 'Ri Đu',
      save: 'Sây',
      open: 'Ô Pân',
      close: 'Cờ Lâu',
      new: 'Niu',
      print: 'Pờ Rin',
      find: 'Phai',
      replace: 'Ri Pờ Lây',
      search: 'Sớt',
      select: 'Si Lếch',
      edit: 'Ê Đít',
      view: 'Viu',
      review: 'Ri Viu',
      help: 'Hép',
      format: 'Pho Mát',
      font: 'Phông',
      size: 'Sai',
      color: 'Cơ Lơ',
      colors: 'Cơ Lơ',
      bold: 'Bôn',
      italic: 'I Ta Lích',
      underline: 'Ăn Đơ Lai',
      align: 'Ơ Lai',
      left: 'Lép',
      right: 'Rai',
      center: 'Xen Tơ',
      justify: 'Giớt Ti Phai',
      slide: 'Xờ Lai',
      slides: 'Xờ Lai',
      slideshow: 'Xờ Lai Sâu',
      animation: 'A Ni Mây Sần',
      animations: 'A Ni Mây Sần',
      transition: 'Trăn Di Sần',
      transitions: 'Trăn Di Sần',
      layout: 'Lây Ao',
      design: 'Đì Giai',
      template: 'Tem Pờ Lết',
      templates: 'Tem Pờ Lết',
      theme: 'Thim',
      themes: 'Thim',
      table: 'Tây Bồ',
      tables: 'Tây Bồ',
      chart: 'Chát',
      charts: 'Chát',
      graph: 'Gờ Ráp',
      shape: 'Sếp',
      shapes: 'Sếp',
      image: 'I Mịt',
      images: 'I Mịt',
      picture: 'Pích Chơ',
      pictures: 'Pích Chơ',
      photo: 'Phô Tô',
      photos: 'Phô Tô',
      video: 'Vi Đi Ô',
      videos: 'Vi Đi Ô',
      audio: 'O Đi Ô',
      music: 'Miu Dích',
      sound: 'Sao',
      sounds: 'Sao',
      voice: 'Voi',
      text: 'Tếch',
      box: 'Bốc',
      textbox: 'Tếch Bốc',
      wordart: 'Guớt Át',
      smartart: 'Smát Át',
      clipart: 'Cờ Líp Át',
      header: 'Hét Đơ',
      footer: 'Phút Tơ',
      page: 'Pây',
      pages: 'Pây',
      document: 'Đóc Ciu Mần',
      documents: 'Đóc Ciu Mần',
      presentation: 'Pờ Rê Den Tây Sần',
      spreadsheet: 'Xờ Pờ Rét Sít',
      workbook: 'Guớc Búc',
      worksheet: 'Guớc Sít',
      sheet: 'Sít',
      sheets: 'Sít',
      cell: 'Seo',
      cells: 'Seo',
      row: 'Râu',
      rows: 'Râu',
      column: 'Co Lăm',
      columns: 'Co Lăm',
      formula: 'Pho Miu La',
      formulas: 'Pho Miu La',
      function: 'Phăng Sần',
      functions: 'Phăng Sần',
      sum: 'Săm',
      average: 'A Vơ Rịt',
      max: 'Mắc',
      min: 'Min',
      count: 'Cao',
      block: 'Bờ Lốc',
      blocks: 'Bờ Lốc',
      sprite: 'Xờ Pờ Rai',
      sprites: 'Xờ Pờ Rai',
      stage: 'Xờ Tây',
      backdrop: 'Bách Đờ Róp',
      backdrops: 'Bách Đờ Róp',
      costume: 'Cót Tum',
      costumes: 'Cót Tum',
      script: 'Xcờ Ríp',
      scripts: 'Xcờ Ríp',
      code: 'Cốt',
      coding: 'Cốt Đinh',
      program: 'Pờ Rô Gờ Ram',
      programming: 'Pờ Rô Gờ Ram Minh',
      programmer: 'Pờ Rô Gờ Ram Mơ',
      bug: 'Bắc',
      bugs: 'Bắc',
      debug: 'Đì Bắc',
      debugging: 'Đì Bắc Ginh',
      loop: 'Lúp',
      loops: 'Lúp',
      repeat: 'Ri Pít',
      forever: 'Pho Ép Vơ',
      wait: 'Guết',
      if: 'Íp',
      then: 'Đen',
      else: 'Eo',
      until: 'Ăn Tiu',
      when: 'Guen',
      clicked: 'Cờ Lích',
      pressed: 'Pờ Rét',
      flag: 'Phờ Lác',
      green: 'Gờ Rin',
      red: 'Rét',
      blue: 'Bờ Lu',
      yellow: 'Diêu Lâu',
      orange: 'O Rìn',
      purple: 'Pơ Pồ',
      pink: 'Pinh',
      black: 'Bờ Lách',
      white: 'Oai',
      move: 'Mu',
      steps: 'Xờ Tép',
      step: 'Xờ Tép',
      turn: 'Tơn',
      degrees: 'Đì Gờ Ri',
      degree: 'Đì Gờ Ri',
      point: 'Pôi',
      direction: 'Đai Rếch Sần',
      glide: 'Gờ Lai',
      seconds: 'Xê Cần',
      second: 'Xê Cần',
      say: 'Xây',
      think: 'Thinh',
      show: 'Sâu',
      hide: 'Hai',
      next: 'Nếch',
      effect: 'I Phếch',
      volume: 'Vo Lum',
      pitch: 'Pít',
      event: 'I Ven',
      events: 'I Ven',
      motion: 'Mâu Sần',
      looks: 'Lúc',
      sensing: 'Sen Sinh',
      touching: 'Tắt Chinh',
      pointer: 'Pôi Tơ',
      ask: 'Ác',
      answer: 'An Sơ',
      timer: 'Thai Mơ',
      operator: 'Óp Pơ Rây Tơ',
      operators: 'Óp Pơ Rây Tơ',
      random: 'Ran Đầm',
      join: 'Gioi',
      letter: 'Lét Tơ',
      length: 'Leng',
      mod: 'Mót',
      round: 'Rao',
      variable: 'Ve Ri Ơ Bồ',
      variables: 'Ve Ri Ơ Bồ',
      list: 'Lít',
      lists: 'Lít',
      set: 'Sét',
      change: 'Chên',
      software: 'Sóp Goe',
      hardware: 'Hát Goe',
      firmware: 'Phơm Goe',
      system: 'Sít Tầm',
      operating: 'Óp Pơ Rây Tinh',
      application: 'Áp Pờ Li Cây Sần',
      applications: 'Áp Pờ Li Cây Sần',
      app: 'Áp',
      apps: 'Áp',
      game: 'Ghêm',
      games: 'Ghêm',
      gaming: 'Ghêm Minh',
      online: 'On Lai',
      offline: 'Óp Lai',
      download: 'Đao Lốt',
      upload: 'Ắp Lốt',
      link: 'Linh',
      links: 'Linh',
      hyperlink: 'Hai Pơ Linh',
      url: 'Iu A Eo',
      http: 'Hết Ti Ti Pi',
      https: 'Hết Ti Ti Pi Ét',
      www: 'Đắp Bồ Iu Đắp Bồ Iu Đắp Bồ Iu',
      html: 'Hết Ti Em Eo',
      css: 'Xi Ét Ét',
      pdf: 'Pi Đi Ép',
      doc: 'Đốc',
      docx: 'Đốc Ích',
      xls: 'Ích Eo Ét',
      xlsx: 'Ích Eo Ét Ích',
      ppt: 'Pi Pi Ti',
      pptx: 'Pi Pi Ti Ích',
      txt: 'Ti Ích Ti',
      jpg: 'Gi Pi Gi',
      jpeg: 'Gi Pếch',
      png: 'Pi En Gi',
      gif: 'Gíp',
      svg: 'Ét Vi Gi',
      mp3: 'Em Pi Ba',
      mp4: 'Em Pi Bốn',
      wav: 'Guây',
      avi: 'Ây Vi Ai',
      zip: 'Díp',
      rar: 'Ra',
      exe: 'I Ích I',
      account: 'Ơ Cao',
      accounts: 'Ơ Cao',
      login: 'Lốc In',
      logout: 'Lốc Ao',
      signin: 'Sai In',
      signup: 'Sai Ắp',
      username: 'Iu Dơ Nêm',
      user: 'Iu Dơ',
      users: 'Iu Dơ',
      password: 'Pát Guớt',
      passwords: 'Pát Guớt',
      pin: 'Pin',
      otp: 'Ô Ti Pi',
      profile: 'Pờ Rô Phai',
      setting: 'Sét Tinh',
      settings: 'Sét Tinh',
      privacy: 'Pờ Rai Vơ Xi',
      security: 'Si Kiu Ri Ti',
      safety: 'Sếp Ti',
      safe: 'Sếp',
      unsafe: 'Ăn Sếp',
      antivirus: 'An Ti Vai Rớt',
      virus: 'Vi Rút',
      malware: 'Man Goe',
      trojan: 'Trô Gian',
      spyware: 'Xờ Pai Goe',
      hacker: 'Hách Cơ',
      hack: 'Hách',
      spam: 'Xờ Pam',
      phishing: 'Phít Sinh',
      scam: 'Xcờ Kem',
      firewall: 'Phai Guôn',
      backup: 'Bách Cắp',
      restore: 'Ri Xờ To',
      update: 'Ắp Đết',
      upgrade: 'Ắp Gờ Rết',
      install: 'In Xờ Tôn',
      uninstall: 'Ăn In Xờ Tôn',
      setup: 'Sét Tắp',
      reset: 'Ri Sét',
      restart: 'Ri Xờ Tát',
      shutdown: 'Sắt Đao',
      sleep: 'Xờ Líp',
      lock: 'Lốc',
      unlock: 'Ăn Lốc',
      share: 'Se',
      like: 'Lai',
      comment: 'Còm Men',
      post: 'Pốt',
      feed: 'Phít',
      story: 'Xờ To Ri',
      reel: 'Riu',
      reels: 'Riu',
      livestream: 'Lai Xcờ Rim',
      stream: 'Xcờ Rim',
      podcast: 'Pót Cát',
      blog: 'Bờ Lốc',
      vlog: 'Vi Lốc',
      digital: 'Đi Gi Tồ',
      citizen: 'Xi Ti Dần',
      copyright: 'Cóp Pi Rai',
      license: 'Lai Sần',
      creative: 'Cờ Ri Ấy Típ',
      commons: 'Còm Mần',
      netiquette: 'Nét Ti Kết',
      cyberbullying: 'Sai Bơ Bu Li Inh',
      computer: 'Cơm Piu Tơ',
      science: 'Sai Ần',
      technology: 'Tếch Nô Lơ Gi',
      information: 'In Pho Mây Sần',
      network: 'Nét Guớc',
      wirelessnetwork: 'Oai Lít Nét Guớc',
      hello: 'Hê Lô',
      world: 'Guơ',
      hi: 'Hai',
      yes: 'Diét',
      no: 'Nâu',
      ok: 'Ô Kê',
      okay: 'Ô Kê',
      true: 'Tru',
      false: 'Phôn',
      input: 'In Pút',
      output: 'Ao Pút',
      process: 'Pờ Rô Xét',
      storage: 'Xờ To Rịt',
      memory: 'Mê Mô Ri',
      brush: 'Bờ Rắt',
      eraser: 'I Rây Dơ',
      pencil: 'Pen Xồ',
      fill: 'Phin',
      line: 'Lai',
      curve: 'Cơ',
      oval: 'Ô Van',
      circle: 'Xơ Cồ',
      rectangle: 'Rếch Tang Gồ',
      square: 'Xờ Que',
      triangle: 'Trai En Gồ',
      polygon: 'Pô Li Gon',
      star: 'Xờ Ta',
      heart: 'Hát',
      arrow: 'A Râu',
    };

    // Quét tất cả các từ không dấu (ASCII words) và chuyển đổi:
    // - Nếu có trong từ điển singleWordDictionary -> thay bằng phiên âm chuẩn
    // - Nếu là từ tiếng Anh chưa có trong từ điển -> dùng bộ G2P transduceUnknownEnglishWord
    text = text.replace(
      /(?<![A-Za-zÀ-ỹ])([A-Za-z][A-Za-z0-9]*)(?![A-Za-zÀ-ỹ])/g,
      (matchedWord) => {
        const lower = matchedWord.toLowerCase();
        if (singleWordDictionary[lower]) {
          return singleWordDictionary[lower];
        }
        return this.transduceUnknownEnglishWord(matchedWord);
      }
    );

    return text;
  }

  /**
   * Chuẩn hóa văn bản tiếng Việt + tiếng Anh trước khi đọc để giọng đọc rõ ràng, mạch lạc, chính xác tuyệt đối
   */
  public normalizeVietnameseSpeechText(rawText: string): string {
    if (!rawText) return '';
    let processed = String(rawText)
      .replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu, ' ')
      .replace(/[“”"']/g, ' ')
      .replace(/[()[\]{}]/g, ', ')
      .replace(/(\d+)\s*[×x*]\s*(\d+)/gi, '$1 nhân $2')
      .replace(/(\d+)\s*[:÷/]\s*(\d+)/g, '$1 chia $2')
      .replace(/(\d+)\s*\+\s*(\d+)/g, '$1 cộng $2')
      .replace(/(\d+)\s*-\s*(\d+)/g, '$1 trừ $2')
      .replace(/=\s*\?/g, ' bằng bao nhiêu ')
      .replace(/=/g, ' bằng ')
      .replace(/%/g, ' phần trăm ')
      .replace(/\bSGK\b/gi, 'sách giáo khoa')
      .replace(/\bSBT\b/gi, 'sách bài tập')
      .replace(/\bVD\b/gi, 'ví dụ')
      .replace(/\bHS\b/gi, 'học sinh')
      .replace(/\bGV\b/gi, 'giáo viên')
      .replace(/\bTHCS\b/gi, 'trung học cơ sở')
      .replace(/\bTHPT\b/gi, 'trung học phổ thông')
      .replace(/\bCNTT\b/gi, 'công nghệ thông tin')
      .replace(/\bTTNT\b/gi, 'trí tuệ nhân tạo')
      .replace(/\bKNS\b/gi, 'kỹ năng số');

    processed = this.applyEnglishPhoneticsForVietnameseTTS(processed);

    return processed.replace(/\s+/g, ' ').trim();
  }

  /**
   * Chọn giọng đọc Tiếng Việt (vi-VN) tự nhiên, to và rõ ràng nhất có trên thiết bị/trình duyệt
   */
  private getBestVietnameseVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices =
      this.cachedVoices.length > 0
        ? this.cachedVoices
        : window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    this.cachedVoices = voices;

    const viVoices = voices.filter(
      (v) =>
        v.lang.toLowerCase().startsWith('vi') ||
        v.name.toLowerCase().includes('vietnam') ||
        v.name.toLowerCase().includes('tiếng việt') ||
        v.name.toLowerCase().includes('hoaimy') ||
        v.name.toLowerCase().includes('namminh') ||
        v.name.toLowerCase().includes('linh') ||
        v.name.toLowerCase().includes('an ')
    );

    if (viVoices.length === 0) return null;

    // Ưu tiên giọng Neural / Natural (HoaiMy, NamMinh, Google Tiếng Việt) vì âm lượng to và phát âm chuẩn nhất
    const preferred =
      viVoices.find(
        (v) =>
          v.name.toLowerCase().includes('hoaimy') &&
          v.name.toLowerCase().includes('natural')
      ) ||
      viVoices.find((v) => v.name.toLowerCase().includes('natural')) ||
      viVoices.find((v) => v.name.toLowerCase().includes('google')) ||
      viVoices.find((v) => v.name.toLowerCase().includes('hoaimy')) ||
      viVoices.find((v) => v.name.toLowerCase().includes('namminh')) ||
      viVoices[0];

    return preferred || null;
  }

  /**
   * Chuông báo hiệu nhẹ, rõ ràng (Web Audio API) trước khi bắt đầu đọc để thu hút sự chú ý của học sinh
   */
  private playSpeechAttentionBell(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.09); // A5
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  /**
   * Dừng đọc văn bản hiện tại ngay lập tức
   */
  public stopSpeech(): void {
    this.currentSpeechSessionId++;
    if (this.speechQueueTimer !== null) {
      clearTimeout(this.speechQueueTimer);
      this.speechQueueTimer = null;
    }
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}
  }

  /**
   * Chia đoạn văn bản thành các mệnh đề ngắn gọn để trình duyệt đọc TO (volume = 1.0),
   * CHẬM RÃI (rate = 0.72), RÕ RÀNG từng chữ và có nhịp nghỉ tự nhiên giữa các câu/đáp án
   */
  private splitIntoClearSpeechSegments(text: string): string[] {
    const rawParts = text
      .split(/(?<=[.!?;\n])\s+/)
      .map((part) => this.normalizeVietnameseSpeechText(part))
      .filter(Boolean);

    if (rawParts.length === 0) {
      const single = this.normalizeVietnameseSpeechText(text);
      return single ? [single] : [];
    }
    return rawParts;
  }

  /**
   * Đọc tuần tự danh sách các mệnh đề với âm lượng TO TỐI ĐA (volume = 1.0)
   * và tốc độ CHẬM RÕ RÀNG (rate = this.speechRate = 0.72), có khoảng nghỉ giữa từng mệnh đề
   */
  private speakSegmentsSequentially(
    segments: string[],
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      interrupt?: boolean;
      pauseMsBetweenSegments?: number;
      rateOverride?: number;
    }
  ): void {
    if (this.isMuted) {
      options?.onEnd?.();
      return;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      options?.onEnd?.();
      return;
    }

    const validSegments = segments
      .map((s) => this.normalizeVietnameseSpeechText(s))
      .filter(Boolean);

    if (validSegments.length === 0) {
      options?.onEnd?.();
      return;
    }

    if (options?.interrupt !== false) {
      this.stopSpeech();
    }

    const sessionId = ++this.currentSpeechSessionId;
    const pauseMs = options?.pauseMsBetweenSegments ?? 360;
    const targetRate = options?.rateOverride ?? this.speechRate;
    const bestVoice = this.getBestVietnameseVoice();

    let currentIndex = 0;
    let hasTriggeredStart = false;

    const speakNext = () => {
      if (sessionId !== this.currentSpeechSessionId || this.isMuted) {
        options?.onEnd?.();
        return;
      }

      if (currentIndex >= validSegments.length) {
        options?.onEnd?.();
        return;
      }

      const segmentText = validSegments[currentIndex];
      currentIndex++;

      try {
        const utterance = new SpeechSynthesisUtterance(segmentText);
        utterance.lang = 'vi-VN';
        utterance.volume = 1.0; // Âm lượng TO TỐI ĐA (100%)
        utterance.rate = targetRate; // Tốc độ CHẬM RÃI, RÕ RÀNG (0.72)
        utterance.pitch = 1.04; // Độ cao giọng sáng, rõ chữ trên loa lớp học

        if (bestVoice) {
          utterance.voice = bestVoice;
        }

        utterance.onstart = () => {
          if (!hasTriggeredStart && sessionId === this.currentSpeechSessionId) {
            hasTriggeredStart = true;
            options?.onStart?.();
          }
        };

        utterance.onend = () => {
          if (sessionId !== this.currentSpeechSessionId) return;
          if (currentIndex < validSegments.length) {
            this.speechQueueTimer = window.setTimeout(speakNext, pauseMs);
          } else {
            options?.onEnd?.();
          }
        };

        utterance.onerror = () => {
          if (sessionId !== this.currentSpeechSessionId) return;
          if (currentIndex < validSegments.length) {
            this.speechQueueTimer = window.setTimeout(speakNext, 150);
          } else {
            options?.onEnd?.();
          }
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        options?.onEnd?.();
      }
    };

    speakNext();
  }

  /**
   * Đọc to, chậm rãi, rõ ràng một đoạn văn bản tiếng Việt + tiếng Anh
   */
  public speakVietnameseText(
    text: string,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      interrupt?: boolean;
      rateOverride?: number;
    }
  ): void {
    const segments = this.splitIntoClearSpeechSegments(text);
    this.speakSegmentsSequentially(segments, {
      onStart: options?.onStart,
      onEnd: options?.onEnd,
      interrupt: options?.interrupt,
      pauseMsBetweenSegments: 340,
      rateOverride: options?.rateOverride,
    });
  }

  /**
   * Đọc lời mời học sinh khi chú vịt 3D của học sinh đó bơi về đích đầu tiên:
   * "Mời bạn + Họ và tên của học sinh đó" (Đọc TO, CHẬM, RÕ RÀNG)
   */
  public speakInviteStudent(studentName: string): void {
    const cleanName = (studentName || '').trim();
    if (!cleanName) return;
    this.playSpeechAttentionBell();
    this.speakSegmentsSequentially([`Mời bạn ${cleanName}.`], {
      interrupt: true,
      pauseMsBetweenSegments: 300,
      rateOverride: 0.72,
    });
  }

  /**
   * Đọc trọn vẹn Câu hỏi và 4 Đáp án A, B, C, D với âm lượng TO, tốc độ CHẬM RÃI, LƯU LOÁT,
   * tách từng phần (Câu hỏi -> nghỉ -> Đáp án A -> nghỉ -> Đáp án B -> nghỉ -> Đáp án C -> nghỉ -> Đáp án D)
   * để giọng đọc luôn giữ âm lượng lớn nhất và rõ ràng từng từ cả tiếng Việt lẫn tiếng Anh!
   */
  public speakQuestionAndOptions(
    questionNumber: number | undefined,
    questionText: string,
    optionsList: string[],
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
    }
  ): void {
    this.playSpeechAttentionBell();

    const prefix = questionNumber ? `Câu hỏi số ${questionNumber}.` : 'Câu hỏi.';
    const labels = ['A', 'B', 'C', 'D'];
    const optionSegments = (optionsList || [])
      .slice(0, 4)
      .map((opt, idx) => `Đáp án ${labels[idx]}: ${opt}.`);

    const segments = [prefix, `${questionText}.`, ...optionSegments];

    this.speakSegmentsSequentially(segments, {
      interrupt: true,
      pauseMsBetweenSegments: 420,
      onStart: callbacks?.onStart,
      onEnd: callbacks?.onEnd,
    });
  }

  // Tiếng động cơ / xuất phát hào hứng
  public playEngineRev(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.45);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      // Audio not permitted yet
    }
  }

  // Tiếng click vui nhộn
  public playClick(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.1);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  // Tiếng trả lời đúng (Chuông ngân vui tươi C - E - G - C5)
  public playCorrect(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.28, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.36);
      });
    } catch (e) {}
  }

  // Tiếng trả lời sai
  public playWrong(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.3);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  // Hiệu ứng COMBO TĂNG TỐC
  public playNitro(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.6);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.8);

      const bufferSize = ctx.sampleRate * 0.6;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(3000, now + 0.5);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.22, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.6);
    } catch (e) {}
  }

  // Kèn chiến thắng (Victory Fanfare) + Khởi động nhạc nền sôi động
  public playVictory(): void {
    this.startCelebrationMusic();
  }

  // Nhạc nền chiến thắng sôi động (Upbeat Celebration Fanfare & Dance Loop)
  public startCelebrationMusic(): void {
    this.stopCelebrationMusic();
    if (this.isMuted) return;

    const ctx = this.getContext();
    if (!ctx) return;

    this.isBgmPlaying = true;

    const playLoopIteration = () => {
      if (!this.isBgmPlaying || this.isMuted) return;
      const audioCtx = this.getContext();
      if (!audioCtx) return;

      try {
        const now = audioCtx.currentTime + 0.03;
        const step = 0.22; // ~136 BPM upbeat tempo (16 steps = 3.52s per bar loop)

        const leadNotes: { stepIdx: number; freq: number; dur: number }[] = [
          { stepIdx: 0, freq: 523.25, dur: 0.18 },
          { stepIdx: 1, freq: 659.25, dur: 0.18 },
          { stepIdx: 2, freq: 783.99, dur: 0.18 },
          { stepIdx: 3, freq: 1046.5, dur: 0.38 },
          { stepIdx: 5, freq: 783.99, dur: 0.18 },
          { stepIdx: 6, freq: 1046.5, dur: 0.38 },
          { stepIdx: 8, freq: 880.0, dur: 0.2 },
          { stepIdx: 9, freq: 1046.5, dur: 0.2 },
          { stepIdx: 10, freq: 987.77, dur: 0.2 },
          { stepIdx: 11, freq: 783.99, dur: 0.2 },
          { stepIdx: 12, freq: 1174.66, dur: 0.22 },
          { stepIdx: 13, freq: 987.77, dur: 0.2 },
          { stepIdx: 14, freq: 1046.5, dur: 0.42 },
        ];

        const bassNotes: { stepIdx: number; freq: number; dur: number }[] = [
          { stepIdx: 0, freq: 130.81, dur: 0.35 },
          { stepIdx: 2, freq: 196.0, dur: 0.35 },
          { stepIdx: 4, freq: 130.81, dur: 0.35 },
          { stepIdx: 6, freq: 196.0, dur: 0.35 },
          { stepIdx: 8, freq: 174.61, dur: 0.35 },
          { stepIdx: 10, freq: 196.0, dur: 0.35 },
          { stepIdx: 12, freq: 196.0, dur: 0.35 },
          { stepIdx: 14, freq: 130.81, dur: 0.4 },
        ];

        const chordHits: { stepIdx: number; freqs: number[]; dur: number }[] = [
          { stepIdx: 0, freqs: [261.63, 329.63, 392.0], dur: 0.35 },
          { stepIdx: 3, freqs: [261.63, 329.63, 392.0], dur: 0.3 },
          { stepIdx: 6, freqs: [261.63, 329.63, 392.0], dur: 0.35 },
          { stepIdx: 8, freqs: [349.23, 440.0, 523.25], dur: 0.35 },
          { stepIdx: 11, freqs: [392.0, 493.88, 587.33], dur: 0.3 },
          { stepIdx: 14, freqs: [261.63, 329.63, 523.25], dur: 0.4 },
        ];

        leadNotes.forEach((n) => {
          const t = now + n.stepIdx * step;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(n.freq, t);

          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);

          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(t);
          osc.stop(t + n.dur + 0.02);
          this.activeNodes.push(osc);
        });

        bassNotes.forEach((b) => {
          const t = now + b.stepIdx * step;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(b.freq, t);

          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + b.dur);

          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(t);
          osc.stop(t + b.dur + 0.02);
          this.activeNodes.push(osc);
        });

        chordHits.forEach((c) => {
          const t = now + c.stepIdx * step;
          c.freqs.forEach((f) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t);

            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.08, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + c.dur);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + c.dur + 0.02);
            this.activeNodes.push(osc);
          });
        });

        for (let i = 0; i < 16; i += 2) {
          const t = now + i * step;
          const kickOsc = audioCtx.createOscillator();
          const kickGain = audioCtx.createGain();
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(130, t);
          kickOsc.frequency.exponentialRampToValueAtTime(42, t + 0.12);
          kickGain.gain.setValueAtTime(0.2, t);
          kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
          kickOsc.connect(kickGain);
          kickGain.connect(audioCtx.destination);
          kickOsc.start(t);
          kickOsc.stop(t + 0.15);
          this.activeNodes.push(kickOsc);
        }
      } catch (e) {}
    };

    playLoopIteration();
    this.bgmTimer = window.setInterval(playLoopIteration, 3520);
  }

  public stopCelebrationMusic(): void {
    this.isBgmPlaying = false;
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.activeNodes.forEach((node) => {
      try {
        (node as OscillatorNode).stop?.();
        node.disconnect();
      } catch {}
    });
    this.activeNodes = [];
  }
}

export const sound = new SoundSynthesizer();
