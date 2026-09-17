import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CRISIS_CARD_COPY, CRISIS_RESOURCES } from '@tamly/core';
import type { CrisisResource } from '@tamly/core';
import { Body, Card, CrisisCardView, H2, PageHeader, Small } from '../components/ui';
import { api } from '../lib/api';
import { colors, spacing } from '../lib/theme';

/**
 * Màn "Cần hỗ trợ ngay". Dùng danh sách đóng gói sẵn để hiện tức thì,
 * rồi thay bằng danh sách từ server nếu lấy được (để số/giờ luôn cập nhật).
 */
export default function Crisis() {
  const [resources, setResources] = useState<CrisisResource[]>(CRISIS_RESOURCES);

  useEffect(() => {
    api
      .crisisResources()
      .then((r) => r.length && setResources(r))
      .catch(() => undefined);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing(4) }}>
        <PageHeader kicker="Khẩn cấp" title="Hỗ trợ ngay" subtitle="Bạn không cần giải thích. Gọi trước, kể sau." />
        <CrisisCardView card={CRISIS_CARD_COPY.self} resources={resources} />

        <Card>
          <H2>Ngay lúc này, bạn có thể</H2>
          <Body>• Ở cạnh một người khác, kể cả khi không nói gì.</Body>
          <Body>• Tạm để những thứ có thể gây hại ra xa tầm tay.</Body>
          <Body>• Thở ra dài hơn hít vào, vài lần. Không cần làm đúng.</Body>
          <Body>• Nhắn cho một người bạn tin: “Mình đang không ổn, ở với mình được không?”</Body>
        </Card>

        <Card tone="alt">
          <H2>Nếu bạn lo cho một người khác</H2>
          <Body>Hãy hỏi thẳng và bình tĩnh: “Bạn có đang nghĩ đến việc làm hại bản thân không?” Hỏi không làm họ “nghĩ ra”. Ở cạnh họ và gọi giúp họ một trong các số ở trên.</Body>
        </Card>

        <View style={{ marginTop: spacing(2) }}>
          <Small>
            Các số này được đội ngũ kiểm tra định kỳ. Nếu bạn gọi mà không được, hãy gọi 115 (cấp cứu) hoặc đến cơ sở y tế gần nhất.
          </Small>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
