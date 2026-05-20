import { MessageSquare } from 'lucide-react';

const feedback = [
  {
    id: 1,
    user: 'maxi@…',
    text: 'Frankfurt Hbf platform changes not showing on iOS.',
    when: '2 h ago',
    tag: 'bug',
  },
  {
    id: 2,
    user: 'leila@…',
    text: 'Bitte Tunis Metro Line 3 als Filter ergänzen.',
    when: '6 h ago',
    tag: 'request',
  },
  { id: 3, user: 'alex@…', text: 'Love the dark mode!', when: '1 d ago', tag: 'praise' },
];

const tagClass: Record<string, string> = {
  bug: 'bg-status-severe/15 text-status-severe',
  request: 'bg-status-info/15 text-status-info',
  praise: 'bg-status-onTime/15 text-status-onTime',
};

export const metadata = { title: 'Feedback · Admin' };

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Feedback</h1>
        <p className="text-muted text-sm">User-reported bugs, requests and praise.</p>
      </header>
      <ul className="space-y-3">
        {feedback.map((f) => (
          <li key={f.id} className="surface flex gap-3 rounded-2xl p-4">
            <MessageSquare className="text-brand-500 h-5 w-5" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-subtle font-mono text-xs">{f.user}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tagClass[f.tag]}`}
                >
                  {f.tag}
                </span>
                <span className="text-subtle ms-auto text-xs">{f.when}</span>
              </div>
              <p className="mt-1 text-sm">{f.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
