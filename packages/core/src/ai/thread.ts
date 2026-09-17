/**
 * Mạch hội thoại: An phải bám chuyện đang nói, nhớ câu đã hỏi,
 * phản ánh lời người dùng vừa nói — không nhảy chủ đề, không hỏi lại.
 */

import type { ChatMessage, Emotion, IntentAnalysis, Topic } from '../types.ts';
import { analyzeIntentByRules } from './intent.ts';

export interface ThreadState {
  turnCount: number;
  stickyTopic?: Topic;
  stickyEmotion?: Emotion;
  lastUserText: string;
  lastAnText: string;
  lastAnQuestion?: string;
  askedQuestions: string[];
  anchors: string[];
  answeringPrevious: boolean;
}

const TOPIC_LABEL: Partial<Record<Topic, string>> = {
  study: 'chuyện học',
  work: 'chuyện việc',
  family: 'chuyện nhà',
  relationship: 'chuyện tình cảm',
  friends: 'chuyện bạn bè',
  money: 'chuyện tiền',
  sleep: 'chuyện ngủ',
  future: 'chuyện phía trước',
  body_image: 'cách mình nhìn bản thân',
  social_media: 'mạng xã hội',
};

const FOLLOWUPS: Record<string, readonly string[]> = {
  study: [
    'Bạn đang kẹt ở môn nào, hay ở cảm giác mình đang tụt lại?',
    'Áp lực này đến từ điểm số, hay từ kỳ vọng quanh bạn?',
    'Nếu tối nay chỉ làm được một việc liên quan bài, bạn sẽ chọn việc nào?',
  ],
  family: [
    'Lúc nói chuyện nhà, phần nào làm bạn mệt nhất — lời họ nói, hay im lặng?',
    'Bạn muốn họ hiểu điều gì mà chưa nói được?',
    'Về nhà với bạn đang giống chỗ trú, hay chỗ phải gồng?',
  ],
  work: [
    'Cái nặng hơn lúc này là khối việc, hay cảm giác mình không đủ?',
    'Có việc nào hôm nay thật sự phải xong, còn lại có thể để mai?',
    'Bạn đang sợ bị nhìn thấy là chưa giỏi, hay sợ mình thật sự chưa theo kịp?',
  ],
  relationship: [
    'Bạn đang nhớ, đang giận, hay đang không biết mình muốn gì với người đó?',
    'Điều vừa xảy ra làm bạn tổn thương nhất là gì?',
    'Bạn muốn được nghe, hay muốn nghĩ bước tiếp?',
  ],
  friends: [
    'Bạn thiếu một người cụ thể, hay thiếu cảm giác thuộc về?',
    'Có ai bạn còn muốn nhắn, dù chỉ một câu không cần hay?',
  ],
  money: [
    'Cái lo tiền này đang là tháng này, hay là cả hướng đi phía trước?',
    'Phần nào đang đè nhất — học phí, nhà, hay cảm giác không được phép yếu?',
  ],
  sleep: [
    'Bạn khó vào giấc, hay tỉnh giữa đêm rồi không ngủ lại được?',
    'Đầu bạn chạy chuyện gì khi tắt đèn?',
  ],
  future: [
    'Bạn đang không biết chọn gì, hay biết rồi mà sợ chọn sai?',
    'Nếu bỏ chữ “phải nên”, bạn muốn một năm tới trông thế nào?',
  ],
  other: [
    'Phần nào trong chuyện này bạn muốn mình nghe kỹ hơn?',
    'Cảm giác này mới đến, hay đã nằm đó một thời gian rồi?',
  ],
};

export function topicLabel(topic?: Topic): string {
  if (!topic || topic === 'other') return 'chuyện này';
  return TOPIC_LABEL[topic] ?? 'chuyện này';
}

