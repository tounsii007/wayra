import { Database, Download, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const rows = [
  {
    id: 'db',
    name: 'DB Open Data',
    country: 'DE',
    flag: '🇩🇪',
    kind: 'GTFS + RT',
    size: '1.4 GB',
    last: '2 min',
    state: 'ok',
  },
  {
    id: 'rmv',
    name: 'RMV',
    country: 'DE',
    flag: '🇩🇪',
    kind: 'GTFS + RT',
    size: '210 MB',
    last: '4 min',
    state: 'ok',
  },
  {
    id: 'bvg',
    name: 'BVG',
    country: 'DE',
    flag: '🇩🇪',
    kind: 'GTFS + RT',
    size: '180 MB',
    last: '3 min',
    state: 'ok',
  },
  {
    id: 'sncf',
    name: 'SNCF',
    country: 'FR',
    flag: '🇫🇷',
    kind: 'GTFS + Navitia',
    size: '950 MB',
    last: '18 min',
    state: 'warn',
  },
  {
    id: 'idfm',
    name: 'IDFM (Île-de-France)',
    country: 'FR',
    flag: '🇫🇷',
    kind: 'GTFS + RT',
    size: '430 MB',
    last: '5 min',
    state: 'ok',
  },
  {
    id: 'ratp',
    name: 'RATP open data',
    country: 'FR',
    flag: '🇫🇷',
    kind: 'GTFS',
    size: '180 MB',
    last: '2 h',
    state: 'ok',
  },
  {
    id: 'sncft',
    name: 'SNCFT (curated)',
    country: 'TN',
    flag: '🇹🇳',
    kind: 'GTFS',
    size: '12 MB',
    last: '46 min',
    state: 'warn',
  },
  {
    id: 'transtu',
    name: 'TRANSTU (curated)',
    country: 'TN',
    flag: '🇹🇳',
    kind: 'GTFS',
    size: '8 MB',
    last: '1 h',
    state: 'ok',
  },
];

export const metadata = { title: 'Feeds · Admin' };

export default function FeedsPage() {
  return (
    <div className="space-y-8">
      <header>
        <span className="chip-brand">
          <Database className="h-3 w-3" />
          Providers
        </span>
        <h1 className="font-display text-display-md tracking-tightest display-tight mt-3 font-bold">
          GTFS feeds
        </h1>
        <p className="text-muted mt-2 max-w-2xl text-pretty text-base">
          GTFS / GTFS-RT sources. Use the importer script (
          <code className="rounded bg-[rgb(var(--surface-muted))] px-1 py-0.5 font-mono text-[12px]">
            pnpm gtfs-import
          </code>
          ) to reload a feed manually.
        </p>
      </header>

      <div className="ticket overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-muted))]">
              <th className="text-subtle px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                Feed
              </th>
              <th className="text-subtle px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                Country
              </th>
              <th className="text-subtle px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                Type
              </th>
              <th className="text-subtle px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                Size
              </th>
              <th className="text-subtle px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                Last sync
              </th>
              <th className="text-subtle px-3 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                State
              </th>
              <th className="text-subtle px-5 py-3 text-right font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]">
            {rows.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-[rgb(var(--surface-muted))]">
                <td className="px-5 py-3">
                  <span className="font-display inline-flex items-center gap-2 font-semibold tracking-tight">
                    <Database className="text-subtle h-4 w-4" />
                    {r.name}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span aria-hidden className="mr-1">
                    {r.flag}
                  </span>
                  <span className="text-subtle font-mono text-xs uppercase tracking-[0.18em]">
                    {r.country}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className="chip-surface text-[10px]">{r.kind}</span>
                </td>
                <td className="board-num px-3 py-3 font-mono text-xs tabular-nums">{r.size}</td>
                <td className="text-muted px-3 py-3 font-mono text-xs">{r.last}</td>
                <td className="px-3 py-3">
                  {r.state === 'ok' ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="dot bg-status-onTime" />
                      <span className="text-status-onTime font-mono text-[10px] uppercase tracking-[0.16em]">
                        healthy
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="dot bg-status-delay" />
                      <span className="text-status-delay font-mono text-[10px] uppercase tracking-[0.16em]">
                        stale
                      </span>
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button
                      className={cn(
                        'focus-ring text-muted inline-flex items-center gap-1 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors hover:text-[rgb(var(--text))]',
                      )}
                      title="Reimport"
                    >
                      <RefreshCw className="h-3 w-3" /> Reimport
                    </button>
                    <button
                      className="focus-ring text-muted inline-flex items-center gap-1 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors hover:text-[rgb(var(--text))]"
                      title="Download"
                    >
                      <Download className="h-3 w-3" /> Source
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
