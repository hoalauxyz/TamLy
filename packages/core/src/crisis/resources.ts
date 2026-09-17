/**
 * Danh sách tài nguyên khẩn cấp.
 *
 * !!! QUAN TRỌNG !!!
 * Trong sản phẩm thật, danh sách này PHẢI được tải từ server (remote config),
 * có quy trình gọi kiểm tra hằng tháng và trường `verifiedAt` được cập nhật.
 * Hardcode một số điện thoại đã ngừng hoạt động vào màn hình khẩn cấp là lỗi nghiêm trọng.
 *
 * Trạng thái dưới đây là kết quả kiểm tra bằng nguồn công khai ngày 17/09/2026,
 * KHÔNG thay thế việc gọi xác minh trực tiếp.
 */

export type ResourceStatus = 'verified' | 'needs_verification' | 'inactive';

export interface CrisisResource {
  id: string;
  name: string;
  phone?: string;
  /** Dạng để mở tel: (không khoảng trắng). */
  dial?: string;
  hours: string;
  audience: string;
  free: boolean;
  status: ResourceStatus;
  verifiedAt?: string; // ISO date
  note?: string;
  url?: string;
  /** Thứ tự hiển thị (nhỏ = trên). */
  priority: number;
}

export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    id: 'emergency_115',
    name: 'Cấp cứu y tế 115',
    phone: '115',
    dial: '115',
    hours: '24/7',
    audience: 'Mọi người – khi đã làm hại bản thân hoặc nguy hiểm tức thời',
    free: true,
    status: 'verified',
    verifiedAt: '2026-09-17',
    priority: 1,
  },
  {
    id: 'child_111',
    name: 'Tổng đài Quốc gia Bảo vệ Trẻ em 111',
    phone: '111',
    dial: '111',
    hours: '24/7',
    audience: 'Dưới 18 tuổi (và người lớn báo tin về trẻ em)',
    free: true,
    status: 'verified',
    verifiedAt: '2026-09-17',
    note: 'Năm 2025 tiếp nhận 616 cuộc gọi về SKTT/ý định tự tử của trẻ em; có can thiệp trực tiếp.',
    url: 'https://tongdai111.vn',
    priority: 2,
  },
  {
    id: 'police_113',
    name: 'Công an 113',
    phone: '113',
    dial: '113',
    hours: '24/7',
    audience: 'Khi đang bị bạo hành, đe dọa, xâm hại',
    free: true,
    status: 'verified',
    verifiedAt: '2026-09-17',
    priority: 3,
  },
  {
    id: 'ngay_mai',
    name: 'Đường dây nóng Ngày Mai',
    phone: '096 306 1414',
    dial: '0963061414',
    hours: '13:00–20:30, Thứ 4 → Chủ nhật (theo website)',
    audience: 'Người trẻ trầm cảm/khủng hoảng và người thân',
    free: true,
    status: 'needs_verification',
    verifiedAt: '2026-09-17',
    note: 'Website còn hiển thị số và giờ trực, nhưng có thông báo tạm dừng kênh hỗ trợ online từ 01/01/2026. PHẢI gọi xác minh trước khi hiển thị cho người dùng.',
    url: 'https://duongdaynongngaymai.vn',
    priority: 4,
  },
  {
    id: 'nearest_hospital',
    name: 'Bệnh viện gần nhất (khoa Tâm thần / Cấp cứu)',
    hours: '24/7',
    audience: 'Mọi người',
    free: false,
    status: 'verified',
    verifiedAt: '2026-09-17',
    note: 'Các bệnh viện đa khoa tỉnh/thành đều có khoa cấp cứu. Ở Hà Nội: Viện Sức khỏe Tâm thần (BV Bạch Mai), BV Tâm thần Trung ương 1. TP.HCM: BV Tâm thần TP.HCM.',
    priority: 5,
  },
];

export function activeResources(resources: CrisisResource[] = CRISIS_RESOURCES): CrisisResource[] {
  return resources.filter((r) => r.status !== 'inactive').sort((a, b) => a.priority - b.priority);
}

/** Thông điệp cố định cho màn hình khẩn cấp. Ngắn, không giảng đạo, không hứa hẹn. */
export const CRISIS_CARD_COPY = {
  self: {
    title: 'Mình nghe bạn đang rất đau.',
    body:
      'Cảm ơn bạn đã nói ra. Lúc này, điều quan trọng nhất là có một người thật ở bên bạn. ' +
      'Bạn có thể gọi ngay một trong các số dưới đây, hoặc nhắn cho một người bạn tin để họ đến với bạn.',
    primaryAction: 'Gọi hỗ trợ ngay',
    secondaryAction: 'Mình an toàn, muốn nói tiếp',
    footer: 'An là AI và không thể thay người thật trong lúc này. Bạn không phải chịu đựng một mình.',
  },
  thirdParty: {
    title: 'Bạn đang lo cho một người khác.',
    body:
      'Điều bạn đang làm rất quan trọng. Hãy ở bên họ nếu có thể, hỏi thẳng và bình tĩnh ("Bạn có đang nghĩ đến việc làm hại bản thân không?"), ' +
      'đừng để họ một mình, và cùng họ gọi một trong các số dưới đây. Nếu họ đã làm hại bản thân, gọi 115 ngay.',
    primaryAction: 'Xem số hỗ trợ',
    secondaryAction: 'Mình muốn hỏi cách nói chuyện với họ',
    footer: 'Bạn không cần phải là chuyên gia để giúp. Chỉ cần ở đó và kết nối họ với người có thể giúp.',
  },
  abuse: {
    title: 'Không ai được phép làm tổn thương bạn.',
    body:
      'Nếu bạn đang ở trong tình huống nguy hiểm, hãy gọi 113 hoặc 111 (nếu bạn dưới 18). ' +
      'Nếu bạn an toàn ngay lúc này, bạn có thể kể thêm để mình cùng nghĩ cách.',
    primaryAction: 'Gọi 113 / 111',
    secondaryAction: 'Mình an toàn lúc này',
    footer: 'Điều đã xảy ra không phải lỗi của bạn.',
  },
} as const;
