'use client';

import { useState } from 'react';
import { AlertTriangle, Plus, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type Severity = 'info' | 'minor' | 'major' | 'critical';
interface Disruption {
  id: string;
  title: string;
  severity: Severity;
  country: 'DE' | 'FR' | 'TN';
  lines: string;
  active: boolean;
}

const initial: Disruption[] = [
  {
    id: 'd1',
    title: 'S1 leichte Verzögerung',
    severity: 'minor',
    country: 'DE',
    lines: 'S1',
    active: true,
  },
  {
    id: 'd2',
    title: 'Grève SNCF — TER IDF',
    severity: 'major',
    country: 'FR',
    lines: 'TER',
    active: true,
  },
  {
    id: 'd3',
    title: 'Métro Tunis · Ligne 1 ralentie',
    severity: 'minor',
    country: 'TN',
    lines: 'M1',
    active: true,
  },
];

const SEV_TONE: Record<Severity, string> = {
  info: 'bg-status-info/15 text-status-info ring-status-info/30',
  minor: 'bg-status-delay/15 text-status-delay ring-status-delay/30',
  major: 'bg-status-severe/15 text-status-severe ring-status-severe/30',
  critical: 'bg-status-cancelled/15 text-status-cancelled ring-status-cancelled/30',
};

export default function DisruptionsPage() {
  const [items, setItems] = useState<Disruption[]>(initial);
  const [showForm, setShowForm] = useState(false);

  function add(form: FormData) {
    const next: Disruption = {
      id: `d-${Date.now()}`,
      title: String(form.get('title') ?? ''),
      severity: (form.get('severity') as Severity) ?? 'minor',
      country: (form.get('country') as Disruption['country']) ?? 'DE',
      lines: String(form.get('lines') ?? ''),
      active: true,
    };
    if (!next.title) return;
    setItems((x) => [next, ...x]);
    setShowForm(false);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="chip-amber">
            <Zap className="h-3 w-3" />
            Curated
          </span>
          <h1 className="font-display text-display-md tracking-tightest display-tight mt-3 font-bold">
            Disruptions
          </h1>
          <p className="text-muted mt-2 max-w-xl text-pretty text-base">
            Curated alerts shown alongside GTFS-RT data — used when an operator&apos;s feed misses
            an event or when context is needed.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className={cn(showForm ? 'btn-ghost' : 'btn-primary')}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'New disruption'}
        </button>
      </header>

      {showForm && (
        <form action={(form) => add(form)} className="ticket grid gap-3 p-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-subtle mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em]">
              Title
            </label>
            <input
              name="title"
              required
              placeholder="e.g. ICE 597 — Signalstörung Hannover"
              className="placeholder:text-subtle focus:border-brand-500/60 w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] px-3 py-2.5 text-sm font-medium outline-none focus:shadow-[0_0_0_4px_rgb(13_148_136_/_0.12)]"
            />
          </div>
          <div>
            <label className="text-subtle mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em]">
              Severity
            </label>
            <select
              name="severity"
              className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] px-3 py-2.5 text-sm font-medium outline-none"
            >
              <option value="info">Info</option>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="text-subtle mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em]">
              Country
            </label>
            <select
              name="country"
              className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] px-3 py-2.5 text-sm font-medium outline-none"
            >
              <option value="DE">🇩🇪 DE</option>
              <option value="FR">🇫🇷 FR</option>
              <option value="TN">🇹🇳 TN</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-subtle mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em]">
              Affected lines
            </label>
            <input
              name="lines"
              placeholder="comma-separated · e.g. S1, S2, RB13"
              className="placeholder:text-subtle focus:border-brand-500/60 w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] px-3 py-2.5 text-sm font-medium outline-none"
            />
          </div>
          <button type="submit" className="btn-primary md:col-span-2">
            Publish disruption
          </button>
        </form>
      )}

      <div className="ticket overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))]">
              <th className="text-subtle px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                Title
              </th>
              <th className="text-subtle px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                Severity
              </th>
              <th className="text-subtle px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                Country
              </th>
              <th className="text-subtle px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                Lines
              </th>
              <th className="text-subtle px-5 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]">
            {items.map((d) => (
              <tr key={d.id} className="transition-colors hover:bg-[rgb(var(--surface-muted))]">
                <td className="px-5 py-3 font-semibold">
                  <span className="inline-flex items-center gap-2">
                    <AlertTriangle className="text-status-delay h-4 w-4" />
                    {d.title}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] ring-1',
                      SEV_TONE[d.severity],
                    )}
                  >
                    {d.severity}
                  </span>
                </td>
                <td className="text-subtle px-3 py-3 font-mono text-xs uppercase tracking-[0.18em]">
                  {d.country}
                </td>
                <td className="text-muted px-3 py-3 font-mono text-xs">{d.lines}</td>
                <td className="px-5 py-3 text-right">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="live-pip text-status-onTime" />
                    <span className="text-status-onTime font-mono text-[10px] uppercase tracking-[0.16em]">
                      Active
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
