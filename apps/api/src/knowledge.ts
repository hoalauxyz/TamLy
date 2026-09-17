import { mergeKnowledge, parseKnowledgePayload } from '@tamly/core';

/** Tải gói JSON đã duyệt. Không crawl web tự do, không fine-tune. */
export async function refreshKnowledge(url: string): Promise<{ added: number; error?: string }> {
  if (!url) return { added: 0 };
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return { added: 0, error: `http ${res.status}` };
    const added = mergeKnowledge(parseKnowledgePayload(await res.json()));
    return { added };
  } catch (e) {
    return { added: 0, error: e instanceof Error ? e.message : 'fetch_failed' };
  }
}
