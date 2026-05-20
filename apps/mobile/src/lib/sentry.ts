/**
 * Mobile Sentry init. Reads EXPO_PUBLIC_SENTRY_DSN at runtime and falls
 * back to a no-op when missing.
 */
export function maybeInitSentry(): boolean {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return false;
  try {
    // Lazy require so the SDK isn't pulled into bundles without a DSN.
    const Sentry = require('@sentry/react-native') as typeof import('@sentry/react-native');
    Sentry.init({
      dsn,
      enableAutoSessionTracking: true,
      tracesSampleRate: Number(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
      environment: __DEV__ ? 'development' : 'production',
    });
    return true;
  } catch {
    return false;
  }
}
