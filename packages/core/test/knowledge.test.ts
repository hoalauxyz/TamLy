import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { runChatTurn } from '../src/ai/pipeline.ts';
import { detectSituation } from '../src/ai/situation.ts';
import { buildThreadState } from '../src/ai/thread.ts';
import {
  mergeKnowledge,
  parseKnowledgePayload,
  resetExtraKnowledge,
  retrieveKnowledge,
} from '../src/knowledge/retrieve.ts';
import { KNOWLEDGE_PACK, KNOWLEDGE_PACK_VERSION } from '../src/knowledge/pack.ts';

const base = { userId: 't', sessionId: 's', history: [] as { role: 'user' | 'assistant'; content: string }[] };

describe('situation + knowledge RAG', () => {
  it('detects exam stress from Vietnamese wording', () => {
    const s = detectSituation('học mãi không vào bài, thi gần quá');
    assert.equal(s.id, 'exam_stress');
    assert.ok(s.confidence > 0);
  });

  it('sticks family pressure from thread topic when the latest line is thin', () => {
    const thread = buildThreadState(
      [
        { role: 'user', content: 'bố mẹ so sánh mình với con nhà người ta' },
        { role: 'assistant', content: 'Lời so sánh đó chạm chỗ nào nhất?' },
      ],
      'chỗ ánh mắt',
    );
    const s = detectSituation('chỗ ánh mắt', thread);
    assert.equal(s.id, 'family_pressure');
  });

  it('retrieves reviewed exam counsel, not diagnosis language', () => {
    const hits = retrieveKnowledge({ text: 'thi gần, tim đập, không vào bài', situation: 'exam_stress', limit: 2 });
    assert.ok(hits.length >= 1);
    assert.ok(hits[0]!.doc.reviewed);
    assert.doesNotMatch(hits[0]!.doc.counsel, /chẩn đoán|trầm cảm|rối loạn|thuốc/);
  });

  it('rejects unreviewed remote documents', () => {
    resetExtraKnowledge();
    const docs = parseKnowledgePayload({
      documents: [
        { id: 'bad', counsel: 'x', ask: 'y', reviewed: false },
        { id: 'ok-remote', counsel: 'Một ý đã duyệt.', ask: 'Bạn muốn kể tiếp?', reviewed: true, source: 'test' },
      ],
    });
    assert.equal(docs.length, 1);
    assert.equal(docs[0]!.id, 'ok-remote');
    const added = mergeKnowledge(docs);
    assert.equal(added, 1);
    resetExtraKnowledge();
  });

  it('does not duplicate bundled ids when merging', () => {
    resetExtraKnowledge();
    const first = KNOWLEDGE_PACK[0]!;
    const added = mergeKnowledge([{ ...first, counsel: 'không được ghi đè' }]);
    assert.equal(added, 0);
    resetExtraKnowledge();
  });

  it('grounds family venting without diagnosing', async () => {
    const r = await runChatTurn({
      ...base,
      text: 'bố mẹ so sánh mình với con nhà người ta, mình mệt',
    });
    assert.equal(r.situation?.id, 'family_pressure');
    assert.ok((r.knowledgeIds ?? []).length >= 1);
    assert.doesNotMatch(r.reply, /trầm cảm|chẩn đoán|rối loạn/);
    assert.match(r.reply, /gia đình|so sánh|nhà|bố mẹ/i);
  });

  it('grounds body shame in the dedicated pack', async () => {
    const r = await runChatTurn({ ...base, text: 'nhìn gương thấy mình béo, tự ti cân nặng' });
    assert.equal(r.situation?.id, 'body_shame');
    assert.ok((r.knowledgeIds ?? []).includes('body-shame'));
  });

  it('exposes a versioned bundled pack', () => {
    assert.match(KNOWLEDGE_PACK_VERSION, /^lang-knowledge-/);
    assert.ok(KNOWLEDGE_PACK.length >= 12);
    assert.ok(KNOWLEDGE_PACK.every((d) => d.reviewed === true && d.counsel.length > 20));
  });
});
