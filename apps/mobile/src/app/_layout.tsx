import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { isOnboarded } from '../lib/store';
import { colors } from '../lib/theme';

function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: Platform.OS === 'web' ? colors.canvas : colors.bg, alignItems: 'center' }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 430,
          backgroundColor: colors.bg,
          overflow: 'hidden',
          ...(Platform.OS === 'web' ? { boxShadow: '0 24px 80px rgba(26,23,20,0.12)' } : {}),
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isOnboarded().then((done) => {
      if (cancelled) return;
      const inOnboarding = segments[0] === 'onboarding';
      if (!done && !inOnboarding) router.replace('/onboarding');
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <PhoneShell>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: '500' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="crisis" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="screening/[instrument]" options={{ headerShown: false }} />
        <Stack.Screen name="skill/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="experts" options={{ headerShown: false }} />
        <Stack.Screen name="journal" options={{ headerShown: false }} />
      </Stack>
      </PhoneShell>
    </SafeAreaProvider>
  );
}
