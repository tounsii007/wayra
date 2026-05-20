import Link from 'next/link';
import * as React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Database,
  Activity,
  MessageSquare,
  BarChart3,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { WayraLogo } from '@/components/wayra-logo';
import { AdminGuard } from './admin-guard';

export const metadata = { title: 'Admin' };

const nav = [
  { href: '/admin', label: 'Overview', Icon: BarChart3 },
  { href: '/admin/disruptions', label: 'Disruptions', Icon: AlertTriangle },
  { href: '/admin/feeds', label: 'Feeds', Icon: Database },
  { href: '/admin/api-status', label: 'API status', Icon: Activity },
  { href: '/admin/feedback', label: 'Feedback', Icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
      <aside className="hidden flex-col gap-3 border-e border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))]/50 p-5 lg:flex">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 pb-2">
          <WayraLogo className="h-9 w-9" />
          <div className="leading-tight">
            <div className="font-display text-base font-bold tracking-tight">Wayra</div>
            <div className="text-accent-700 dark:text-accent-400 mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
              <ShieldCheck className="h-3 w-3" /> Admin
            </div>
          </div>
        </div>

        <div className="divider-dotted -mx-1" />

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          <span className="text-subtle px-2 pb-1 pt-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
            Workspace
          </span>
          {nav.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="text-muted focus-ring group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all hover:bg-[rgb(var(--surface))] hover:text-[rgb(var(--text))]"
            >
              <span className="text-muted group-hover:bg-brand-500 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[rgb(var(--surface))] transition-colors group-hover:text-white">
                <Icon className="h-3.5 w-3.5" />
              </span>
              {label}
            </Link>
          ))}
        </nav>

        {/* Bottom utilities */}
        <div className="mt-auto flex items-center gap-2 border-t border-[rgb(var(--border))] pt-3">
          <ThemeToggle />
          <LocaleSwitcher />
          <Link
            href="/"
            className="text-muted ml-auto text-xs font-semibold underline-offset-2 hover:text-[rgb(var(--text))] hover:underline"
          >
            ← Exit
          </Link>
        </div>
      </aside>

      {/* Mobile top-bar */}
      <header className="flex items-center justify-between border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))]/50 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <WayraLogo className="h-7 w-7" />
          <div className="text-accent-700 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
            <ShieldCheck className="h-3 w-3" />
            Admin
          </div>
        </div>
        <Link href="/" className="text-muted text-xs font-semibold">
          Exit
        </Link>
      </header>

      <main className="p-6 lg:p-10">{children}</main>
    </div>
  );
}
