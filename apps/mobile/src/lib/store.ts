import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Lưu trữ local (local-first).
 *
 * MVP dùng AsyncStorage. Trước beta: chuyển nhật ký/check-in sang expo-sqlite + SQLCipher
 * hoặc mã hóa bằng khóa trong expo-secure-store; pseudonymous id cũng nên nằm trong SecureStore.
 */

const KEYS = {
  userId: 'lang.userId',
  onboarded: 'lang.onboarded',
  nickname: 'lang.nickname',
  consentLlm: 'lang.consentLlm',
  checkins: 'lang.checkins', // bản sao local để hiển thị offline
  sessionId: 'lang.chat.sessionId',
  localPosts: 'lang.posts',
  chatMessages: 'lang.chat.messages',
  companion: 'lang.companion',
} as const;

function randomId(len = 24): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  const cryptoObj = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (cryptoObj?.getRandomValues) {
    const bytes = cryptoObj.getRandomValues(new Uint8Array(len));
    for (const b of bytes) out += alphabet[b % alphabet.length];
    return out;
  }
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function getOrCreateUserId(): Promise<string> {
  const existing = await AsyncStorage.getItem(KEYS.userId);
  if (existing) return existing;
  const id = randomId();
  await AsyncStorage.setItem(KEYS.userId, id);
  return id;
}

export async function isOnboarded(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.onboarded)) === '1';
}
export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(KEYS.onboarded, '1');
}

export async function getNickname(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.nickname)) ?? 'bạn';
}
export async function setNickname(n: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.nickname, n);
}

export async function getConsentLlm(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.consentLlm)) === '1';
}
export async function setConsentLlm(v: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.consentLlm, v ? '1' : '0');
}

export interface LocalCheckin {
  at: string;
  mood: number;
  energy?: number;
  tags: string[];
  note?: string;
}

export async function getLocalCheckins(): Promise<LocalCheckin[]> {
  const raw = await AsyncStorage.getItem(KEYS.checkins);
  return raw ? (JSON.parse(raw) as LocalCheckin[]) : [];
}
export async function addLocalCheckin(c: LocalCheckin): Promise<LocalCheckin[]> {
  const all = await getLocalCheckins();
  all.push(c);
  const trimmed = all.slice(-365);
  await AsyncStorage.setItem(KEYS.checkins, JSON.stringify(trimmed));
  return trimmed;
}

export async function getOrCreateSessionId(): Promise<string> {
  const existing = await AsyncStorage.getItem(KEYS.sessionId);
  if (existing) return existing;
  const id = `s_${randomId(16)}`;
  await AsyncStorage.setItem(KEYS.sessionId, id);
  return id;
}
export async function resetSession(): Promise<string> {
  const id = `s_${randomId(16)}`;
  await AsyncStorage.setItem(KEYS.sessionId, id);
  await AsyncStorage.removeItem(KEYS.chatMessages);
  return id;
}

export interface LocalChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export async function getLocalChat(): Promise<LocalChatMsg[]> {
  const raw = await AsyncStorage.getItem(KEYS.chatMessages);
  return raw ? (JSON.parse(raw) as LocalChatMsg[]) : [];
}
export async function setLocalChat(msgs: LocalChatMsg[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.chatMessages, JSON.stringify(msgs.slice(-80)));
}

export interface CompanionMemory {
  emotion?: string;
  topics: string[];
  intensity?: string;
  updatedAt: string;
}

export async function getCompanionMemory(): Promise<CompanionMemory | null> {
  const raw = await AsyncStorage.getItem(KEYS.companion);
  return raw ? (JSON.parse(raw) as CompanionMemory) : null;
}
export async function setCompanionMemory(m: CompanionMemory): Promise<void> {
  await AsyncStorage.setItem(KEYS.companion, JSON.stringify(m));
}

export interface LocalPost {
  id: number;
  groupId: string;
  createdAt: string;
  content: string;
  status: string;
  mine: boolean;
}

export async function getLocalPosts(groupId: string): Promise<LocalPost[]> {
  const raw = await AsyncStorage.getItem(KEYS.localPosts);
  const all: LocalPost[] = raw ? (JSON.parse(raw) as LocalPost[]) : [];
  return all.filter((p) => p.groupId === groupId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
export async function addLocalPost(p: Omit<LocalPost, 'id'>): Promise<LocalPost[]> {
  const raw = await AsyncStorage.getItem(KEYS.localPosts);
  const all: LocalPost[] = raw ? (JSON.parse(raw) as LocalPost[]) : [];
  const next: LocalPost = { ...p, id: Date.now() };
  all.push(next);
  await AsyncStorage.setItem(KEYS.localPosts, JSON.stringify(all.slice(-200)));
  return getLocalPosts(p.groupId);
}

/** Xóa toàn bộ dữ liệu local, kể cả pseudonymous id (lần mở sau là "người mới"). */
export async function wipeLocalData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

export const isWeb = Platform.OS === 'web';
