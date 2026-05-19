import { Platform } from 'react-native';
import { api } from './api';
import { useAuthStore } from './auth-store';

/**
 * Register the device for Expo push notifications and persist the
 * resulting token on the backend.
 *
 * Requires the consumer to have `expo-notifications` installed and the
 * EAS project configured. In Expo Go on a simulator there's no token,
 * so the function bails gracefully.
 */
export async function registerForPush(): Promise<{ token?: string }> {
  if (Platform.OS === 'web') return {};
  let Notifications: typeof import('expo-notifications') | undefined;
  try {
    // Lazy require so the dep stays optional during development without the
    // module installed.
    Notifications = require('expo-notifications') as typeof import('expo-notifications');
  } catch {
    return {};
  }

  const settings = await Notifications.getPermissionsAsync();
  let granted = settings.granted;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  if (!granted) return {};

  try {
    const result = await Notifications.getExpoPushTokenAsync();
    const token = result.data;
    const authToken = useAuthStore.getState().token;
    if (token && authToken) {
      await api.addExpoSubscription({ token, platform: Platform.OS as 'ios' | 'android' });
    }
    return { token };
  } catch {
    return {};
  }
}
