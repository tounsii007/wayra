import * as Sentry from '@sentry/node';

/**
 * Initialise Sentry if SENTRY_DSN is set. Safe to call before NestFactory:
 * if the env var is missing we no-op so dev runs aren't gated on a real
 * Sentry project.
 */
export function initSentry(): boolean {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return false;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    profilesSampleRate: 0,
    sendDefaultPii: false,
  });
  return true;
}

export { Sentry };
