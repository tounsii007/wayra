'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  locale: string;
  theme: string;
  role?: string;
  emailVerified?: boolean;
}

interface AuthState {
  /** Short-lived access token (~15 min) */
  token: string | null;
  /** Long-lived refresh token (~30 days) */
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser, refreshToken?: string) => void;
  setAccessToken: (token: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setSession: (token, user, refreshToken) =>
        set({ token, user, ...(refreshToken !== undefined && { refreshToken }) }),
      setAccessToken: (token) => set({ token }),
      clear: () => set({ token: null, refreshToken: null, user: null }),
    }),
    {
      name: 'wayra-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function getToken(): string | null {
  try {
    return useAuthStore.getState().token;
  } catch {
    return null;
  }
}
