/**
 * Bộ nhớ cá nhân hóa + học cải thiện An.
 *
 * Hai lớp, cố ý tách:
 *  1. Memory (theo từng người): tóm tắt check-in / chủ đề gần đây để An nhớ *chính người đó*.
 *  2. Learn (toàn hệ thống): sự kiện đã khử nhận dạng (cảm xúc, chủ đề, ý định, mức rủi ro)
 *     để đội ngũ xem pattern và chỉnh kịch bản/prompt. KHÔNG nhồi nguyên văn hội thoại vào model.
 *
 * Vì sao không fine-tune trực tiếp trên nhật ký thô:
 *  - Model sẽ bắt chước tuyệt vọng, teencode tự hại, và có thể lộ chuyện của người khác.
 *  - PDPL 91/2025: dữ liệu sức khỏe là nhạy cảm; "đồng ý lúc quảng bá" không thay được cơ chế kỹ thuật.
 *  - Cách học đúng: RAG trên tóm tắt của chính user + thống kê mẫu + (sau này) bộ dữ liệu đã người duyệt.
 */

import type { Emotion, Intent, RiskLevel, Topic } from '../types.ts';

export interface CheckinSnapshot {
  at: string;
  mood: number;
  tags: string[];
  note?: string | null;
}

export interface LearnEvent {
  at: string;
  intent: Intent;
  emotion: Emotion;
  intensity: string;
  topics: Topic[];
  riskLevel: RiskLevel;
  strategy: string;
}

const MOOD_WORD = ['rất tệ', 'không ổn', 'tạm', 'khá ổn', 'tốt'] as const;

