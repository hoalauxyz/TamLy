import { normalizeVietnamese } from '../text/normalize.ts';
import type { ThreadState } from './thread.ts';
import { SITUATION_LABEL, type SituationId } from '../knowledge/pack.ts';

export interface SituationHit {
  id: SituationId;
  label: string;
  confidence: number;
}

const RULES: Array<{ id: SituationId; re: RegExp; w: number }> = [
  { id: 'exam_stress', re: /\b(?:thi|on thi|kiem tra|deadline|hoc mai|khong vao bai|diem|gpa|no mon|tot nghiep)\b/, w: 1 },
  { id: 'family_pressure', re: /\b(?:bo me|ba me|so sanh|con nha nguoi ta|ky vong|ve nha|gia dinh|bo|me)\b/, w: 1 },
  { id: 'work_burnout', re: /\b(?:sep|ot|tang ca|kpi|thu viec|cong ty|burnout|lam hoai|het pin)\b/, w: 0.95 },
  { id: 'heartbreak', re: /\b(?:chia tay|nguoi yeu|ny|phan boi|crush|nguoi cu|to tinh)\b/, w: 1 },
  { id: 'loneliness', re: /\b(?:co don|mot minh|khong ai hieu|chang ai|khong co ban)\b/, w: 0.95 },
  { id: 'homesickness', re: /\b(?:xa nha|nam nhat|ky tuc|ve que|nho nha)\b/, w: 0.9 },
  { id: 'rumination', re: /\b(?:nghi mai|khong tat|quay vong|gia nhu|tai sao minh|trong dau chay)\b/, w: 0.9 },
  { id: 'sleep_debt', re: /\b(?:mat ngu|kho ngu|thuc dem|thuc khuya|khong ngu)\b/, w: 1 },
  { id: 'social_compare', re: /\b(?:tiktok|instagram|mxh|so sanh|luot|body|xau)\b/, w: 0.9 },
  { id: 'future_fog', re: /\b(?:tuong lai|khong biet lam gi|chon nganh|ra truong|lac loi|huong di)\b/, w: 0.9 },
  { id: 'money_stress', re: /\b(?:tien|hoc phi|no|thue nha|lam them|khong du tien)\b/, w: 1 },
  { id: 'body_shame', re: /\b(?:beo|gay|xau|mun|can nang|khong dep|tu ti)\b/, w: 0.85 },
  { id: 'need_human', re: /\b(?:chuyen gia|nguoi that|tham van|bac si|keo dai|hai tuan)\b/, w: 0.8 },
];

export function detectSituation(text: string, thread?: ThreadState): SituationHit {
  const { ascii } = normalizeVietnamese([text, thread?.lastUserText ?? '', thread?.anchors.join(' ') ?? ''].join(' '));
  let best: { id: SituationId; w: number } = { id: 'general', w: 0 };
  for (const r of RULES) {
    if (r.re.test(ascii) && r.w > best.w) best = { id: r.id, w: r.w };
  }
  if (best.id === 'general' && thread?.stickyTopic === 'study') best = { id: 'exam_stress', w: 0.55 };
  if (best.id === 'general' && thread?.stickyTopic === 'family') best = { id: 'family_pressure', w: 0.55 };
  return { id: best.id, label: SITUATION_LABEL[best.id], confidence: best.w };
}
