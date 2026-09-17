import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activeResources, buildContextSummary, runChatTurn } from '@tamly/core';
import type { CrisisCard, CrisisResource, ScriptedReply, SuggestedAction } from '@tamly/core';
import { CrisisCardView } from '../../components/ui';
import { AnMark, IconButton, MenuIcon } from '../../components/Icons';
import { Sidebar } from '../../components/Sidebar';
import { api, ApiError } from '../../lib/api';
import {
  getLocalChat,
  getLocalCheckins,
  getNickname,
  getOrCreateSessionId,
  resetSession,
  setCompanionMemory,
  setLocalChat,
} from '../../lib/store';
import { canListen, canSpeak, speak, startListening, stopListening, stopSpeaking } from '../../lib/voice';
import { colors, font, radius, shadowFloat, shadowSoft, spacing } from '../../lib/theme';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: ScriptedReply['suggestions'];
}

const OPENERS = [
  { k: 'study', t: 'Áp lực học đang đè' },
  { k: 'tired', t: 'Mệt mà không gọi được tên' },
  { k: 'home', t: 'Muốn kể chuyện nhà' },
];

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
  const [situation, setSituation] = useState<string | null>(null);
  const [crisis, setCrisis] = useState<{ card: CrisisCard; resources: CrisisResource[] } | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const list = useRef<FlatList<Msg>>(null);

  useEffect(() => {
    getNickname().then(setNick);
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
        await setCompanionMemory({
          emotion: r.analysis.emotion,
          topics: r.analysis.topics,
          intensity: r.analysis.intensity,
          updatedAt: new Date().toISOString(),
        });
      }
      if (r.situation?.label) setSituation(r.situation.label);
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
        await setCompanionMemory({
          emotion: r.analysis.emotion,
          topics: r.analysis.topics,
          intensity: r.analysis.intensity,
          updatedAt: new Date().toISOString(),
        });
        if (r.situation?.label) setSituation(r.situation.label);
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
    setSituation(null);
    await setLocalChat([]);
  }

  const hour = new Date().getHours();
  const hello = hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View
        style={{
          paddingHorizontal: spacing(4),
          paddingVertical: spacing(2),
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: colors.line,
        }}
      >
        <IconButton onPress={() => setMenu(true)}>
          <MenuIcon />
        </IconButton>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginLeft: spacing(1) }}>
          <AnMark size={36} />
          <View>
            <Text style={[font.h2, { letterSpacing: 0.4 }]}>An</Text>
            <Text style={font.caption}>{busy ? 'Đang nghe' : situation ?? 'Luôn ở đây'}</Text>
          </View>
        </View>
        {canSpeak() && (
          <IconButton onPress={() => setSpeakOn(!speakOn)} dim={!speakOn}>
            <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '600' }}>{speakOn ? 'On' : 'Âm'}</Text>
          </IconButton>
        )}
        <IconButton onPress={newSession}>
          <Text style={{ color: colors.textMuted, fontSize: 20, lineHeight: 22, marginTop: -2 }}>+</Text>
        </IconButton>
        <Pressable
          onPress={() => router.push('/crisis')}
          style={{ marginLeft: spacing(1), paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.warn }}
        >
          <Text style={{ color: colors.warn, fontSize: 11, fontWeight: '600', letterSpacing: 0.8 }}>HỖ TRỢ</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={12}>
        <FlatList
          ref={list}
          data={msgs}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: spacing(4), paddingTop: spacing(6), paddingBottom: spacing(3), gap: spacing(4), flexGrow: 1 }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: spacing(8) }}>
              <Text style={font.caption}>Lắng</Text>
              <Text style={[font.display, { marginTop: spacing(3) }]}>
                {hello},{'\n'}
                {nick}.
              </Text>
              <Text style={[font.body, { color: colors.textMuted, marginTop: spacing(3), maxWidth: 320 }]}>
                Kể chậm cũng được. Mình nhớ chuyện bạn đang nói — không cần bắt đầu lại.
              </Text>
              <View style={{ marginTop: spacing(8), gap: spacing(2) }}>
                {OPENERS.map((o) => (
                  <Pressable
                    key={o.k}
                    onPress={() => send(o.t)}
                    style={({ pressed }) => [
                      {
                        paddingVertical: spacing(3),
                        paddingHorizontal: spacing(4),
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: colors.line,
                        backgroundColor: pressed ? colors.primarySoft : colors.bgElevated,
                      },
                    ]}
                  >
                    <Text style={[font.body, { fontSize: 15 }]}>{o.t}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ alignItems: item.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {item.role === 'assistant' && (
                <Text style={[font.caption, { marginBottom: spacing(1), marginLeft: 4 }]}>An</Text>
              )}
              <View
                style={[
                  {
                    maxWidth: '86%',
                    paddingVertical: spacing(3),
                    paddingHorizontal: spacing(4),
                    borderRadius: 22,
                  },
                  item.role === 'user'
                    ? { backgroundColor: colors.userBubble, borderBottomRightRadius: 6 }
                    : [{ backgroundColor: colors.botBubble, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: colors.line }, shadowSoft],
                ]}
              >
                <Text style={[font.body, { color: item.role === 'user' ? '#F6F1E8' : colors.ink, fontSize: 16, lineHeight: 24 }]}>{item.content}</Text>
              </View>
              {item.suggestions && item.suggestions.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing(2), gap: spacing(1) }}>
                  {item.suggestions.map((s) => (
                    <Pressable
                      key={s.label}
                      onPress={() => handleAction(s.action)}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: radius.pill,
                        borderWidth: 1,
                        borderColor: colors.line,
                        backgroundColor: colors.bgElevated,
                      }}
                    >
                      <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '500' }}>{s.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
          ListFooterComponent={
            <View>
              {busy && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginTop: spacing(2) }}>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text style={font.small}>An đang đọc lại điều bạn vừa nói…</Text>
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

        <View style={{ paddingHorizontal: spacing(3), paddingBottom: spacing(3), paddingTop: spacing(1) }}>
          <View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'flex-end',
                backgroundColor: colors.card,
                borderRadius: 28,
                padding: 6,
                borderWidth: 1,
                borderColor: colors.line,
                gap: 4,
              },
              shadowFloat,
            ]}
          >
            {canListen() && (
              <Pressable
                onPress={toggleMic}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: listening ? colors.warn : colors.cardAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: listening ? 10 : 8,
                    height: listening ? 10 : 14,
                    borderRadius: listening ? 2 : 8,
                    backgroundColor: listening ? '#fff' : colors.primary,
                  }}
                />
              </Pressable>
            )}
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={listening ? 'Đang nghe bạn…' : 'Nói với An'}
              placeholderTextColor={colors.textFaint}
              multiline
              maxLength={2000}
              style={{
                flex: 1,
                minHeight: 44,
                maxHeight: 120,
                paddingHorizontal: spacing(2),
                paddingVertical: 11,
                color: colors.ink,
                fontSize: 16,
                lineHeight: 22,
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
                backgroundColor: busy || !input.trim() ? colors.cardAlt : colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: busy || !input.trim() ? colors.textFaint : '#F6F1E8', fontSize: 18, fontWeight: '600' }}>↑</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Sidebar open={menu} onClose={() => setMenu(false)} nickname={nick} />
    </SafeAreaView>
  );
}
