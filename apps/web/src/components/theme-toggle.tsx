'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const order = ['light', 'dark', 'system'] as const;
type Mode = (typeof order)[number];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={cn('h-9 w-9 rounded-full', className)} />;
  }

  const current = (theme as Mode) ?? 'system';
  const Icon = current === 'dark' ? Moon : current === 'light' ? Sun : Monitor;

  return (
    <button
      type="button"
      aria-label={`Theme: ${current}`}
      onClick={() => {
        const next = order[(order.indexOf(current) + 1) % order.length] ?? 'system';
        setTheme(next);
      }}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full',
        'glass focus-ring transition-transform hover:scale-105',
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
