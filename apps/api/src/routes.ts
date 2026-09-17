import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  AD_POLICY,
  activeResources,
  aggregatePatterns,
  buildContextSummary,
  GROUP_RULES,
  INSTRUMENTS,
  LLMCrisisClassifier,
  OpenAICompatibleProvider,
  PLACEHOLDER_SUPPORT,
  preModeratePost,
  runChatTurn,
  scoreInstrument,
  SKILLS,
  SKILL_CATEGORY_LABELS,
  toLearnEvent,
} from '@tamly/core';
import type { ChatMessage, InstrumentId, LLMProvider, Topic } from '@tamly/core';
import type { AppConfig } from './config.ts';
import type { Db } from './db.ts';

/**
 * XÁC THỰC (MVP): header `x-user-id` là pseudonymous id do client tạo (UUID) và lưu local.
 * Đây là placeholder để phát triển. Trước beta: thay bằng OTP/Apple/Google qua Firebase Auth
 * hoặc Supabase, và ánh xạ auth_uid -> pseudonymous user_id trong kho RIÊNG.
 */
function requireUser(req: FastifyRequest, reply: FastifyReply, db: Db): string | null {
  const id = req.headers['x-user-id'];
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{8,64}$/.test(id)) {
    reply.code(401).send({ error: 'missing_or_invalid_user' });
    return null;
  }
  db.ensureUser(id);
  return id;
}

