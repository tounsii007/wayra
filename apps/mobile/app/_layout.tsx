import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppState, useColorScheme, View } from 'react-native';
import { useEffect } from 'react';
import { useTheme } from '@/theme';
import { drainQueue } from '@/lib/queue-drainer';
import '@/i18n';

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = useTheme();

  useEffect(() => {
    // Drain the offline mutation queue on mount and every time the app
    // returns to the foreground.
    void drainQueue();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void drainQueue();
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.bg },
          }}
        />
      </View>
    </SafeAreaProvider>
  );
}
