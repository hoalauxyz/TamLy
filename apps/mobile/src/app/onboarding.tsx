import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnMark } from '../components/Icons';
import { Body, Button, Card, Small } from '../components/ui';
import { api } from '../lib/api';
import { setConsentLlm, setNickname, setOnboarded } from '../lib/store';
import { colors, font, radius, spacing } from '../lib/theme';

const SLIDES = [
  {
    kicker: '01',
    title: 'Một chỗ để kể.',
    body: 'Mở Lắng là gặp An. Nhật ký, kỹ năng, nhóm và người hỗ trợ nằm trong menu — khi bạn cần, không khi app muốn.',
  },
  {
    kicker: '02',
    title: 'Không chẩn đoán.',
    body: 'An là AI. Kết quả trong app chỉ để tham khảo. Việc nặng hơn — gặp người thật.',
  },
  {
    kicker: '03',
    title: 'Chuyện của bạn ở lại với bạn.',
    body: 'Không cần tên thật. Hội thoại lưu trên máy. Máy chủ không giữ nguyên văn — chỉ học mẫu cảm xúc và chủ đề.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [nick, setNick] = useState('');
  const [consentLlm, setConsent] = useState(true);
  const [ageOk, setAgeOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const last = step === SLIDES.length;

  async function finish() {
    setBusy(true);
    try {
      const name = nick.trim() || 'bạn';
      await setNickname(name);
      await setConsentLlm(consentLlm);
      await setOnboarded();
      api.updateMe({ nickname: name, consentLlm, consentResearch: true, consentImprove: true }).catch(() => undefined);
      router.replace('/(tabs)');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing(6), flexGrow: 1, justifyContent: 'center' }}>
        {!last ? (
          <View>
            <AnMark size={56} />
            <Text style={[font.caption, { marginTop: spacing(8) }]}>{SLIDES[step]!.kicker}</Text>
            <Text style={[font.display, { marginTop: spacing(3), fontSize: 34 }]}>{SLIDES[step]!.title}</Text>
            <Body>{SLIDES[step]!.body}</Body>
            <View style={{ flexDirection: 'row', gap: 6, marginVertical: spacing(8) }}>
              {SLIDES.map((_, i) => (
                <View key={i} style={{ width: i === step ? 22 : 6, height: 6, borderRadius: 3, backgroundColor: i === step ? colors.primary : colors.line }} />
              ))}
            </View>
            <Button title="Tiếp tục" onPress={() => setStep(step + 1)} />
          </View>
        ) : (
          <View>
            <Text style={font.caption}>Biệt danh</Text>
            <Text style={[font.display, { marginTop: spacing(2), fontSize: 30 }]}>Gọi bạn là gì?</Text>
            <Body muted>Một tên nhỏ là đủ. Không ai trong app thấy tên thật.</Body>
            <TextInput
              value={nick}
              onChangeText={setNick}
              placeholder="ví dụ: Mèo"
              placeholderTextColor={colors.textFaint}
              maxLength={30}
              style={{
                marginTop: spacing(5),
                backgroundColor: colors.card,
                borderRadius: radius.md,
                padding: spacing(4),
                fontSize: 18,
                borderWidth: 1,
                borderColor: colors.line,
                color: colors.ink,
              }}
            />
            <Card style={{ marginTop: spacing(5) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[font.h2, { flex: 1, paddingRight: spacing(3) }]}>An dùng AI để trả lời</Text>
                <Switch value={consentLlm} onValueChange={setConsent} trackColor={{ true: colors.primary }} />
              </View>
              <Small>Tắt được trong Cài đặt. Crisis vẫn chạy.</Small>
            </Card>
            <Button title="Bắt đầu" onPress={finish} disabled={busy || !ageOk} style={{ marginTop: spacing(4) }} />
            <Pressable
              onPress={() => setAgeOk(!ageOk)}
              style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing(3), marginTop: spacing(4) }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: ageOk ? colors.primary : colors.line,
                  backgroundColor: ageOk ? colors.primary : 'transparent',
                  marginTop: 2,
                }}
              />
              <Small>Tôi từ 16 tuổi. An là AI, không phải tư vấn y khoa, không thay cấp cứu.</Small>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