export function extractQuestion(text: string): string | undefined {
  const parts = text
    .split(/(?<=[?？])\s+|(?<=[.!…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const q = [...parts].reverse().find((s) => /[?？]/.test(s) || /^(Nếu|Bạn|Điều|Phần|Cái|Khi)\b/.test(s));
  return q?.replace(/^[“"]|[”"]$/g, '').slice(0, 180);
}

/** Lấy một cụm lời người dùng để An nhắc lại — không phải tóm tắt máy móc. */
export function echoAnchor(text: string): string | undefined {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length < 8) return cleaned || undefined;
  const clauses = cleaned
    .split(/[,.;!?…]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8 && s.length <= 90);
  const preferred = clauses.find((s) => !/^(mình|tôi|em|tui|nay|hôm nay|giờ)\s+(đang|thấy|cảm thấy)?\s*$/i.test(s));
  const pick = preferred ?? clauses[0] ?? cleaned.slice(0, 80);
  return pick.replace(/^[àừờừừ\s]+/i, '').trim() || undefined;
}

export function buildThreadState(history: ChatMessage[], currentText: string): ThreadState {
  const userTurns = history.filter((m) => m.role === 'user');
  const anTurns = history.filter((m) => m.role === 'assistant');
  const lastUserText = userTurns.at(-1)?.content ?? '';
  const lastAnText = anTurns.at(-1)?.content ?? '';
  const askedQuestions = anTurns.map((m) => extractQuestion(m.content)).filter((q): q is string => !!q);
  const lastAnQuestion = askedQuestions.at(-1);

  const topicVotes = new Map<Topic, number>();
  const emotionVotes = new Map<Emotion, number>();
  const anchors: string[] = [];
  for (const m of userTurns.slice(-8)) {
    const a = analyzeIntentByRules(m.content);
    for (const t of a.topics) {
      if (t === 'other') continue;
      topicVotes.set(t, (topicVotes.get(t) ?? 0) + 1);
    }
    if (a.emotion !== 'neutral') emotionVotes.set(a.emotion, (emotionVotes.get(a.emotion) ?? 0) + 1);
    const echo = echoAnchor(m.content);
    if (echo) anchors.push(echo);
  }
  const current = analyzeIntentByRules(currentText);
  for (const t of current.topics) {
    if (t !== 'other') topicVotes.set(t, (topicVotes.get(t) ?? 0) + 2);
  }
  if (current.emotion !== 'neutral') emotionVotes.set(current.emotion, (emotionVotes.get(current.emotion) ?? 0) + 2);
  const curEcho = echoAnchor(currentText);
  if (curEcho) anchors.push(curEcho);

  const stickyTopic = [...topicVotes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const stickyEmotion = [...emotionVotes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const answeringPrevious = !!lastAnQuestion && current.intent !== 'greeting' && current.intent !== 'asking_about_app';

  return {
    turnCount: userTurns.length,
    stickyTopic,
    stickyEmotion,
    lastUserText,
    lastAnText,
    lastAnQuestion,
    askedQuestions,
    anchors: unique(anchors).slice(-6),
    answeringPrevious,
  };
}

/** Giữ chủ đề/cảm xúc đang bám nếu tin này không rõ. Không biến giữa cuộc thành lời chào. */
export function stickAnalysis(base: IntentAnalysis, thread: ThreadState): IntentAnalysis {
  let intent = base.intent;
  if (thread.turnCount > 0 && intent === 'greeting') intent = 'venting';
  if (thread.turnCount > 0 && intent === 'mood_checkin' && (thread.stickyTopic || thread.answeringPrevious)) intent = 'venting';
  if (intent === 'unclear' && thread.turnCount > 0) intent = 'venting';

  const emotion = base.emotion !== 'neutral' ? base.emotion : (thread.stickyEmotion ?? base.emotion);
  const topics =
    base.topics.length && base.topics[0] !== 'other'
      ? base.topics
      : thread.stickyTopic
        ? [thread.stickyTopic]
        : base.topics;
  return { ...base, intent, emotion, topics };
}

export function pickFollowUp(thread: ThreadState, topic?: Topic, seed = 0): string {
  const key = topic && FOLLOWUPS[topic] ? topic : 'other';
  const pool = FOLLOWUPS[key] ?? FOLLOWUPS.other!;
  const unused = pool.filter((q) => !alreadyAsked(q, thread.askedQuestions));
  const list = unused.length ? unused : pool;
  return list[Math.abs(seed) % list.length]!;
}

export function continuityNote(thread: ThreadState, analysis: IntentAnalysis): string {
  const bits: string[] = [];
  if (thread.stickyTopic) bits.push(`Chủ đề đang bám: ${topicLabel(thread.stickyTopic)} (${thread.stickyTopic}).`);
  if (thread.stickyEmotion) bits.push(`Cảm xúc xuyên suốt: ${thread.stickyEmotion}.`);
  if (thread.anchors.length) bits.push(`Người dùng đã nói: ${thread.anchors.slice(-3).map((a) => `“${a}”`).join('; ')}.`);
  if (thread.lastAnQuestion) bits.push(`Câu An vừa hỏi: “${thread.lastAnQuestion}”. Tin này là câu trả lời — phản ánh câu trả lời trước, đừng hỏi câu mới chưa kịp nghe.`);
  if (thread.askedQuestions.length) bits.push(`Đừng hỏi lại: ${thread.askedQuestions.slice(-4).map((q) => `“${q}”`).join('; ')}.`);
  bits.push(`Cảm xúc lượt này: ${analysis.emotion}. Chủ đề lượt này: ${analysis.topics.join(', ')}.`);
  bits.push('Phải nhắc một chi tiết cụ thể họ vừa nói. Một câu hỏi mở là đủ. Không chào lại. Không đổi chuyên mục.');
  return bits.join(' ');
}

function alreadyAsked(q: string, asked: string[]): boolean {
  const n = norm(q);
  return asked.some((a) => {
    const b = norm(a);
    return b.includes(n.slice(0, 24)) || n.includes(b.slice(0, 24));
  });
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[?？.!\s]+/g, ' ').trim();
}

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const i of items) {
    const k = norm(i);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(i);
  }
  return out;
}
