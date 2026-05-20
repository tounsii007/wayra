import type { LucideIcon } from 'lucide-react';

/**
 * Editorial wrapper for static/long-form pages (about, privacy, terms, …).
 * Provides:
 *   • Aurora hero with chip + display heading
 *   • Prose container with consistent typography
 */
export function EditorialPage({
  chip,
  ChipIcon,
  title,
  highlight,
  lead,
  children,
  meta,
}: {
  chip: string;
  ChipIcon?: LucideIcon;
  title: string;
  /** Optional second clause rendered in the brand gradient. */
  highlight?: string;
  lead?: string;
  children: React.ReactNode;
  /** Small monospace meta line (e.g. "Last updated · 2024-09-10"). */
  meta?: string;
}) {
  return (
    <main id="main" className="relative">
      <section className="relative isolate overflow-hidden border-b border-[rgb(var(--border))]">
        <div className="hero-aurora opacity-60" />
        <div className="grid-pattern absolute inset-0 -z-10 opacity-40 dark:opacity-20" />
        <div className="mx-auto max-w-4xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
          <span className="chip-brand">
            {ChipIcon && <ChipIcon className="h-3 w-3" />}
            {chip}
          </span>
          <h1 className="font-display text-display-lg tracking-tightest display-tight mt-4 font-bold">
            {title}{' '}
            {highlight && (
              <span className="from-brand-600 to-accent-600 bg-gradient-to-r bg-clip-text text-transparent">
                {highlight}
              </span>
            )}
          </h1>
          {lead && (
            <p className="text-muted mt-4 max-w-2xl text-pretty text-lg leading-relaxed">{lead}</p>
          )}
          {meta && (
            <p className="text-subtle mt-3 font-mono text-[10px] uppercase tracking-[0.2em]">
              {meta}
            </p>
          )}
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
        <div className="prose-editorial text-muted space-y-5 text-base leading-relaxed">
          {children}
        </div>
      </article>
    </main>
  );
}
