import { Tabs } from 'expo-router';
import { Home, Map, Activity, Compass, UserCircle2 } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';

/**
 * Bottom-tab navigator.  Active tint follows the Mediterranean teal brand
 * with a subtle warm cream/ink background and elevated shadow on iOS.
 */
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
          backgroundColor: theme.bgElevated,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          // Soft elevation
          shadowColor: theme.isDark ? '#000' : '#0f172a',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: theme.isDark ? 0.4 : 0.06,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          marginTop: 2,
        },
        tabBarIcon: ({ color, focused, size }) => {
          const Icon =
            route.name === 'index'
              ? Home
              : route.name === 'map'
                ? Map
                : route.name === 'live'
                  ? Activity
                  : route.name === 'assistant'
                    ? Compass
                    : UserCircle2;
          return <Icon color={color} size={size ?? 22} strokeWidth={focused ? 2.4 : 2} />;
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
