import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { asyncStorage } from './storage';

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  locale: string;
  theme: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setSession: (token: string, user: AuthUser) => void;
  setHydrated: (v: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      setSession: (token, user) => set({ token, user }),
      setHydrated: (v) => set({ hydrated: v }),
      clear: () => set({ token: null, user: null }),
    }),
    {
      name: 'wayra:auth',
      storage: asyncStorage(),
      onRehydrateStorage: () => (s) => s?.setHydrated(true),
      partialize: (s) => ({ token: s.token, user: s.user }) as Partial<AuthState>,
    },
  ),
);
