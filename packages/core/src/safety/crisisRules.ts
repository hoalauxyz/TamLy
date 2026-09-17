import type { CrisisCategory } from '../types.ts';

/**
 * Luật phát hiện khủng hoảng, khớp trên văn bản ĐÃ BỎ DẤU (xem normalize.ts).
 *
 * Trọng số (weight) cộng dồn thành điểm; ngưỡng ở crisisDetector.ts.
 *   >= 0.8  -> high   (dừng LLM, hiện màn hình khẩn cấp)
 *   >= 0.4  -> medium (An hỏi xác nhận nhẹ, gắn cờ, hiện tài nguyên)
 *   >= 0.15 -> low    (tiếp tục, gắn cờ theo dõi)
 *
 * QUY TRÌNH BẮT BUỘC: mọi thay đổi ở file này phải được cố vấn lâm sàng duyệt
 * và chạy lại bộ test red-team (test/crisis.test.ts) trước khi deploy.
 *
 * Nguyên tắc viết luật:
 *  - Cụm có chủ ý rõ ("muon chet", "tu tu") -> weight cao.
 *  - Từ đơn đa nghĩa ("chet", "bien mat") -> chỉ tính khi đi kèm ngữ cảnh.
 *  - Thành ngữ đời thường ("chan chet", "met chet di duoc", "chet cuoi") -> loại trừ.
 */

export interface CrisisRule {
  id: string;
  category: CrisisCategory;
  /** Khớp trên văn bản đã bỏ dấu. */
  pattern: RegExp;
  /**
   * Tùy chọn: bản CÓ DẤU. Khi văn bản gốc có dấu tiếng Việt, luật này được dùng thay `pattern`
   * để tránh nhập nhằng do bỏ dấu ("từ từ" ≠ "tự tử").
   */
  viPattern?: RegExp;
  weight: number;
  note?: string;
}

// Các cụm chỉ bản thân, dùng trong nhiều luật.
const SELF = '(?:minh|toi|tui|em|con|t|tao|to|anh|chi)';
const WANT = '(?:muon|mun|uoc|chi muon|chi uoc|them|mong)';
/** WANT + các từ đệm hay gặp: "ước gì", "muốn được", "chỉ muốn sao". */
const WANT_ = `${WANT}(?: gi| sao| duoc| co the| lam sao)?`;
const NOT = '(?:khong|ko|k|chang|cha|hong|hok|dau|deo)';

