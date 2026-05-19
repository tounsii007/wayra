import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { asyncStorage } from './storage';

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  locale: string;
  theme: string;
  role?: string;
  emailVerified?: boolean;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setSession: (token: string, user: AuthUser, refreshToken?: string) => void;
  setHydrated: (v: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      hydrated: false,
      setSession: (token, user, refreshToken) =>
        set({ token, user, ...(refreshToken !== undefined && { refreshToken }) }),
      setHydrated: (v) => set({ hydrated: v }),
      clear: () => set({ token: null, refreshToken: null, user: null }),
    }),
    {
      name: 'wayra:auth',
      storage: asyncStorage(),
      onRehydrateStorage: () => (s) => s?.setHydrated(true),
      partialize: (s) =>
        ({ token: s.token, refreshToken: s.refreshToken, user: s.user }) as Partial<AuthState>,
    },
  ),
);
