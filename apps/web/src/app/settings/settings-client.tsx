'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  CloudDownload,
  Heart,
  KeyRound,
  Palette,
  Languages,
  UserCircle2,
  BellRing,
  ShieldCheck,
  Database,
  Mail,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { usePrefsStore, type NotificationChannels } from '@/lib/prefs-store';
import { useRecentStore } from '@/lib/recent-store';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

const channelLabels: Record<keyof NotificationChannels, string> = {
  delay: 'Delays',
  cancellation: 'Cancellations',
  platformChange: 'Platform changes',
  departureSoon: 'Departure soon',
  tightTransfer: 'Tight transfer',
  disruptionOnFavorite: 'Disruption on saved routes',
  priceChange: 'Price changes',
  offlineDataStale: 'Offline data stale',
};

export function SettingsClient() {
  const tTheme = useTranslations('theme');
  const prefs = usePrefsStore();
  const recents = useRecentStore();
  const auth = useAuthStore();

  return (
    <div className="space-y-6">
      <Section title="Appearance" Icon={Palette} accent="amber">
        <Row label="Theme" hint={`${tTheme('light')} / ${tTheme('dark')} / ${tTheme('system')}`}>
          <ThemeToggle />
        </Row>
        <Row label="Language" hint="DE · EN · FR · AR · IT · ES" Icon={Languages}>
          <LocaleSwitcher />
        </Row>
      </Section>

      <Section title="Account" Icon={UserCircle2} accent="brand">
        {auth.user ? (
          <Row label={auth.user.displayName ?? 'Signed in'} hint={auth.user.email ?? undefined}>
            <Link href="/me" className="btn-primary text-xs">
              Manage
            </Link>
          </Row>
        ) : (
          <Row
            label="Not signed in"
            hint="Sign in to sync favourites, saved trips and notifications across devices."
          >
            <Link href="/login" className="btn-primary text-xs">
              <KeyRound className="h-3.5 w-3.5" /> Sign in
            </Link>
          </Row>
        )}
      </Section>

      <Section title="Notifications" Icon={BellRing} accent="amber">
        <Toggle
          label="Push notifications"
          hint="Browser notifications for trips, delays and disruptions."
          checked={prefs.pushEnabled}
          onChange={prefs.setPushEnabled}
        />
        <Toggle
          label="Email"
          hint="Daily digests and weekly summaries."
          checked={prefs.emailEnabled}
          onChange={prefs.setEmailEnabled}
          Icon={Mail}
        />

        <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))] p-4">
          <div className="text-subtle mb-3 text-[10px] font-bold uppercase tracking-[0.18em]">
            Channels
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(channelLabels) as Array<keyof NotificationChannels>).map((k) => (
              <Toggle
                key={k}
                compact
                label={channelLabels[k]}
                checked={prefs.channels[k]}
                onChange={(v) => prefs.setChannel(k, v)}
              />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Data & privacy" Icon={ShieldCheck} accent="brand">
        <Row
          label="Recent searches"
          hint={`${recents.recents.length} saved locally`}
          Icon={Database}
        >
          <button
            disabled={recents.recents.length === 0}
            onClick={recents.clear}
            className="btn-surface text-xs disabled:opacity-50"
          >
            Clear
          </button>
        </Row>
        <Row label="Offline regions" hint="Downloaded cities for offline routing">
          <Link href="/offline" className="btn-surface text-xs">
            <CloudDownload className="h-3.5 w-3.5" /> Manage
          </Link>
        </Row>
        <Row label="Favourites" hint="Manage saved places and routes">
          <Link href="/me" className="btn-surface text-xs">
            <Heart className="h-3.5 w-3.5" /> Open
          </Link>
        </Row>
      </Section>

      <p className="text-subtle px-1 pb-6 font-mono text-[10px] uppercase tracking-[0.18em]">
        Wayra v0.6 · Data: OSM (ODbL) · GTFS / GTFS-RT per provider · MapLibre tiles
      </p>
    </div>
  );
}

function Section({
  title,
  Icon,
  accent,
  children,
}: {
  title: string;
  Icon: typeof Palette;
  accent: 'brand' | 'amber';
  children: React.ReactNode;
}) {
  return (
    <section className="ticket overflow-hidden">
      <header className="flex items-center gap-3 border-b border-[rgb(var(--border))] px-6 py-4">
        <span
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm',
            accent === 'brand'
              ? 'from-brand-500 to-brand-700 bg-gradient-to-br'
              : 'from-accent-400 to-accent-600 bg-gradient-to-br',
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
      </header>
      <div className="space-y-3 p-6">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  Icon,
  children,
}: {
  label: string;
  hint?: string;
  Icon?: typeof Palette;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon className="text-muted h-4 w-4 shrink-0" />}
        <div className="min-w-0">
          <div className="text-sm font-semibold">{label}</div>
          {hint && <div className="text-muted text-xs">{hint}</div>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  compact,
  Icon,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  compact?: boolean;
  Icon?: typeof Palette;
}) {
  return (
    <label className={cn('flex items-center justify-between gap-3', compact ? '' : 'py-1')}>
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon className="text-muted h-4 w-4 shrink-0" />}
        <div className="min-w-0">
          <div className="text-sm font-semibold">{label}</div>
          {hint && !compact && <div className="text-muted text-xs">{hint}</div>}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'focus-ring relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked
            ? 'from-brand-500 to-brand-600 bg-gradient-to-r shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
            : 'bg-[rgb(var(--border-strong))]',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-all',
            checked ? 'start-[22px]' : 'start-0.5',
          )}
        />
      </button>
    </label>
  );
}
