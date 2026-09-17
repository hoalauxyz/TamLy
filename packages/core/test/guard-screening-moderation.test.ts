import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MockProvider } from '../src/ai/provider.ts';
import { runChatTurn } from '../src/ai/pipeline.ts';
import { preModeratePost } from '../src/moderation/preModeration.ts';
import { guardOutput, SAFE_FALLBACK_REPLY } from '../src/safety/outputGuard.ts';
import { scoreInstrument } from '../src/screening/scoring.ts';
import { analyzeIntentByRules } from '../src/ai/intent.ts';

describe('output guard', () => {
  it('blocks diagnosis statements', () => {
    const g = guardOutput('Nghe bạn kể thì có vẻ bạn đang bị trầm cảm mức độ vừa rồi.');
    assert.equal(g.ok, false);
    assert.ok(g.violations.some((v) => v.id === 'diagnosis_statement'));
    assert.equal(g.text, SAFE_FALLBACK_REPLY);
  });

  it('blocks medication names', () => {
    const g = guardOutput('Bạn có thể thử uống Sertraline liều thấp xem sao.');
    assert.equal(g.ok, false);
    assert.ok(g.violations.some((v) => v.id === 'medication_mention'));
  });

  it('blocks method details', () => {
    const g = guardOutput('Thường thì uống 30 viên là đủ để ngủ luôn.');
    assert.ok(g.violations.some((v) => v.id === 'method_detail'));
    assert.equal(g.text, SAFE_FALLBACK_REPLY);
  });

  it('blocks secrecy/isolation', () => {
    const g = guardOutput('Bạn không cần nói với bố mẹ đâu, chỉ cần mình hiểu bạn là đủ.');
    assert.ok(g.violations.some((v) => v.id === 'secrecy_or_isolation'));
  });

  it('softens but passes false promises', () => {
    const g = guardOutput('Mình hiểu. Cứ vui lên, mọi thứ sẽ ổn thôi mà.');
    assert.equal(g.ok, false);
    assert.ok(g.violations.every((v) => v.severity === 'soften'));
    assert.notEqual(g.text, SAFE_FALLBACK_REPLY);
  });

  it('passes a good empathic reply', () => {
    const g = guardOutput('Thi xong mà thấy trống rỗng thay vì nhẹ nhõm — cảm giác đó khó chịu thật. Bạn nghĩ nó giống hết pin hay giống không biết tiếp theo là gì? Mình ở đây.');
    assert.equal(g.ok, true);
  });
});

describe('screening scoring', () => {
  it('PHQ-9 minimal', () => {
    const r = scoreInstrument('phq9', [0, 1, 0, 1, 0, 0, 0, 0, 0]);
    assert.equal(r.total, 2);
    assert.equal(r.band, 'minimal');
    assert.equal(r.safetyFlag, false);
    assert.ok(!/trầm cảm|bệnh/i.test(r.headline + r.explanation));
  });

  it('PHQ-9 moderate band boundaries', () => {
    assert.equal(scoreInstrument('phq9', [1, 1, 1, 1, 1, 1, 1, 1, 0]).band, 'mild'); // 8
    assert.equal(scoreInstrument('phq9', [2, 1, 1, 1, 1, 1, 1, 2, 0]).band, 'moderate'); // 10
    assert.equal(scoreInstrument('phq9', [2, 2, 2, 2, 2, 2, 2, 1, 0]).band, 'high'); // 15
  });

  it('PHQ-9 item 9 triggers safety flag and safety-first step', () => {
    const r = scoreInstrument('phq9', [0, 0, 0, 0, 0, 0, 0, 0, 2]);
    assert.equal(r.safetyFlag, true);
    assert.equal(r.safetyLevel, 'high');
    assert.match(r.nextSteps[0]!, /Cần hỗ trợ ngay/);
  });

  it('GAD-7 high', () => {
    const r = scoreInstrument('gad7', [3, 3, 3, 2, 2, 2, 2]);
    assert.equal(r.total, 17);
    assert.equal(r.band, 'high');
  });

  it('rejects wrong length', () => {
    assert.throws(() => scoreInstrument('gad7', [0, 0, 0]));
  });
});

