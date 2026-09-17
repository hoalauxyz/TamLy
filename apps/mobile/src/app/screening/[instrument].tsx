import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { INSTRUMENTS, scoreInstrument, CRISIS_RESOURCES, CRISIS_CARD_COPY, SCREENING_DISCLAIMER } from '@tamly/core';
import type { Band, InstrumentId, ScreeningResult } from '@tamly/core';
import { Body, Button, Card, CrisisCardView, Small, Title } from '../../components/ui';
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
      <View style={{ flex: 1, padding: spacing(4), backgroundColor: colors.bg }}>
        <Body>Không tìm thấy bộ câu hỏi.</Body>
      </View>
    );
  }

  function answer(v: number) {
    const next = [...answers];
    next[i] = v;
    setAnswers(next);
    if (i + 1 < inst!.items.length) {
      setI(i + 1);
    } else {
      // Tính điểm ngay trên máy (không phụ thuộc mạng); gửi server để lưu lịch sử (best-effort).
      const r = scoreInstrument(inst!.id, next);
      setResult(r);
      api.submitScreening(inst!.id, next).catch(() => undefined);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing(4) }}>
      <Stack.Screen options={{ title: inst.title }} />

      {i === -1 && !result && (
        <View>
          <Title>{inst.title}</Title>
          <Card>
            <Body>{inst.intro}</Body>
            <Small>Khoảng 2–3 phút · {inst.items.length} câu</Small>
          </Card>
          <Card tone="alt">
            <Small>{SCREENING_DISCLAIMER}</Small>
          </Card>
          <Button title="Bắt đầu" onPress={() => setI(0)} />
        </View>
      )}

      {i >= 0 && !result && (
        <View>
          <Small>
            Câu {i + 1}/{inst.items.length}
          </Small>
          <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, marginVertical: spacing(3) }}>
            <View style={{ width: `${((i + 1) / inst.items.length) * 100}%`, height: 4, backgroundColor: colors.primary, borderRadius: 2 }} />
          </View>
          <Small>{inst.timeframe}</Small>
          <Text style={[font.body, { fontSize: 19, lineHeight: 28, marginVertical: spacing(4) }]}>{inst.items[i]}</Text>
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
                borderColor: answers[i] === o.value ? colors.primary : colors.border,
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
          <Small>Kết quả tham khảo</Small>
          <Title>{result.headline}</Title>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing(2) }}>
              <Text style={{ fontSize: 40, fontWeight: '700', color: colors.primary }}>{result.total}</Text>
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
            <Button title="Nói chuyện với An" onPress={() => router.replace('/(tabs)/chat')} />
            <Button title="Về trang chính" variant="ghost" onPress={() => router.replace('/(tabs)')} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}