/** Tóm tắt ngắn, không chứa nguyên văn nhật ký/chat, để nhét vào context của An. */
export function buildContextSummary(input: {
  checkins: CheckinSnapshot[];
  recentEvents?: Array<{ emotion: string; topics: string[] }>;
  sessionThemes?: string[];
}): string {
  const parts: string[] = [];
  const week = input.checkins.filter((c) => Date.now() - Date.parse(c.at) < 7 * 86_400_000);
  if (week.length) {
    const avg = week.reduce((s, c) => s + c.mood, 0) / week.length;
    const moodLabel = MOOD_WORD[Math.max(0, Math.min(4, Math.round(avg) - 1))] ?? 'tạm';
    const tagCount = new Map<string, number>();
    for (const c of week) for (const t of c.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    const topTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
    parts.push(`Check-in ${week.length} ngày gần đây, trung bình nghiêng về "${moodLabel}"${topTags.length ? `, hay gắn: ${topTags.join(', ')}` : ''}.`);
  }
  const themes = input.sessionThemes?.filter(Boolean).slice(0, 3);
  if (themes?.length) parts.push(`Chủ đề phiên gần: ${themes.join(', ')}.`);
  const ev = input.recentEvents ?? [];
  if (ev.length) {
    const emo = mode(ev.map((e) => e.emotion));
    const topic = mode(ev.flatMap((e) => e.topics));
    if (emo || topic) parts.push(`Gần đây hay nói với giọng ${emo ?? 'trung tính'}${topic ? `, quanh ${topic}` : ''}.`);
  }
  if (!parts.length) return '';
  parts.push('Dùng để nhớ và hỏi tiếp cho tự nhiên. Không nhắc lại như đang theo dõi. Không chẩn đoán.');
  return parts.join(' ');
}

/** Một câu nhận xét đời thường trên trang chủ — không phải kết luận y khoa. */
export function describeMoodTrend(checkins: CheckinSnapshot[]): string | null {
  const week = checkins.filter((c) => Date.now() - Date.parse(c.at) < 7 * 86_400_000);
  if (week.length < 2) return null;
  const avg = week.reduce((s, c) => s + c.mood, 0) / week.length;
  const first = week.slice(0, Math.ceil(week.length / 2));
  const last = week.slice(Math.ceil(week.length / 2));
  const a1 = first.reduce((s, c) => s + c.mood, 0) / first.length;
  const a2 = last.reduce((s, c) => s + c.mood, 0) / last.length;
  const delta = a2 - a1;
  const tagCount = new Map<string, number>();
  for (const c of week) for (const t of c.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  const top = [...tagCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const feel = avg <= 2.2 ? 'nặng hơn bình thường' : avg >= 4 ? 'nhẹ hơn' : 'lẫn lộn';
  const move = delta >= 0.6 ? 'Cuối tuần có vẻ đỡ hơn đầu tuần.' : delta <= -0.6 ? 'Cuối tuần có vẻ xuống hơn đầu tuần.' : 'Chưa thấy một hướng rõ ràng — cũng bình thường.';
  return `Tuần này bạn check-in ${week.length} ngày, nhìn chung ${feel}. ${move}${top ? ` "${top}" xuất hiện nhiều nhất.` : ''} Đây là nhận xét từ nhật ký, không phải chẩn đoán.`;
}

export function toLearnEvent(input: {
  intent: Intent;
  emotion: Emotion;
  intensity: string;
  topics: Topic[];
  riskLevel: RiskLevel;
  strategy: string;
  at?: string;
}): LearnEvent {
  return {
    at: input.at ?? new Date().toISOString(),
    intent: input.intent,
    emotion: input.emotion,
    intensity: input.intensity,
    topics: input.topics,
    riskLevel: input.riskLevel,
    strategy: input.strategy,
  };
}

export interface PatternRow {
  key: string;
  count: number;
}

/** Gộp sự kiện ẩn danh thành bảng tần suất để chỉnh kịch bản. */
export function aggregatePatterns(events: LearnEvent[]): {
  emotions: PatternRow[];
  topics: PatternRow[];
  intents: PatternRow[];
  strategies: PatternRow[];
} {
  return {
    emotions: countBy(events.map((e) => e.emotion)),
    topics: countBy(events.flatMap((e) => e.topics)),
    intents: countBy(events.map((e) => e.intent)),
    strategies: countBy(events.map((e) => e.strategy)),
  };
}

function countBy(keys: string[]): PatternRow[] {
  const m = new Map<string, number>();
  for (const k of keys) {
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

function mode(items: string[]): string | undefined {
  if (!items.length) return undefined;
  return countBy(items)[0]?.key;
}

export const AD_POLICY = {
  /** Banner chỉ nằm ngoài khung chat. Không cá nhân hóa theo cảm xúc/nội dung hội thoại. */
  placement: 'page-banner-only' as const,
  neverInChat: true,
  neverTargetByMoodOrTranscript: true,
  label: 'Không gian dành cho đối tác — không liên quan nội dung An đang nói với bạn.',
};

export interface CompanionPlan {
  headline: string;
  steps: string[];
  skillId?: string;
  expertHint: boolean;
}

const SKILL_BY_EMOTION: Partial<Record<Emotion, { id: string; step: string }>> = {
  anxious: { id: 'breathing-478', step: 'Khi lo dâng lên: thử thở 4-7-8 khoảng 2 phút.' },
  overwhelmed: { id: 'grounding-54321', step: 'Khi đầu chạy: grounding 5-4-3-2-1 để về hiện tại.' },
  tired: { id: 'behavioral-activation', step: 'Khi hết pin: chọn một việc rất nhỏ và làm xong nó.' },
  sad: { id: 'thought-record', step: 'Viết ra suy nghĩ đang lặp — nhìn nó từ ngoài sẽ nhẹ hơn ở trong nó.' },
  lonely: { id: 'reach-out', step: 'Nhắn một người bạn tin, dù chỉ một câu “mình đang cần ngồi cạnh”.' },
  empty: { id: 'behavioral-activation', step: 'Một hành động nhỏ có chủ đích, không cần đợi cảm hứng.' },
  angry: { id: 'box-breathing', step: 'Thở hộp vài vòng trước khi trả lời ai đó.' },
  hopeful: { id: 'gratitude-3', step: 'Ghi 3 điều hôm nay đang đỡ hơn một chút.' },
};

/** Gợi ý nhẹ từ cảm xúc/chủ đề — không phải liệu trình. */
export function buildCompanionPlan(input: { emotion?: string; topics?: string[]; intensity?: string }): CompanionPlan {
  const emotion = (input.emotion ?? 'neutral') as Emotion;
  const skill = SKILL_BY_EMOTION[emotion] ?? SKILL_BY_EMOTION.anxious!;
  const topic = input.topics?.[0];
  const heavy = input.intensity === 'high';
  const topicLine =
    topic === 'study'
      ? 'Chuyện học/thi đang chiếm chỗ — chia nhỏ hôm nay ra một việc là đủ.'
      : topic === 'family'
        ? 'Chuyện nhà thường nặng vì vừa thương vừa mệt. Bạn không cần giải quyết hết tối nay.'
        : topic === 'work'
          ? 'Năm đầu đi làm dễ thấy mình “không đủ”. Một việc rõ ràng hôm nay đáng hơn nghĩ cả sự nghiệp.'
          : 'Mình ở đây để nghe. Không cần nói hay, không cần có kết luận.';
  return {
    headline: 'Gợi ý nhỏ cho lúc này',
    steps: [topicLine, skill.step, 'Nếu chuyện kéo dài và ăn-ngủ-học đảo lộn, gặp người thật sẽ chắc hơn AI.'],
    skillId: skill.id,
    expertHint: heavy,
  };
}
