import { normalizeVietnamese } from '../text/normalize.ts';
import { KNOWLEDGE_PACK, KNOWLEDGE_PACK_VERSION, type KnowledgeDoc, type SituationId } from './pack.ts';

let extra: KnowledgeDoc[] = [];

export function mergeKnowledge(docs: KnowledgeDoc[]): number {
  const ok = docs.filter((d) => d && d.reviewed === true && d.counsel && d.id);
  const seen = new Set(extra.map((d) => d.id));
  let n = 0;
  for (const d of ok) {
    if (seen.has(d.id) || KNOWLEDGE_PACK.some((c) => c.id === d.id)) continue;
    extra.push(d);
    seen.add(d.id);
    n++;
  }
  return n;
}

export function allKnowledge(): KnowledgeDoc[] {
  return [...KNOWLEDGE_PACK, ...extra];
}

export function knowledgeStats(): { bundled: number; extra: number; version: string } {
  return { bundled: KNOWLEDGE_PACK.length, extra: extra.length, version: KNOWLEDGE_PACK_VERSION };
}

/** Chỉ dùng trong test — gói đóng sẵn không bị xóa. */
export function resetExtraKnowledge(): void {
  extra = [];
}

export function parseKnowledgePayload(raw: unknown): KnowledgeDoc[] {
  if (!raw || typeof raw !== 'object') return [];
  const docs = Array.isArray(raw) ? raw : (raw as { documents?: unknown }).documents;
  if (!Array.isArray(docs)) return [];
  const out: KnowledgeDoc[] = [];
  for (const d of docs) {
    if (!d || typeof d !== 'object') continue;
    const o = d as Partial<KnowledgeDoc>;
    if (o.reviewed !== true || typeof o.id !== 'string' || typeof o.counsel !== 'string' || typeof o.ask !== 'string') continue;
    out.push({
      id: o.id.slice(0, 80),
      title: String(o.title ?? o.id).slice(0, 120),
      situations: Array.isArray(o.situations) && o.situations.length ? o.situations : ['general'],
      topics: Array.isArray(o.topics) && o.topics.length ? o.topics : ['other'],
      tags: Array.isArray(o.tags) ? o.tags.map(String).slice(0, 20) : [],
      counsel: o.counsel.slice(0, 600),
      ask: o.ask.slice(0, 200),
      skillId: o.skillId,
      source: String(o.source ?? 'gói đã duyệt').slice(0, 200),
      reviewed: true,
    });
  }
  return out;
}

function tokens(text: string): string[] {
  const { ascii } = normalizeVietnamese(text);
  return ascii.split(/[^a-z0-9]+/).filter((w) => w.length >= 2);
}

/** Truy xuất 1–2 mục sát tình huống. Không sinh kiến thức mới. */
export function retrieveKnowledge(input: {
  text: string;
  situation?: SituationId;
  topics?: string[];
  limit?: number;
}): Array<{ doc: KnowledgeDoc; score: number }> {
  const q = new Set(tokens(input.text));
  const ranked = allKnowledge()
    .map((doc) => {
      const bag = tokens([doc.title, doc.counsel, doc.tags.join(' '), doc.ask].join(' '));
      let score = 0;
      for (const w of bag) if (q.has(w)) score += 1;
      if (input.situation && doc.situations.includes(input.situation)) score += 6;
      for (const t of input.topics ?? []) if (doc.topics.includes(t as never)) score += 2;
      return { doc, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  const limit = input.limit ?? 2;
  return ranked.slice(0, limit);
}

export function formatKnowledgeForPrompt(hits: Array<{ doc: KnowledgeDoc }>): string {
  if (!hits.length) return '';
  return hits
    .map(
      (h) =>
        `Tài liệu nội bộ [${h.doc.id}] (${h.doc.source}): ${h.doc.counsel} Câu hỏi gợi ý: ${h.doc.ask}. Chỉ dùng nếu khớp chuyện đang nói. Không chẩn đoán. Không bịa nghiên cứu.`,
    )
    .join('\n');
}