export const CRISIS_RULES: CrisisRule[] = [
  // ---------- Ý nghĩ tự tử / không muốn sống ----------
  {
    id: 'si_want_die',
    category: 'suicidal_ideation',
    pattern: new RegExp(`\\b${WANT_} (?:duoc )?chet\\b`),
    weight: 0.9,
    note: 'muốn chết / chỉ muốn chết / ước được chết / ước gì chết',
  },
  {
    id: 'si_english',
    category: 'suicidal_ideation',
    pattern:
      /\b(?:want|wanna|wish|going|gonna|about) to (?:die|chet|kill myself|disappear|end it(?: all)?|not exist|be dead|sleep forever)\b|\bkill myself\b|\bkms\b|\bend my life\b|\bsuicidal\b|\bi (?:want|wanna) (?:die|chet)\b|\bno reason to live\b/,
    weight: 0.9,
    note: 'Gen Z hay chen tiếng Anh',
  },
  {
    id: 'si_want_end',
    category: 'suicidal_ideation',
    pattern: new RegExp(`\\b${WANT_} (?:duoc )?ket thuc (?:tat ca|moi thu|het|cuoc song|cuoc doi|doi minh|no|luon|di)\\b`),
    weight: 0.9,
    note: 'muốn kết thúc tất cả',
  },
  {
    id: 'si_tu_tu',
    category: 'suicidal_ideation',
    pattern: /\b(?:tu tu|tu sat|tu ket lieu|ket lieu (?:doi|cuoc doi|ban than))\b/,
    viPattern: /(?:^|[^\p{L}])(?:tự tử|tự sát|tự kết liễu|kết liễu (?:đời|cuộc đời|bản thân))(?![\p{L}])/u,
    weight: 0.9,
    note: '"từ từ" (chậm rãi) bỏ dấu cũng thành "tu tu" -> dùng viPattern khi có dấu',
  },
  {
    id: 'si_sleep_forever',
    category: 'suicidal_ideation',
    pattern: /\bngu (?:luon|mai|mot giac dai|mot giac that dai|mai mai) (?:khong|ko|chang|va khong|va ko) (?:bao gio |can |phai )?(?:day|tinh|tinh lai|thuc day|thuc)(?: nua)?\b|\bngu (?:mot giac )?(?:khong|ko) (?:bao gio )?(?:day|tinh)(?: nua| lai)?\b/,
    weight: 0.85,
    note: '"ngủ luôn không dậy" — ẩn dụ tự tử rõ, không phụ thuộc từ "muốn"',
  },
  {
    id: 'si_not_want_live',
    category: 'suicidal_ideation',
    pattern: new RegExp(`\\b${NOT} (?:con )?${WANT} song(?: nua| them)?\\b`),
    weight: 0.9,
    note: 'không muốn sống (nữa)',
  },
  {
    id: 'si_not_want_live_alt',
    category: 'suicidal_ideation',
    pattern: new RegExp(`\\b(?:chan song|met song|${NOT} the song|song ${NOT} noi|${NOT} song noi)\\b`),
    weight: 0.6,
  },
  {
    id: 'si_die_for_good',
    category: 'suicidal_ideation',
    pattern: /\bchet (?:di )?(?:cho (?:roi|xong|nhe|khoe|thoat)|quach|luon (?:cho|di))\b/,
    weight: 0.85,
    note: 'chết đi cho rồi / chết cho xong / chết quách',
  },
  {
    id: 'si_end_everything',
    category: 'suicidal_ideation',
    pattern: /\bket thuc (?:tat ca|moi thu|het|cuoc song|cuoc doi|doi minh|no)\b/,
    weight: 0.7,
  },
  {
    id: 'si_disappear',
    category: 'suicidal_ideation',
    pattern: new RegExp(
      `\\b${WANT_} (?:duoc )?(?:bien mat|tan bien|bay mau|khong ton tai|khong con ton tai|ngu (?:luon|mai)|ngu (?:mot giac )?(?:khong|ko) (?:bao gio )?(?:day|tinh)|khong bao gio thuc day|khong (?:can|phai) thuc day)\\b`,
    ),
    weight: 0.75,
    note: 'muốn biến mất / ngủ luôn không dậy — ẩn dụ phổ biến của Gen Z',
  },
  {
    id: 'si_disappear_forever',
    category: 'suicidal_ideation',
    pattern: /\bbien mat (?:mai mai|vinh vien|khoi (?:the gioi|cuoc doi|day|tat ca))\b/,
    weight: 0.7,
  },
  {
    id: 'si_why_live',
    category: 'suicidal_ideation',
    pattern: /\bsong (?:de|de lam|lam) gi(?: nua)?\b|\bsong (?:con )?(?:y nghia|nghia ly) gi\b|\bkhong (?:biet|thay) (?:song )?de lam gi\b/,
    weight: 0.5,
    note: 'sống để làm gì — cần xác nhận thêm',
  },
  {
    id: 'si_better_dead',
    category: 'suicidal_ideation',
    pattern: new RegExp(
      `\\b(?:chet|khong ton tai|khong sinh ra) (?:con|thi) (?:tot|de|suong|hon|nhe)\\b|\\bgia (?:ma|nhu) ${SELF} (?:chet|khong sinh ra|chua tung sinh ra)\\b|\\btot hon (?:neu|khi) ${SELF} (?:chet|khong con|bien mat)\\b`,
    ),
    weight: 0.75,
  },
  {
    id: 'si_wish_not_born',
    category: 'suicidal_ideation',
    pattern: /\b(?:uoc|gia ma|gia nhu) (?:minh|toi|em) (?:khong|chua|dung) (?:sinh ra|ton tai|duoc sinh ra)\b/,
    weight: 0.6,
  },

  // ---------- Tự hại ----------
  {
    id: 'sh_cut',
    category: 'self_harm',
    pattern: /\b(?:cat|rach|khia|cao)(?: vao)? (?:tay|co tay|dui|chan|da|nguoi|co)\b|\bself harm\b|\btu hai\b|\btu lam (?:dau|ton thuong|hai) (?:ban than|minh|co the)\b|\blam dau (?:chinh )?(?:ban than|minh)\b/,
    weight: 0.85,
  },
  {
    id: 'sh_hit_burn',
    category: 'self_harm',
    pattern: /\b(?:dap dau|dam (?:vao )?tuong|dot (?:tay|da|nguoi)|tu danh|tu dam|tu dap|tu tat|cao (?:den )?chay mau|bua toc|nhin an de trung phat)\b/,
    weight: 0.6,
  },

  // ---------- Kế hoạch / phương pháp ----------
  {
    id: 'pm_method_pills',
    category: 'plan_or_method',
    pattern: /\buong (?:het |ca |nhieu |mot voc |mot nam |ca vi |ca lo )?thuoc(?: ngu| an than| giam dau)?(?: qua lieu| de chet| cho chet| luon)?\b|\bqua lieu\b|\bbao nhieu vien (?:thi|de|moi) (?:chet|du)\b/,
    weight: 0.8,
  },
  {
    id: 'pm_method_other',
    category: 'plan_or_method',
    pattern: /\b(?:treo co|nhay (?:lau|cau|xuong|song|tu tren)|lao (?:dau )?(?:vao|ra) (?:xe|duong|tau)|cat (?:co|dong mach)|uong thuoc (?:sau|diet co|tru sau)|nhay xuong)\b/,
    weight: 0.85,
  },
  {
    id: 'pm_asking_how',
    category: 'plan_or_method',
    pattern: /\b(?:cach|lam sao|lam the nao|the nao)(?: de| cho)? (?:chet|tu tu|ra di|di) (?:nhe nhang|khong dau|nhanh|em ai|khong ai biet|it dau)\b|\bchet (?:nhu the nao|kieu gi|cach nao) (?:thi )?(?:nhe nhang|khong dau|it dau|nhanh)\b|\bcach (?:tu tu|chet) (?:nao|gi)\b/,
    weight: 1.0,
    note: 'hỏi phương pháp — luôn high',
  },
  {
    id: 'pm_has_plan',
    category: 'plan_or_method',
    // Tân ngữ tự sát là BẮT BUỘC: "có cách nào giữ tập trung không", "có kế hoạch học", "đã mua thuốc cảm" là câu thường.
    pattern:
      /\b(?:da |dang )?(?:co|len|lap|chuan bi|tinh|tinh ki|nghi ra|len xong) (?:ke hoach|cach|phuong an|ngay|ngay gio|thoi diem)(?: de| cho| roi)? (?:chet|tu tu|ra di|ket thuc(?: tat ca| moi thu| het)?|lam viec do|lam chuyen do|bien mat)\b|\bda (?:mua|chuan bi|gom|tich|de san|co) (?:thuoc ngu|thuoc an than|ca vi thuoc|nhieu thuoc|dao|day|luoi lam|xang)\b|\bchon ngay (?:de )?(?:chet|tu tu|ra di|ket thuc)\b/,
    weight: 0.8,
  },
  {
    id: 'pm_tonight_now',
    category: 'plan_or_method',
    pattern: /\b(?:toi nay|dem nay|hom nay|ngay mai|lat nua|bay gio|ngay bay gio|sap|tuan nay|cuoi tuan nay) (?:minh |toi |em |tui )?(?:se|sap|chac|quyet dinh|dinh|tinh|chac chan) (?:chet|tu tu|ra di|di xa|ket thuc|bien mat|lam (?:that|no|dieu do|viec do|chuyen do))\b/,
    weight: 0.85,
    note: 'mốc thời gian gần + động từ ý định — chỉ báo nguy cấp. KHÔNG dùng "di" trần (đi học, đi làm).',
  },
  {
    id: 'pm_attempted_before',
    category: 'plan_or_method',
    pattern: /\b(?:da|tung|lan truoc|hoi truoc|hom truoc|tuan truoc) (?:co )?(?:thu|dinh|tinh|suyt|tung) (?:tu tu|chet|uong thuoc|cat tay|lam (?:that|no|viec do|dieu do|the))\b|\btu tu (?:khong|ko|bat) thanh\b|\bsuyt chet\b/,
    weight: 0.7,
    note: 'tiền sử toan tự sát — yếu tố nguy cơ mạnh',
  },

  // ---------- Từ biệt ----------
  {
    id: 'fw_letter',
    category: 'farewell',
    pattern: /\b(?:thu|la thu|lời nhan|loi nhan|tin nhan|video|bai) (?:tuyet menh|cuoi|cuoi cung|tam biet|de lai)\b|\bviet (?:thu|loi) (?:de lai|tam biet|cuoi)\b|\bde lai (?:loi nhan|thu|tin nhan|video) (?:cuoi|cuoi cung|tam biet)\b/,
    weight: 0.85,
  },
  {
    id: 'fw_goodbye',
    category: 'farewell',
    pattern: /\b(?:tam biet|vinh biet|chao) (?:moi nguoi|tat ca|ca nha|the gioi|cuoc doi)(?: nhe| nha)?\b|\bcam on (?:vi )?(?:tat ca|moi thu)(?: nhe| nha)?\b.*\b(?:khong|ko|chang) (?:gap|noi chuyen|con) (?:lai|nua)\b|\bhen gap (?:lai )?(?:o )?(?:kiep sau|the gioi khac|kiep khac)\b|\bcho (?:minh|toi|em) (?:tam biet|di|ra di|di xa)\b/,
    weight: 0.7,
  },
  {
    id: 'fw_not_see_again',
    category: 'farewell',
    pattern: /\b(?:se |chac |co le )?(?:khong|ko|chang) (?:bao gio |con )?(?:gap|thay|noi chuyen voi|lam phien) (?:lai |nhau |moi nguoi |ai |cac ban |ban )?(?:nua|dau|them)\b/,
    weight: 0.35,
    note: 'chỉ mạnh khi đi cùng lời tạm biệt/cảm ơn',
  },
  {
    id: 'fw_give_away',
    category: 'farewell',
    pattern: /\b(?:cho|tang|de lai|chia) (?:het|tat ca|toan bo) (?:do|do dac|tai san|tien|sach|quan ao)\b/,
    weight: 0.35,
  },

  // ---------- Tuyệt vọng ----------
  {
    id: 'hp_burden',
    category: 'hopelessness',
    pattern: new RegExp(
      `\\b(?:la |thanh |tro thanh )?ganh nang (?:cho|voi|cua) (?:moi nguoi|gia dinh|bo me|ba me|ba ma|cha me|ai|tat ca|nguoi khac|xa hoi)\\b|\\bmoi nguoi (?:se )?(?:tot|nhe|thoai mai|hanh phuc|de tho|kho|do kho|vui) hon (?:neu |khi )?(?:khong|ko|chang) co ${SELF}\\b|\\bkhong co ${SELF} (?:thi )?(?:moi nguoi|ai|ho|nha|gia dinh) (?:cung )?(?:tot|nhe|hanh phuc|de) hon\\b`,
    ),
    weight: 0.6,
    note: 'cảm giác là gánh nặng — yếu tố nguy cơ đã được nghiên cứu',
  },
  {
    id: 'hp_better_without_me',
    category: 'hopelessness',
    pattern: new RegExp(
      `\\b(?:khong|ko|chang) co ${SELF}(?: thi| roi)? (?:moi nguoi|ai|ho|nha|gia dinh|bo me|ba me|tat ca)(?: cung| se| thi| chac| chac se| co le)? (?:tot|nhe|nhe nhang|hanh phuc|de|de tho|thoai mai|do kho|vui|yen) hon\\b|\\b(?:moi nguoi|gia dinh|bo me|ba me|ai) (?:se |cung |chac )?(?:tot|nhe|hanh phuc|thoai mai|de tho|vui|yen) hon (?:neu |khi )?(?:khong|ko|chang) (?:co |con )?${SELF}\\b`,
    ),
    weight: 0.5,
    note: '"không có mình mọi người sẽ nhẹ hơn" — cụm ý nghĩ tự tử thụ động rất phổ biến',
  },
  {
    id: 'hp_no_one_cares',
    category: 'hopelessness',
    pattern: new RegExp(
      `\\b(?:khong|ko|chang|cha) (?:ai|nguoi nao|con ai) (?:can|quan tam|thuong|yeu|nho|de y|muon|hieu) (?:den )?${SELF}(?: nua| ca| dau| het)?\\b|\\b${SELF} (?:khong|ko|chang) (?:con )?(?:quan trong|y nghia|gia tri|dang|xung dang) (?:voi ai|gi|nua)?\\b`,
    ),
    weight: 0.4,
  },
  {
    id: 'hp_no_way_out',
    category: 'hopelessness',
    pattern: /\b(?:khong|ko|chang|het) (?:con )?(?:loi thoat|duong (?:thoat|nao|lui|ra)|cach nao (?:khac|nua)|hy vong|hi vong|tuong lai|ly do (?:de )?(?:song|tiep tuc|co gang)|gi de mat|dong luc song)\b|\bvo vong\b|\bbe tac (?:hoan toan|toan tap|khong loi thoat)\b|\bchiu (?:khong|ko|het|chang) (?:noi|duoc)(?: nua| roi| them)?\b|\bkhong (?:the )?(?:chiu|gong|co gang|tiep tuc|chong do) (?:noi |duoc |them )?(?:nua|them|roi)\b|\bqua (?:suc|gioi han|nguong) chiu dung\b/,
    weight: 0.4,
  },
  {
    id: 'hp_everything_pointless',
    category: 'hopelessness',
    pattern: /\b(?:moi thu|tat ca|cuoc doi|cuoc song|song) (?:deu |that |qua |chi )?(?:vo nghia|vo dung|vo ich|khong (?:co )?y nghia|chang co y nghia|dang ghet|tam toi|ket thuc roi)\b|\bbuong (?:xuoi|bo) (?:het|tat ca|moi thu|cuoc doi|roi)\b|\bbo cuoc (?:voi )?(?:cuoc doi|cuoc song|tat ca|het|roi)\b/,
    weight: 0.35,
  },
  {
    id: 'hp_trapped_pain',
    category: 'hopelessness',
    pattern: /\b(?:dau|kho|met|nang|te) (?:qua|lam|den muc|toi muc|khong chiu noi|khong the ta|khong ta noi|khong dien ta) (?:khong (?:muon|the) )?(?:song|ton tai|tiep tuc|tinh day|thuc day)?/,
    weight: 0.3,
  },

  // ---------- Làm hại người khác ----------
  {
    id: 'ho_kill',
    category: 'harm_others',
    pattern: new RegExp(
      `\\b${WANT} (?:giet|dam|danh chet|lam hai|tra thu|huy diet|xu|thanh toan) (?:no|nguoi do|thang do|con do|bon no|bon do|chung no|ho|ca lop|ca truong|tat ca|moi nguoi|bo|me|ba|ma|cha)\\b|\\bgiet (?:het|sach|ca|tat ca|nguoi)\\b|\\b(?:mang|cam|dem) (?:dao|sung|xang|bom) (?:den|toi|vao|di) (?:truong|lop|cong ty|nha no)\\b`,
    ),
    weight: 0.9,
  },

  // ---------- Bạo hành / xâm hại ----------
  {
    id: 'av_abuse',
    category: 'abuse_or_violence',
    pattern:
      /\bbi (?:(?:bo|me|ba|ma|cha|anh|chu|ong|bac|nguoi yeu|ny|chong|vo|thay|co|ban|bon no|no|ho|nguoi ta|nguoi la|hang xom|ai do|mot nguoi|tui no|bon kia) )?(?:danh(?! gia| thuc| rang| may| dau| so| bong| bai| co| don| nhau| cap)|dam|da|tat|bop co|xam hai|lam dung|cuong (?:buc|hiep|ep)|hiep dam|so mo|quay roi|ep (?:quan he|lam chuyen|cham|coi)|bao hanh|hanh ha|doa (?:giet|danh)|nhot|bo doi|deo doa|de doa|tong tien|bat nat|ep buoc|chui (?:rua|mang|bới|boi) (?:moi ngay|suot|lien tuc|thuong xuyen))\b/,
    weight: 0.55,
    note: 'nguy hiểm từ bên ngoài — hướng đến 111 (trẻ em) / 113 / cơ quan chức năng',
  },
];

