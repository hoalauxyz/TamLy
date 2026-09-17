import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { getSkill } from '@tamly/core';
import { Body, Button, Card, Small, Title } from '../../components/ui';
import { colors, font, spacing } from '../../lib/theme';

export default function SkillDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const skill = getSkill(id ?? '');
  const [step, setStep] = useState(-1); // -1 = màn giới thiệu
  const [count, setCount] = useState<number | null>(null);

  const current = skill && step >= 0 ? skill.steps[step] : undefined;

  useEffect(() => {
    if (!current?.seconds) {
      setCount(null);
      return;
    }
    setCount(current.seconds);
    const t = setInterval(() => setCount((c) => (c && c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [current]);

  if (!skill) {
    return (
      <View style={{ flex: 1, padding: spacing(4), backgroundColor: colors.bg }}>
        <Body>Không tìm thấy bài này.</Body>
      </View>
    );
  }

  const done = step >= skill.steps.length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing(4) }}>
      <Stack.Screen options={{ title: skill.title }} />
      {step === -1 && (
        <View>
          <Title>{skill.title}</Title>
          <Small>{skill.minutes} phút</Small>
          <Card style={{ marginTop: spacing(3) }}>
            <Text style={font.small}>Khi nào dùng</Text>
            <Body>{skill.when}</Body>
            <Text style={[font.small, { marginTop: spacing(3) }]}>Vì sao</Text>
            <Body>{skill.why}</Body>
          </Card>
          <Button title="Bắt đầu" onPress={() => setStep(0)} />
        </View>
      )}

      {current && (
        <View>
          <Small>
            Bước {step + 1}/{skill.steps.length}
          </Small>
          <Card style={{ marginTop: spacing(2), minHeight: 180, justifyContent: 'center' }}>
            <Text style={[font.body, { fontSize: 20, lineHeight: 30 }]}>{current.text}</Text>
            {count !== null && (
              <Text style={{ fontSize: 56, fontWeight: '700', color: colors.primary, textAlign: 'center', marginTop: spacing(4) }}>{count}</Text>
            )}
          </Card>
          <View style={{ flexDirection: 'row', gap: spacing(2) }}>
            {step > 0 && <Button title="Lùi" variant="ghost" onPress={() => setStep(step - 1)} />}
            <Button title={step === skill.steps.length - 1 ? 'Xong' : 'Tiếp'} onPress={() => setStep(step + 1)} style={{ flex: 1 }} disabled={count !== null && count > 0} />
          </View>
        </View>
      )}

      {done && (
        <View>
          <Title>Bạn đã làm xong.</Title>
          <Card tone="primary">
            <Body>{skill.closing}</Body>
          </Card>
          <Button title="Ghi lại cảm xúc lúc này (30s)" onPress={() => router.replace('/(tabs)')} />
          <Button title="Quay lại thư viện" variant="ghost" onPress={() => router.back()} style={{ marginTop: spacing(2) }} />
        </View>
      )}
    </ScrollView>
  );
}
