import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// next/navigation — provide a minimal mock so components that call useRouter,
// usePathname, etc. don't crash under jsdom.
// ---------------------------------------------------------------------------
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// ---------------------------------------------------------------------------
// next-intl — return the message key so rendered text is deterministic in
// tests without needing real locale JSON files.
// ---------------------------------------------------------------------------
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
  useNow: () => new Date('2024-01-01T12:00:00.000Z'),
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ---------------------------------------------------------------------------
// localStorage — jsdom provides Storage but its `clear` implementation can
// be absent in certain Vitest/jsdom combinations.  Replace it with a plain
// in-memory map that is wiped before every test.
// ---------------------------------------------------------------------------
const _ls: Map<string, string> = new Map();
const localStorageMock: Storage = {
  get length() {
    return _ls.size;
  },
  key: (i: number) => [..._ls.keys()][i] ?? null,
  getItem: (k: string) => _ls.get(k) ?? null,
  setItem: (k: string, v: string) => _ls.set(k, v),
  removeItem: (k: string) => _ls.delete(k),
  clear: () => _ls.clear(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Reset the in-memory store before every test so Zustand's persist
// middleware starts from a clean slate.
beforeEach(async () => {
  _ls.clear();
  // Reset Zustand's recentStore in-memory state too.  We do this lazily so
  // the import only happens when the store module has already been loaded.
  try {
    const { useRecentStore } = await import('../lib/recent-store');
    // Merge-reset (no `true`) so the action functions (push/clear) are kept.
    useRecentStore.setState({ recents: [] });
  } catch {
    // Module not yet loaded — nothing to reset.
  }
});

// ---------------------------------------------------------------------------
// Silence "matchMedia not found" warnings from components that read the
// user's preferred color scheme — jsdom doesn't implement it.
// ---------------------------------------------------------------------------
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
