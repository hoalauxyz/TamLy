import { CRISIS_CARD_COPY } from '../crisis/resources.ts';
import { assessCrisis } from '../safety/crisisDetector.ts';
import { guardOutput } from '../safety/outputGuard.ts';
import type { GuardViolation } from '../safety/outputGuard.ts';
import type { ChatMessage, CrisisAssessment, CrisisClassifier, IntentAnalysis, SafetyEvent } from '../types.ts';
import { analyzeIntentByRules, parseIntentJson } from './intent.ts';
import type { LLMProvider } from './provider.ts';
import {
  scriptedAboutApp,
  scriptedAskingSymptoms,
  scriptedGreeting,
  scriptedHighRiskReply,
  scriptedMediumRiskCheck,
  scriptedMoodCheckin,
  scriptedTechnique,
  scriptedUnclear,
  scriptedVenting,
  scriptedWantingHuman,
} from './scripts.ts';
import type { ScriptedReply, SuggestedAction } from './scripts.ts';
import { AN_SYSTEM_PROMPT, INTENT_PROMPT, PROMPT_VERSION } from './systemPrompt.ts';

/**
 * Pipeline 7 bước cho một lượt chat.
 *
 *  [1] Chuẩn hóa      -> normalize (trong detector/intent)
 *  [2] Crisis luật    -> high: dừng, trả crisis card
 *  [3] Crisis LLM     -> medium: hỏi xác nhận
 *  [4] Intent/Emotion -> luật (+ LLM nếu có)
 *  [5] Sinh trả lời   -> KỊCH BẢN mặc định; LLM chỉ cho venting/unclear khi có provider
 *  [6] Output guard   -> chặn chẩn đoán/thuốc/phương pháp
 *  [7] Trả về + log
 *
 * Toàn bộ pipeline chạy được khi provider = undefined (chế độ no-LLM).
 */

export interface ChatTurnInput {
  userId: string;
  sessionId: string;
  text: string;
  /** Lịch sử phiên hiện tại (tối đa ~15 tin gần nhất được dùng). */
  history: ChatMessage[];
  /** Tóm tắt ngữ cảnh dài hạn (check-in + chủ đề), không chứa nguyên văn nhạy cảm. */
  contextSummary?: string;
  provider?: LLMProvider;
  classifier?: CrisisClassifier;
  /** Tắt LLM toàn hệ thống (kill-switch). */
  llmDisabled?: boolean;
  /** Người dùng đã bấm "Mình an toàn, muốn nói tiếp" sau crisis card -> không lặp lại card ngay. */
  acknowledgedCrisis?: boolean;
  /** Bản thử nghiệm: ưu tiên LLM cho giãi bày khi có provider (vẫn qua crisis + output guard). */
  preferLlmForVenting?: boolean;
  now?: Date;
}

export interface CrisisCard {
  variant: 'self' | 'thirdParty' | 'abuse';
  title: string;
  body: string;
  primaryAction: string;
  secondaryAction: string;
  footer: string;
}

export interface ChatTurnResult {
  reply: string;
  suggestions?: ScriptedReply['suggestions'];
  crisisCard?: CrisisCard;
  /** LLM có được gọi để sinh câu trả lời không. */
  usedLLM: boolean;
  strategy: 'crisis_high' | 'crisis_medium' | 'script' | 'llm' | 'llm_fallback_script';
  risk: CrisisAssessment;
  analysis: IntentAnalysis;
  guardViolations: GuardViolation[];
  promptVersion: string;
  events: SafetyEvent[];
  latencyMs: number;
}

const MAX_HISTORY = 24;

