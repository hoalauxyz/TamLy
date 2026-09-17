import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PLACEHOLDER_SUPPORT, formatVnd } from '@tamly/core';
import { Body, Button, Card, HelpNowButton, PageHeader, Small } from '../components/ui';
import { colors, font, spacing } from '../lib/theme';

export default function Experts() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
    <ScrollView contentContainerStyle={{ padding: spacing(4) }}>
      <PageHeader kicker="Kết nối" title="Người thật" subtitle="Minh họa. Đặt lịch sẽ mở khi đã xác minh giấy phép." />
      <HelpNowButton />
      <Card tone="alt">
        <Body>
          Hai tầng hỗ trợ: người lắng nghe (giá sinh viên) và chuyên gia tham vấn đã xác minh. MVP đang dùng hồ sơ minh họa — chưa mở đặt lịch thật, chưa xác minh giấy phép.
        </Body>
      </Card>

      {PLACEHOLDER_SUPPORT.map((p) => (
        <Card key={p.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[font.h2, { flex: 1 }]}>{p.displayName}</Text>
            <Small>{p.tier === 'listener' ? 'Người lắng nghe' : 'Tham vấn'}</Small>
          </View>
          <Small>{p.focus}</Small>
          <Body muted>{p.intro}</Body>
          <View style={{ marginTop: spacing(2) }}>
            <Body>
              {formatVnd(p.studentPriceVnd)} / {p.sessionMinutes} phút
              {p.studentPriceVnd !== p.priceVnd ? ` · giá thường ${formatVnd(p.priceVnd)}` : ''}
            </Body>
            <Small>{p.format === 'video' ? 'Video call' : 'Chat'} · {p.placeholder ? 'Minh họa' : 'Đã xác minh'}</Small>
          </View>
          <Button
            title="Đặt lịch (sắp mở)"
            variant="secondary"
            onPress={() => undefined}
            disabled
            style={{ marginTop: spacing(3), opacity: 0.6 }}
          />
        </Card>
      ))}

      <Button title="Cần hỗ trợ ngay (hotline)" variant="warn" onPress={() => router.push('/crisis')} />
      <Small>Khi mở thật: xác minh giấy phép, hợp đồng, và phân biệt rõ tham vấn (không phải khám chữa bệnh) với trị liệu lâm sàng.</Small>
    </ScrollView>
    </SafeAreaView>
  );
}
