import type { ChatMessage, CrisisClassifier, CrisisClassifierResult, RiskLevel } from '../types.ts';
import { CRISIS_CLASSIFIER_PROMPT } from './systemPrompt.ts';

/**
 * Lớp trừu tượng nhà cung cấp LLM.
 * Cho phép đổi OpenAI <-> Anthropic <-> Gemini <-> mô hình host nội địa (vLLM/Ollama, OpenAI-compatible)
 * mà không đụng pipeline. Cũng cho phép chạy "no-LLM" (provider = null).
 */
export interface LLMProvider {
  readonly name: string;
  complete(messages: ChatMessage[], opts?: CompleteOptions): Promise<string>;
}

export interface CompleteOptions {
  maxTokens?: number;
  temperature?: number;
  /** Ép trả JSON (nếu provider hỗ trợ). */
  json?: boolean;
  timeoutMs?: number;
}

export interface OpenAICompatibleConfig {
  baseUrl: string; // ví dụ https://api.openai.com/v1 hoặc http://localhost:11434/v1
  apiKey?: string;
  model: string;
  /** Header bổ sung (ví dụ cho zero-retention). */
  headers?: Record<string, string>;
}

/**
 * Provider dùng chuẩn OpenAI Chat Completions – tương thích OpenAI, Groq, Together,
 * OpenRouter, vLLM, Ollama, và nhiều dịch vụ nội địa.
 */
export class OpenAICompatibleProvider implements LLMProvider {
  readonly name: string;
  private readonly cfg: OpenAICompatibleConfig;
  constructor(cfg: OpenAICompatibleConfig) {
    this.cfg = cfg;
    this.name = `openai-compatible:${cfg.model}`;
  }

  async complete(messages: ChatMessage[], opts: CompleteOptions = {}): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20_000);
    try {
      const res = await fetch(`${this.cfg.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          ...(this.cfg.apiKey ? { authorization: `Bearer ${this.cfg.apiKey}` } : {}),
          ...(this.cfg.headers ?? {}),
        },
        body: JSON.stringify({
          model: this.cfg.model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: opts.maxTokens ?? 350,
          temperature: opts.temperature ?? 0.6,
          ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
        }),
      });
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const text = data.choices?.[0]?.message?.content;
      if (typeof text !== 'string') throw new Error('LLM: empty response');
      return text.trim();
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Provider giả cho test / demo offline: trả lời cố định hoặc theo hàm. */
export class MockProvider implements LLMProvider {
  readonly name = 'mock';
  private readonly responder: (messages: ChatMessage[]) => string;
  constructor(responder: (messages: ChatMessage[]) => string) {
    this.responder = responder;
  }
  async complete(messages: ChatMessage[]): Promise<string> {
    return this.responder(messages);
  }
}

/** Bộ phân loại crisis lớp 2 dựa trên LLM (JSON). */
export class LLMCrisisClassifier implements CrisisClassifier {
  private readonly provider: LLMProvider;
  constructor(provider: LLMProvider) {
    this.provider = provider;
  }

  async classify(text: string, recentHistory: string[] = []): Promise<CrisisClassifierResult> {
    const ctx = recentHistory.length ? `Ngữ cảnh gần đây:\n${recentHistory.slice(-4).join('\n')}\n\n` : '';
    const raw = await this.provider.complete(
      [
        { role: 'system', content: CRISIS_CLASSIFIER_PROMPT },
        { role: 'user', content: `${ctx}Tin nhắn cần phân loại:\n"""${text}"""` },
      ],
      { json: true, temperature: 0, maxTokens: 120, timeoutMs: 8_000 },
    );
    return parseClassifierJson(raw);
  }
}

export function parseClassifierJson(raw: string): CrisisClassifierResult {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('classifier: no JSON');
  const obj = JSON.parse(raw.slice(start, end + 1)) as Partial<CrisisClassifierResult>;
  const levels: RiskLevel[] = ['none', 'low', 'medium', 'high'];
  if (!obj.level || !levels.includes(obj.level)) throw new Error('classifier: bad level');
  const confidence = typeof obj.confidence === 'number' ? Math.max(0, Math.min(1, obj.confidence)) : 0.5;
  return { level: obj.level, confidence, rationale: obj.rationale };
}