function requireAdmin(req: FastifyRequest, reply: FastifyReply, config: AppConfig): boolean {
  const token = req.headers['x-admin-token'];
  if (token !== config.adminToken || config.adminToken === 'change-me') {
    reply.code(403).send({ error: 'forbidden' });
    return false;
  }
  return true;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function registerRoutes(app: FastifyInstance, db: Db, config: AppConfig): void {
  const provider: LLMProvider | undefined = config.llm
    ? new OpenAICompatibleProvider({ baseUrl: config.llm.baseUrl, apiKey: config.llm.apiKey, model: config.llm.model })
    : undefined;
  const classifier = provider ? new LLMCrisisClassifier(provider) : undefined;

  // ---------------- Người dùng ----------------
  app.post<{ Body: { nickname?: string; consentLlm?: boolean; consentResearch?: boolean; consentImprove?: boolean } }>('/v1/me', async (req, reply) => {
    const userId = requireUser(req, reply, db);
    if (!userId) return;
    const b = req.body ?? {};
    if (b.nickname) db.sql.prepare('UPDATE users SET nickname = ? WHERE id = ?').run(b.nickname.slice(0, 30), userId);
    if (typeof b.consentLlm === 'boolean') db.sql.prepare('UPDATE users SET consent_llm = ? WHERE id = ?').run(b.consentLlm ? 1 : 0, userId);
    if (typeof b.consentResearch === 'boolean') db.sql.prepare('UPDATE users SET consent_research = ? WHERE id = ?').run(b.consentResearch ? 1 : 0, userId);
    if (typeof b.consentImprove === 'boolean') db.sql.prepare('UPDATE users SET consent_improve = ? WHERE id = ?').run(b.consentImprove ? 1 : 0, userId);
    return db.sql.prepare('SELECT id, nickname, created_at, consent_llm, consent_research, consent_improve FROM users WHERE id = ?').get(userId);
  });

  app.get('/v1/me', async (req, reply) => {
    const userId = requireUser(req, reply, db);
    if (!userId) return;
    return db.sql.prepare('SELECT id, nickname, created_at, consent_llm, consent_research, consent_improve FROM users WHERE id = ?').get(userId);
  });

  /** Quyền xóa dữ liệu (PDPL 91/2025). */
  app.delete('/v1/me', async (req, reply) => {
    const userId = requireUser(req, reply, db);
    if (!userId) return;
    db.eraseUser(userId);
    return { ok: true };
  });

  /** Quyền tiếp cận dữ liệu (xuất toàn bộ). */
  app.get('/v1/me/export', async (req, reply) => {
    const userId = requireUser(req, reply, db);
    if (!userId) return;
    return {
      user: db.sql.prepare('SELECT id, nickname, created_at FROM users WHERE id = ?').get(userId),
      checkins: db.sql.prepare('SELECT at, mood, energy, tags, note FROM checkins WHERE user_id = ? ORDER BY at').all(userId),
      screenings: db.sql.prepare('SELECT at, instrument, answers, total, band FROM screenings WHERE user_id = ? ORDER BY at').all(userId),
      chat: db.sql.prepare('SELECT session_id, at, role, content FROM chat_messages WHERE user_id = ? ORDER BY at').all(userId),
      posts: db.sql.prepare('SELECT group_id, at, content, status FROM posts WHERE user_id = ? ORDER BY at').all(userId),
    };
  });

  // ---------------- Check-in ----------------
  app.post<{ Body: { mood: number; energy?: number; tags?: string[]; note?: string } }>('/v1/checkins', async (req, reply) => {
    const userId = requireUser(req, reply, db);
    if (!userId) return;
    const { mood, energy, tags = [], note } = req.body ?? ({} as never);
    if (!Number.isInteger(mood) || mood < 1 || mood > 5) return reply.code(400).send({ error: 'mood must be 1..5' });
    const at = new Date().toISOString();
    db.sql
      .prepare('INSERT INTO checkins (user_id, at, mood, energy, tags, note) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, at, mood, energy ?? null, JSON.stringify(tags.slice(0, 5)), note?.slice(0, 500) ?? null);
    const count = (db.sql.prepare('SELECT COUNT(*) AS c FROM checkins WHERE user_id = ?').get(userId) as { c: number }).c;
    // Gợi ý sàng lọc sau check-in thứ 3 (không bắt buộc lúc onboarding).
    const lastScreening = db.sql.prepare('SELECT at FROM screenings WHERE user_id = ? ORDER BY at DESC LIMIT 1').get(userId) as { at: string } | undefined;
    const suggestScreening = count >= 3 && (!lastScreening || Date.now() - Date.parse(lastScreening.at) > 14 * 86_400_000);
    return { ok: true, at, count, suggestScreening };
  });

  app.get<{ Querystring: { days?: string } }>('/v1/checkins', async (req, reply) => {
    const userId = requireUser(req, reply, db);
    if (!userId) return;
    const days = Math.min(Number(req.query.days ?? 30), 365);
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const rows = db.sql
      .prepare('SELECT at, mood, energy, tags, note FROM checkins WHERE user_id = ? AND at >= ? ORDER BY at')
      .all(userId, since) as Array<{ at: string; mood: number; energy: number | null; tags: string; note: string | null }>;
    return rows.map((r) => ({ ...r, tags: JSON.parse(r.tags) as string[] }));
  });

  // ---------------- Sàng lọc ----------------
  app.get('/v1/screenings/instruments', async () => INSTRUMENTS);

  app.post<{ Body: { instrument: InstrumentId; answers: number[] } }>('/v1/screenings', async (req, reply) => {
    const userId = requireUser(req, reply, db);
    if (!userId) return;
    const { instrument, answers } = req.body ?? ({} as never);
    if (!INSTRUMENTS[instrument]) return reply.code(400).send({ error: 'unknown instrument' });
    let result;
    try {
      result = scoreInstrument(instrument, answers);
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }
    const at = new Date().toISOString();
    db.sql
      .prepare('INSERT INTO screenings (user_id, at, instrument, answers, total, band, safety_flag) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(userId, at, instrument, JSON.stringify(answers), result.total, result.band, result.safetyFlag ? 1 : 0);
    if (result.safetyFlag) {
      db.logSafetyEvent(
        { at, userId, kind: 'screening_item9', level: result.safetyLevel, meta: { instrument, total: result.total } },
        false,
      );
    }
    return { ...result, at, crisisResources: result.safetyFlag ? activeResources() : undefined };
  });

  app.get('/v1/screenings', async (req, reply) => {
    const userId = requireUser(req, reply, db);
    if (!userId) return;
    return db.sql.prepare('SELECT at, instrument, total, band, safety_flag FROM screenings WHERE user_id = ? ORDER BY at DESC LIMIT 20').all(userId);
  });

  // ---------------- Chat với An ----------------
  app.post<{
    Body: {
      sessionId: string;
      message: string;
      acknowledgedCrisis?: boolean;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };
  }>('/v1/chat', async (req, reply) => {
    const userId = requireUser(req, reply, db);
    if (!userId) return;
    const { sessionId, message, acknowledgedCrisis, history: clientHistory } = req.body ?? ({} as never);
    if (typeof sessionId !== 'string' || !sessionId || typeof message !== 'string' || !message.trim()) {
      return reply.code(400).send({ error: 'sessionId and message required' });
    }
    if (message.length > 2000) return reply.code(400).send({ error: 'message too long' });

    const unlimited = !config.chatDailyLimit || config.chatDailyLimit <= 0;
    const day = todayKey();
    const quota = (db.sql.prepare('SELECT count FROM chat_quota WHERE user_id = ? AND day = ?').get(userId, day) as { count: number } | undefined)?.count ?? 0;
    const overQuota = !unlimited && quota >= config.chatDailyLimit;

    const user = db.sql.prepare('SELECT consent_llm FROM users WHERE id = ?').get(userId) as { consent_llm: number };
    const history: ChatMessage[] = Array.isArray(clientHistory)
      ? clientHistory
          .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
          .slice(-24)
          .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
      : [];

    const checkins = db.sql
      .prepare('SELECT at, mood, tags, note FROM checkins WHERE user_id = ? ORDER BY at DESC LIMIT 14')
      .all(userId) as Array<{ at: string; mood: number; tags: string; note: string | null }>;
    const recentLearn = db.sql
      .prepare('SELECT emotion, topics FROM learn_events WHERE user_id = ? ORDER BY at DESC LIMIT 20')
      .all(userId) as Array<{ emotion: string; topics: string }>;
    const contextSummary = buildContextSummary({
      checkins: checkins.map((c) => ({ at: c.at, mood: c.mood, tags: JSON.parse(c.tags) as string[], note: null })),
      recentEvents: recentLearn.map((e) => ({ emotion: e.emotion, topics: JSON.parse(e.topics || '[]') as string[] })),
    });

    const result = await runChatTurn({
      userId,
      sessionId,
      text: message,
      history,
      contextSummary: contextSummary || undefined,
      provider,
      classifier,
      llmDisabled: config.llmDisabled || !user.consent_llm || overQuota,
      acknowledgedCrisis,
      preferLlmForVenting: true,
    });

    // Không lưu nguyên văn hội thoại. Chỉ ghi mẫu học (cảm xúc/chủ đề) và sự kiện an toàn.
    db.sql
      .prepare('INSERT INTO chat_quota (user_id, day, count) VALUES (?, ?, 1) ON CONFLICT(user_id, day) DO UPDATE SET count = count + 1')
      .run(userId, day);

    for (const e of result.events) db.logSafetyEvent({ ...e, redactedText: message.slice(0, 500) }, config.storeCrisisText);

    const improve = (db.sql.prepare('SELECT consent_improve FROM users WHERE id = ?').get(userId) as { consent_improve: number } | undefined)?.consent_improve !== 0;
    if (improve && result.risk.level !== 'high') {
      const ev = toLearnEvent({
        intent: result.analysis.intent,
        emotion: result.analysis.emotion,
        intensity: result.analysis.intensity,
        topics: result.analysis.topics,
        riskLevel: result.risk.level,
        strategy: result.strategy,
      });
      db.sql
        .prepare('INSERT INTO learn_events (at, user_id, intent, emotion, intensity, topics, risk_level, strategy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(ev.at, userId, ev.intent, ev.emotion, ev.intensity, JSON.stringify(ev.topics), ev.riskLevel, ev.strategy);
      if (contextSummary) {
        db.sql
          .prepare(
            `INSERT INTO session_summaries (user_id, session_id, updated_at, summary, emotion, topics)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(user_id, session_id) DO UPDATE SET updated_at = excluded.updated_at, summary = excluded.summary, emotion = excluded.emotion, topics = excluded.topics`,
          )
          .run(userId, sessionId, ev.at, contextSummary.slice(0, 500), result.analysis.emotion, JSON.stringify(result.analysis.topics));
      }
    }

    return {
      reply: result.reply,
      suggestions: result.suggestions,
      crisisCard: result.crisisCard,
      crisisResources: result.crisisCard ? activeResources() : undefined,
      risk: result.risk.level,
      usedLLM: result.usedLLM,
      analysis: { intent: result.analysis.intent, emotion: result.analysis.emotion, intensity: result.analysis.intensity, topics: result.analysis.topics },
      quota: { used: quota + 1, limit: unlimited ? 0 : config.chatDailyLimit, llmAvailable: !!provider && !config.llmDisabled && !!user.consent_llm && !overQuota },
    };
  });

  app.get<{ Querystring: { sessionId: string } }>('/v1/chat/history', async (req, reply) => {
    const userId = requireUser(req, reply, db);
    if (!userId) return;
    return [];
  });

  // ---------------- Tài nguyên khẩn cấp & kỹ năng ----------------
  app.get('/v1/crisis-resources', async () => activeResources());

  app.get('/v1/skills', async () => ({ categories: SKILL_CATEGORY_LABELS, skills: SKILLS }));

  app.get('/v1/support', async () => ({ people: PLACEHOLDER_SUPPORT, note: 'placeholder' }));

  app.get('/v1/ads', async () => ({
    enabled: config.adsEnabled,
    ...AD_POLICY,
    slots: config.adsEnabled
      ? [{ id: 'home-banner', html: null, label: AD_POLICY.label }]
      : [],
  }));

  // ---------------- Nhóm (tiền kiểm duyệt) ----------------
  app.get('/v1/groups', async () => ({
    rules: GROUP_RULES,
    groups: db.sql.prepare('SELECT g.*, (SELECT COUNT(*) FROM posts p WHERE p.group_id = g.id AND p.status = \'approved\') AS post_count FROM groups g').all(),
  }));

  app.get<{ Params: { id: string } }>('/v1/groups/:id/posts', async (req, reply) => {
    const userId = requireUser(req, reply, db);
    if (!userId) return;
    // Chỉ bài đã duyệt + bài của chính mình (để thấy trạng thái chờ).
    return db.sql
      .prepare(
        `SELECT id, at, content, status, (user_id = ?) AS mine
         FROM posts WHERE group_id = ? AND (status = 'approved' OR user_id = ?) ORDER BY at DESC LIMIT 50`,
      )
      .all(userId, req.params.id, userId);
  });

  app.post<{ Params: { id: string }; Body: { content: string } }>('/v1/groups/:id/posts', async (req, reply) => {
    const userId = requireUser(req, reply, db);
    if (!userId) return;
    const content = (req.body?.content ?? '').trim();
    if (!content) return reply.code(400).send({ error: 'content required' });
    const group = db.sql.prepare('SELECT id FROM groups WHERE id = ?').get(req.params.id);
    if (!group) return reply.code(404).send({ error: 'group not found' });

    const mod = preModeratePost(content);
    const statusMap = { approve: 'approved', hold_for_review: 'held', reject: 'rejected', redirect_to_support: 'redirected' } as const;
    const at = new Date().toISOString();
    db.sql
      .prepare('INSERT INTO posts (group_id, user_id, at, content, status, moderation_reasons) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.params.id, userId, at, content, statusMap[mod.decision], JSON.stringify(mod.reasons));

    if (mod.decision === 'redirect_to_support' || mod.alertModerator) {
      db.logSafetyEvent(
        {
          at,
          userId,
          kind: mod.decision === 'redirect_to_support' ? 'post_rejected' : 'post_held',
          level: mod.crisis.level,
          categories: mod.crisis.categories,
          ruleIds: mod.reasons,
          redactedText: content.slice(0, 500),
          meta: { groupId: req.params.id, alertModerator: mod.alertModerator },
        },
        config.storeCrisisText || mod.decision === 'redirect_to_support',
      );
    }

    return {
      decision: mod.decision,
      status: statusMap[mod.decision],
      message: mod.authorMessage,
      crisisResources: mod.decision === 'redirect_to_support' ? activeResources() : undefined,
    };
  });

  // ---------------- Safety Ops (điều phối viên / cố vấn lâm sàng) ----------------
  app.get<{ Querystring: { since?: string; unreviewed?: string } }>('/v1/admin/safety-events', async (req, reply) => {
    if (!requireAdmin(req, reply, config)) return;
    const since = req.query.since ?? new Date(Date.now() - 7 * 86_400_000).toISOString();
    const onlyUnreviewed = req.query.unreviewed === '1';
    return db.sql
      .prepare(`SELECT * FROM safety_events WHERE at >= ? ${onlyUnreviewed ? 'AND reviewed_at IS NULL' : ''} ORDER BY at DESC LIMIT 200`)
      .all(since);
  });

  app.post<{ Params: { id: string }; Body: { reviewer: string; note?: string } }>('/v1/admin/safety-events/:id/review', async (req, reply) => {
    if (!requireAdmin(req, reply, config)) return;
    db.sql
      .prepare('UPDATE safety_events SET reviewed_at = ?, reviewed_by = ?, review_note = ? WHERE id = ?')
      .run(new Date().toISOString(), req.body.reviewer, req.body.note ?? null, Number(req.params.id));
    return { ok: true };
  });

  app.get('/v1/admin/posts/held', async (req, reply) => {
    if (!requireAdmin(req, reply, config)) return;
    return db.sql.prepare("SELECT id, group_id, at, content, moderation_reasons FROM posts WHERE status = 'held' ORDER BY at").all();
  });

  app.post<{ Params: { id: string }; Body: { decision: 'approved' | 'rejected'; moderator: string } }>('/v1/admin/posts/:id', async (req, reply) => {
    if (!requireAdmin(req, reply, config)) return;
    const { decision, moderator } = req.body;
    if (decision !== 'approved' && decision !== 'rejected') return reply.code(400).send({ error: 'bad decision' });
    db.sql.prepare('UPDATE posts SET status = ?, moderated_at = ?, moderated_by = ? WHERE id = ?').run(decision, new Date().toISOString(), moderator, Number(req.params.id));
    return { ok: true };
  });

  app.get('/v1/admin/metrics', async (req, reply) => {
    if (!requireAdmin(req, reply, config)) return;
    const q = (s: string) => (db.sql.prepare(s).get() as { c: number }).c;
    return {
      users: q('SELECT COUNT(*) AS c FROM users'),
      checkins7d: q("SELECT COUNT(*) AS c FROM checkins WHERE at >= datetime('now', '-7 days')"),
      screenings7d: q("SELECT COUNT(*) AS c FROM screenings WHERE at >= datetime('now', '-7 days')"),
      chatTurns7d: q("SELECT COUNT(*) AS c FROM chat_messages WHERE role = 'user' AND at >= datetime('now', '-7 days')"),
      crisisHigh7d: q("SELECT COUNT(*) AS c FROM safety_events WHERE kind = 'crisis_detected' AND level = 'high' AND at >= datetime('now', '-7 days')"),
      outputBlocked7d: q("SELECT COUNT(*) AS c FROM safety_events WHERE kind = 'output_blocked' AND at >= datetime('now', '-7 days')"),
      postsHeld: q("SELECT COUNT(*) AS c FROM posts WHERE status = 'held'"),
      unreviewedSafetyEvents: q('SELECT COUNT(*) AS c FROM safety_events WHERE reviewed_at IS NULL'),
      learnEvents7d: q("SELECT COUNT(*) AS c FROM learn_events WHERE at >= datetime('now', '-7 days')"),
    };
  });

  app.get('/v1/admin/learn/patterns', async (req, reply) => {
    if (!requireAdmin(req, reply, config)) return;
    const rows = db.sql
      .prepare("SELECT intent, emotion, intensity, topics, risk_level, strategy FROM learn_events WHERE at >= datetime('now', '-30 days') LIMIT 5000")
      .all() as Array<{ intent: string; emotion: string; intensity: string; topics: string; risk_level: string; strategy: string }>;
    const events = rows.map((r) =>
      toLearnEvent({
        intent: r.intent as never,
        emotion: r.emotion as never,
        intensity: r.intensity,
        topics: JSON.parse(r.topics || '[]') as Topic[],
        riskLevel: r.risk_level as never,
        strategy: r.strategy,
      }),
    );
    return { windowDays: 30, n: events.length, patterns: aggregatePatterns(events) };
  });
}
