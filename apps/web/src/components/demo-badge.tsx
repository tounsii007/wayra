import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Tiny "Demo data" pill rendered on any UI surface where the data is
 * mocked or synthesised rather than coming from a real upstream feed.
 * Keeps the product honest while we're still wiring real GTFS data.
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
        'bg-accent-violet/15 inline-flex items-center gap-1 rounded-full px-2 py-0.5',
        'text-accent-violet text-[10px] font-bold uppercase tracking-wider',
        className,
      )}
      aria-label="Demo data — not from a live feed"
    >
      <Sparkles className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}
