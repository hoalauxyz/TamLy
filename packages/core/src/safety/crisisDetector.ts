import { normalizeVietnamese, stripDiacritics } from '../text/normalize.ts';
import type {
  CrisisAssessment,
  CrisisCategory,
  CrisisClassifier,
  CrisisRuleMatch,
  RiskLevel,
} from '../types.ts';
import { RISK_ORDER, maxRisk } from '../types.ts';
import {
  CRISIS_RULES,
  FIRST_PERSON_IDEATION,
  IDIOM_EXCLUSIONS,
  NEGATION_PATTERNS,
  THIRD_PARTY_PATTERNS,
} from './crisisRules.ts';

export const CRISIS_THRESHOLDS = {
  high: 0.8,
  medium: 0.4,
  low: 0.15,
} as const;

export function scoreToLevel(score: number): RiskLevel {
  if (score >= CRISIS_THRESHOLDS.high) return 'high';
  if (score >= CRISIS_THRESHOLDS.medium) return 'medium';
  if (score >= CRISIS_THRESHOLDS.low) return 'low';
  return 'none';
}

function isInsideExclusion(ascii: string, matchIndex: number, matchLength: number): boolean {
  for (const ex of IDIOM_EXCLUSIONS) {
    const re = new RegExp(ex.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(ascii)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      if (matchIndex >= start && matchIndex + matchLength <= end) return true;
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  return false;
}

/**
 * Lớp 1: luật. Đồng bộ, <5ms, luôn chạy trước mọi thứ.
 */
const HAS_DIACRITICS = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i;

export function detectCrisisByRules(text: string): CrisisAssessment {
  const { ascii, vi } = normalizeVietnamese(text);
  const hasDiacritics = HAS_DIACRITICS.test(text);
  const matches: CrisisRuleMatch[] = [];

  for (const rule of CRISIS_RULES) {
    // Luật có bản có dấu và văn bản có dấu -> dùng bản có dấu (tránh "từ từ" == "tu tu").
    if (rule.viPattern && hasDiacritics) {
      const mv = rule.viPattern.exec(vi);
      if (mv) {
        // Vẫn áp dụng loại trừ thành ngữ/ngữ cảnh phim truyện (tính trên bản ascii).
        const asciiMatch = stripDiacritics(mv[0]).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const idx = ascii.indexOf(asciiMatch);
        if (idx < 0 || !isInsideExclusion(ascii, idx, asciiMatch.length)) {
          matches.push({ ruleId: rule.id, category: rule.category, weight: rule.weight, matchedText: mv[0].trim() });
        }
      }
      continue;
    }
    const re = new RegExp(rule.pattern.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(ascii)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex++;
        continue;
      }
      if (!isInsideExclusion(ascii, m.index, m[0].length)) {
        matches.push({
          ruleId: rule.id,
          category: rule.category,
          weight: rule.weight,
          matchedText: m[0],
        });
      }
    }
  }

  // Mỗi luật chỉ tính một lần (tránh lặp từ làm tăng điểm giả).
  const uniqueByRule = new Map<string, CrisisRuleMatch>();
  for (const m of matches) if (!uniqueByRule.has(m.ruleId)) uniqueByRule.set(m.ruleId, m);
  const unique = [...uniqueByRule.values()];

  let score = unique.reduce((s, m) => s + m.weight, 0);

  const categories = [...new Set(unique.map((m) => m.category))];

  // Đồng xuất hiện ý nghĩ + kế hoạch/phương pháp => nguy cấp.
  if (
    (categories.includes('suicidal_ideation') || categories.includes('hopelessness')) &&
    categories.includes('plan_or_method')
  ) {
    score += 0.3;
  }
  // Từ biệt + bất kỳ dấu hiệu khác => nguy cấp.
  if (categories.includes('farewell') && categories.length > 1) score += 0.2;

  // Phủ định tường minh: giảm mạnh, nhưng không về 0 (vẫn để low để theo dõi).
  const negated = NEGATION_PATTERNS.some((p) => p.test(ascii));
  if (negated) score = Math.min(score, 0.2);

  // Người thứ ba: chỉ khi có tên quan hệ + cụm khủng hoảng, VÀ không có ý nghĩ ngôi thứ nhất tường minh.
  // Khi nghi ngờ, ưu tiên coi là bản thân (thẻ "self" vẫn chứa hotline nên an toàn hơn).
  const thirdParty = THIRD_PARTY_PATTERNS.some((p) => p.test(ascii)) && !FIRST_PERSON_IDEATION.test(ascii);
  if (thirdParty && !categories.includes('third_party')) categories.push('third_party');

  // Chỉ mối nguy từ bên ngoài (bạo hành) không tự động lên high nếu đứng một mình.
  if (categories.length === 1 && categories[0] === 'abuse_or_violence') {
    score = Math.min(score, CRISIS_THRESHOLDS.high - 0.01);
  }

  score = Math.min(score, 1.5);

  return {
    level: scoreToLevel(score),
    score: Number(score.toFixed(3)),
    categories,
    matches: unique,
    thirdParty,
    source: 'rules',
  };
}

export interface AssessOptions {
  classifier?: CrisisClassifier;
  recentHistory?: string[];
  /** Bỏ qua classifier khi luật đã kết luận high (tiết kiệm thời gian). Mặc định true. */
  skipClassifierOnHigh?: boolean;
}

/**
 * Lớp 1 + Lớp 2. Quy tắc gộp:
 *  - Luật ra 'high' => luôn 'high' (an toàn hơn thông minh).
 *  - Classifier chỉ được NÂNG mức, không được hạ mức của luật,
 *    trừ khi luật chỉ ở 'low' và classifier tự tin (>=0.85) là 'none'.
 */
export async function assessCrisis(text: string, opts: AssessOptions = {}): Promise<CrisisAssessment> {
  const rules = detectCrisisByRules(text);
  const skipOnHigh = opts.skipClassifierOnHigh ?? true;

  if (!opts.classifier || (skipOnHigh && rules.level === 'high')) return rules;

  let classifier;
  try {
    classifier = await opts.classifier.classify(text, opts.recentHistory);
  } catch {
    // Lỗi classifier không được làm giảm an toàn: giữ kết quả luật.
    return rules;
  }

  let level = maxRisk(rules.level, classifier.level);
  if (rules.level === 'low' && classifier.level === 'none' && classifier.confidence >= 0.85) {
    level = 'none';
  }

  return {
    ...rules,
    level,
    source: RISK_ORDER[classifier.level] > RISK_ORDER[rules.level] ? 'classifier' : 'combined',
    classifier,
  };
}

/** Tiện ích cho log: rút gọn danh mục về chuỗi. */
export function summarizeCategories(categories: CrisisCategory[]): string {
  return categories.length ? categories.join(',') : 'none';
}
