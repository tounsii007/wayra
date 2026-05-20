import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@wayra/types', '@wayra/shared', '@wayra/i18n', '@wayra/ui'],
  experimental: {
    typedRoutes: false,
  },
  // Type-checking happens in a dedicated CI job ('Type-check') against the
  // workspace tsconfigs. Letting next build re-run it duplicates work AND
  // hits a known Next 15 + React 19 + pnpm-hoist issue where generated
  // LayoutProps types and the consumer's React.ReactNode resolve to
  // different @types/react instances.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.wayra.app' },
    ],
  },
  async headers() {
    const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const wsOrigin = apiOrigin.replace(/^http/, 'ws');
    // Tight default-src policy. Map tiles need imgSrc=https; MapLibre needs
    // a worker-src 'blob:' for its tile-loader Web Worker; next-themes
    // injects a small inline style + script in the head, hence 'unsafe-inline'.
    const csp = [
      `default-src 'self'`,
      `base-uri 'self'`,
      `object-src 'none'`,
      `frame-ancestors 'none'`,
      `form-action 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `font-src 'self' data: https://fonts.gstatic.com`,
      `img-src 'self' data: blob: https:`,
      `connect-src 'self' ${apiOrigin} ${wsOrigin} https://api.maptiler.com https://tile.openstreetmap.org`,
      `worker-src 'self' blob:`,
      `manifest-src 'self'`,
    ].join('; ');

    const securityHeaders = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'geolocation=(self), microphone=(), camera=()',
      },
    ];
    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      });
    }
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
