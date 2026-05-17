import { cn } from '@/lib/utils';

export function WayraLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="wayra-g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="55%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#0ea5a5" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#wayra-g)" />
      {/* Stylized "W" / route */}
      <path
        d="M9 13c3 0 4 2 5.5 7 1.4 4.7 2.4 7 3.5 7s2.1-2.3 3.5-7c1.5-5 2.5-7 5.5-7"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="13" r="2.2" fill="white" />
      <circle cx="27" cy="13" r="2.2" fill="white" />
    </svg>
  );
}
