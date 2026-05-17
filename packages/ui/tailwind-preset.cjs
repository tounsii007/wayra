/**
 * Tailwind preset used by apps/web. Mirrors the design tokens.
 */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dde9ff',
          200: '#b8d2ff',
          300: '#85b1ff',
          400: '#4f87ff',
          500: '#2563eb',
          600: '#1d4fd1',
          700: '#1840a8',
          800: '#163682',
          900: '#142e69',
        },
        accent: {
          teal: '#0ea5a5',
          violet: '#7c3aed',
          sunset: '#f59e0b',
        },
        status: {
          onTime: '#16a34a',
          delay: '#f59e0b',
          severe: '#dc2626',
          info: '#0ea5e9',
          cancelled: '#991b1b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        arabic: ['Cairo', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '22px',
      },
      boxShadow: {
        glow: '0 8px 40px rgba(37, 99, 235, 0.25)',
        card: '0 8px 28px -8px rgba(15, 23, 42, 0.18)',
      },
      backgroundImage: {
        'hero-radial':
          'radial-gradient(1200px 600px at 0% 0%, rgba(37,99,235,0.25), transparent 60%),' +
          'radial-gradient(1000px 500px at 100% 0%, rgba(124,58,237,0.22), transparent 60%),' +
          'radial-gradient(900px 500px at 50% 100%, rgba(14,165,165,0.20), transparent 60%)',
        'glass-light':
          'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.35) 100%)',
        'glass-dark':
          'linear-gradient(180deg, rgba(17,23,39,0.6) 0%, rgba(17,23,39,0.4) 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s cubic-bezier(0.2, 0, 0, 1) both',
        shimmer: 'shimmer 1.4s linear infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
};
