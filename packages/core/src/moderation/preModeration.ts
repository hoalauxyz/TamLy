import { detectCrisisByRules } from '../safety/crisisDetector.ts';
import { normalizeVietnamese } from '../text/normalize.ts';
import type { CrisisAssessment } from '../types.ts';

/**
 * Tiền kiểm duyệt bài đăng trong nhóm (chạy TRƯỚC khi bài hiển thị).
 *
 * Quyết định:
 *  - approve                : hiển thị ngay.
 *  - hold_for_review        : giữ lại cho điều phối viên; tác giả thấy "đang chờ duyệt".
 *  - redirect_to_support    : KHÔNG đăng; hiển thị hỗ trợ cho chính tác giả (nội dung tự hại).
 *  - reject                 : không đăng; giải thích lý do ngắn (xúc phạm, spam, thông tin cá nhân).
 *
 * Triết lý: nhóm là nơi chia sẻ trải nghiệm & cách vượt qua, KHÔNG phải nơi mô tả chi tiết
 * nỗi đau cấp tính hay phương pháp. Người đang ở điểm đó cần con người, không cần một feed.
 */

export type ModerationDecision = 'approve' | 'hold_for_review' | 'redirect_to_support' | 'reject';

export interface ModerationResult {
  decision: ModerationDecision;
  reasons: string[];
  crisis: CrisisAssessment;
  /** Thông điệp hiển thị cho tác giả. */
  authorMessage: string;
  /** Có cần cảnh báo điều phối viên ngay không (crisis high). */
  alertModerator: boolean;
}

const PROFANITY = /\b(?:dm|dmm|dcm|djt|dit|đm|clm|cl|vcl|vkl|cc|ccc|oc cho|óc chó|ngu nhu|do ngu|con cho|thang cho|con dien|do dien|bo lao|me may|ma may|cha may|chet me may|cut|biến đi|bien di|cút)\b/;
const TARGETED_HARM = /\b(?:may|cau|ban|tui may|bon may|thang nay|con nay|nguoi nay|ai do) (?:nen|cu|hay|di ma|thi) (?:chet|tu tu|bien mat|cut|di chet|chet di)\b|\bchet di (?:cho|di) (?:may|cau|ban|bon may)\b/;
const PII = /\b0\d{9}\b|\b\d{9,12}\b|@[a-z0-9_.]{3,}|\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b|\bfb\.com\/|\bfacebook\.com\/|\bzalo\.me\/|\bt\.me\/|\binstagram\.com\//;
const SPAM = /\b(?:mua ngay|giam gia|khuyen mai|inbox|ib minh|lien he|link (?:bio|duoi)|kiem tien|viec nhe luong cao|tuyen ctv|casino|ca do|vay tien nhanh|app vay)\b|https?:\/\/\S+/;
const METHOD_SHARING = /\b(?:uong|dung|can|mua) (?:bao nhieu|may) (?:vien|lieu|thuoc)\b|\b(?:cach|huong dan|chi cach) (?:tu tu|cat|tu hai|ket thuc|lam dau)\b|\bthuoc (?:gi|nao) (?:de|thi|moi) (?:ngu luon|chet|di nhanh)\b|\b(?:it dau|khong dau|nhe nhang) (?:nhat|hon)\b/;
const PRO_SELFHARM_NORMALIZE = /\b(?:cat|tu hai|self harm|sh) (?:la|cung|cung la|chi la) (?:cach|mot cach|binh thuong|de|hay|tot)\b|\bcat (?:xong|roi) (?:thay|se) (?:nhe|do|thoai mai|de chiu|thoat)\b|\bai (?:cung|ma chang) (?:cat|tu hai|sh)\b/;
const DIAGNOSING_OTHERS = /\b(?:ban|cau|may|nguoi nay) (?:chac|chac chan|ro rang|100%|dung la|bi|dang bi|mac) (?:tram cam|lo au|roi loan|luong cuc|adhd|tam than|benh) (?:roi|rui|day|nhe|luon)\b|\bnghe (?:la|thi) biet (?:bi|mac) (?:tram cam|roi loan|luong cuc)\b/;
const MED_ADVICE = /\b(?:uong|dung|thu|mua|xin) (?:thu )?(?:sertraline|zoloft|fluoxetine|prozac|escitalopram|xanax|alprazolam|seduxen|diazepam|stilnox|zolpidem|seroquel|quetiapine|olanzapine|amitriptyline|thuoc ngu|thuoc an than|thuoc chong tram cam|thuoc tram cam)\b|\bminh (?:dang )?uong \w+ (?:mg|vien)\b/;

