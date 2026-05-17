import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';
import { useTheme } from '@/theme';
import '@/i18n';

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = useTheme();
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
