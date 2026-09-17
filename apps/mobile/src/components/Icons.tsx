import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { colors } from '../lib/theme';

export function MenuIcon({ color = colors.ink }: { color?: string }) {
  return (
    <View style={{ width: 18, height: 12, justifyContent: 'space-between' }}>
      <View style={{ height: 1.5, backgroundColor: color, width: 18, borderRadius: 1 }} />
      <View style={{ height: 1.5, backgroundColor: color, width: 13, borderRadius: 1 }} />
      <View style={{ height: 1.5, backgroundColor: color, width: 16, borderRadius: 1 }} />
    </View>
  );
}

export function IconButton({
  onPress,
  children,
  dim,
}: {
  onPress?: () => void;
  children: ReactNode;
  dim?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? colors.cardAlt : 'transparent',
        opacity: dim ? 0.45 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}

export function AnMark({ size = 40 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size - 10,
          height: size - 10,
          borderRadius: (size - 10) / 2,
          borderWidth: 1,
          borderColor: 'rgba(255,252,248,0.35)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: 1.5, height: size * 0.28, backgroundColor: '#F6F1E8', borderRadius: 1 }} />
      </View>
    </View>
  );
}
