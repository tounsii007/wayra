import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistStorage, StorageValue } from 'zustand/middleware';

/**
 * AsyncStorage adapter for zustand's `persist` middleware.
 * Mirrors the JSON shape that web's `createJSONStorage(() => localStorage)` produces.
 */
export function asyncStorage<T>(): PersistStorage<T> {
  return {
    async getItem(name) {
      const raw = await AsyncStorage.getItem(name);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as StorageValue<T>;
      } catch {
        return null;
      }
    },
    setItem(name, value) {
      return AsyncStorage.setItem(name, JSON.stringify(value));
    },
    removeItem(name) {
      return AsyncStorage.removeItem(name);
    },
  };
}
