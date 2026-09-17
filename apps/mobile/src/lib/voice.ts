/**
 * Giọng nói trên web (Web Speech API). Trên native: TTS nếu có speechSynthesis; STT cần trình duyệt.
 */
import { Platform } from 'react-native';

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: { results: ArrayLike<{ isFinal?: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onend: (() => void) | null;
};

function recognitionCtor(): (new () => SpeechRec) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canListen(): boolean {
  return Platform.OS === 'web' && !!recognitionCtor();
}

export function canSpeak(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.speechSynthesis?.speak === 'function';
}

let rec: SpeechRec | null = null;

export function startListening(opts: { onText: (t: string) => void; onEnd: () => void; onError?: () => void }): () => void {
  const Ctor = recognitionCtor();
  if (!Ctor) {
    opts.onError?.();
    opts.onEnd();
    return () => undefined;
  }
  stopListening();
  rec = new Ctor();
  rec.lang = 'vi-VN';
  rec.interimResults = false;
  rec.continuous = false;
  rec.onresult = (ev) => {
    const last = ev.results[ev.results.length - 1];
    const t = last?.[0]?.transcript?.trim();
    if (t) opts.onText(t);
  };
  rec.onerror = () => opts.onError?.();
  rec.onend = () => {
    rec = null;
    opts.onEnd();
  };
  rec.start();
  return stopListening;
}

export function stopListening(): void {
  try {
    rec?.abort();
  } catch {
    /* ignore */
  }
  rec = null;
}

export function speak(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.slice(0, 400));
  u.lang = 'vi-VN';
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined') return;
  window.speechSynthesis?.cancel();
}
