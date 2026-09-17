// Kiểu dữ liệu
export * from './types.ts';

// Chuẩn hóa văn bản
export { normalizeVietnamese, stripDiacritics, expandTeencode } from './text/normalize.ts';
export type { NormalizedText } from './text/normalize.ts';

// An toàn
export { detectCrisisByRules, assessCrisis, scoreToLevel, CRISIS_THRESHOLDS, summarizeCategories } from './safety/crisisDetector.ts';
export type { AssessOptions } from './safety/crisisDetector.ts';
export { CRISIS_RULES, IDIOM_EXCLUSIONS, NEGATION_PATTERNS, THIRD_PARTY_PATTERNS } from './safety/crisisRules.ts';
export type { CrisisRule } from './safety/crisisRules.ts';
export { guardOutput, SAFE_FALLBACK_REPLY } from './safety/outputGuard.ts';
export type { GuardResult, GuardViolation, GuardSeverity } from './safety/outputGuard.ts';

// Tài nguyên khẩn cấp
export { CRISIS_RESOURCES, activeResources, CRISIS_CARD_COPY } from './crisis/resources.ts';
export type { CrisisResource, ResourceStatus } from './crisis/resources.ts';

// AI
export { AN_SYSTEM_PROMPT, CRISIS_CLASSIFIER_PROMPT, INTENT_PROMPT, PROMPT_VERSION } from './ai/systemPrompt.ts';
export { OpenAICompatibleProvider, MockProvider, LLMCrisisClassifier, parseClassifierJson } from './ai/provider.ts';
export type { LLMProvider, CompleteOptions, OpenAICompatibleConfig } from './ai/provider.ts';
export { analyzeIntentByRules, parseIntentJson } from './ai/intent.ts';
export { runChatTurn } from './ai/pipeline.ts';
export type { ChatTurnInput, ChatTurnResult, CrisisCard } from './ai/pipeline.ts';
export type { ScriptedReply, SuggestedAction } from './ai/scripts.ts';

// Sàng lọc
export { PHQ9, GAD7, INSTRUMENTS } from './screening/instruments.ts';
export type { Instrument, InstrumentId } from './screening/instruments.ts';
export { scoreInstrument, SCREENING_DISCLAIMER } from './screening/scoring.ts';
export type { ScreeningResult, Band } from './screening/scoring.ts';

// Nội dung
export { SKILLS, getSkill, SKILL_CATEGORY_LABELS } from './content/skills.ts';
export type { Skill, SkillStep, SkillCategory } from './content/skills.ts';
export { DEFAULT_GROUPS } from './content/groups.ts';
export type { PeerGroup } from './content/groups.ts';
export { PLACEHOLDER_SUPPORT, formatVnd } from './content/experts.ts';
export type { SupportPerson, SupportTier, SupportFormat } from './content/experts.ts';

// Kiểm duyệt
export { preModeratePost, GROUP_RULES } from './moderation/preModeration.ts';
export type { ModerationDecision, ModerationResult } from './moderation/preModeration.ts';

// Học / nhớ
export { buildContextSummary, describeMoodTrend, toLearnEvent, aggregatePatterns, AD_POLICY, buildCompanionPlan } from './learn/memory.ts';
export type { CheckinSnapshot, LearnEvent, PatternRow, CompanionPlan } from './learn/memory.ts';
