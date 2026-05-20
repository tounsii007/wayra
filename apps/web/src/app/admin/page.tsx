import {
  Activity,
  Train,
  AlertTriangle,
  Users,
  Database,
  MapPin,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

const stats = [
  {
    label: 'Stops indexed',
    value: '24,318',
    sub: '+412 today',
    trend: 'up',
    Icon: MapPin,
    accent: 'from-brand-500 to-brand-700',
  },
  {
    label: 'Lines',
    value: '1,094',
    sub: 'DE · FR · TN · …',
    trend: 'up',
    Icon: Train,
    accent: 'from-teal-500 to-brand-700',
  },
  {
    label: 'Active disruptions',
    value: '38',
    sub: '4 major',
    trend: 'down',
    Icon: AlertTriangle,
    accent: 'from-accent-400 to-accent-600',
  },
  {
    label: 'Users',
    value: '2.7k',
    sub: '+11% this week',
    trend: 'up',
    Icon: Users,
    accent: 'from-violet-500 to-fuchsia-600',
  },
];

const feeds = [
  {
    id: 'db',
    name: 'DB Open Data',
    country: 'DE',
    status: 'green',
    lastSync: '2 min ago',
    records: '1.2M',
  },
  {
    id: 'rmv',
    name: 'RMV',
    country: 'DE',
    status: 'green',
    lastSync: '4 min ago',
    records: '320k',
  },
  {
    id: 'bvg',
    name: 'BVG',
    country: 'DE',
    status: 'green',
    lastSync: '3 min ago',
    records: '180k',
  },
  {
    id: 'sncf',
    name: 'SNCF',
    country: 'FR',
    status: 'amber',
    lastSync: '18 min ago',
    records: '920k',
  },
  {
    id: 'idfm',
    name: 'IDFM',
    country: 'FR',
    status: 'green',
    lastSync: '5 min ago',
    records: '480k',
  },
  {
    id: 'sncft',
    name: 'SNCFT',
    country: 'TN',
    status: 'amber',
    lastSync: '46 min ago',
    records: '24k',
  },
];

const statusClass: Record<string, string> = {
  green: 'bg-status-onTime ring-status-onTime/30',
  amber: 'bg-status-delay ring-status-delay/30',
  red: 'bg-status-severe ring-status-severe/30',
};

export default function AdminOverviewPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <header>
        <span className="chip-amber">
          <TrendingUp className="h-3 w-3" />
          Snapshot
        </span>
        <h1 className="font-display text-display-md tracking-tightest display-tight mt-3 font-bold">
          Operations overview
        </h1>
        <p className="text-muted mt-2 max-w-xl text-pretty text-base">
          Live status across all networks, feeds and operations. Numbers refresh every 60 seconds.
        </p>
      </header>

      {/* Stat tiles */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, sub, trend, Icon, accent }) => (
          <article
            key={label}
            className="surface-elevated hover:shadow-card relative isolate overflow-hidden rounded-3xl p-5 transition-all hover:-translate-y-0.5"
          >
            <div
              className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${accent} opacity-25 blur-2xl`}
            />
            <div className="flex items-start justify-between">
              <div
                className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-md`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={
                  trend === 'up'
                    ? 'bg-status-onTime/15 text-status-onTime inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]'
                    : 'bg-status-delay/15 text-status-delay inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]'
                }
              >
                <ArrowUpRight className={`h-3 w-3 ${trend === 'down' ? 'rotate-90' : ''}`} />
                {trend}
              </span>
            </div>
            <div className="text-subtle mt-4 font-mono text-[10px] uppercase tracking-[0.18em]">
              {label}
            </div>
            <div className="board-num font-display tracking-tightest mt-1 text-3xl font-bold">
              {value}
            </div>
            <div className="text-muted mt-1 text-xs">{sub}</div>
          </article>
        ))}
      </section>

      {/* Feeds table */}
      <section>
        <header className="mb-4 flex items-end justify-between">
          <div>
            <span className="chip-brand">
              <Database className="h-3 w-3" />
              Providers
            </span>
            <h2 className="font-display text-display-sm tracking-tightest display-tight mt-3 font-bold">
              Feed health
            </h2>
          </div>
          <span className="text-subtle font-mono text-[11px] uppercase tracking-[0.18em]">
            last 1h window
          </span>
        </header>

        <div className="ticket overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))]">
                <th className="text-subtle px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                  Network
                </th>
                <th className="text-subtle px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                  Country
                </th>
                <th className="text-subtle px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                  Records
                </th>
                <th className="text-subtle px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                  Last sync
                </th>
                <th className="text-subtle px-5 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {feeds.map((f) => (
                <tr key={f.id} className="transition-colors hover:bg-[rgb(var(--surface-muted))]">
                  <td className="font-display px-5 py-3 font-semibold tracking-tight">{f.name}</td>
                  <td className="text-subtle px-3 py-3 font-mono text-xs uppercase tracking-[0.18em]">
                    {f.country}
                  </td>
                  <td className="board-num px-3 py-3 font-mono text-xs">{f.records}</td>
                  <td className="text-muted px-3 py-3 text-xs">{f.lastSync}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ring-4 ${statusClass[f.status]}`}
                      />
                      <Activity className="text-subtle h-3.5 w-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
