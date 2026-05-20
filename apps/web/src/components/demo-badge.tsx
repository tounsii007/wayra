import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * "Demo data" pill — surfaces wherever the data is mocked or synthesised
 * rather than coming from a real upstream feed.  Keeps the product honest
 * while we're still wiring real GTFS providers.
 */
export function DemoBadge({
  label = 'Demo data',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full',
        'border-accent-500/30 bg-accent-500/10 border px-2 py-0.5',
        'text-accent-700 dark:text-accent-400 font-mono text-[10px] font-bold uppercase tracking-[0.16em]',
        className,
      )}
      aria-label="Demo data — not from a live feed"
    >
      <Sparkles className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}
