import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CRISIS_CARD_COPY, CRISIS_RESOURCES, DEFAULT_GROUPS, GROUP_RULES, preModeratePost } from '@tamly/core';
import { Body, Button, Card, CrisisCardView, PageHeader, Small } from '../../components/ui';
import { api } from '../../lib/api';
import type { Group, Post } from '../../lib/api';
import { addLocalPost, getLocalPosts } from '../../lib/store';
import { colors, font, radius, spacing } from '../../lib/theme';

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ`;
  return `${Math.floor(h / 24)} ngày`;
}

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const [offline, setOffline] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    api
      .groups()
      .then((gs) => {
        setGroup(gs.find((g) => g.id === id) ?? null);
        setOffline(false);
      })
      .catch(() => {
        const g = DEFAULT_GROUPS.find((x) => x.id === id);
        setGroup(
          g
            ? {
                id: g.id,
                name: g.name,
                description: g.description,
                openHours: g.openHours,
                maxMembers: g.maxMembers,
                postCount: 0,
                isOpen: true,
                rules: [...GROUP_RULES],
              }
            : null,
        );
        setOffline(true);
      });
    api
      .posts(id)
      .then(setPosts)
      .catch(async () => {
        const local = await getLocalPosts(id);
        setPosts(
          local.map((p) => ({
            id: p.id,
            createdAt: p.createdAt,
            content: p.content,
            status: p.status,
            mine: p.mine,
            authorAlias: p.mine ? (p.status === 'approved' ? 'Bạn' : 'Bạn · đang chờ duyệt') : 'Ẩn danh',
          })),
        );
      });
  }, [id]);

  useEffect(load, [load]);

  async function submit() {
    if (!id || !text.trim()) return;
    setBusy(true);
    setNotice(null);
    try {
      if (offline) {
        const mod = preModeratePost(text.trim());
        if (mod.decision === 'redirect_to_support') {
          setNotice(mod.authorMessage);
          setShowCrisis(true);
        } else if (mod.decision === 'reject') {
          setNotice(mod.authorMessage);
        } else {
          const status = mod.decision === 'approve' ? 'approved' : 'held';
          await addLocalPost({ groupId: id, createdAt: new Date().toISOString(), content: text.trim(), status, mine: true });
          setText('');
          setNotice(status === 'approved' ? 'Bài của bạn đã lên (lưu trên máy).' : 'Bài đang chờ duyệt (lưu trên máy).');
          load();
        }
        return;
      }
      const r = await api.createPost(id, text.trim());
      setText('');
      if (r.decision === 'approve') {
        setNotice('Bài của bạn đã lên.');
        load();
      } else if (r.decision === 'hold_for_review') {
        setNotice('Cảm ơn bạn đã chia sẻ. Bài đang chờ người kiểm duyệt xem trước khi hiện, thường trong vài giờ.');
      } else if (r.decision === 'redirect_to_support') {
        setNotice(r.message);
        setShowCrisis(true);
      } else {
        setNotice(r.message);
      }
    } catch {
      setNotice('Không gửi được. Thử lại sau nhé.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4) }}>
        <PageHeader
          kicker="Ẩn danh · có kiểm duyệt"
          title={group?.name ?? 'Nhóm'}
          subtitle={group?.description ?? 'Đang mở nhóm…'}
        />

        <Pressable
          onPress={() => setShowRules(!showRules)}
          style={{ backgroundColor: colors.chipBg, padding: spacing(3), borderRadius: radius.md, marginBottom: spacing(3), borderWidth: 1, borderColor: colors.line }}
        >
          <Small>Nhóm này được kiểm duyệt trước. Không chia sẻ cách tự hại. {showRules ? '▲' : '▼ Xem quy tắc'}</Small>
          {showRules && group && (
            <View style={{ marginTop: spacing(2) }}>
              {group.rules.map((r, i) => (
                <Text key={i} style={font.small}>
                  • {r}
                </Text>
              ))}
            </View>
          )}
        </Pressable>

        {showCrisis && (
          <View style={{ marginBottom: spacing(3) }}>
            <CrisisCardView card={CRISIS_CARD_COPY.self} resources={CRISIS_RESOURCES} onContinue={() => setShowCrisis(false)} />
            <Button title="Nói chuyện riêng với An" variant="secondary" onPress={() => router.push('/(tabs)')} style={{ marginTop: spacing(2) }} />
          </View>
        )}

        <Card>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Chia sẻ điều bạn đang trải qua… (ẩn danh)"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1500}
            style={{ minHeight: 88, color: colors.text, fontSize: 16, lineHeight: 24 }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing(2) }}>
            <Small>{text.length}/1500</Small>
            <Button title="Đăng" onPress={submit} disabled={busy || text.trim().length < 5} />
          </View>
          {notice && <Body muted>{notice}</Body>}
        </Card>

        {posts.length === 0 && <Body muted>Chưa có bài nào. Bạn có thể là người đầu tiên.</Body>}
        {posts.map((p) => (
          <Card key={p.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Small>{p.authorAlias}</Small>
              <Small>{timeAgo(p.createdAt)}</Small>
            </View>
            <Text style={[font.body, { marginTop: spacing(2) }]}>{p.content}</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
