import Link from 'next/link';
import * as React from 'react';
import { ShieldCheck, AlertTriangle, Database, Activity, MessageSquare, BarChart3 } from 'lucide-react';
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
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <aside className="surface flex flex-col gap-2 border-e border-[rgb(var(--border))] p-4">
        <div className="flex items-center gap-2 px-2 pb-3">
          <WayraLogo className="h-7 w-7" />
          <div>
            <div className="text-sm font-bold leading-tight">Wayra</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-brand-500 inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Admin
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {nav.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-[rgb(var(--surface-muted))] hover:text-[rgb(var(--text))]"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2 px-1">
          <ThemeToggle />
          <LocaleSwitcher />
        </div>
      </aside>
      <main className="p-6 lg:p-8">{children}</main>
    </div>
  );
}
