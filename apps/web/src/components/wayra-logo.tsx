import { cn } from '@/lib/utils';

/**
 * Wayra logo — a stylised "route" mark.
 *
 * Two dots (origin / destination) connected by a serpentine route line that
 * subtly resembles a "W".  Uses brand teal → amber gradient (the two pillars
 * of the design system).  The whole mark sits on a rounded square with a
 * gentle inner ring so it reads even at favicon sizes.
 */
export function WayraLogo({ className, variant = 'gradient' }: { className?: string; variant?: 'gradient' | 'mono' }) {
  const id = 'wayra-grad-' + variant;
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="55%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id={id + '-mono'} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.92" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
        </linearGradient>
      </defs>
      {/* Background tile */}
      <rect
        width="40"
        height="40"
        rx="12"
        fill={variant === 'gradient' ? `url(#${id})` : `url(#${id}-mono)`}
      />
      {/* Inner highlight ring */}
      <rect x="0.5" y="0.5" width="39" height="39" rx="11.5" stroke="rgba(255,255,255,0.18)" />

      {/* Route path — subtle "W" / undulating line */}
      <path
        d="M9 14c3.4 0 4.5 2.6 5.8 7 1.3 4.5 2.1 6 3.2 6 1.1 0 1.9-1.5 3.2-6 1.3-4.4 2.4-7 5.8-7"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Origin / destination dots */}
      <circle cx="9" cy="14" r="2.3" fill="white" />
      <circle cx="27" cy="14" r="2.3" fill="white" />

      {/* Tiny accent dot — the connection / destination flag */}
      <circle cx="31.5" cy="9" r="1.4" fill="#fbbf24" />
    </svg>
  );
}
