import { normalizeVietnamese } from '../text/normalize.ts';

/**
 * Kiểm tra ĐẦU RA của LLM trước khi gửi cho người dùng.
 * Mục tiêu: chặn chẩn đoán, thuốc, chi tiết phương pháp tự hại, mạo danh chuyên gia.
 *
 * 'block'  -> thay toàn bộ câu trả lời bằng fallback an toàn.
 * 'soften' -> cho qua nhưng ghi log (để cải thiện prompt).
 */

export type GuardSeverity = 'block' | 'soften';

export interface GuardViolation {
  id: string;
  severity: GuardSeverity;
  matchedText: string;
}

export interface GuardResult {
  ok: boolean;
  violations: GuardViolation[];
  /** Văn bản an toàn để gửi (bằng gốc nếu ok). */
  text: string;
}

interface GuardRule {
  id: string;
  severity: GuardSeverity;
  pattern: RegExp; // khớp trên ascii bỏ dấu
}

// Tên thuốc tâm thần phổ biến ở VN (generic + thương mại). Bot không được nhắc tới.
const MEDS =
  '(?:sertraline|zoloft|fluoxetine|prozac|escitalopram|lexapro|paroxetine|citalopram|venlafaxine|duloxetine|amitriptyline|mirtazapine|bupropion|trazodone|alprazolam|xanax|diazepam|seduxen|valium|lorazepam|clonazepam|rivotril|bromazepam|lexomil|zolpidem|stilnox|olanzapine|quetiapine|seroquel|risperidone|aripiprazole|haloperidol|lithium|valproate|depakine|lamotrigine|carbamazepine|pregabalin|gabapentin|melatonin|rotunda|rotundin|stresam|sulpiride|dogmatil|magne b6)';