/**
 * Loại trừ thành ngữ: nếu cụm khớp nằm TRONG một trong các mẫu này, bỏ qua.
 * Khớp trên văn bản đã bỏ dấu.
 */
export const IDIOM_EXCLUSIONS: RegExp[] = [
  /\b(?:chan|met|buon|dau|soi|so|nong|lanh|doi|ngu|hai|thich|yeu|ghet|cuoi|ngai|xau|dep|hay|ngon|dat|re|cay|ngot|kho|lo|ban|toi|tuc|gian|xau ho|nhuc|quen|sot|dau dau|dau bung|dau chan)\s+chet(?: di duoc| mat| di| luon| thoi| duoc| ca| roi| nguoi)?\b/,
  /\bchet (?:cuoi|mat|tiet|cha|me|toi|roi \w+ oi|dam|dam roi|chac|that|dien|nguoi luon)\b/,
  /\b(?:cuoi|dang yeu|buon cuoi|ngu|dep|hay) (?:chet|muon chet|chet mat|chet di duoc|chet nguoi)\b/,
  /\bmuon chet (?:vi|voi|luon vi|di duoc vi) (?:cuoi|xau ho|quê|que|nhuc|ngai|deadline|bai tap|thi|kiem tra|do an|no|chieu|nong|lanh|doi)\b/,
  /\b(?:pin|may|dien thoai|laptop|xe|game|nhan vat|boss|tuong|acc|nick|server|wifi|mang|app|cay|hoa|ca|cho|meo|nv) (?:sap |bi |da |vua )?(?:chet|bay mau|tu tu)\b/,
  /\bchet (?:doi|khat|ret|nong|met|ngat|lang|dung|may|dien|pin|mang|acc|nick)\b/,
  /\bdeadline (?:dí|di|giet|dí chet|chet)\b/,
  /\b(?:phim|truyen|sach|game|bai hat|nhan vat|dien vien|ca si|idol|nam chinh|nu chinh|manga|anime|fic|drama|tap \d+)\b.*\b(?:tu tu|chet|tu sat)\b/,
  /\b(?:tu tu|chet|tu sat)\b.*\b(?:trong (?:phim|truyen|game|sach|drama|anime|manga|fic)|cua nhan vat|cua idol|o tap)\b/,
  /\bchet (?:danh|tam|tam chet|chuong)\b/,
  /\bbay mau (?:khoi|ra khoi|luon) (?:group|nhom|server|top|bxh|danh sach|list|feed|tl|timeline)\b/,
];

