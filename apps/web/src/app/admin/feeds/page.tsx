import { Database, Download, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

const rows = [
  {
    id: 'db',
    name: 'DB Open Data',
    country: 'DE',
    kind: 'GTFS + RT',
    size: '1.4 GB',
    last: '2 min',
    state: 'ok',
  },
  {
    id: 'rmv',
    name: 'RMV',
    country: 'DE',
    kind: 'GTFS + RT',
    size: '210 MB',
    last: '4 min',
    state: 'ok',
  },
  {
    id: 'bvg',
    name: 'BVG',
    country: 'DE',
    kind: 'GTFS + RT',
    size: '180 MB',
    last: '3 min',
    state: 'ok',
  },
  {
    id: 'sncf',
    name: 'SNCF',
    country: 'FR',
    kind: 'GTFS + Navitia',
    size: '950 MB',
    last: '18 min',
    state: 'warn',
  },
  {
    id: 'idfm',
    name: 'IDFM (Île-de-France)',
    country: 'FR',
    kind: 'GTFS + RT',
    size: '430 MB',
    last: '5 min',
    state: 'ok',
  },
  {
    id: 'ratp',
    name: 'RATP open data',
    country: 'FR',
    kind: 'GTFS',
    size: '180 MB',
    last: '2 h',
    state: 'ok',
  },
  {
    id: 'sncft',
    name: 'SNCFT (curated)',
    country: 'TN',
    kind: 'GTFS',
    size: '12 MB',
    last: '46 min',
    state: 'warn',
  },
  {
    id: 'transtu',
    name: 'TRANSTU (curated)',
    country: 'TN',
    kind: 'GTFS',
    size: '8 MB',
    last: '1 h',
    state: 'ok',
  },
];

export const metadata = { title: 'Feeds · Admin' };

export default function FeedsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Feeds</h1>
        <p className="text-muted text-sm">
          GTFS / GTFS-RT sources. Use the importer script (`gtfs-import`) to reload a feed manually.
        </p>
      </header>

      <div className="surface overflow-hidden rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-subtle text-left text-xs uppercase tracking-wide">
              <th className="px-4 py-3">Feed</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Last sync</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-semibold">
                  <Database className="text-subtle mr-2 inline h-4 w-4" />
                  {r.name}
                </td>
                <td className="px-4 py-3">{r.country}</td>
                <td className="text-muted px-4 py-3">{r.kind}</td>
                <td className="px-4 py-3 tabular-nums">{r.size}</td>
                <td className="text-muted px-4 py-3">{r.last}</td>
                <td className="px-4 py-3">
                  {r.state === 'ok' ? (
                    <span className="text-status-onTime inline-flex items-center gap-1 text-xs font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> healthy
                    </span>
                  ) : (
                    <span className="text-status-delay inline-flex items-center gap-1 text-xs font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5" /> stale
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      className="surface-muted focus-ring inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold hover:text-[rgb(var(--text))]"
                      title="Reimport"
                    >
                      <RefreshCw className="h-3 w-3" /> reimport
                    </button>
                    <button
                      className="surface-muted focus-ring inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold hover:text-[rgb(var(--text))]"
                      title="Download"
                    >
                      <Download className="h-3 w-3" /> source
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
