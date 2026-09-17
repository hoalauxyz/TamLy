/**
 * Danh sách người hỗ trợ.
 * MVP: dữ liệu minh họa để dựng UI + luồng đặt chỗ. KHÔNG phải chuyên gia thật.
 * Trước khi ra mắt: xác minh giấy phép / bằng cấp từng người, hợp đồng, và bỏ cờ `placeholder`.
 */
export type SupportTier = 'listener' | 'counselor';
export type SupportFormat = 'chat' | 'video';

export interface SupportPerson {
  id: string;
  displayName: string;
  tier: SupportTier;
  focus: string;
  intro: string;
  priceVnd: number;
  studentPriceVnd: number;
  format: SupportFormat;
  sessionMinutes: number;
  placeholder: boolean;
}

export const PLACEHOLDER_SUPPORT: SupportPerson[] = [
  {
    id: 'listener-01',
    displayName: 'Người lắng nghe A',
    tier: 'listener',
    focus: 'Áp lực học tập, năm nhất xa nhà',
    intro: 'Sinh viên tâm lý năm cuối (mô hình minh họa). 30 phút lắng nghe, không chẩn đoán, không trị liệu.',
    priceVnd: 80_000,
    studentPriceVnd: 0,
    format: 'chat',
    sessionMinutes: 30,
    placeholder: true,
  },
  {
    id: 'listener-02',
    displayName: 'Người lắng nghe B',
    tier: 'listener',
    focus: 'Đi làm năm đầu, mất phương hướng',
    intro: 'Người lắng nghe được đào tạo 40 giờ (mô hình minh họa). Tập trung phản ánh cảm xúc, không tư vấn nghề nghiệp chuyên sâu.',
    priceVnd: 80_000,
    studentPriceVnd: 50_000,
    format: 'chat',
    sessionMinutes: 30,
    placeholder: true,
  },
  {
    id: 'counselor-01',
    displayName: 'Chuyên gia tham vấn C',
    tier: 'counselor',
    focus: 'Lo âu, stress, giao tiếp gia đình',
    intro: 'Tham vấn tâm lý (không phải khám chữa bệnh). Hồ sơ minh họa — chưa xác minh giấy phép.',
    priceVnd: 350_000,
    studentPriceVnd: 220_000,
    format: 'video',
    sessionMinutes: 45,
    placeholder: true,
  },
  {
    id: 'counselor-02',
    displayName: 'Chuyên gia tham vấn D',
    tier: 'counselor',
    focus: 'Sinh viên, sau tốt nghiệp',
    intro: 'Buổi online 45 phút. Minh họa mức giá phù hợp người trẻ; chưa mở đặt lịch thật.',
    priceVnd: 400_000,
    studentPriceVnd: 250_000,
    format: 'video',
    sessionMinutes: 45,
    placeholder: true,
  },
];

export function formatVnd(n: number): string {
  if (n === 0) return 'Miễn phí (gói trường)';
  return `${n.toLocaleString('vi-VN')}đ`;
}
