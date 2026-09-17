/**
 * Kiểu dữ liệu dùng chung cho toàn hệ thống.
 * Nguyên tắc: mọi kết quả tự động đều là "gợi ý/tham khảo", không phải chẩn đoán.
 */

/** Mức rủi ro khủng hoảng. Thứ tự tăng dần. */
export type RiskLevel = 'none' | 'low' | 'medium' | 'high';

export const RISK_ORDER: Record<RiskLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

export function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RISK_ORDER[a] >= RISK_ORDER[b] ? a : b;
}

/** Nhóm dấu hiệu khủng hoảng. */
export type CrisisCategory =
  | 'suicidal_ideation' // ý nghĩ tự tử / không muốn sống
  | 'self_harm' // tự làm đau bản thân
  | 'plan_or_method' // có kế hoạch, hỏi/nêu phương pháp
  | 'hopelessness' // tuyệt vọng, gánh nặng, không lối thoát
  | 'farewell' // lời từ biệt, thư tuyệt mệnh
  | 'harm_others' // ý định làm hại người khác
  | 'abuse_or_violence' // đang bị bạo hành / xâm hại
  | 'third_party'; // nói về người khác đang gặp nguy hiểm

export interface CrisisRuleMatch {
  ruleId: string;
  category: CrisisCategory;
  weight: number;
  matchedText: string;
}

export interface CrisisAssessment {
  level: RiskLevel;
  /** Điểm tổng hợp 0..1+ (đã cắt ở 1.5 để log). */
  score: number;
  categories: CrisisCategory[];
  matches: CrisisRuleMatch[];
  /** Nội dung nói về người thứ ba (bạn bè, người thân) thay vì bản thân. */
  thirdParty: boolean;
  /** Nguồn đưa ra kết luận cuối. */
  source: 'rules' | 'classifier' | 'combined';
  classifier?: CrisisClassifierResult;
}

export interface CrisisClassifierResult {
  level: RiskLevel;
  confidence: number; // 0..1
  rationale?: string;
}

/** Bộ phân loại ngữ nghĩa (LLM nhỏ / model riêng). Lớp 2 sau luật. */
export interface CrisisClassifier {
  classify(text: string, recentHistory?: string[]): Promise<CrisisClassifierResult>;
}

export type Intent =
  | 'greeting'
  | 'venting' // giãi bày cảm xúc
  | 'seeking_technique' // muốn kỹ thuật/cách làm
  | 'mood_checkin'
  | 'asking_symptoms' // "mình có bị trầm cảm không?"
  | 'wanting_human' // muốn nói với người thật
  | 'asking_about_app'
  | 'crisis'
  | 'unclear';

export type Emotion =
  | 'sad'
  | 'anxious'
  | 'angry'
  | 'tired'
  | 'empty'
  | 'lonely'
  | 'overwhelmed'
  | 'hopeful'
  | 'neutral';

export type EmotionIntensity = 'low' | 'medium' | 'high';

export interface IntentAnalysis {
  intent: Intent;
  emotion: Emotion;
  intensity: EmotionIntensity;
  /** Chủ đề nhận diện được (học tập, gia đình, ...). */
  topics: Topic[];
  source: 'rules' | 'llm';
}

export type Topic =
  | 'study'
  | 'work'
  | 'family'
  | 'relationship'
  | 'friends'
  | 'money'
  | 'body_image'
  | 'sleep'
  | 'social_media'
  | 'future'
  | 'other';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  /** ISO time */
  at?: string;
}

/** Sự kiện an toàn được ghi lại (không chứa nguyên văn trừ khi được cấu hình). */
export interface SafetyEvent {
  at: string;
  userId: string;
  sessionId?: string;
  kind: 'crisis_detected' | 'output_blocked' | 'post_held' | 'post_rejected' | 'screening_item9';
  level: RiskLevel;
  categories?: CrisisCategory[];
  ruleIds?: string[];
  /** Chỉ có khi cấu hình cho phép lưu nội dung để review có kiểm soát. */
  redactedText?: string;
  meta?: Record<string, unknown>;
}