export async function runChatTurn(input: ChatTurnInput): Promise<ChatTurnResult> {
  const started = Date.now();
  const now = (input.now ?? new Date()).toISOString();
  const events: SafetyEvent[] = [];
  const recentUserTexts = input.history.filter((m) => m.role === 'user').slice(-4).map((m) => m.content);
  const turnIndex = input.history.filter((m) => m.role === 'user').length;

  // [1]+[2]+[3]
  const risk = await assessCrisis(input.text, { classifier: input.classifier, recentHistory: recentUserTexts });

  if (risk.level !== 'none') {
    events.push({
      at: now,
      userId: input.userId,
      sessionId: input.sessionId,
      kind: 'crisis_detected',
      level: risk.level,
      categories: risk.categories,
      ruleIds: risk.matches.map((m) => m.ruleId),
      meta: { source: risk.source, score: risk.score, thirdParty: risk.thirdParty },
    });
  }

  const baseAnalysis = analyzeIntentByRules(input.text);

  if (risk.level === 'high') {
    const variant: CrisisCard['variant'] = risk.thirdParty
      ? 'thirdParty'
      : risk.categories.length === 1 && risk.categories[0] === 'abuse_or_violence'
        ? 'abuse'
        : 'self';
    const copy = CRISIS_CARD_COPY[variant];
    const scripted = scriptedHighRiskReply(risk.thirdParty);
    return finish({
      reply: scripted.text,
      suggestions: scripted.suggestions,
      crisisCard: { variant, ...copy },
      usedLLM: false,
      strategy: 'crisis_high',
      risk,
      analysis: { ...baseAnalysis, intent: 'crisis' },
      guardViolations: [],
    });
  }

  if (risk.level === 'medium' && !input.acknowledgedCrisis) {
    const abuseOnly = risk.categories.length === 1 && risk.categories[0] === 'abuse_or_violence';
    const scripted = abuseOnly
      ? { text: CRISIS_CARD_COPY.abuse.body, suggestions: [{ label: 'Gọi 113 / 111', action: { type: 'open_crisis' } as SuggestedAction }] }
      : scriptedMediumRiskCheck();
    return finish({
      reply: scripted.text,
      suggestions: scripted.suggestions,
      crisisCard: abuseOnly ? { variant: 'abuse', ...CRISIS_CARD_COPY.abuse } : undefined,
      usedLLM: false,
      strategy: 'crisis_medium',
      risk,
      analysis: baseAnalysis,
      guardViolations: [],
    });
  }

  // [4] Intent/Emotion: luật trước; LLM chỉ để tinh chỉnh khi câu dài/không rõ.
  let analysis = baseAnalysis;
  const llmAvailable = !!input.provider && !input.llmDisabled;
  if (llmAvailable && (analysis.intent === 'unclear' || analysis.intent === 'venting')) {
    try {
      const raw = await input.provider!.complete(
        [
          { role: 'system', content: INTENT_PROMPT },
          { role: 'user', content: input.text },
        ],
        { json: true, temperature: 0, maxTokens: 120, timeoutMs: 6_000 },
      );
      const parsed = parseIntentJson(raw);
      // LLM không được đổi intent an toàn (wanting_human/asking_symptoms) thành thứ khác.
      if (parsed && parsed.intent !== 'crisis') analysis = { ...parsed, topics: parsed.topics.length ? parsed.topics : analysis.topics };
    } catch {
      /* giữ kết quả luật */
    }
  }

  // [5] Chọn chiến lược: kịch bản là mặc định.
  let scripted: ScriptedReply | null = null;
  switch (analysis.intent) {
    case 'greeting':
      scripted = scriptedGreeting(turnIndex);
      break;
    case 'asking_symptoms':
      scripted = scriptedAskingSymptoms();
      break;
    case 'wanting_human':
      scripted = scriptedWantingHuman();
      break;
    case 'asking_about_app':
      scripted = scriptedAboutApp(input.text);
      break;
    case 'mood_checkin':
      scripted = scriptedMoodCheckin(analysis);
      break;
    case 'seeking_technique':
      scripted = scriptedTechnique(analysis);
      break;
    default:
      scripted = null; // venting / unclear -> ưu tiên LLM nếu có
  }

  if (scripted && !(input.preferLlmForVenting && llmAvailable && (analysis.intent === 'venting' || analysis.intent === 'unclear' || analysis.intent === 'mood_checkin'))) {
    const text = withMemory(scripted.text, input.contextSummary, analysis.intent);
    return finish({
      reply: text,
      suggestions: scripted.suggestions,
      usedLLM: false,
      strategy: 'script',
      risk,
      analysis,
      guardViolations: [],
    });
  }

  if (!llmAvailable) {
    const s = analysis.intent === 'unclear' ? scriptedUnclear() : scriptedVenting(analysis, turnIndex);
    return finish({
      reply: withMemory(s.text, input.contextSummary, analysis.intent),
      suggestions: s.suggestions,
      usedLLM: false,
      strategy: 'script',
      risk,
      analysis,
      guardViolations: [],
    });
  }

  // LLM cho phần đồng cảm.
  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: AN_SYSTEM_PROMPT },
      ...(input.contextSummary
        ? [{ role: 'system' as const, content: `Ngữ cảnh (do hệ thống tóm tắt, không nhắc lại nguyên văn với người dùng): ${input.contextSummary}` }]
        : []),
      {
        role: 'system',
        content: `Phân tích tự động (tham khảo): cảm xúc=${analysis.emotion}, cường độ=${analysis.intensity}, chủ đề=${analysis.topics.join(',')}, lượt thứ=${turnIndex + 1}. ${
          turnIndex >= 12 ? 'Đã trò chuyện khá lâu: nếu phù hợp, mời thử kỹ năng, ghi cảm xúc, hoặc nói với người thật — đừng cắt chuyện đột ngột.' : ''
        }`,
      },
      ...input.history.slice(-MAX_HISTORY),
      { role: 'user', content: input.text },
    ];
    const raw = await input.provider!.complete(messages, { temperature: 0.6, maxTokens: 300, timeoutMs: 15_000 });

    // [6] Guard
    const guard = guardOutput(raw);
    if (!guard.ok) {
      const blocked = guard.violations.filter((v) => v.severity === 'block');
      events.push({
        at: now,
        userId: input.userId,
        sessionId: input.sessionId,
        kind: 'output_blocked',
        level: blocked.length ? 'medium' : 'low',
        ruleIds: guard.violations.map((v) => v.id),
        meta: { blocked: blocked.length > 0, promptVersion: PROMPT_VERSION },
      });
    }
    const suggestions = turnIndex >= 12
      ? [
          { label: 'Thở 2 phút', action: { type: 'open_skill', skillId: 'breathing-478' } as SuggestedAction },
          { label: 'Nói với người thật', action: { type: 'open_human_support' } as SuggestedAction },
        ]
      : undefined;
    return finish({ reply: guard.text, suggestions, usedLLM: true, strategy: 'llm', risk, analysis, guardViolations: guard.violations });
  } catch {
    const s = analysis.intent === 'unclear' ? scriptedUnclear() : scriptedVenting(analysis, turnIndex);
    return finish({ reply: s.text, suggestions: s.suggestions, usedLLM: false, strategy: 'llm_fallback_script', risk, analysis, guardViolations: [] });
  }

  function finish(partial: Omit<ChatTurnResult, 'promptVersion' | 'events' | 'latencyMs'>): ChatTurnResult {
    return { ...partial, promptVersion: PROMPT_VERSION, events, latencyMs: Date.now() - started };
  }
}

function withMemory(reply: string, summary: string | undefined, intent: IntentAnalysis['intent']): string {
  if (!summary) return reply;
  if (intent === 'crisis' || intent === 'asking_about_app' || intent === 'asking_symptoms') return reply;
  const first = summary.split('.')[0]?.trim();
  if (!first || first.length < 20) return reply;
  if (intent === 'greeting') return `${reply} ${first}.`;
  if (intent === 'venting' || intent === 'mood_checkin') return `${first}. ${reply}`;
  return reply;
}
