import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius, spacing } from '../lib/theme';

const ITEMS: Array<{ label: string; hint: string; href: string }> = [
  { label: 'Cảm xúc hôm nay', hint: 'Check-in 30 giây', href: '/journal' },
  { label: 'Kỹ năng ngắn', hint: 'Thở, grounding, ngủ…', href: '/(tabs)/skills' },
  { label: 'Nhóm chia sẻ', hint: 'Ẩn danh, có kiểm duyệt', href: '/(tabs)/groups' },
  { label: 'Kiểm tra nhanh', hint: 'Tham khảo, không chẩn đoán', href: '/screening/phq9' },
  { label: 'Người hỗ trợ', hint: 'Sau này: chuyên gia phù hợp', href: '/experts' },
  { label: 'Cài đặt', hint: 'Dữ liệu, quyền riêng tư', href: '/(tabs)/more' },
];

export function Sidebar({ open, onClose, nickname }: { open: boolean; onClose: () => void; nickname: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  if (!open) return null;

  function go(href: string) {
    onClose();
    router.push(href as never);
  }

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 50, flexDirection: 'row' }}>
      <View style={{ width: 300, maxWidth: '86%', backgroundColor: colors.card, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16, paddingHorizontal: spacing(4) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginBottom: spacing(5) }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 20 }}>🌿</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={font.h2}>An</Text>
            <Text style={font.small}>Bạn đồng hành của {nickname}</Text>
          </View>
        </View>

        <Pressable onPress={onClose} style={{ paddingVertical: spacing(3), marginBottom: spacing(2) }}>
          <Text style={{ fontWeight: '700', color: colors.primary }}>Trò chuyện</Text>
          <Text style={font.small}>Màn hình chính</Text>
        </Pressable>

        {ITEMS.map((it) => (
          <Pressable key={it.href} onPress={() => go(it.href)} style={{ paddingVertical: spacing(3), borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text style={{ fontWeight: '600', color: colors.text }}>{it.label}</Text>
            <Text style={font.small}>{it.hint}</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => go('/crisis')}
          style={{ marginTop: spacing(5), backgroundColor: colors.warn, borderRadius: radius.pill, paddingVertical: spacing(3), alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Cần hỗ trợ ngay</Text>
        </Pressable>
      </View>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(46,42,37,0.28)' }} />
    </View>
  );
}
