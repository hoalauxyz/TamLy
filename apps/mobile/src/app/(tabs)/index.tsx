import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activeResources, buildCompanionPlan, buildContextSummary, runChatTurn } from '@tamly/core';
import type { CompanionPlan, CrisisCard, CrisisResource, ScriptedReply, SuggestedAction } from '@tamly/core';
import { Chip, CrisisCardView } from '../../components/ui';
import { Sidebar } from '../../components/Sidebar';
import { api, ApiError } from '../../lib/api';
import {
  getCompanionMemory,
  getLocalChat,
  getLocalCheckins,
  getNickname,
  getOrCreateSessionId,
  resetSession,
  setCompanionMemory,
  setLocalChat,
} from '../../lib/store';
import { canListen, canSpeak, speak, startListening, stopListening, stopSpeaking } from '../../lib/voice';
import { colors, font, radius, spacing } from '../../lib/theme';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: ScriptedReply['suggestions'];
}

const OPENERS = ['Mình đang lo', 'Hôm nay mệt quá', 'Kể với mình một chút', 'Muốn thở một chút'];

export default function ChatHome() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakOn, setSpeakOn] = useState(false);
  const [menu, setMenu] = useState(false);
  const [nick, setNick] = useState('bạn');
  const [plan, setPlan] = useState<CompanionPlan | null>(null);
  const [crisis, setCrisis] = useState<{ card: CrisisCard; resources: CrisisResource[] } | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const list = useRef<FlatList<Msg>>(null);

  useEffect(() => {
    getNickname().then(setNick);
    getCompanionMemory().then((m) => {
      if (m) setPlan(buildCompanionPlan(m));
    });
    getOrCreateSessionId().then(async (sid) => {
      setSessionId(sid);
      const local = await getLocalChat();
      if (local.length) setMsgs(local);
    });
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, []);

  function handleAction(a: SuggestedAction) {
    switch (a.type) {
      case 'open_skill':
        router.push(`/skill/${a.skillId}`);
        break;
      case 'open_screening':
        router.push(`/screening/${a.instrument}`);
        break;
      case 'open_checkin':
        router.push('/journal');
        break;
      case 'open_human_support':
        router.push('/experts');
        break;
      case 'open_crisis':
        router.push('/crisis');
        break;
      case 'continue_chat':
        if (a.prefill) setInput(a.prefill);
        break;
    }
  }

  async function send(text: string) {
    const t = text.trim();
    if (!t || !sessionId || busy) return;
    setInput('');
    setBusy(true);
    const userMsg: Msg = { id: `u${Date.now()}`, role: 'user', content: t };
    const nextMsgs = [...msgs, userMsg];
    setMsgs(nextMsgs);
    const history = nextMsgs.slice(-24).map((m) => ({ role: m.role, content: m.content }));
    try {
      const r = await api.chat({
        sessionId,
        message: t,
        acknowledgedCrisis: acknowledged,
        history: history.slice(0, -1),
      });
      const assistant: Msg = { id: `a${Date.now()}`, role: 'assistant', content: r.reply, suggestions: r.suggestions };
      const all = [...nextMsgs, assistant];
      setMsgs(all);
      await setLocalChat(all);
      if (r.analysis) {
        const mem = { emotion: r.analysis.emotion, topics: r.analysis.topics, intensity: r.analysis.intensity, updatedAt: new Date().toISOString() };
        await setCompanionMemory(mem);
        setPlan(buildCompanionPlan(mem));
      }
      if (speakOn) speak(r.reply);
      if (r.crisisCard && r.crisisResources) {
        setCrisis({ card: r.crisisCard, resources: r.crisisResources });
        setAcknowledged(false);
        stopSpeaking();
      }
    } catch (e) {
      try {
        const checkins = await getLocalCheckins();
        const r = await runChatTurn({
          userId: 'local',
          sessionId,
          text: t,
          history: history.slice(0, -1),
          contextSummary: buildContextSummary({ checkins }) || undefined,
          llmDisabled: true,
          acknowledgedCrisis: acknowledged,
        });
        const assistant: Msg = { id: `a${Date.now()}`, role: 'assistant', content: r.reply, suggestions: r.suggestions };
        const all = [...nextMsgs, assistant];
        setMsgs(all);
        await setLocalChat(all);
        const mem = { emotion: r.analysis.emotion, topics: r.analysis.topics, intensity: r.analysis.intensity, updatedAt: new Date().toISOString() };
        await setCompanionMemory(mem);
        setPlan(buildCompanionPlan(mem));
        if (speakOn) speak(r.reply);
        if (r.crisisCard) {
          setCrisis({ card: r.crisisCard, resources: activeResources() });
          setAcknowledged(false);
        }
      } catch {
        const msg = e instanceof ApiError ? `Không gửi được (${e.message}).` : 'Mình chưa kết nối được. Bạn cứ kể, mình nghe trên máy này.';
        setMsgs((m) => [...m, { id: `e${Date.now()}`, role: 'assistant', content: msg }]);
      }
    } finally {
      setBusy(false);
      setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  function toggleMic() {
    if (listening) {
      stopListening();
      setListening(false);
      return;
    }
    if (!canListen()) return;
    setListening(true);
    startListening({
      onText: (t) => {
        setInput(t);
        void send(t);
      },
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    });
  }

  async function newSession() {
    stopSpeaking();
    const sid = await resetSession();
    setSessionId(sid);
    setMsgs([]);
    setCrisis(null);
    setPlan(null);
    await setLocalChat([]);
  }

  const hour = new Date().getHours();
  const hello = hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, width: '100%', maxWidth: 480, alignSelf: 'center' }} edges={['top']}>
      <View style={{ paddingHorizontal: spacing(3), paddingTop: spacing(1), paddingBottom: spacing(2), flexDirection: 'row', alignItems: 'center', gap: spacing(2) }}>
        <Pressable onPress={() => setMenu(true)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, color: colors.text }}>☰</Text>
        </Pressable>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>🌿</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[font.h2, { marginBottom: 0 }]}>An</Text>
          <Text style={font.small}>{busy ? 'Đang nghe…' : 'Bạn của bạn'}</Text>
        </View>
        {canSpeak() && (
          <Pressable onPress={() => setSpeakOn(!speakOn)} style={{ padding: spacing(2) }}>
            <Text style={{ fontSize: 18 }}>{speakOn ? '🔊' : '🔈'}</Text>
          </Pressable>
        )}
        <Pressable onPress={newSession} style={{ padding: spacing(2) }}>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Mới</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/crisis')} style={{ backgroundColor: colors.warn, paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.pill }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>🆘</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={12}>
        <FlatList
          ref={list}
          data={msgs}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing(4), gap: spacing(3), flexGrow: 1 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', paddingTop: spacing(10) }}>
              <Text style={[font.title, { textAlign: 'center' }]}>{hello}, {nick}.</Text>
              <Text style={[font.body, { textAlign: 'center', color: colors.textMuted, marginTop: spacing(2) }]}>
                Mình là An. Kể gì cũng được — lo, mệt, vui, trống. Mình nghe như một người bạn.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: spacing(5) }}>
                {OPENERS.map((o) => (
                  <Chip key={o} label={o} onPress={() => send(o)} />
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View>
              <View
                style={{
                  alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  backgroundColor: item.role === 'user' ? colors.userBubble : colors.botBubble,
                  paddingVertical: spacing(3),
                  paddingHorizontal: spacing(4),
                  borderRadius: item.role === 'user' ? 22 : 22,
                  borderBottomRightRadius: item.role === 'user' ? 6 : 22,
                  borderBottomLeftRadius: item.role === 'user' ? 22 : 6,
                  borderWidth: item.role === 'user' ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={[font.body, { color: item.role === 'user' ? '#fff' : colors.text, lineHeight: 23 }]}>{item.content}</Text>
              </View>
              {item.suggestions && item.suggestions.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing(2) }}>
                  {item.suggestions.map((s) => (
                    <Chip key={s.label} label={s.label} onPress={() => handleAction(s.action)} />
                  ))}
                </View>
              )}
            </View>
          )}
          ListFooterComponent={
            <View>
              {busy && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing(2) }} />}
              {plan && msgs.length >= 2 && !crisis && (
                <View style={{ marginTop: spacing(3), backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing(3) }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{plan.headline}</Text>
                  {plan.steps.map((s) => (
                    <Text key={s} style={[font.small, { marginTop: 4 }]}>
                      • {s}
                    </Text>
                  ))}
                  {plan.skillId && (
                    <Pressable onPress={() => router.push(`/skill/${plan.skillId}`)} style={{ marginTop: spacing(2) }}>
                      <Text style={{ color: colors.primary, fontWeight: '600' }}>Thử kỹ năng gợi ý →</Text>
                    </Pressable>
                  )}
                </View>
              )}
              {crisis && (
                <View style={{ marginTop: spacing(3) }}>
                  <CrisisCardView
                    card={crisis.card}
                    resources={crisis.resources}
                    onContinue={() => {
                      setAcknowledged(true);
                      setCrisis(null);
                    }}
                  />
                </View>
              )}
            </View>
          }
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            padding: spacing(3),
            gap: spacing(2),
            backgroundColor: colors.bg,
          }}
        >
          {canListen() && (
            <Pressable
              onPress={toggleMic}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: listening ? colors.warn : colors.card,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 18 }}>{listening ? '⏹' : '🎤'}</Text>
            </Pressable>
          )}
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={listening ? 'Đang nghe bạn nói…' : 'Nói với An…'}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={2000}
            style={{
              flex: 1,
              minHeight: 44,
              maxHeight: 120,
              backgroundColor: colors.card,
              borderRadius: 22,
              paddingHorizontal: spacing(4),
              paddingVertical: spacing(2),
              color: colors.text,
              fontSize: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            onSubmitEditing={() => send(input)}
          />
          <Pressable
            onPress={() => send(input)}
            disabled={busy || !input.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: busy || !input.trim() ? 0.45 : 1,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Sidebar open={menu} onClose={() => setMenu(false)} nickname={nick} />
    </SafeAreaView>
  );
}
