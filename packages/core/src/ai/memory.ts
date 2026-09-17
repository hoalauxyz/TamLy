import type { Emotion, IntentAnalysis, Topic } from '../types.ts';

/**
 * "Trí nhớ" của An theo từng người — KHÔNG phải huấn luyện mô hình.
 *
 * Chỉ lưu tần suất chủ đề + cảm xúc (không lưu nguyên văn).
 * Dùng để: (1) An nhớ ngữ cảnh của CHÍNH người đó, (2) thỉnh thoảng đưa nhận xét
 * tham khảo không chẩn đoán, (3) nếu user đồng ý nghiên cứu thì đóng góp số liệu ẩn danh.
 */

export interface CompanionMemory {
  turns: number;
  topics: Partial<Record<Topic, number>>;
  emotions: Partial<Record<Emotion, number>>;
  updatedAt: string;
}

const TOPIC_VI: Record<Topic, string> = {
  study: 'học tập',
  work: 'công việc',
  family: 'gia đình',
  relationship: 'tình cảm',
  friends: 'bạn bè',
  money: 'tiền bạc',
  body_image: 'cơ thể / ngoại hình',
  sleep: 'giấc ngủ',
  social_media: 'mạng xã hội',
  future: 'định hướng tương lai',
  other: 'chuyện đời thường',
};

const EMOTION_VI: Record<Emotion, string> = {
  sad: 'buồn',
  anxious: 'lo',
  angry: 'bực / tức',
  tired: 'mệt',
  empty: 'trống',
  lonely: 'cô đơn',
  overwhelmed: 'ngợp',
  hopeful: 'nhẹ hơn một chút',
  neutral: 'ổn / trung tính',
};

function topKeys<K extends string>(counts: Partial<Record<K, number>>, n: number): K[] {
  return (Object.entries(counts) as Array<[K, number]>)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

export function emptyMemory(now = new Date()): CompanionMemory {
  return { turns: 0, topics: {}, emotions: {}, updatedAt: now.toISOString() };
}

export function mergeMemory(prev: CompanionMemory | undefined, analysis: IntentAnalysis, now = new Date()): CompanionMemory {
  const mem = prev ? { ...prev, topics: { ...prev.topics }, emotions: { ...prev.emotions } } : emptyMemory(now);
  mem.turns += 1;
  mem.updatedAt = now.toISOString();
  if (analysis.emotion !== 'neutral') {
    mem.emotions[analysis.emotion] = (mem.emotions[analysis.emotion] ?? 0) + 1;
  }
  for (const t of analysis.topics) {
    if (t === 'other') continue;
    mem.topics[t] = (mem.topics[t] ?? 0) + 1;
  }
  return mem;
}

/** Tóm tắt máy (đưa vào LLM), không chứa nguyên văn tin nhắn. */
export function memoryToContextSummary(mem: CompanionMemory): string | undefined {
  if (mem.turns < 3) return undefined;
  const topics = topKeys(mem.topics, 3).map((t) => TOPIC_VI[t]);
  const emotions = topKeys(mem.emotions, 2).map((e) => EMOTION_VI[e]);
  const parts = [`Đã trò chuyện khoảng ${mem.turns} lượt.`];
  if (topics.length) parts.push(`Chủ đề hay gặp: ${topics.join(', ')}.`);
  if (emotions.length) parts.push(`Cảm xúc lặp lại: ${emotions.join(', ')}.`);
  parts.push('Không chẩn đoán. Không nhắc lại như kết luận y khoa. Có thể nhẹ nhàng nối vào chủ đề nếu người dùng đang nói về cùng chuyện.');
  return parts.join(' ');
}

/**
 * Nhận xét tham khảo cho người dùng. Không dùng từ bệnh / rối loạn / trầm cảm / chẩn đoán.
 * Chỉ hiện sau đủ lượt để tránh "đánh giá" vội.
 */
export function insightForUser(mem: CompanionMemory): string | undefined {
  if (mem.turns < 5) return undefined;
  const topics = topKeys(mem.topics, 2).map((t) => TOPIC_VI[t]);
  const emotions = topKeys(mem.emotions, 2).map((e) => EMOTION_VI[e]);
  if (!topics.length && !emotions.length) return undefined;

  const topicBit = topics.length ? `những gì bạn hay kể xoay quanh ${topics.join(' và ')}` : 'những gì bạn đã kể';
  const emotionBit = emotions.length ? ` cảm giác lặp lại là ${emotions.join(', ')}.` : '.';
  return (
    `Mình không chẩn đoán và không thay chuyên gia. Chỉ từ ${topicBit},${emotionBit} ` +
    `Nếu chuyện này kéo dài và làm học, ngủ hoặc gặp người khác trở nên khó hơn, một người thật sẽ giúp rõ hơn AI.`
  );
}

export function shouldOfferInsight(mem: CompanionMemory): boolean {
  return mem.turns >= 5 && mem.turns % 5 === 0 && !!insightForUser(mem);
}
