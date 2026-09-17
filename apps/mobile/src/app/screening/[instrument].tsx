import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { INSTRUMENTS, scoreInstrument, CRISIS_RESOURCES, CRISIS_CARD_COPY, SCREENING_DISCLAIMER } from '@tamly/core';
import type { Band, InstrumentId, ScreeningResult } from '@tamly/core';
import { Body, Button, Card, CrisisCardView, HelpNowButton, PageHeader, Small } from '../../components/ui';
import { api } from '../../lib/api';
import { colors, font, radius, spacing } from '../../lib/theme';

const BAND_LABEL: Record<Band, string> = {
  minimal: 'Rất ít',
  mild: 'Nhẹ',
  moderate: 'Đáng chú ý',
  high: 'Nhiều',
};

export default function Screening() {
  const { instrument } = useLocalSearchParams<{ instrument: string }>();
  const router = useRouter();
  const inst = instrument === 'phq9' || instrument === 'gad7' ? INSTRUMENTS[instrument as InstrumentId] : undefined;
  const [i, setI] = useState(-1); // -1 = màn giới thiệu
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [crisisAck, setCrisisAck] = useState(false);

  if (!inst) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <View style={{ padding: spacing(4) }}>
          <PageHeader kicker="Tham khảo" title="Không tìm thấy bộ câu hỏi" subtitle="Quay lại nói với An, hoặc mở kiểm tra từ menu." />
        </View>
      </SafeAreaView>
    );
  }

  function answer(v: number) {
    const next = [...answers];
    next[i] = v;
    setAnswers(next);
    if (i + 1 < inst!.items.length) {
      setI(i + 1);
    } else {
      const r = scoreInstrument(inst!.id, next);
      setResult(r);
      api.submitScreening(inst!.id, next).catch(() => undefined);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4) }}>
        {i === -1 && !result && (
          <View>
            <PageHeader kicker="Tham khảo · 2–3 phút" title={inst.title} subtitle={inst.intro} />
            <HelpNowButton />
            <Card tone="alt">
              <Small>{SCREENING_DISCLAIMER}</Small>
            </Card>
            <Small>{inst.items.length} câu · kết quả không phải chẩn đoán</Small>
            <Button title="Bắt đầu" onPress={() => setI(0)} style={{ marginTop: spacing(4) }} />
          </View>
        )}

        {i >= 0 && !result && (
          <View>
            <Text style={font.caption}>
              Câu {i + 1} / {inst.items.length}
            </Text>
            <View style={{ height: 3, backgroundColor: colors.line, borderRadius: 2, marginVertical: spacing(3) }}>
              <View style={{ width: `${((i + 1) / inst.items.length) * 100}%`, height: 3, backgroundColor: colors.primary, borderRadius: 2 }} />
            </View>
            <Small>{inst.timeframe}</Small>
            <Text style={[font.title, { fontSize: 22, lineHeight: 30, marginVertical: spacing(5) }]}>{inst.items[i]}</Text>
            {inst.options.map((o) => (
              <Pressable
                key={o.value}
                onPress={() => answer(o.value)}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: radius.md,
                  padding: spacing(4),
                  marginBottom: spacing(2),
                  borderWidth: 1,
                  borderColor: answers[i] === o.value ? colors.primary : colors.line,
                }}
              >
                <Text style={font.body}>{o.label}</Text>
              </Pressable>
            ))}
            {i > 0 && <Button title="Câu trước" variant="ghost" onPress={() => setI(i - 1)} />}
          </View>
        )}

        {result && (
          <View>
            {result.safetyFlag && !crisisAck && (
              <View style={{ marginBottom: spacing(3) }}>
                <CrisisCardView card={CRISIS_CARD_COPY.self} resources={CRISIS_RESOURCES} onContinue={() => setCrisisAck(true)} />
              </View>
            )}
            <PageHeader kicker="Kết quả tham khảo" title={result.headline} subtitle="Một bức tranh sơ bộ, không phải kết luận y khoa." />
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing(2) }}>
                <Text style={[font.display, { fontSize: 44, lineHeight: 48, color: colors.primary }]}>{result.total}</Text>
                <Small>
                  / {result.max} · {BAND_LABEL[result.band]}
                </Small>
              </View>
              <Body>{result.explanation}</Body>
            </Card>
            <Card tone="alt">
              <Text style={[font.h2, { marginBottom: spacing(2) }]}>Bạn có thể</Text>
              {result.nextSteps.map((r, idx) => (
                <Text key={idx} style={[font.body, { marginBottom: spacing(1) }]}>
                  • {r}
                </Text>
              ))}
              <Small>Làm lại sau khoảng {result.retestInDays} ngày để thấy xu hướng.</Small>
            </Card>
            <Small>{result.disclaimer}</Small>
            <View style={{ marginTop: spacing(4), gap: spacing(2) }}>
              <Button title="Nói chuyện với An" onPress={() => router.replace('/(tabs)')} />
              <Button title="Về cảm xúc hôm nay" variant="ghost" onPress={() => router.replace('/journal')} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
