import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Card, Small, Title } from '../components/ui';
import { api } from '../lib/api';
import { setConsentLlm, setNickname, setOnboarded } from '../lib/store';
import { colors, font, radius, spacing } from '../lib/theme';

const SLIDES = [
  {
    title: 'Bạn không phải đối mặt một mình',
    body: 'Mở Lắng là mở An — kể như kể với một người bạn. Nhật ký, kỹ năng, nhóm và người hỗ trợ nằm trong menu khi bạn cần.',
  },
  {
    title: 'Lắng không chẩn đoán, không điều trị',
    body: 'Mọi kết quả trong app chỉ để tham khảo. An là AI, không phải người thật, và không thay được chuyên gia.',
  },
  {
    title: 'Dữ liệu của bạn, quyền của bạn',
    body: 'Không cần tên thật. Nhật ký và hội thoại lưu trên máy bạn. Máy chủ không giữ nguyên văn chat — chỉ học mẫu cảm xúc/chủ đề. Bạn xóa được mọi thứ bất cứ lúc nào.',
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
            <View style={{ height: 160, borderRadius: radius.lg, backgroundColor: colors.primarySoft, marginBottom: spacing(6) }} />
            <Title>{SLIDES[step]!.title}</Title>
            <Body>{SLIDES[step]!.body}</Body>
            <View style={{ flexDirection: 'row', gap: 6, marginVertical: spacing(6) }}>
              {SLIDES.map((_, i) => (
                <View key={i} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? colors.primary : colors.border }} />
              ))}
            </View>
            <Button title="Tiếp tục" onPress={() => setStep(step + 1)} />
          </View>
        ) : (
          <View>
            <Title>Gọi bạn là gì nhé?</Title>
            <Body muted>Một biệt danh là đủ. Không ai trong app thấy tên thật của bạn.</Body>
            <TextInput
              value={nick}
              onChangeText={setNick}
              placeholder="ví dụ: Mèo Xanh"
              placeholderTextColor={colors.textMuted}
              maxLength={30}
              style={{
                marginTop: spacing(4),
                backgroundColor: '#fff',
                borderRadius: radius.md,
                padding: spacing(4),
                fontSize: 16,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
              }}
            />
            <Card style={{ marginTop: spacing(6) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[font.h2, { flex: 1 }]}>Cho phép An dùng AI để trả lời</Text>
                <Switch value={consentLlm} onValueChange={setConsent} trackColor={{ true: colors.primary }} />
              </View>
              <Small>An dùng AI để trả lời tự nhiên hơn. Tắt được trong Cài đặt.</Small>
            </Card>
            <Button title="Bắt đầu" onPress={finish} disabled={busy || !ageOk} style={{ marginTop: spacing(4) }} />
            <Pressable
              onPress={() => setAgeOk(!ageOk)}
              style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing(3), marginTop: spacing(4) }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: ageOk ? colors.primary : colors.border,
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
