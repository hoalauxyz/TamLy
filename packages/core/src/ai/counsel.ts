import type { IntentAnalysis } from '../types.ts';
import type { KnowledgeDoc } from '../knowledge/pack.ts';
import { echoAnchor, pickFollowUp, topicLabel, type ThreadState } from './thread.ts';
import type { ScriptedReply } from './scripts.ts';
import type { SituationHit } from './situation.ts';

/**
 * Trả lời có căn: nhắc lời người dùng + một ý từ tài liệu đã duyệt + một câu hỏi đúng tình huống.
 * Không chẩn đoán. Không bịa nghiên cứu.
 */
export function counselReply(input: {
  userText: string;
  analysis: IntentAnalysis;
  thread: ThreadState;
  situation: SituationHit;
  docs: KnowledgeDoc[];
  turnIndex: number;
}): ScriptedReply {
  const { userText, analysis, thread, situation, docs, turnIndex } = input;
  const doc = docs[0];
  const anchor = echoAnchor(userText) ?? thread.anchors.at(-1);
  const ask = unusedAsk(doc?.ask, thread) ?? pickFollowUp(thread, analysis.topics[0], turnIndex);

  const bits: string[] = [];
  if (thread.answeringPrevious && anchor) {
    bits.push(`Bạn vừa nói “${clip(anchor)}”.`);
  } else if (anchor && thread.turnCount > 0) {
    bits.push(`Mình giữ “${clip(anchor)}”.`);
  } else if (anchor) {
    bits.push(`“${clip(anchor)}” — mình nghe thấy chỗ đó.`);
  } else {
    bits.push('Mình đang nghe bạn.');
  }

  if (situation.id !== 'general') {
    bits.push(`Chuyện này nghiêng về ${situation.label.toLowerCase()}.`);
  } else if (analysis.topics[0] && analysis.topics[0] !== 'other') {
    bits.push(`Vẫn quanh ${topicLabel(analysis.topics[0])}.`);
  }

  if (doc) bits.push(doc.counsel);
  bits.push(ask);

  const suggestions: ScriptedReply['suggestions'] = [];
  if (doc?.skillId && (analysis.intensity === 'high' || turnIndex >= 5)) {
    suggestions.push({ label: 'Thử kỹ năng ngắn', action: { type: 'open_skill', skillId: doc.skillId } });
  }
  if (situation.id === 'need_human' || turnIndex >= 10) {
    suggestions.push({ label: 'Người hỗ trợ', action: { type: 'open_human_support' } });
  }
  if (suggestions.length) suggestions.push({ label: 'Kể tiếp', action: { type: 'continue_chat' } });

  return { text: bits.join(' '), suggestions: suggestions.length ? suggestions : undefined };
}

function unusedAsk(ask: string | undefined, thread: ThreadState): string | undefined {
  if (!ask) return undefined;
  const n = ask.toLowerCase().slice(0, 24);
  if (thread.askedQuestions.some((q) => q.toLowerCase().includes(n) || n.includes(q.toLowerCase().slice(0, 18)))) return undefined;
  return ask;
}

function clip(s: string): string {
  return s.replace(/[.?!…]+$/g, '').slice(0, 72);
}
