'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Place } from '@wayra/types';

interface RecentState {
  recents: Place[];
  push: (place: Place) => void;
  clear: () => void;
}

const MAX = 8;

export const useRecentStore = create<RecentState>()(
  persist(
    (set) => ({
      recents: [],
      push: (place) =>
        set((s) => {
          const without = s.recents.filter((p) => p.id !== place.id);
          return { recents: [place, ...without].slice(0, MAX) };
        }),
      clear: () => set({ recents: [] }),
    }),
    { name: 'wayra-recents', storage: createJSONStorage(() => localStorage) },
  ),
);
