/**
 * Client-side Sentry init. Lazily imports `@sentry/nextjs` so the bundle
 * stays slim when no DSN is configured.
 */
export async function maybeInitSentry(): Promise<boolean> {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return false;
  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? 'development',
      release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
      tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    });
    return true;
  } catch {
    return false;
  }
}