/**
 * Phủ định rõ ràng: giảm điểm mạnh cho các luật cùng câu.
 * (Lưu ý lâm sàng: "không muốn chết nhưng cũng không muốn sống" vẫn là medium —
 * luật si_not_want_live sẽ bắt riêng phần sau, nên phủ định ở đây chỉ áp dụng
 * cho các cụm phủ định ý định một cách tường minh.)
 */
export const NEGATION_PATTERNS: RegExp[] = [
  /\b(?:khong|ko|chua|chang|chua bao gio|khong bao gio|chua tung) (?:co |he |tung |bao gio )?(?:y dinh|nghi den|nghi toi|nghi ve|nghi chuyen|tinh|dinh|muon|co y dinh|co suy nghi|co y nghi) (?:viec |chuyen |se |la |den viec )?(?:tu tu|tu sat|chet|tu hai|lam hai ban than|lam gi ban than|lam dau ban than)\b/,
  /\b(?:khong|ko|chua|chang) (?:phai|co) (?:muon|dinh|tinh) (?:chet|tu tu) (?:dau|gi|dau nhe|dau ma|dau nha)\b/,
  /\byen tam\b.*\b(?:khong|ko) (?:lam gi|tu tu|chet|lam gi ban than)\b/,
  /\b(?:khong|ko) (?:den muc|toi muc|den noi) (?:muon chet|tu tu|tu hai|cat tay)\b/,
];