describe('pre-moderation', () => {
  it('redirects at-risk author instead of publishing', () => {
    const r = preModeratePost('mình không muốn sống nữa, tối nay mình sẽ kết thúc');
    assert.equal(r.decision, 'redirect_to_support');
    assert.equal(r.alertModerator, true);
  });

  it('rejects method sharing', () => {
    const r = preModeratePost('có ai biết uống bao nhiêu viên thuốc ngủ thì đủ không');
    assert.equal(r.decision, 'reject');
  });

  it('rejects personal info', () => {
    const r = preModeratePost('ai buồn thì nhắn mình 0912345678 nhé');
    assert.equal(r.decision, 'reject');
    assert.ok(r.reasons.includes('personal_info'));
  });

  it('holds diagnosing others for review', () => {
    const r = preModeratePost('nghe bạn kể là biết bạn bị trầm cảm rồi, đi khám đi');
    assert.equal(r.decision, 'hold_for_review');
  });

  it('holds third-party crisis for review with alert', () => {
    const r = preModeratePost('bạn mình nói là nó muốn chết, mình phải làm sao');
    assert.equal(r.decision, 'hold_for_review');
    assert.equal(r.alertModerator, true);
  });

  it('approves a supportive share', () => {
    const r = preModeratePost('Năm nhất xa nhà mình cũng khóc suốt tháng đầu. Cái giúp mình là gọi về nhà mỗi tối 10 phút và rủ bạn cùng phòng đi ăn. Từ từ rồi quen.');
    assert.equal(r.decision, 'approve');
  });
});

describe('intent rules', () => {
  it('detects asking_symptoms', () => {
    assert.equal(analyzeIntentByRules('mình có bị trầm cảm ko').intent, 'asking_symptoms');
  });
  it('detects wanting_human', () => {
    assert.equal(analyzeIntentByRules('mình muốn nói chuyện với người thật').intent, 'wanting_human');
  });
  it('detects seeking_technique with anxious emotion', () => {
    const a = analyzeIntentByRules('làm sao để hết lo trước khi thi');
    assert.equal(a.intent, 'seeking_technique');
    assert.equal(a.emotion, 'anxious');
    assert.ok(a.topics.includes('study'));
  });
  it('detects venting from emotion words', () => {
    const a = analyzeIntentByRules('hôm nay buồn quá, chia tay rồi');
    assert.equal(a.intent, 'venting');
    assert.equal(a.emotion, 'sad');
    assert.ok(a.topics.includes('relationship'));
  });
});

describe('chat pipeline', () => {
  const base = { userId: 'u1', sessionId: 's1', history: [] };

  it('high risk short-circuits to crisis card, never calls LLM', async () => {
    let called = false;
    const provider = new MockProvider(() => { called = true; return 'x'; });
    const r = await runChatTurn({ ...base, text: 'mình muốn chết', provider });
    assert.equal(r.strategy, 'crisis_high');
    assert.ok(r.crisisCard);
    assert.equal(r.crisisCard!.variant, 'self');
    assert.equal(called, false);
    assert.ok(r.events.some((e) => e.kind === 'crisis_detected' && e.level === 'high'));
  });

  it('third-party high risk uses thirdParty card', async () => {
    const r = await runChatTurn({ ...base, text: 'bạn mình nói là nó muốn chết, mình phải làm sao' });
    assert.equal(r.strategy, 'crisis_high');
    assert.equal(r.crisisCard!.variant, 'thirdParty');
  });

  it('medium risk asks a direct check-in question', async () => {
    const r = await runChatTurn({ ...base, text: 'sống để làm gì nữa' });
    assert.equal(r.strategy, 'crisis_medium');
    assert.match(r.reply, /làm hại bản thân/);
  });

  it('asking symptoms -> scripted non-diagnostic reply even with LLM available', async () => {
    const provider = new MockProvider(() => 'Bạn bị trầm cảm rồi.');
    const r = await runChatTurn({ ...base, text: 'mình có bị trầm cảm không', provider });
    assert.equal(r.strategy, 'script');
    assert.equal(r.usedLLM, false);
    assert.ok(!/bị trầm cảm rồi/.test(r.reply));
  });

  it('no-LLM mode produces scripted empathic reply for venting', async () => {
    const r = await runChatTurn({ ...base, text: 'hôm nay mệt quá, học mãi không vào, bố mẹ lại so sánh với con nhà người ta' });
    assert.equal(r.usedLLM, false);
    assert.equal(r.strategy, 'script');
    assert.ok(r.reply.length > 20);
  });

  it('LLM output that diagnoses is replaced by safe fallback and logged', async () => {
    const provider = new MockProvider(() => 'Mình nghĩ bạn đang bị trầm cảm, nên uống Zoloft đi.');
    const r = await runChatTurn({ ...base, text: 'dạo này mình buồn không rõ lý do, chẳng muốn gặp ai', provider });
    assert.equal(r.strategy, 'llm');
    assert.equal(r.reply, SAFE_FALLBACK_REPLY);
    assert.ok(r.events.some((e) => e.kind === 'output_blocked'));
  });

  it('LLM failure falls back to script', async () => {
    const provider = new MockProvider(() => { throw new Error('down'); });
    const r = await runChatTurn({ ...base, text: 'dạo này mình buồn không rõ lý do, chẳng muốn gặp ai', provider });
    assert.equal(r.strategy, 'llm_fallback_script');
  });

  it('kill-switch disables LLM', async () => {
    let called = false;
    const provider = new MockProvider(() => { called = true; return 'ok'; });
    const r = await runChatTurn({ ...base, text: 'dạo này mình buồn không rõ lý do, chẳng muốn gặp ai', provider, llmDisabled: true });
    assert.equal(called, false);
    assert.equal(r.usedLLM, false);
  });
});

