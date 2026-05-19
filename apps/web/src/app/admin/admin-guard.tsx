'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldOff } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface Props {
  children: React.ReactNode;
}

/**
 * Client-side admin gate. Reads role from /api/auth/me and either renders
 * the children or shows a 'not authorized' panel with a sign-in CTA.
 *
 * Note: this is a UX guard. The real protection lives on the backend
 * (RolesGuard + @Roles('admin')) — without an admin token, all
 * /api/admin/* responses return 403.
 */
export function AdminGuard({ children }: Props) {
  const router = useRouter();
  const { token } = useAuthStore();
  const [state, setState] = useState<'checking' | 'ok' | 'forbidden' | 'unauthenticated'>(
    'checking',
  );

  useEffect(() => {
    if (!token) {
      setState('unauthenticated');
      return;
    }
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    (async () => {
      try {
        const res = await fetch(`${base}/api/auth/me`, {
          headers: { authorization: `Bearer ${token}` },
        });
        const json = (await res.json()) as { data?: { role?: string } };
        if (!res.ok) {
          setState('unauthenticated');
          return;
        }
        if (json.data?.role === 'admin' || json.data?.role === 'staff') {
          setState('ok');
        } else {
          setState('forbidden');
        }
      } catch {
        setState('unauthenticated');
      }
    })();
  }, [token]);

  if (state === 'checking') {
    return (
      <div className="min-h-screen p-8">
        <div className="skeleton h-20 w-1/3 rounded-2xl" />
      </div>
    );
  }
  if (state === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="surface max-w-md rounded-2xl p-6 text-center">
          <ShieldOff className="mx-auto h-10 w-10 text-status-severe" />
          <h2 className="mt-3 text-lg font-bold">Sign in required</h2>
          <p className="mt-1 text-sm text-muted">
            The admin area is reserved for staff accounts.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }
  if (state === 'forbidden') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="surface max-w-md rounded-2xl p-6 text-center">
          <ShieldOff className="mx-auto h-10 w-10 text-status-severe" />
          <h2 className="mt-3 text-lg font-bold">Forbidden</h2>
          <p className="mt-1 text-sm text-muted">
            Your account doesn't have admin permissions. Ask a teammate to grant you
            <code className="mx-1 rounded bg-[rgb(var(--surface-muted))] px-1 py-0.5 text-xs">
              role = admin
            </code>
            in the database.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
