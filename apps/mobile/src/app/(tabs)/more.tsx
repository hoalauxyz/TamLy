import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner, BackToAn, Body, Button, Card, H2, HelpNowButton, Small, Title } from '../../components/ui';
import { api } from '../../lib/api';
import { getConsentLlm, getNickname, setConsentLlm, wipeLocalData } from '../../lib/store';
import { colors, font, spacing } from '../../lib/theme';

export default function More() {
  const router = useRouter();
  const [nick, setNick] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getNickname().then(setNick);
    getConsentLlm().then(setConsent);
  }, []);

  async function toggleConsent(v: boolean) {
    setConsent(v);
    await setConsentLlm(v);
    api.updateMe({ consentLlm: v }).catch(() => undefined);
  }

  async function exportData() {
    setBusy(true);
    try {
      const data = await api.exportMe();
      Alert.alert('Dữ liệu của bạn', `Server đang giữ: ${data.checkins.length} check-in, ${data.screenings.length} bài sàng lọc, ${data.posts.length} bài viết nhóm. Hội thoại với An không lưu nguyên văn trên máy chủ.\n\nBản đầy đủ (JSON) sẽ có nút tải về trong bản tiếp theo.`);
    } catch {
      Alert.alert('Không kết nối được máy chủ.');
    } finally {
      setBusy(false);
    }
  }

  function deleteAll() {
    Alert.alert('Xóa toàn bộ dữ liệu?', 'Mọi check-in, kết quả sàng lọc, tin nhắn với An và bài viết của bạn sẽ bị xóa khỏi máy này và khỏi máy chủ. Không khôi phục được.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa hết',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await api.deleteMe().catch(() => undefined);
            await wipeLocalData();
            router.replace('/onboarding');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4) }}>
        <BackToAn />
        <HelpNowButton />
        <Title>Xin chào, {nick}</Title>

        <H2>Người thật</H2>
        <Card>
          <Body>Khi bạn muốn nói với một người có chuyên môn thay vì AI.</Body>
          <View style={{ marginTop: spacing(3), gap: spacing(2) }}>
            <Button title="Xem người lắng nghe & chuyên gia" onPress={() => router.push('/experts')} />
            <Button title="Kiểm tra tâm trạng (PHQ-9, tham khảo)" variant="secondary" onPress={() => router.push('/screening/phq9')} />
            <Button title="Kiểm tra lo lắng (GAD-7, tham khảo)" variant="secondary" onPress={() => router.push('/screening/gad7')} />
            <Button title="Phòng tham vấn tâm lý ở trường bạn" variant="secondary" onPress={() => Alert.alert('Gợi ý', 'Hầu hết trường ĐH lớn (KHXH&NV, Sư phạm, Bách khoa, Y…) có phòng tham vấn miễn phí cho sinh viên. Hỏi phòng Công tác sinh viên hoặc tìm “tham vấn tâm lý + tên trường”.')} />
            <Button title="Đường dây hỗ trợ & khẩn cấp" variant="secondary" onPress={() => router.push('/crisis')} />
          </View>
        </Card>

        <H2>Quyền riêng tư & dữ liệu</H2>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[font.body, { flex: 1, fontWeight: '600' }]}>Cho phép An dùng AI</Text>
            <Switch value={consent} onValueChange={toggleConsent} trackColor={{ true: colors.primary }} />
          </View>
          <Small>Khi tắt, tin nhắn của bạn không rời khỏi máy chủ Lắng; An trả lời bằng kịch bản có sẵn. Phát hiện khủng hoảng vẫn hoạt động.</Small>
        </Card>
        <Card>
          <Body>• Check-in lưu trên máy bạn; máy chủ chỉ giữ điểm tâm trạng/tag để An nhớ xu hướng.</Body>
          <Body>• Hội thoại nằm trên máy bạn. Máy chủ không lưu nguyên văn — chỉ ghi mẫu cảm xúc, chủ đề, ý định.</Body>
          <Body>• Không bán dữ liệu. An không train trên nội dung chat thô.</Body>
          <Body>• Quảng cáo (nếu có) chỉ là banner trên trang, không chèn vào câu trả lời của An, không nhắm theo cảm xúc.</Body>
          <View style={{ marginTop: spacing(3), gap: spacing(2) }}>
            <Button title="Xem dữ liệu của tôi" variant="secondary" onPress={exportData} disabled={busy} />
            <Button title="Xóa toàn bộ dữ liệu" variant="warn" onPress={deleteAll} disabled={busy} />
          </View>
        </Card>

        <H2>Về Lắng</H2>
        <Card>
          <Body>Lắng là không gian hỗ trợ sức khỏe tinh thần cho người trẻ Việt Nam. Lắng không chẩn đoán, không điều trị, không thay thế bác sĩ hay nhà tâm lý.</Body>
          <Body>An là AI. Các bài sàng lọc là công cụ tham khảo, kết quả không phải kết luận y khoa.</Body>
          <View style={{ marginTop: spacing(3), gap: spacing(2) }}>
            <Button title="Điều khoản & Chính sách quyền riêng tư" variant="ghost" onPress={() => Linking.openURL('https://example.com/lang/privacy')} />
            <Button title="Báo lỗi / góp ý" variant="ghost" onPress={() => Linking.openURL('mailto:hello@example.com?subject=Lắng%20-%20góp%20ý')} />
          </View>
          <Small>Phiên bản 0.1.1 (bản thử nghiệm)</Small>
        </Card>
        <AdBanner />
      </ScrollView>
    </SafeAreaView>
  );
}