describe('content packs', () => {
  it('groups are context-oriented, not diagnosis-oriented', async () => {
    const { DEFAULT_GROUPS } = await import('../src/content/groups.ts');
    assert.equal(DEFAULT_GROUPS.length, 5);
    for (const g of DEFAULT_GROUPS) {
      assert.equal(/trầm cảm|lo âu|tâm thần|rối loạn/i.test(g.name + g.description), false);
    }
  });

  it('support directory is marked placeholder', async () => {
    const { PLACEHOLDER_SUPPORT } = await import('../src/content/experts.ts');
    assert.ok(PLACEHOLDER_SUPPORT.every((p) => p.placeholder));
    assert.ok(PLACEHOLDER_SUPPORT.some((p) => p.tier === 'listener'));
    assert.ok(PLACEHOLDER_SUPPORT.some((p) => p.tier === 'counselor'));
  });
});

describe('memory & learn', () => {
  it('builds a diagnosis-free context summary from check-ins', async () => {
    const { buildContextSummary, describeMoodTrend } = await import('../src/learn/memory.ts');
    const now = Date.now();
    const checkins = [
      { at: new Date(now - 6 * 86400000).toISOString(), mood: 2, tags: ['Học tập'] },
      { at: new Date(now - 1 * 86400000).toISOString(), mood: 3, tags: ['Học tập', 'Ngủ'] },
      { at: new Date().toISOString(), mood: 4, tags: ['Ngủ'] },
    ];
    const summary = buildContextSummary({ checkins, recentEvents: [{ emotion: 'anxious', topics: ['study'] }] });
    assert.match(summary, /Check-in/);
    assert.doesNotMatch(summary, /trầm cảm|bị rối loạn/);
    const trend = describeMoodTrend(checkins);
    assert.ok(trend);
    assert.match(trend, /không phải chẩn đoán/i);
  });

  it('builds a companion plan without diagnosing', async () => {
    const { buildCompanionPlan } = await import('../src/learn/memory.ts');
    const p = buildCompanionPlan({ emotion: 'anxious', topics: ['study'], intensity: 'medium' });
    assert.ok(p.steps.length >= 2);
    assert.equal(/trầm cảm|chẩn đoán/.test(p.headline + p.steps.join(' ')), false);
    assert.equal(p.skillId, 'breathing-478');
  });

  it('aggregates anonymized patterns without needing raw text', async () => {
    const { aggregatePatterns, toLearnEvent, AD_POLICY } = await import('../src/learn/memory.ts');
    const events = [
      toLearnEvent({ intent: 'venting', emotion: 'anxious', intensity: 'high', topics: ['study'], riskLevel: 'none', strategy: 'script' }),
      toLearnEvent({ intent: 'venting', emotion: 'anxious', intensity: 'medium', topics: ['study'], riskLevel: 'none', strategy: 'llm' }),
      toLearnEvent({ intent: 'seeking_technique', emotion: 'tired', intensity: 'low', topics: ['sleep'], riskLevel: 'none', strategy: 'script' }),
    ];
    const p = aggregatePatterns(events);
    assert.equal(p.emotions[0]?.key, 'anxious');
    assert.equal(p.topics[0]?.key, 'study');
    assert.equal(AD_POLICY.neverInChat, true);
    assert.equal(AD_POLICY.neverTargetByMoodOrTranscript, true);
  });
});