export function preModeratePost(text: string): ModerationResult {
  const { ascii } = normalizeVietnamese(text);
  const crisis = detectCrisisByRules(text);
  const reasons: string[] = [];

  // 1. Tác giả đang ở nguy cơ: không đăng, hỗ trợ tác giả.
  if (crisis.level === 'high' && !crisis.thirdParty) {
    return {
      decision: 'redirect_to_support',
      reasons: ['author_at_risk'],
      crisis,
      alertModerator: true,
      authorMessage:
        'Mình đọc được là bạn đang rất đau. Bài này chưa được đăng, không phải vì bạn sai, mà vì lúc này bạn cần một người thật hơn là một nhóm. ' +
        'Mình đã mở các số hỗ trợ bên dưới, và một điều phối viên sẽ được báo. Bạn không phải một mình.',
    };
  }

  // 2. Nội dung chia sẻ phương pháp / bình thường hóa tự hại: từ chối.
  if (METHOD_SHARING.test(ascii) || PRO_SELFHARM_NORMALIZE.test(ascii)) {
    reasons.push('method_or_normalizing_selfharm');
    return {
      decision: 'reject',
      reasons,
      crisis,
      alertModerator: crisis.level !== 'none',
      authorMessage:
        'Bài này không đăng được vì có nội dung về cách thức hoặc mô tả tự làm đau bản thân theo hướng dễ gây ảnh hưởng đến người khác trong nhóm. ' +
        'Nếu bạn đang cần nói về điều này, người lắng nghe trong app sẵn sàng nghe bạn riêng.',
    };
  }

  // 3. Xúc phạm / công kích cá nhân: từ chối.
  if (TARGETED_HARM.test(ascii)) {
    reasons.push('targeted_harm');
    return { decision: 'reject', reasons, crisis, alertModerator: true, authorMessage: 'Bài này không đăng được vì có lời lẽ mong điều xấu cho người khác. Nhóm là nơi an toàn cho tất cả.' };
  }
  if (PROFANITY.test(ascii)) {
    reasons.push('profanity');
    return { decision: 'reject', reasons, crisis, alertModerator: false, authorMessage: 'Bài có từ ngữ xúc phạm nên chưa đăng được. Bạn sửa lại một chút nhé — điều bạn muốn nói vẫn quan trọng.' };
  }

  // 4. Thông tin cá nhân / liên hệ ngoài app / spam: từ chối (bảo vệ ẩn danh).
  if (PII.test(text.toLowerCase())) {
    reasons.push('personal_info');
    return { decision: 'reject', reasons, crisis, alertModerator: false, authorMessage: 'Để giữ ẩn danh cho mọi người, nhóm không cho đăng số điện thoại, email, link mạng xã hội. Bạn bỏ phần đó ra là đăng được.' };
  }
  if (SPAM.test(ascii)) {
    reasons.push('spam_or_link');
    return { decision: 'reject', reasons, crisis, alertModerator: false, authorMessage: 'Bài có link hoặc nội dung quảng cáo nên chưa đăng được.' };
  }

  // 5. Cần con người xem: crisis medium, chẩn đoán người khác, khuyên thuốc, người thứ ba nguy cấp.
  if (crisis.level === 'medium' || (crisis.level === 'high' && crisis.thirdParty)) reasons.push('crisis_medium_or_third_party');
  if (DIAGNOSING_OTHERS.test(ascii)) reasons.push('diagnosing_others');
  if (MED_ADVICE.test(ascii)) reasons.push('medication_advice');
  if (text.length > 1500) reasons.push('very_long');

  if (reasons.length) {
    return {
      decision: 'hold_for_review',
      reasons,
      crisis,
      alertModerator: reasons.includes('crisis_medium_or_third_party'),
      authorMessage: 'Bài của bạn đang chờ điều phối viên xem qua (thường dưới 2 giờ trong giờ mở cửa). Cảm ơn bạn đã chia sẻ.',
    };
  }

  // 6. Crisis low: cho đăng nhưng ghi cờ theo dõi.
  return {
    decision: 'approve',
    reasons: crisis.level === 'low' ? ['crisis_low_flag'] : [],
    crisis,
    alertModerator: false,
    authorMessage: 'Đã đăng.',
  };
}

/** Quy tắc nhóm hiển thị cố định trong UI. */
export const GROUP_RULES: readonly string[] = [
  'Chia sẻ trải nghiệm và điều đã giúp bạn — không mô tả chi tiết cách tự làm đau bản thân.',
  'Không chẩn đoán người khác, không khuyên dùng/ngừng thuốc.',
  'Không đăng thông tin liên hệ cá nhân. Mọi người ở đây đều ẩn danh.',
  'Lắng nghe trước khi khuyên. "Mình cũng từng vậy" thường giúp hơn "Bạn nên...".',
  'Nếu bạn đang không an toàn với chính mình, hãy dùng nút "Cần hỗ trợ ngay" thay vì đăng bài — nhóm không thể ở bên bạn kịp lúc.',
];
