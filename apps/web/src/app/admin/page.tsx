import { Activity, Train, AlertTriangle, Users, Database, MapPin } from 'lucide-react';

const stats = [
  { label: 'Stops indexed', value: '24,318', sub: '+412 today', Icon: MapPin, accent: 'from-brand-500 to-accent-violet' },
  { label: 'Lines', value: '1,094', sub: 'DE · FR · TN', Icon: Train, accent: 'from-accent-teal to-brand-500' },
  { label: 'Active disruptions', value: '38', sub: '4 major', Icon: AlertTriangle, accent: 'from-accent-sunset to-status-severe' },
  { label: 'Users', value: '2.7k', sub: '+11% this week', Icon: Users, accent: 'from-brand-500 to-accent-teal' },
];

const feeds = [
  { id: 'db', name: 'DB Open Data (DE)', status: 'green', lastSync: '2 min ago' },
  { id: 'rmv', name: 'RMV (DE)', status: 'green', lastSync: '4 min ago' },
  { id: 'bvg', name: 'BVG (DE)', status: 'green', lastSync: '3 min ago' },
  { id: 'sncf', name: 'SNCF (FR)', status: 'amber', lastSync: '18 min ago' },
  { id: 'idfm', name: 'IDFM (FR)', status: 'green', lastSync: '5 min ago' },
  { id: 'sncft', name: 'SNCFT (TN)', status: 'amber', lastSync: '46 min ago' },
];

const statusTone: Record<string, string> = {
  green: 'bg-status-onTime',
  amber: 'bg-status-delay',
  red: 'bg-status-severe',
};

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted">Snapshot across all networks, feeds and live operations.</p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, sub, Icon, accent }) => (
          <article key={label} className="surface relative overflow-hidden rounded-2xl p-5">
            <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl`} />
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-glow`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-subtle">{label}</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
            <div className="text-xs text-muted">{sub}</div>
          </article>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Provider feeds</h2>
        <div className="surface overflow-hidden rounded-2xl">
          <ul className="divide-y divide-[rgb(var(--border))]">
            {feeds.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                <Database className="h-4 w-4 text-subtle" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{f.name}</div>
                  <div className="text-xs text-subtle">last sync · {f.lastSync}</div>
                </div>
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusTone[f.status]}`} />
                <Activity className="h-4 w-4 text-subtle" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
