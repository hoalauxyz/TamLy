import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { CrisisCard, CrisisResource, InstrumentId, ScreeningResult, ScriptedReply, Skill, SkillCategory } from '@tamly/core';
import { getOrCreateUserId } from './store';

/**
 * API client mỏng. Mọi request gắn header x-user-id (pseudonymous).
 * Android emulator không thấy localhost của máy host -> dùng 10.0.2.2.
 */
function resolveBaseUrl(): string {
  const configured = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ?? 'http://localhost:3000';
  if (Platform.OS === 'android' && configured.includes('localhost')) return configured.replace('localhost', '10.0.2.2');
  return configured;
}

export const API_BASE_URL = resolveBaseUrl();

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const userId = await getOrCreateUserId();
  // Chỉ gắn content-type khi có body: Fastify từ chối JSON rỗng (vd. DELETE /v1/me).
  const headers: Record<string, string> = { 'x-user-id': userId, ...((init.headers as Record<string, string>) ?? {}) };
  if (init.body !== undefined) headers['content-type'] = 'application/json';
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      msg = ((await res.json()) as { error?: string }).error ?? msg;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

/** Kiểu đã "làm phẳng" cho UI. */
export interface Group {
  id: string;
  name: string;
  description: string;
  openHours: string;
  maxMembers: number;
  postCount: number;
  isOpen: boolean;
  rules: readonly string[];
}

export interface Post {
  id: number;
  createdAt: string;
  content: string;
  status: string;
  mine: boolean;
  authorAlias: string;
}

export interface ExportedData {
  user: unknown;
  checkins: unknown[];
  screenings: unknown[];
  chatMessages: unknown[];
  posts: unknown[];
}

/** Nhóm "đang mở" nếu giờ hiện tại nằm trong open_hours (định dạng "HH:MM–HH:MM", có thể nhiều đoạn nối bằng "&"). */
function isOpenNow(openHours: string): boolean {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const ranges = openHours.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/g) ?? [];
  if (!ranges.length) return true;
  return ranges.some((r) => {
    const m = /(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/.exec(r)!;
    const a = Number(m[1]) * 60 + Number(m[2]);
    const b = Number(m[3]) * 60 + Number(m[4]);
    return cur >= a && cur <= b;
  });
}

export const api = {
  health: () => request<{ ok: boolean; llm: string }>('/health'),

  me: () => request<{ id: string; nickname: string; consent_llm: number }>('/v1/me'),
  updateMe: (body: { nickname?: string; consentLlm?: boolean; consentResearch?: boolean; consentImprove?: boolean }) =>
    request('/v1/me', { method: 'POST', body: JSON.stringify(body) }),
  deleteMe: () => request<{ ok: boolean }>('/v1/me', { method: 'DELETE' }),
  exportMe: async (): Promise<ExportedData> => {
    const r = await request<{ user: unknown; checkins: unknown[]; screenings: unknown[]; chat: unknown[]; posts: unknown[] }>('/v1/me/export');
    return { user: r.user, checkins: r.checkins, screenings: r.screenings, chatMessages: r.chat, posts: r.posts };
  },

  checkin: (body: { mood: number; energy?: number; tags?: string[]; note?: string }) =>
    request<{ ok: boolean; at: string; count: number; suggestScreening: boolean }>('/v1/checkins', { method: 'POST', body: JSON.stringify(body) }),
  checkins: (days = 30) => request<Array<{ at: string; mood: number; energy: number | null; tags: string[]; note: string | null }>>(`/v1/checkins?days=${days}`),

  submitScreening: (instrument: InstrumentId, answers: number[]) =>
    request<ScreeningResult & { at: string; crisisResources?: CrisisResource[] }>('/v1/screenings', {
      method: 'POST',
      body: JSON.stringify({ instrument, answers }),
    }),
  screenings: () => request<Array<{ at: string; instrument: InstrumentId; total: number; band: string; safety_flag: number }>>('/v1/screenings'),

  chat: (body: { sessionId: string; message: string; acknowledgedCrisis?: boolean; history?: Array<{ role: 'user' | 'assistant'; content: string }> }) =>
    request<{
      reply: string;
      suggestions?: ScriptedReply['suggestions'];
      crisisCard?: CrisisCard;
      crisisResources?: CrisisResource[];
      risk: string;
      usedLLM: boolean;
      analysis?: { intent: string; emotion: string; intensity: string; topics: string[] };
      quota: { used: number; limit: number; llmAvailable: boolean };
    }>('/v1/chat', { method: 'POST', body: JSON.stringify(body) }),
  chatHistory: (sessionId: string) => request<Array<{ at: string; role: 'user' | 'assistant'; content: string }>>(`/v1/chat/history?sessionId=${encodeURIComponent(sessionId)}`),

  crisisResources: () => request<CrisisResource[]>('/v1/crisis-resources'),
  skills: () => request<{ categories: Record<SkillCategory, string>; skills: Skill[] }>('/v1/skills'),

  groups: async (): Promise<Group[]> => {
    const r = await request<{
      rules: string[];
      groups: Array<{ id: string; name: string; description: string; open_hours: string; max_members: number; post_count: number }>;
    }>('/v1/groups');
    return r.groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      openHours: g.open_hours,
      maxMembers: g.max_members,
      postCount: g.post_count,
      isOpen: isOpenNow(g.open_hours),
      rules: r.rules,
    }));
  },
  posts: async (groupId: string): Promise<Post[]> => {
    const rows = await request<Array<{ id: number; at: string; content: string; status: string; mine: number }>>(`/v1/groups/${groupId}/posts`);
    return rows.map((p) => ({
      id: p.id,
      createdAt: p.at,
      content: p.content,
      status: p.status,
      mine: p.mine === 1,
      authorAlias: p.mine === 1 ? (p.status === 'approved' ? 'Bạn' : `Bạn · ${p.status === 'held' ? 'đang chờ duyệt' : p.status}`) : 'Ẩn danh',
    }));
  },
  createPost: (id: string, content: string) =>
    request<{ decision: 'approve' | 'hold_for_review' | 'reject' | 'redirect_to_support'; status: string; message: string; crisisResources?: CrisisResource[] }>(
      `/v1/groups/${id}/posts`,
      { method: 'POST', body: JSON.stringify({ content }) },
    ),
};
