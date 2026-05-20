'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'signup';

/**
 * Auth form — paper-ticket styling with a segmented login/signup toggle,
 * password visibility toggle, and a passkey shortcut.
 */
export function AuthForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <form onSubmit={submit} className="ticket relative overflow-hidden p-6 sm:p-8">
      {/* Top accent bar */}
      <div className="from-brand-500 via-accent-500 to-brand-500 absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r" />

      {/* Heading */}
      <header className="mb-5">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          {mode === 'login' ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="text-muted mt-1 text-sm">
          {mode === 'login'
            ? 'Sign in to save trips, favourites & offline regions.'
            : 'Save trips, sync between devices and get delay alerts.'}
        </p>
      </header>

      {/* Mode toggle */}
      <div
        role="radiogroup"
        aria-label="Authentication mode"
        className="mb-5 flex gap-1 rounded-full bg-[rgb(var(--surface-muted))] p-1"
      >
        {(['login', 'signup'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'focus-ring flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-all',
              mode === m
                ? 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text))] shadow-sm'
                : 'text-muted hover:text-[rgb(var(--text))]',
            )}
          >
            {m === 'login' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {mode === 'signup' && (
          <Field icon={<UserIcon className="h-4 w-4" />} label="Display name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              className="placeholder:text-subtle w-full bg-transparent py-3 pe-3 ps-2 text-sm font-medium outline-none"
            />
          </Field>
        )}

        <Field icon={<Mail className="h-4 w-4" />} label="Email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete={mode === 'signup' ? 'email' : 'username'}
            className="placeholder:text-subtle w-full bg-transparent py-3 pe-3 ps-2 text-sm font-medium outline-none"
          />
        </Field>

        <Field icon={<Lock className="h-4 w-4" />} label="Password">
          <input
            required
            type={showPassword ? 'text' : 'password'}
            minLength={mode === 'signup' ? 8 : 1}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? '≥ 8 characters' : '••••••••'}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="placeholder:text-subtle w-full bg-transparent py-3 pe-3 ps-2 text-sm font-medium outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="focus-ring text-subtle me-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-[rgb(var(--surface))] hover:text-[rgb(var(--text))]"
          >
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </Field>

        {mode === 'login' && (
          <div className="text-right">
            <a
              href="/forgot"
              className="link-editorial text-muted text-xs font-semibold hover:text-[rgb(var(--text))]"
            >
              Forgot password?
            </a>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-status-severe/10 text-status-severe mt-3 rounded-xl px-3 py-2.5 text-sm">
          {error}
        </div>
      )}

      {/* Primary submit */}
      <button type="submit" disabled={busy} className="btn-primary mt-5 w-full">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === 'signup' ? 'Create account' : 'Sign in'}
        {!busy && <ArrowRight className="h-4 w-4" />}
      </button>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-[rgb(var(--border))]" />
        <span className="text-subtle font-mono text-[10px] uppercase tracking-[0.18em]">or</span>
        <span className="h-px flex-1 bg-[rgb(var(--border))]" />
      </div>

      {/* Passkey shortcut */}
      <button type="button" className="btn-surface w-full">
        <KeyRound className="h-4 w-4" />
        Sign in with a passkey
      </button>

      {/* Skip */}
      <p className="text-subtle mt-5 text-center text-xs">
        Don&apos;t want an account?{' '}
        <a href="/" className="link-editorial text-brand-700 dark:text-brand-300 font-semibold">
          Continue as guest
        </a>
      </p>
    </form>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-subtle mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em]">
        {label}
      </span>
      <span className="focus-within:border-brand-500/60 flex items-center gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] ps-3 focus-within:shadow-[0_0_0_4px_rgb(13_148_136_/_0.12)]">
        <span className="text-subtle">{icon}</span>
        {children}
      </span>
    </label>
  );
}
