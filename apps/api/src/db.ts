import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_GROUPS } from '@tamly/core';
import type { SafetyEvent } from '@tamly/core';

/**
 * Lớp dữ liệu cho MVP (SQLite tích hợp trong Node >= 22.13).
 *
 * Nguyên tắc tách định danh: bảng `users` chỉ có pseudonymous id + nickname.
 * Thông tin xác thực (SĐT/email) khi có sẽ nằm ở bảng/kho RIÊNG (auth), không join trực tiếp.
 *
 * Production: chuyển sang PostgreSQL với cùng schema; xem docs/02.
 */

export class Db {
  readonly sql: DatabaseSync;

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.sql = new DatabaseSync(path);
    this.sql.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    this.migrate();
  }

  private migrate(): void {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nickname TEXT NOT NULL,
        created_at TEXT NOT NULL,
        consent_llm INTEGER NOT NULL DEFAULT 0,
        consent_research INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT
      );
      CREATE TABLE IF NOT EXISTS checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        at TEXT NOT NULL,
        mood INTEGER NOT NULL,          -- 1..5
        energy INTEGER,                 -- 1..5
        tags TEXT NOT NULL DEFAULT '[]',-- JSON array
        note TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_checkins_user_at ON checkins(user_id, at);
      CREATE TABLE IF NOT EXISTS screenings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        at TEXT NOT NULL,
        instrument TEXT NOT NULL,
        answers TEXT NOT NULL,          -- JSON array
        total INTEGER NOT NULL,
        band TEXT NOT NULL,
        safety_flag INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_screenings_user_at ON screenings(user_id, at);
      CREATE TABLE IF NOT EXISTS chat_messages (
        -- Bảng tương thích / dọn dữ liệu cũ. API hiện không INSERT nguyên văn hội thoại.
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_id TEXT NOT NULL,
        at TEXT NOT NULL,
        role TEXT NOT NULL,             -- user | assistant
        content TEXT NOT NULL,
        strategy TEXT,
        risk_level TEXT,
        prompt_version TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_chat_user_session ON chat_messages(user_id, session_id, at);
      CREATE TABLE IF NOT EXISTS safety_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        at TEXT NOT NULL,
        user_id TEXT NOT NULL,
        session_id TEXT,
        kind TEXT NOT NULL,
        level TEXT NOT NULL,
        categories TEXT,
        rule_ids TEXT,
        redacted_text TEXT,
        meta TEXT,
        reviewed_at TEXT,
        reviewed_by TEXT,
        review_note TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_safety_at ON safety_events(at);
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        open_hours TEXT NOT NULL,
        max_members INTEGER NOT NULL DEFAULT 12
      );
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id TEXT NOT NULL REFERENCES groups(id),
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        at TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT NOT NULL,           -- approved | held | rejected | redirected
        moderation_reasons TEXT,
        moderated_at TEXT,
        moderated_by TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_posts_group_status ON posts(group_id, status, at);
      CREATE TABLE IF NOT EXISTS chat_quota (
        user_id TEXT NOT NULL,
        day TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, day)
      );
      CREATE TABLE IF NOT EXISTS learn_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        at TEXT NOT NULL,
        user_id TEXT NOT NULL,
        intent TEXT,
        emotion TEXT,
        intensity TEXT,
        topics TEXT,
        risk_level TEXT,
        strategy TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_learn_at ON learn_events(at);
      CREATE TABLE IF NOT EXISTS session_summaries (
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        summary TEXT NOT NULL,
        emotion TEXT,
        topics TEXT,
        PRIMARY KEY (user_id, session_id)
      );
    `);
    this.ensureColumn('users', 'consent_improve', 'INTEGER NOT NULL DEFAULT 1');
    this.seedGroups();
  }

  private ensureColumn(table: string, column: string, spec: string): void {
    const cols = this.sql.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (cols.some((c) => c.name === column)) return;
    this.sql.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${spec}`);
  }

  private seedGroups(): void {
    const count = (this.sql.prepare('SELECT COUNT(*) AS c FROM groups').get() as { c: number }).c;
    if (count > 0) return;
    const insert = this.sql.prepare('INSERT INTO groups (id, name, description, open_hours, max_members) VALUES (?, ?, ?, ?, ?)');
    // Nhóm theo BỐI CẢNH, không theo tên bệnh.
    for (const g of DEFAULT_GROUPS) insert.run(g.id, g.name, g.description, g.openHours, g.maxMembers);
  }

  ensureUser(id: string, nickname = 'Bạn'): void {
    this.sql
      .prepare('INSERT OR IGNORE INTO users (id, nickname, created_at, consent_llm, consent_research, consent_improve) VALUES (?, ?, ?, 1, 1, 1)')
      .run(id, nickname, new Date().toISOString());
  }

  logSafetyEvent(e: SafetyEvent, storeText: boolean): void {
    this.sql
      .prepare(
        'INSERT INTO safety_events (at, user_id, session_id, kind, level, categories, rule_ids, redacted_text, meta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        e.at,
        e.userId,
        e.sessionId ?? null,
        e.kind,
        e.level,
        e.categories ? JSON.stringify(e.categories) : null,
        e.ruleIds ? JSON.stringify(e.ruleIds) : null,
        storeText ? (e.redactedText ?? null) : null,
        e.meta ? JSON.stringify(e.meta) : null,
      );
  }

  /** Xóa dữ liệu chat cũ hơn N ngày (chạy định kỳ). */
  purgeOldChat(retentionDays: number): number {
    const cutoff = new Date(Date.now() - retentionDays * 86_400_000).toISOString();
    const r = this.sql.prepare('DELETE FROM chat_messages WHERE at < ?').run(cutoff);
    return Number(r.changes);
  }

  /** Quyền xóa (PDPL): xóa toàn bộ dữ liệu người dùng. Safety events được khử nhận dạng thay vì xóa (nghĩa vụ lưu hồ sơ sự cố theo Luật AI). */
  eraseUser(userId: string): void {
    const tx = this.sql;
    tx.exec('BEGIN');
    try {
      tx.prepare('DELETE FROM checkins WHERE user_id = ?').run(userId);
      tx.prepare('DELETE FROM screenings WHERE user_id = ?').run(userId);
      tx.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(userId);
      tx.prepare('DELETE FROM posts WHERE user_id = ?').run(userId);
      tx.prepare('DELETE FROM chat_quota WHERE user_id = ?').run(userId);
      tx.prepare('DELETE FROM learn_events WHERE user_id = ?').run(userId);
      tx.prepare('DELETE FROM session_summaries WHERE user_id = ?').run(userId);
      tx.prepare("UPDATE safety_events SET user_id = 'erased', redacted_text = NULL WHERE user_id = ?").run(userId);
      tx.prepare('DELETE FROM users WHERE id = ?').run(userId);
      tx.exec('COMMIT');
    } catch (err) {
      tx.exec('ROLLBACK');
      throw err;
    }
  }
}
