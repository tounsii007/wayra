'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { usePrefsStore, type NotificationChannels } from '@/lib/prefs-store';
import { useRecentStore } from '@/lib/recent-store';
import { useAuthStore } from '@/lib/auth-store';
import { CloudDownload, Heart, KeyRound } from 'lucide-react';

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
    <div className="mt-6 space-y-4">
      <Section title="Appearance">
        <Row label="Theme" hint={`${tTheme('light')} / ${tTheme('dark')} / ${tTheme('system')}`}>
          <ThemeToggle />
        </Row>
        <Row label="Language" hint="DE · EN · FR · AR · IT · ES">
          <LocaleSwitcher />
        </Row>
      </Section>

      <Section title="Account">
        {auth.user ? (
          <Row label={auth.user.displayName ?? 'Signed in'} hint={auth.user.email ?? undefined}>
            <Link
              href="/me"
              className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white focus-ring"
            >
              Manage
            </Link>
          </Row>
        ) : (
          <Row
            label="Not signed in"
            hint="Sign in to sync favorites, saved routes, and notifications across devices."
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white focus-ring"
            >
              <KeyRound className="h-3 w-3" /> Sign in
            </Link>
          </Row>
        )}
      </Section>

      <Section title="Notifications">
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
        />
        <div className="border-t border-[rgb(var(--border))] pt-3 mt-2">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-subtle">Channels</div>
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

      <Section title="Data & privacy">
        <Row label="Recent searches" hint={`${recents.recents.length} saved locally`}>
          <button
            disabled={recents.recents.length === 0}
            onClick={recents.clear}
            className="rounded-full surface-muted px-3 py-1.5 text-xs font-semibold disabled:opacity-50 focus-ring"
          >
            Clear
          </button>
        </Row>
        <Row label="Offline regions" hint="Downloaded cities for offline routing">
          <Link
            href="/offline"
            className="inline-flex items-center gap-1.5 rounded-full surface-muted px-3 py-1.5 text-xs font-semibold focus-ring"
          >
            <CloudDownload className="h-3 w-3" /> Manage
          </Link>
        </Row>
        <Row label="Favorites" hint="Manage saved places and routes">
          <Link
            href="/me"
            className="inline-flex items-center gap-1.5 rounded-full surface-muted px-3 py-1.5 text-xs font-semibold focus-ring"
          >
            <Heart className="h-3 w-3" /> Open
          </Link>
        </Row>
      </Section>

      <p className="px-1 pb-6 text-xs text-subtle">
        Wayra v0.3 · Data: OSM (ODbL), GTFS / GTFS-RT per provider, MapLibre tiles.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface rounded-2xl p-5">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-subtle">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        {hint && <div className="text-xs text-muted">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  compact,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  compact?: boolean;
}) {
  return (
    <label className={`flex items-center justify-between gap-3 ${compact ? '' : 'py-1'}`}>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        {hint && !compact && <div className="text-xs text-muted">{hint}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-ring ${
          checked ? 'bg-brand-500' : 'bg-[rgb(var(--border))]'
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'start-[22px]' : 'start-0.5'
          }`}
        />
      </button>
    </label>
  );
}