/**
 * Chỉ báo người thứ ba: người dùng đang nói về bạn bè/người thân.
 * Vẫn cần hỗ trợ, nhưng nội dung phản hồi khác (hướng dẫn giúp người khác).
 */
/**
 * Danh sách quan hệ dùng làm chủ ngữ người thứ ba. CỐ Ý KHÔNG có "em", "anh", "chi", "con", "chau"
 * đứng một mình vì người trẻ VN dùng chúng làm ngôi thứ nhất ("em muốn chết").
 * Cũng không có "co", "di", "chu", "ba", "ma", "ho" đứng một mình vì trùng từ thông dụng.
 */
const RELATIVE =
  '(?:ban minh|ban toi|ban em|ban tui|ban t|nguoi ban|dua ban|thang ban|con ban|ban than|bff|crush|nguoi yeu|ny|bo me|ba me|bo minh|me minh|ba minh|ma minh|bo toi|me toi|bo em|me em|em trai|em gai|anh trai|chi gai|em minh|anh minh|chi minh|em toi|anh toi|chi toi|chau minh|chau toi|ong ba|ba ngoai|ba noi|ong noi|ong ngoai|nguoi than|ban cung phong|ban cung lop|dong nghiep|hoc sinh|hoc tro|con trai|con gai|con toi|con minh|chong minh|vo minh|chong toi|vo toi|nguoi quen|mot nguoi|mot dua|mot ban|no|ban ay|ban do|em ay|anh ay|chi ay|nguoi do|nguoi ay|cau ay|ong ay|ba ay|thang do|con do|dua do|tui no|bon no)';

