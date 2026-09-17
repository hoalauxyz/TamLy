import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSkill } from '@tamly/core';
import { Body, Button, Card, PageHeader } from '../../components/ui';
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <View style={{ padding: spacing(4) }}>
          <PageHeader kicker="Thư viện" title="Không tìm thấy bài này" subtitle="Quay lại thư viện hoặc nói với An." />
        </View>
      </SafeAreaView>
    );
  }

  const done = step >= skill.steps.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4) }}>
        {step === -1 && (
          <View>
            <PageHeader kicker={`${skill.minutes} phút`} title={skill.title} subtitle={skill.when} />
            <Card>
              <Text style={font.caption}>Vì sao</Text>
              <Body>{skill.why}</Body>
            </Card>
            <Button title="Bắt đầu" onPress={() => setStep(0)} />
          </View>
        )}

        {current && (
          <View>
            <Text style={font.caption}>
              Bước {step + 1} / {skill.steps.length}
            </Text>
            <Text style={[font.title, { marginTop: spacing(3), marginBottom: spacing(4) }]}>{skill.title}</Text>
            <Card style={{ minHeight: 200, justifyContent: 'center' }}>
              <Text style={[font.body, { fontSize: 20, lineHeight: 30 }]}>{current.text}</Text>
              {count !== null && (
                <Text style={[font.display, { fontSize: 56, lineHeight: 64, color: colors.primary, textAlign: 'center', marginTop: spacing(5) }]}>{count}</Text>
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
            <PageHeader kicker="Xong" title="Bạn đã làm xong." subtitle="Không cần làm đúng. Chỉ cần đã thử." />
            <Card tone="primary">
              <Body>{skill.closing}</Body>
            </Card>
            <Button title="Ghi lại cảm xúc lúc này" onPress={() => router.replace('/journal')} />
            <Button title="Quay lại thư viện" variant="ghost" onPress={() => router.back()} style={{ marginTop: spacing(2) }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
