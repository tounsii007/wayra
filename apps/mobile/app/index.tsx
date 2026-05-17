import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/theme';

export default function Index() {
  const theme = useTheme();
  const [target, setTarget] = useState<'(tabs)' | 'onboarding' | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('wayra:onboarded').then((v) => {
      setTarget(v === '1' ? '(tabs)' : 'onboarding');
    });
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator color={theme.brand} />
      </View>
    );
  }
  return <Redirect href={target === '(tabs)' ? '/(tabs)' : '/onboarding'} />;
}
