'use client';

import { useState } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';

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
  { id: 'd1', title: 'S1 leichte Verzögerung', severity: 'minor', country: 'DE', lines: 'S1', active: true },
  { id: 'd2', title: 'Grève SNCF — TER IDF', severity: 'major', country: 'FR', lines: 'TER', active: true },
  { id: 'd3', title: 'Métro Tunis · Ligne 1 ralentie', severity: 'minor', country: 'TN', lines: 'M1', active: true },
];

const severityClass: Record<Severity, string> = {
  info: 'bg-status-info/15 text-status-info',
  minor: 'bg-status-delay/15 text-status-delay',
  major: 'bg-status-severe/15 text-status-severe',
  critical: 'bg-status-cancelled/15 text-status-cancelled',
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
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Disruptions</h1>
          <p className="text-sm text-muted">Curated alerts shown alongside GTFS-RT data.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-glow focus-ring"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'New disruption'}
        </button>
      </header>

      {showForm && (
        <form
          action={(form) => add(form)}
          className="surface grid gap-3 rounded-2xl p-4 md:grid-cols-2"
        >
          <input
            name="title"
            required
            placeholder="Title"
            className="surface-muted col-span-2 rounded-xl px-3 py-2 text-sm focus-ring"
          />
          <select name="severity" className="surface-muted rounded-xl px-3 py-2 text-sm focus-ring">
            <option value="info">Info</option>
            <option value="minor">Minor</option>
            <option value="major">Major</option>
            <option value="critical">Critical</option>
          </select>
          <select name="country" className="surface-muted rounded-xl px-3 py-2 text-sm focus-ring">
            <option value="DE">DE</option>
            <option value="FR">FR</option>
            <option value="TN">TN</option>
          </select>
          <input
            name="lines"
            placeholder="Affected lines (comma-separated)"
            className="surface-muted col-span-2 rounded-xl px-3 py-2 text-sm focus-ring"
          />
          <button
            type="submit"
            className="col-span-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white focus-ring"
          >
            Save
          </button>
        </form>
      )}

      <div className="surface overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-subtle">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Lines</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]">
            {items.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-semibold">
                  <AlertTriangle className="mr-2 inline h-4 w-4 text-status-delay" />
                  {d.title}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${severityClass[d.severity]}`}>
                    {d.severity}
                  </span>
                </td>
                <td className="px-4 py-3">{d.country}</td>
                <td className="px-4 py-3 text-muted">{d.lines}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold text-status-onTime">active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
