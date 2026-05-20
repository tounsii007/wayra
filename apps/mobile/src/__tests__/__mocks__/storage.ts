/**
 * In-memory replacement for src/lib/storage.ts used during Jest runs.
 * Mirrors the surface that Zustand's `persist` expects from PersistStorage.
 */
import type { PersistStorage, StorageValue } from 'zustand/middleware';

const buckets: Map<string, string> = new Map();

export function asyncStorage<T>(): PersistStorage<T> {
  return {
    async getItem(name) {
      const raw = buckets.get(name);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as StorageValue<T>;
      } catch {
        return null;
      }
    },
    async setItem(name, value) {
      buckets.set(name, JSON.stringify(value));
    },
    async removeItem(name) {
      buckets.delete(name);
    },
  };
}
