/**
 * Wayra design system — Tailwind preset shared by apps/web.
 *
 * Visual language: "Mediterranean Transit"
 *   • brand   — deep ocean teal (Mediterranean + rail-green heritage)
 *   • accent  — saffron amber (North-African warmth, sunset)
 *   • ink     — deep navy near-black (tunnel, schedule board)
 *   • cream   — warm off-white (editorial, never stark)
 *   • gold    — used sparingly for status / highlights
 *
 * Typography:
 *   • display — Bricolage Grotesque (variable, optical-sizing — editorial headlines)
 *   • sans    — Inter (workhorse body type)
 *   • mono    — JetBrains Mono (departure-board numerics, times, codes)
 *   • arabic  — Cairo / IBM Plex Sans Arabic (RTL coverage)
 */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary — Ocean Teal (replaces the old generic blue brand).
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // primary
          600: '#0d9488', // hero accent / CTAs
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Accent — Saffron / Amber.  The complementary partner to teal.
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706', // hero accent
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
          // Named aliases retained for backwards-compat.
          teal: '#0d9488',
          violet: '#7c3aed',
          sunset: '#d97706',
          gold: '#fbbf24',
          coral: '#fb7185',
        },
        // Neutral — Ink (deep navy) for text/surfaces in dark mode.
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Cream — editorial off-white for light backgrounds + paper feel.
        cream: {
          50: '#fdfbf6',
          100: '#fbf7ee',
          200: '#f5ecd9',
          300: '#ecdcb8',
        },
        status: {
          onTime: '#10b981',
          delay: '#f59e0b',
          severe: '#ef4444',
          info: '#0ea5e9',
          cancelled: '#7f1d1d',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        display: [
          'var(--font-display)',
          '"Bricolage Grotesque"',
          'var(--font-sans)',
          'Inter',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: [
          'var(--font-mono)',
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'monospace',
        ],
        arabic: ['Cairo', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Display sizes for editorial headlines.
        'display-xl': ['clamp(3rem, 6.5vw, 5.5rem)', { lineHeight: '1.02', letterSpacing: '-0.04em' }],
        'display-lg': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.035em' }],
        'display-md': ['clamp(2rem, 3.6vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'display-sm': ['clamp(1.5rem, 2.5vw, 2rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        xl: '18px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '40px',
        // Ticket-stub corner radius — slightly off-balance for character.
        ticket: '20px',
      },
      boxShadow: {
        // Soft layered elevation — feels like paper, not the default
        // material shadow.
        sm: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.02)',
        DEFAULT:
          '0 2px 8px -2px rgba(15, 23, 42, 0.08), 0 4px 16px -4px rgba(15, 23, 42, 0.06)',
        md: '0 4px 14px -4px rgba(15, 23, 42, 0.12), 0 8px 24px -8px rgba(15, 23, 42, 0.08)',
        lg: '0 10px 30px -10px rgba(15, 23, 42, 0.18), 0 20px 50px -20px rgba(15, 23, 42, 0.12)',
        card: '0 8px 24px -8px rgba(15, 23, 42, 0.14)',
        glow: '0 10px 40px -10px rgba(13, 148, 136, 0.45)',
        'glow-amber': '0 10px 40px -10px rgba(217, 119, 6, 0.4)',
        // Inner ring for press/focus states.
        ringInset: 'inset 0 0 0 1px rgba(15, 23, 42, 0.08)',
      },
      backgroundImage: {
        // Aurora gradients — warmer than the old blue/violet/teal.
        'aurora-warm':
          'radial-gradient(1100px 600px at 8% 12%, rgba(217, 119, 6, 0.28), transparent 60%),' +
          'radial-gradient(900px 500px at 92% 8%, rgba(13, 148, 136, 0.30), transparent 60%),' +
          'radial-gradient(800px 460px at 50% 100%, rgba(251, 191, 36, 0.20), transparent 60%)',
        'aurora-cool':
          'radial-gradient(1100px 600px at 0% 0%, rgba(13, 148, 136, 0.30), transparent 60%),' +
          'radial-gradient(900px 500px at 100% 0%, rgba(20, 184, 166, 0.25), transparent 60%),' +
          'radial-gradient(800px 460px at 50% 100%, rgba(251, 191, 36, 0.16), transparent 60%)',
        // Mesh — a more interesting hero backdrop.
        'mesh-mediterranean':
          'conic-gradient(from 220deg at 30% 30%, rgba(13, 148, 136, 0.22), transparent 35%),' +
          'conic-gradient(from 60deg at 80% 20%, rgba(217, 119, 6, 0.18), transparent 35%),' +
          'conic-gradient(from 320deg at 60% 90%, rgba(251, 191, 36, 0.16), transparent 35%)',
        // Paper / parchment gradient for ticket surfaces.
        'paper-light':
          'linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(251, 247, 238, 0.92) 100%)',
        'paper-dark':
          'linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(2, 6, 23, 0.92) 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        // A signature departure-board flip / shuffle animation.
        'flip-in': {
          '0%': { opacity: '0', transform: 'rotateX(-90deg)' },
          '100%': { opacity: '1', transform: 'rotateX(0deg)' },
        },
        // Marquee for live status ticker.
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        // Subtle floating motion for hero illustrations.
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        // Compass-needle style rotation for loaders.
        compass: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        // Route-line drawing animation.
        'draw-line': {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        // Number-roll for departure times.
        'number-roll': {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.45s cubic-bezier(0.2, 0, 0, 1) both',
        'fade-in-up': 'fade-in-up 0.55s cubic-bezier(0.2, 0, 0, 1) both',
        'fade-in-down': 'fade-in-down 0.5s cubic-bezier(0.2, 0, 0, 1) both',
        'slide-in-right': 'slide-in-right 0.45s cubic-bezier(0.2, 0, 0, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        'flip-in': 'flip-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        marquee: 'marquee 40s linear infinite',
        'marquee-slow': 'marquee 80s linear infinite',
        float: 'float 6s ease-in-out infinite',
        compass: 'compass 12s linear infinite',
        'draw-line': 'draw-line 1.4s cubic-bezier(0.65, 0, 0.35, 1) forwards',
      },
      transitionTimingFunction: {
        // Custom curves that feel "transit-like" — confident, with arrival.
        arrive: 'cubic-bezier(0.16, 1, 0.3, 1)',
        depart: 'cubic-bezier(0.65, 0, 0.35, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backdropBlur: {
        xs: '4px',
      },
      letterSpacing: {
        tightest: '-0.06em',
        tighter: '-0.04em',
      },
    },
  },
};
