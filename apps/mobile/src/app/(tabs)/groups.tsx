import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_GROUPS, GROUP_RULES } from '@tamly/core';
import { Body, Card, Disclaimer, HelpNowButton, PageHeader, Small } from '../../components/ui';
import { api } from '../../lib/api';
import type { Group } from '../../lib/api';
import { colors, radius, spacing } from '../../lib/theme';

export default function Groups() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      api
        .groups()
        .then((g) => {
          setGroups(g);
          setErr(null);
        })
        .catch(() => {
          setGroups(
            DEFAULT_GROUPS.map((g) => ({
              id: g.id,
              name: g.name,
              description: g.description,
              openHours: g.openHours,
              maxMembers: g.maxMembers,
              postCount: 0,
              isOpen: true,
              rules: [...GROUP_RULES],
            })),
          );
          setErr('Đang dùng danh sách nhóm trên máy (chưa kết nối máy chủ). Bài viết sẽ lưu tạm trên thiết bị này.');
        });
    }, []),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4) }}>
        <PageHeader kicker="Cộng đồng" title="Nhóm chia sẻ" subtitle="Theo hoàn cảnh sống, ẩn danh, có kiểm duyệt." />
        <HelpNowButton />
        <Card tone="alt">
          <Small>
            Nhóm theo hoàn cảnh, không theo “bệnh”. Bài viết ẩn danh và được kiểm duyệt trước khi hiện. Không mô tả cách tự hại, không chẩn đoán nhau, không chia sẻ thông tin
            liên hệ.
          </Small>
        </Card>
        {err && <Body muted>{err}</Body>}
        {groups?.map((g) => (
          <Pressable
            key={g.id}
            onPress={() => router.push(`/group/${g.id}`)}
            style={{ backgroundColor: colors.card, borderRadius: radius.md, padding: spacing(4), marginBottom: spacing(3), borderWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ fontWeight: '600', fontSize: 16, color: colors.text }}>{g.name}</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>{g.description}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing(2) }}>
              <Small>{g.postCount} bài viết</Small>
              <Small>{g.isOpen ? 'Đang mở' : 'Tạm đóng'}</Small>
            </View>
          </Pressable>
        ))}
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}