const GUARD_RULES: GuardRule[] = [
  {
    id: 'diagnosis_statement',
    severity: 'block',
    pattern:
      /\bban (?:dang |da |co the dang |chac chan |ro rang |co ve )?(?:bi|mac|co) (?:benh )?(?:tram cam|roi loan|lo au lan toa|luong cuc|tam than phan liet|adhd|ocd|ptsd|roi loan an uong|roi loan nhan cach|roi loan hoang so|hoang so|tam than)\b|\bchan doan (?:cua minh|cua toi|la|cho ban|ban)\b|\bminh (?:chan doan|ket luan) (?:ban|rang ban)\b|\btheo (?:chan doan|danh gia lam sang) (?:cua )?minh\b/,
  },
  {
    id: 'medication_mention',
    severity: 'block',
    pattern: new RegExp(`\\b${MEDS}\\b|\\b(?:uong|dung|thu|mua|xin|ke) (?:them |mot it |it |vai vien )?thuoc (?:ngu|an than|chong tram cam|tram cam|lo au|giai lo|an dinh)\\b|\\bke (?:don|toa|thuoc)\\b|\\blieu (?:dung|luong)\\b`),
  },
  {
    id: 'method_detail',
    severity: 'block',
    pattern:
      /\b(?:\d+|vai|nhieu|mot voc|mot nam|ca vi|ca lo) vien\b.*\b(?:chet|du|qua lieu|ngu luon|tu tu)\b|\b(?:cach|huong dan|buoc) (?:de )?(?:tu tu|ket thuc|cat tay|treo co|nhay lau|tu hai)\b|\b(?:treo co|nhay lau|cat co|cat dong mach|uong thuoc sau|thuoc diet co) (?:thi|se|la|nhanh|it dau|khong dau|nhe nhang)\b|\bit dau (?:nhat|hon)\b|\bkhong dau (?:nhat|hon)\b/,
  },
  {
    id: 'impersonation',
    severity: 'block',
    pattern:
      /\b(?:minh|toi|an) (?:la|voi tu cach la|voi kinh nghiem la) (?:mot )?(?:bac si|bac sy|nha tam ly|nha tri lieu|chuyen gia|tham van vien|bac si tam than|tam ly gia|nha tam ly hoc|chuyen vien)\b|\bvoi (?:kinh nghiem|chuyen mon) (?:lam sang|y khoa|tri lieu) cua minh\b/,
  },
  {
    id: 'encourage_harm',
    severity: 'block',
    pattern:
      /\b(?:cu|hay|nen|thu) (?:lam|thuc hien|tu tu|cat|tu hai|lam dau)(?: di| xem| thu)?\b.*\b(?:neu (?:ban )?(?:muon|thay can)|cho nhe|de giai toa)\b|\b(?:tu hai|cat tay|lam dau ban than) (?:la |cung )?(?:mot )?cach (?:hay|tot|hieu qua|binh thuong|de giai toa|de doi pho|on)\b|\bquyet dinh (?:cua ban|do) (?:la )?(?:dung|hop ly|de hieu|ok|on)\b.*\b(?:chet|tu tu|ra di|ket thuc)\b|\b(?:chet|tu tu|ra di) (?:la|se la|co the la) (?:mot )?(?:giai phap|cach|lua chon|loi thoat|su giai thoat)\b/,
  },
  {
    id: 'secrecy_or_isolation',
    severity: 'block',
    pattern:
      /\b(?:dung|khong can|khong nen|khoi) (?:noi|ke|chia se|bao) (?:voi|cho) (?:ai|bo me|ba me|gia dinh|ban be|nguoi khac|bac si|chuyen gia|thay co|ai khac)\b|\bchi (?:can |co )?(?:minh|an) (?:la du|thoi|hieu ban|o day|can ban)\b|\b(?:khong ai|chang ai) (?:khac )?(?:hieu|can|thuong) ban (?:nhu|bang|ngoai) (?:minh|an)\b/,
  },
  {
    id: 'false_promise',
    severity: 'soften',
    pattern:
      /\b(?:minh|an) (?:hua|dam bao|cam ket|chac chan|khang dinh) (?:rang |la |voi ban )?(?:moi (?:thu|chuyen|viec)|tat ca|ban) (?:se|roi se|chac chan se) (?:on|tot|qua|khoi|het|vui)\b|\bmoi (?:thu|chuyen) (?:roi )?se (?:on|tot|qua) (?:thoi|ma|ca thoi)\b|\bcu vui len\b|\bdung buon nua\b|\bnghi tich cuc (?:len|di|thoi)\b|\bco nguoi con kho hon ban\b/,
  },
  {
    id: 'medical_advice_other',
    severity: 'soften',
    pattern: /\b(?:ban nen|hay|can) (?:ngung|dung|bo|giam|tang) (?:thuoc|lieu|dieu tri)\b|\bkhong can (?:gap|di|kham) (?:bac si|chuyen gia|benh vien)\b/,
  },
  {
    id: 'too_long',
    severity: 'soften',
    pattern: /^(?:[^.!?\n]*[.!?\n]\s*){9,}/, // > 8 câu
  },
];

/** Câu trả lời dự phòng khi output bị chặn. Ngắn, đồng cảm, mở đường sang con người. */
export const SAFE_FALLBACK_REPLY =
  'Mình xin lỗi, mình vừa định nói một điều không thật sự phù hợp với vai trò của mình. ' +
  'Điều mình có thể làm là lắng nghe bạn. Bạn muốn kể thêm về điều đang làm bạn nặng lòng nhất lúc này không? ' +
  'Và nếu bạn muốn nói với một người thật, mình có thể chỉ cho bạn cách.';

export function guardOutput(reply: string): GuardResult {
  const { ascii } = normalizeVietnamese(reply);
  const violations: GuardViolation[] = [];

  for (const rule of GUARD_RULES) {
    const m = rule.pattern.exec(rule.id === 'too_long' ? reply : ascii);
    if (m) violations.push({ id: rule.id, severity: rule.severity, matchedText: m[0].slice(0, 80) });
  }

  const blocked = violations.some((v) => v.severity === 'block');
  return {
    ok: violations.length === 0,
    violations,
    text: blocked ? SAFE_FALLBACK_REPLY : reply,
  };
}
