/**
 * Hệ thống thị giác: ấm, tĩnh, editorial — không “app sức khỏe rẻ”.
 * Serif cho tiêu đề, sans hệ thống cho thân. Rừng sâu + ngà, không mint phẳng.
 */
import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const colors = {
  canvas: '#E8E0D4',
  bg: '#F6F1E8',
  bgElevated: '#FBFAF7',
  card: '#FFFcf8',
  cardAlt: '#F3EEE6',
  ink: '#1A1714',
  text: '#1A1714',
  textMuted: '#6B645B',
  textFaint: '#8A8278',
  line: '#E6DFD4',
  border: '#E6DFD4',
  primary: '#2F4A3E',
  primarySoft: '#E7EFEA',
  accent: '#9A7B4F',
  warn: '#9A4F32',
  warnSoft: '#F6E8E1',
  danger: '#8F3A2A',
  chipBg: '#F0EBE3',
  userBubble: '#2F4A3E',
  botBubble: '#FFFcf8',
} as const;

export const radius = { sm: 12, md: 18, lg: 28, pill: 999 } as const;

export const spacing = (n: number) => n * 4;

const displayFamily = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia, "Iowan Old Style", "Palatino Linotype", Palatino, serif',
  default: 'serif',
});

const sansFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  default: undefined,
});

export const font = {
  display: {
    fontFamily: displayFamily,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '500' as const,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  title: {
    fontFamily: displayFamily,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '500' as const,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: sansFamily,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
    color: colors.ink,
    letterSpacing: 0.2,
  },
  body: {
    fontFamily: sansFamily,
    fontSize: 16,
    lineHeight: 25,
    fontWeight: '400' as const,
    color: colors.ink,
  },
  small: {
    fontFamily: sansFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },
  caption: {
    fontFamily: sansFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500' as const,
    color: colors.textFaint,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
  },
} satisfies Record<string, TextStyle>;

export const shadowSoft: ViewStyle = Platform.select({
  web: { boxShadow: '0 10px 30px rgba(26, 23, 20, 0.06)' } as ViewStyle,
  ios: {
    shadowColor: '#1A1714',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  default: { elevation: 2 },
})!;

export const shadowFloat: ViewStyle = Platform.select({
  web: { boxShadow: '0 16px 48px rgba(26, 23, 20, 0.10)' } as ViewStyle,
  ios: {
    shadowColor: '#1A1714',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  default: { elevation: 4 },
})!;
