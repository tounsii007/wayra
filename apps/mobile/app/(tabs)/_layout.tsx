import { Tabs } from 'expo-router';
import { Home, Map, Activity, Sparkles, User } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.textSubtle,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: 64,
          paddingTop: 6,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const Icon =
            route.name === 'index' ? Home
              : route.name === 'map' ? Map
              : route.name === 'live' ? Activity
              : route.name === 'assistant' ? Sparkles
              : User;
          return <Icon color={color} size={size ?? 22} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: t('nav.plan') }} />
      <Tabs.Screen name="map" options={{ title: t('nav.map') }} />
      <Tabs.Screen name="live" options={{ title: t('nav.live') }} />
      <Tabs.Screen name="assistant" options={{ title: t('nav.assistant') }} />
      <Tabs.Screen name="profile" options={{ title: t('nav.settings') }} />
    </Tabs>
  );
}
