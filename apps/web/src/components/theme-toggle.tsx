'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const order = ['light', 'dark', 'system'] as const;
type Mode = (typeof order)[number];

/**
 * Theme toggle — cycles light → dark → system.  Uses a soft scale press,
 * a subtle ring on focus, and an icon that smoothly rotates on change.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          'h-9 w-9 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))]',
          className,
        )}
      />
    );
  }

  const current = (theme as Mode) ?? 'system';
  const Icon = current === 'dark' ? Moon : current === 'light' ? Sun : Monitor;
  const labels: Record<Mode, string> = {
    light: 'Light mode',
    dark: 'Dark mode',
    system: 'System theme',
  };

  return (
    <button
      type="button"
      aria-label={labels[current]}
      title={labels[current]}
      onClick={() => {
        const next = order[(order.indexOf(current) + 1) % order.length] ?? 'system';
        setTheme(next);
      }}
      className={cn(
        'focus-ring text-muted group relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))] transition-all hover:scale-105 hover:text-[rgb(var(--text))] active:scale-95',
        className,
      )}
    >
      <Icon className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
    </button>
  );
}
