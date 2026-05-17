'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  locale: string;
  theme: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clear: () => set({ token: null, user: null }),
    }),
    {
      name: 'wayra-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Helper to read the current token outside of React. */
export function getToken(): string | null {
  try {
    return useAuthStore.getState().token;
  } catch {
    return null;
  }
}
