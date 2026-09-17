import { useRouter } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { CrisisCard, CrisisResource } from '@tamly/core';
import { AD_POLICY } from '@tamly/core';
import { colors, font, radius, spacing } from '../lib/theme';
import { isWeb } from '../lib/store';

export function Screen({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Card({ children, style, tone = 'default' }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; tone?: 'default' | 'alt' | 'warn' | 'primary' }>) {
  const bg = tone === 'alt' ? colors.cardAlt : tone === 'warn' ? colors.warnSoft : tone === 'primary' ? colors.primarySoft : colors.card;
  return <View style={[styles.card, { backgroundColor: bg }, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'warn';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = variant === 'primary' ? colors.primary : variant === 'warn' ? colors.warn : variant === 'secondary' ? colors.primarySoft : 'transparent';
  const fg = variant === 'primary' || variant === 'warn' ? '#fff' : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }, style]}
    >
      <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, onPress, selected }: { label: string; onPress?: () => void; selected?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
      <Text style={{ color: selected ? colors.primary : colors.text, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={[font.title, { marginBottom: spacing(2) }]}>{children}</Text>;
}
export function H2({ children }: { children: ReactNode }) {
  return <Text style={[font.h2, { marginBottom: spacing(2) }]}>{children}</Text>;
}
export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[font.body, muted && { color: colors.textMuted }]}>{children}</Text>;
}
export function Small({ children }: { children: ReactNode }) {
  return <Text style={font.small}>{children}</Text>;
}

/** Nút nổi "Cần hỗ trợ ngay" — xuất hiện trên hầu hết màn hình. */
export function HelpNowButton() {
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/crisis')} style={styles.helpNow}>
      <Text style={{ color: '#fff', fontWeight: '700' }}>Cần hỗ trợ ngay</Text>
    </Pressable>
  );
}

/** Màn phụ (kỹ năng, nhóm, cài đặt) quay về trò chuyện — tab bar đã ẩn. */
export function BackToAn() {
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)')} style={{ marginBottom: spacing(3) }}>
      <Text style={{ color: colors.primary, fontWeight: '700' }}>← Trò chuyện với An</Text>
    </Pressable>
  );
}

export function AdBanner() {
  if (!isWeb) return null;
  return (
    <View style={styles.ad} accessibilityRole="text">
      <Text style={[font.small, { textAlign: 'center' }]}>{AD_POLICY.label}</Text>
      <Text style={[font.small, { textAlign: 'center', marginTop: 4 }]}>Banner đối tác (beta) — không cá nhân hóa theo cảm xúc hay nội dung chat.</Text>
    </View>
  );
}

export function Disclaimer() {
  return (
    <Text style={[font.small, { textAlign: 'center', marginTop: spacing(3) }]}>
      An là AI, không phải tư vấn y khoa. Nếu bạn đang không an toàn, hãy dùng “Cần hỗ trợ ngay”.
    </Text>
  );
}

/** Thẻ khẩn cấp cố định (không phải bong bóng chat). */
export type CrisisCardCopy = Pick<CrisisCard, 'title' | 'body' | 'primaryAction' | 'secondaryAction' | 'footer'>;

export function CrisisCardView({
  card,
  resources,
  onContinue,
}: {
  card: CrisisCardCopy;
  resources: CrisisResource[];
  onContinue?: () => void;
}) {
  return (
    <Card tone="warn" style={{ borderColor: colors.warn, borderWidth: 1 }}>
      <Text style={[font.h2, { color: colors.danger }]}>{card.title}</Text>
      <Text style={[font.body, { marginTop: spacing(2) }]}>{card.body}</Text>
      <View style={{ marginTop: spacing(3), gap: spacing(2) }}>
        {resources
          .filter((r) => r.dial)
          .map((r) => (
            <Pressable key={r.id} onPress={() => Linking.openURL(`tel:${r.dial}`)} style={styles.hotline}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.text }}>{r.name}</Text>
                <Text style={font.small}>
                  {r.hours} · {r.audience}
                </Text>
                {r.status === 'needs_verification' && <Text style={[font.small, { color: colors.warn }]}>Đang xác minh giờ hoạt động</Text>}
              </View>
              <Text style={{ fontWeight: '700', color: colors.primary, fontSize: 16 }}>{r.phone}</Text>
            </Pressable>
          ))}
      </View>
      {onContinue && <Button title={card.secondaryAction} variant="ghost" onPress={onContinue} style={{ marginTop: spacing(2) }} />}
      <Text style={[font.small, { marginTop: spacing(2) }]}>{card.footer}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing(4) },
  card: {
    borderRadius: radius.md,
    padding: spacing(4),
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing(3),
  },
  btn: { paddingVertical: spacing(3), paddingHorizontal: spacing(4), borderRadius: radius.pill, alignItems: 'center' },
  btnText: { fontWeight: '600', fontSize: 15 },
  chip: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: radius.pill,
    backgroundColor: colors.chipBg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing(2),
    marginBottom: spacing(2),
  },
  helpNow: {
    alignSelf: 'flex-end',
    backgroundColor: colors.warn,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: radius.pill,
    marginBottom: spacing(3),
  },
  hotline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.sm,
    padding: spacing(3),
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing(2),
  },
  ad: {
    marginTop: spacing(3),
    marginBottom: spacing(2),
    padding: spacing(3),
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
});
