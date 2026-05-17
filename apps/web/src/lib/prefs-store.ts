'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  pushEnabled: boolean;
  emailEnabled: boolean;
  channels: NotificationChannels;
  setPushEnabled: (v: boolean) => void;
  setEmailEnabled: (v: boolean) => void;
  setChannel: (k: keyof NotificationChannels, v: boolean) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
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
      setPushEnabled: (v) => set({ pushEnabled: v }),
      setEmailEnabled: (v) => set({ emailEnabled: v }),
      setChannel: (k, v) => set((s) => ({ channels: { ...s.channels, [k]: v } })),
    }),
    { name: 'wayra-prefs', storage: createJSONStorage(() => localStorage) },
  ),
);
