import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SKILLS, SKILL_CATEGORY_LABELS } from '@tamly/core';
import type { SkillCategory } from '@tamly/core';
import { BackToAn, Chip, Disclaimer, HelpNowButton, Small, Title } from '../../components/ui';
import { colors, radius, spacing } from '../../lib/theme';

// Nội dung kỹ năng đóng gói sẵn trong app (dùng được offline). Server có cùng dữ liệu tại /v1/skills.
export default function Skills() {
  const router = useRouter();
  const [cat, setCat] = useState<SkillCategory | 'all'>('all');
  const cats = Object.keys(SKILL_CATEGORY_LABELS) as SkillCategory[];
  const list = cat === 'all' ? SKILLS : SKILLS.filter((s) => s.category === cat);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4) }}>
        <BackToAn />
        <HelpNowButton />
        <Title>Kỹ năng ngắn</Title>
        <Small>Mỗi bài 2–5 phút. Không cần làm đúng, chỉ cần thử.</Small>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: spacing(3), marginHorizontal: -spacing(4) }} contentContainerStyle={{ paddingHorizontal: spacing(4) }}>
          <Chip label="Tất cả" selected={cat === 'all'} onPress={() => setCat('all')} />
          {cats.map((c) => (
            <Chip key={c} label={SKILL_CATEGORY_LABELS[c]} selected={cat === c} onPress={() => setCat(c)} />
          ))}
        </ScrollView>
        {list.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => router.push(`/skill/${s.id}`)}
            style={{ backgroundColor: colors.card, borderRadius: radius.md, padding: spacing(4), marginBottom: spacing(3), borderWidth: 1, borderColor: colors.border }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '600', fontSize: 16, color: colors.text, flex: 1 }}>{s.title}</Text>
              <Small>{s.minutes} phút</Small>
            </View>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>{s.when}</Text>
          </Pressable>
        ))}
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}