const CRISIS_PHRASE =
  '(?:muon chet|muon tu tu|tu tu|tu sat|tu hai|cat tay|khong muon song|ko muon song|bien mat|khong con muon song|uong thuoc (?:ngu|qua lieu|tu tu)|nhay lau|treo co|co y dinh tu tu|muon ket thuc|lam hai ban than|lam dau ban than)';

export const THIRD_PARTY_PATTERNS: RegExp[] = [
  // "<quan hệ> ... (tối đa 6 từ) ... <cụm khủng hoảng>"
  new RegExp(`\\b${RELATIVE}\\b(?: [a-z0-9]+){0,6} ${CRISIS_PHRASE}\\b`),
  // "làm sao / giúp ... <quan hệ> ... <cụm khủng hoảng>"
  new RegExp(`\\b(?:lam sao|lam the nao|phai lam gi|nen lam gi|giup|cuu|khuyen|noi gi voi|xu ly|ung xu|noi chuyen voi)\\b(?: [a-z0-9]+){0,5} ${RELATIVE}\\b(?: [a-z0-9]+){0,6} ${CRISIS_PHRASE}\\b`),
];

/**
 * Ngôi thứ nhất tường minh. Nếu khớp, KHÔNG coi là người thứ ba dù có tên quan hệ trong câu
 * ("bạn mình bỏ mình rồi, mình muốn chết" -> bản thân).
 */
export const FIRST_PERSON_IDEATION: RegExp = new RegExp(
  `\\b(?:minh|toi|tui|em|con|t|tao|to) (?:thi |cung |chi |that su |thuc su |cung chi |gio |gio chi |chac )?(?:${WANT}|dinh|se|sap|dang|uoc gi|chi uoc)(?: gi| sao| duoc)? (?:duoc )?(?:chet|tu tu|tu sat|bien mat|ket thuc|ra di|cat tay|tu hai|ngu luon|khong ton tai)\\b|\\b(?:minh|toi|tui|em|con|t|tao) (?:khong|ko|k|chang) (?:con )?(?:muon|mun) song\\b|\\bchet di cho (?:roi|xong)\\b`,
);
