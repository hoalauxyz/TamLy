import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnMark } from './Icons';
import { colors, font, radius, spacing } from '../lib/theme';

const ITEMS: Array<{ label: string; hint: string; href: string }> = [
  { label: 'Cảm xúc hôm nay', hint: 'Check-in ba mươi giây', href: '/journal' },
  { label: 'Kỹ năng ngắn', hint: 'Thở, grounding, ngủ', href: '/(tabs)/skills' },
  { label: 'Nhóm chia sẻ', hint: 'Ẩn danh, có kiểm duyệt', href: '/(tabs)/groups' },
  { label: 'Kiểm tra nhanh', hint: 'Tham khảo, không chẩn đoán', href: '/screening/phq9' },
  { label: 'Người hỗ trợ', hint: 'Chuyên gia — sắp mở', href: '/experts' },
  { label: 'Cài đặt', hint: 'Dữ liệu và quyền riêng tư', href: '/(tabs)/more' },
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
      <View
        style={{
          width: 312,
          maxWidth: '88%',
          backgroundColor: colors.bgElevated,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: spacing(5),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginBottom: spacing(8) }}>
          <AnMark size={44} />
          <View style={{ flex: 1 }}>
            <Text style={font.caption}>Đồng hành</Text>
            <Text style={[font.title, { fontSize: 22, marginTop: 2 }]}>{nickname}</Text>
          </View>
        </View>

        <Pressable onPress={onClose} style={{ paddingVertical: spacing(3), marginBottom: spacing(2) }}>
          <Text style={[font.h2, { color: colors.primary }]}>Trò chuyện</Text>
          <Text style={font.small}>Màn hình chính</Text>
        </Pressable>

        {ITEMS.map((it) => (
          <Pressable key={it.href} onPress={() => go(it.href)} style={{ paddingVertical: spacing(3), borderTopWidth: 1, borderTopColor: colors.line }}>
            <Text style={{ fontWeight: '500', color: colors.ink, fontSize: 16 }}>{it.label}</Text>
            <Text style={[font.small, { marginTop: 2 }]}>{it.hint}</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => go('/crisis')}
          style={{
            marginTop: 'auto',
            borderWidth: 1,
            borderColor: colors.warn,
            borderRadius: radius.pill,
            paddingVertical: spacing(3),
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.warn, fontWeight: '600', letterSpacing: 0.6, fontSize: 13 }}>Cần hỗ trợ ngay</Text>
        </Pressable>
      </View>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(26,23,20,0.28)' }} />
    </View>
  );
}
