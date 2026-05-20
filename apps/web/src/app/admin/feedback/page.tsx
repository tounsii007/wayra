import { MessageSquare, Bug, Lightbulb, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const feedback = [
  {
    id: 1,
    user: 'maxi@…',
    text: 'Frankfurt Hbf platform changes not showing on iOS.',
    when: '2h ago',
    tag: 'bug' as const,
  },
  {
    id: 2,
    user: 'leila@…',
    text: 'Bitte Tunis Metro Line 3 als Filter ergänzen.',
    when: '6h ago',
    tag: 'request' as const,
  },
  {
    id: 3,
    user: 'alex@…',
    text: 'Love the dark mode! The amber-on-ink board look is genuinely special.',
    when: '1d ago',
    tag: 'praise' as const,
  },
];

const TAG_META: Record<
  (typeof feedback)[number]['tag'],
  { tone: string; Icon: typeof MessageSquare; label: string }
> = {
  bug: { tone: 'bg-status-severe/15 text-status-severe', Icon: Bug, label: 'Bug' },
  request: { tone: 'bg-status-info/15 text-status-info', Icon: Lightbulb, label: 'Request' },
  praise: { tone: 'bg-status-onTime/15 text-status-onTime', Icon: Heart, label: 'Praise' },
};

export const metadata = { title: 'Feedback · Admin' };

export default function FeedbackPage() {
  return (
    <div className="space-y-8">
      <header>
        <span className="chip-amber">
          <MessageSquare className="h-3 w-3" />
          Inbox
        </span>
        <h1 className="font-display text-display-md tracking-tightest display-tight mt-3 font-bold">
          Feedback
        </h1>
        <p className="text-muted mt-2 max-w-xl text-pretty text-base">
          User-reported bugs, feature requests, and praise. Triage weekly.
        </p>
      </header>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        <Summary label="Bugs" value="1" tone="severe" />
        <Summary label="Requests" value="1" tone="info" />
        <Summary label="Praise" value="1" tone="onTime" />
      </div>

      <ul className="space-y-3">
        {feedback.map((f) => {
          const meta = TAG_META[f.tag];
          const Icon = meta.Icon;
          return (
            <li key={f.id} className="ticket flex gap-4 overflow-hidden p-5">
              <span
                className={cn(
                  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                  meta.tone,
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-subtle font-mono text-xs">{f.user}</span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em]',
                      meta.tone,
                    )}
                  >
                    {meta.label}
                  </span>
                  <span className="text-subtle ms-auto font-mono text-[10px] uppercase tracking-[0.16em]">
                    {f.when}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--text))]">{f.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'severe' | 'info' | 'onTime';
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-1.5 text-xs font-semibold">
      <span
        className={cn(
          'dot',
          tone === 'severe' && 'bg-status-severe',
          tone === 'info' && 'bg-status-info',
          tone === 'onTime' && 'bg-status-onTime',
        )}
      />
      <span className="text-muted">{label}</span>
      <span className="board-num font-mono text-[11px]">{value}</span>
    </span>
  );
}
