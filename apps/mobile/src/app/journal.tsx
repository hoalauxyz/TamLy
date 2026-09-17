import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Card, Chip, Disclaimer, H2, HelpNowButton, PageHeader, Small, AdBanner } from '../components/ui';
import { describeMoodTrend } from '@tamly/core';
import { api } from '../lib/api';
import { addLocalCheckin, getLocalCheckins, getNickname } from '../lib/store';
import type { LocalCheckin } from '../lib/store';
import { colors, font, radius, spacing } from '../lib/theme';

const MOODS = [
  { v: 1, e: '😞', l: 'Rất tệ' },
  { v: 2, e: '😕', l: 'Không ổn' },
  { v: 3, e: '😐', l: 'Tạm' },
  { v: 4, e: '🙂', l: 'Khá ổn' },
  { v: 5, e: '😄', l: 'Tốt' },
];
const TAGS = ['Học tập', 'Công việc', 'Gia đình', 'Tình cảm', 'Bạn bè', 'Tiền', 'Ngủ', 'Khác'];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function MiniTrend({ data }: { data: LocalCheckin[] }) {
  const days: Array<{ label: string; mood: number | null }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toDateString();
    const items = data.filter((c) => new Date(c.at).toDateString() === key);
    const avg = items.length ? items.reduce((s, c) => s + c.mood, 0) / items.length : null;
    days.push({ label: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]!, mood: avg });
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, marginTop: spacing(2) }}>
      {days.map((d, i) => (
        <View key={i} style={{ alignItems: 'center', flex: 1 }}>
          <View
            style={{
              width: 18,
              height: d.mood ? 12 + (d.mood / 5) * 50 : 6,
              borderRadius: 6,
              backgroundColor: d.mood ? colors.primary : colors.border,
              opacity: d.mood ? 0.4 + d.mood / 8 : 1,
            }}
          />
          <Small>{d.label}</Small>
        </View>
      ))}
    </View>
  );
}

export default function Journal() {
  const router = useRouter();
  const [nick, setNick] = useState('bạn');
  const [checkins, setCheckins] = useState<LocalCheckin[]>([]);
  const [mood, setMood] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [suggestScreening, setSuggestScreening] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getNickname().then(setNick);
      getLocalCheckins().then((c) => {
        setCheckins(c);
        setSuggestScreening(c.length >= 3);
      });
    }, []),
  );

  const doneToday = checkins.some((c) => isToday(c.at));
  const weekNote = describeMoodTrend(checkins);

  async function save() {
    if (!mood) return;
    setSaving(true);
    try {
      const entry: LocalCheckin = { at: new Date().toISOString(), mood, tags, note: note.trim() || undefined };
      const all = await addLocalCheckin(entry);
      setCheckins(all);
      setMood(null);
      setTags([]);
      setNote('');
      api
        .checkin({ mood: entry.mood, tags, note: entry.note })
        .then((r) => setSuggestScreening(r.suggestScreening))
        .catch(() => setSuggestScreening(all.length >= 3));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4) }}>
        <PageHeader kicker={greeting()} title={`${nick}, hôm nay thế nào?`} subtitle="Một nhịp nhỏ, không phải báo cáo." />
        <HelpNowButton />

        {!doneToday ? (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {MOODS.map((m) => (
                <Pressable key={m.v} onPress={() => setMood(m.v)} style={{ alignItems: 'center', opacity: mood && mood !== m.v ? 0.4 : 1 }}>
                  <Text style={{ fontSize: 34 }}>{m.e}</Text>
                  <Small>{m.l}</Small>
                </Pressable>
              ))}
            </View>
            {mood && (
              <View style={{ marginTop: spacing(4) }}>
                <Small>Điều gì đang ảnh hưởng? (tùy chọn)</Small>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing(2) }}>
                  {TAGS.map((t) => (
                    <Chip key={t} label={t} selected={tags.includes(t)} onPress={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t].slice(0, 3))} />
                  ))}
                </View>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Thêm một dòng nếu muốn (không bắt buộc)"
                  placeholderTextColor={colors.textMuted}
                  maxLength={280}
                  style={{
                    marginTop: spacing(3),
                    backgroundColor: colors.bg,
                    borderRadius: radius.md,
                    padding: spacing(3),
                    color: colors.text,
                    fontSize: 15,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                />
                <Button title="Lưu (30 giây là xong)" onPress={save} disabled={saving} style={{ marginTop: spacing(2) }} />
              </View>
            )}
          </Card>
        ) : (
          <Card tone="primary">
            <Body>Bạn đã check-in hôm nay. Cảm ơn bạn đã dành 30 giây cho mình.</Body>
          </Card>
        )}

        {checkins.length > 0 && (
          <Card>
            <H2>Xu hướng gần đây</H2>
            <MiniTrend data={checkins} />
            {weekNote ? <Body muted>{weekNote}</Body> : null}
          </Card>
        )}

        {suggestScreening && (
          <Card tone="alt">
            <H2>Muốn nhìn rõ hơn không?</H2>
            <Body muted>Một bài kiểm tra tham khảo 3 phút có thể giúp bạn thấy bức tranh hai tuần qua.</Body>
            <View style={{ flexDirection: 'row', gap: spacing(2), marginTop: spacing(3) }}>
              <Button title="Tâm trạng (PHQ-9)" variant="secondary" onPress={() => router.push('/screening/phq9')} style={{ flex: 1 }} />
              <Button title="Lo lắng (GAD-7)" variant="secondary" onPress={() => router.push('/screening/gad7')} style={{ flex: 1 }} />
            </View>
          </Card>
        )}

        <Button title="Quay lại nói với An" onPress={() => router.replace('/(tabs)')} style={{ marginTop: spacing(2) }} />
        <Disclaimer />
        <AdBanner />
      </ScrollView>
    </SafeAreaView>
  );
}
