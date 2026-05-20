'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

type Mode = 'login' | 'signup';

export function AuthForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const path = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const res = await fetch(base + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'signup' ? { email, password, displayName: name } : { email, password },
        ),
      });
      const json = (await res.json()) as {
        data?: {
          accessToken?: string;
          token?: string;
          refreshToken?: string;
          user: never;
        };
        error?: { message: string };
      };
      if (!res.ok || !json.data) {
        throw new Error(json.error?.message ?? 'Request failed');
      }
      const access = json.data.accessToken ?? json.data.token ?? '';
      setSession(access, json.data.user, json.data.refreshToken);
      router.replace('/me');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface space-y-3 rounded-2xl p-5">
      <div className="surface-muted flex gap-1 rounded-full p-1">
        {(['login', 'signup'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`focus-ring flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
              mode === m
                ? 'bg-[rgb(var(--surface))] shadow-sm'
                : 'text-muted hover:text-[rgb(var(--text))]'
            }`}
          >
            {m === 'login' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      {mode === 'signup' && (
        <Field icon={<User className="text-subtle h-4 w-4" />}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Display name"
            autoComplete="name"
            className="placeholder:text-subtle w-full bg-transparent py-3 pe-3 ps-2 text-sm outline-none"
          />
        </Field>
      )}

      <Field icon={<Mail className="text-subtle h-4 w-4" />}>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete={mode === 'signup' ? 'email' : 'username'}
          className="placeholder:text-subtle w-full bg-transparent py-3 pe-3 ps-2 text-sm outline-none"
        />
      </Field>

      <Field icon={<Lock className="text-subtle h-4 w-4" />}>
        <input
          required
          type="password"
          minLength={mode === 'signup' ? 8 : 1}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === 'signup' ? 'Choose a password (≥8 chars)' : 'Password'}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          className="placeholder:text-subtle w-full bg-transparent py-3 pe-3 ps-2 text-sm outline-none"
        />
      </Field>

      {error && (
        <div className="bg-status-severe/10 text-status-severe rounded-xl px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="bg-brand-500 shadow-glow hover:bg-brand-600 focus-ring inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === 'signup' ? 'Create account' : 'Sign in'}
      </button>

      <p className="text-subtle text-center text-xs">
        Continue without account?{' '}
        <a href="/" className="text-brand-500 font-semibold">
          Skip
        </a>
      </p>
    </form>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="surface-muted flex items-center gap-2 rounded-2xl ps-3">
      {icon}
      {children}
    </label>
  );
}
