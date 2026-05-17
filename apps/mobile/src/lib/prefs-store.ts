import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Locale, Theme } from '@wayra/types';
import { asyncStorage } from './storage';

export interface NotificationChannels {
  delay: boolean;
  cancellation: boolean;
  platformChange: boolean;
  departureSoon: boolean;
  tightTransfer: boolean;
  disruptionOnFavorite: boolean;
  priceChange: boolean;
  offlineDataStale: boolean;
}

interface PrefsState {
  /** "system" means follow OS, otherwise an explicit override. */
  themeOverride: Theme;
  /** undefined → follow device locale; explicit locale otherwise. */
  localeOverride: Locale | undefined;
  pushEnabled: boolean;
  emailEnabled: boolean;
  channels: NotificationChannels;
  setTheme: (t: Theme) => void;
  setLocale: (l: Locale | undefined) => void;
  setPushEnabled: (v: boolean) => void;
  setEmailEnabled: (v: boolean) => void;
  setChannel: (k: keyof NotificationChannels, v: boolean) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      themeOverride: 'system',
      localeOverride: undefined,
      pushEnabled: true,
      emailEnabled: false,
      channels: {
        delay: true,
        cancellation: true,
        platformChange: true,
        departureSoon: true,
        tightTransfer: true,
        disruptionOnFavorite: true,
        priceChange: false,
        offlineDataStale: true,
      },
      setTheme: (t) => set({ themeOverride: t }),
      setLocale: (l) => set({ localeOverride: l }),
      setPushEnabled: (v) => set({ pushEnabled: v }),
      setEmailEnabled: (v) => set({ emailEnabled: v }),
      setChannel: (k, v) => set((s) => ({ channels: { ...s.channels, [k]: v } })),
    }),
    { name: 'wayra:prefs', storage: asyncStorage() },
  ),
);
