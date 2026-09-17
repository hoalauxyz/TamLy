/**
 * Bảng màu: ấm, không "bệnh viện". Nền be/cream, chữ nâu đậm, nhấn xanh lá dịu.
 * Màu khẩn cấp là cam đất (không đỏ chói, tránh gây hoảng).
 */
export const colors = {
  bg: '#F4EFE6',
  card: '#FFFFFF',
  cardAlt: '#FBF8F2',
  text: '#2E2A25',
  textMuted: '#6F675D',
  border: '#E6DFD3',
  primary: '#4F7C6D',
  primarySoft: '#DCE9E3',
  accent: '#C9A26B',
  warn: '#C8743C',
  warnSoft: '#F7E3D6',
  danger: '#B5482F',
  chipBg: '#EFE9DE',
  userBubble: '#4F7C6D',
  botBubble: '#FFFFFF',
} as const;

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;

export const spacing = (n: number) => n * 4;

export const font = {
  title: { fontSize: 24, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 16, lineHeight: 24, color: colors.text },
  small: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
} as const;
