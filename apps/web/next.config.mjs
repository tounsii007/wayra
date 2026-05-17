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
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), microphone=(), camera=()',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
