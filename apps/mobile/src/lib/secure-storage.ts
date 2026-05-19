import type { PersistStorage, StorageValue } from 'zustand/middleware';

/**
 * Wraps expo-secure-store for sensitive values (auth tokens). Falls back
 * to AsyncStorage if SecureStore is not available (e.g. running on the
 * web platform that Expo also targets).
 *
 * Note: SecureStore has a 2 KB value limit per key on iOS — we keep
 * payloads small (auth token + user view only).
 */
export function secureStorage<T>(): PersistStorage<T> {
  let SecureStore: typeof import('expo-secure-store') | undefined;
  let AsyncStorage: typeof import('@react-native-async-storage/async-storage').default | undefined;
  try {
    SecureStore = require('expo-secure-store') as typeof import('expo-secure-store');
  } catch {
    /* not bundled in this environment */
  }
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage')
      .default as typeof import('@react-native-async-storage/async-storage').default;
  } catch {
    /* unavailable */
  }

  const isAvailable = !!SecureStore?.isAvailableAsync;

  return {
    async getItem(name) {
      try {
        if (SecureStore && isAvailable && (await SecureStore.isAvailableAsync())) {
          const raw = await SecureStore.getItemAsync(name);
          if (raw) return JSON.parse(raw) as StorageValue<T>;
        }
      } catch {
        /* fall through to AsyncStorage */
      }
      if (AsyncStorage) {
        const raw = await AsyncStorage.getItem(name);
        if (raw) {
          try {
            return JSON.parse(raw) as StorageValue<T>;
          } catch {
            return null;
          }
        }
      }
      return null;
    },
    async setItem(name, value) {
      const serialized = JSON.stringify(value);
      try {
        if (SecureStore && isAvailable && (await SecureStore.isAvailableAsync())) {
          await SecureStore.setItemAsync(name, serialized, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          });
          return;
        }
      } catch {
        /* fall through */
      }
      if (AsyncStorage) await AsyncStorage.setItem(name, serialized);
    },
    async removeItem(name) {
      try {
        if (SecureStore && isAvailable && (await SecureStore.isAvailableAsync())) {
          await SecureStore.deleteItemAsync(name);
        }
      } catch {
        /* ignore */
      }
      if (AsyncStorage) await AsyncStorage.removeItem(name);
    },
  };
}
