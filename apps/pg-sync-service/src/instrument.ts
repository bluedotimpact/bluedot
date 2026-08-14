import * as Sentry from '@sentry/node';
import env from './env';

// Sentry SDK calls (captureException, captureCheckIn) are safe no-ops when
// init is skipped, so local dev and tests work without a DSN.
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT ?? 'development',
    // Errors and cron check-ins only; tracing quota is reserved for website
    tracesSampleRate: 0,
  });
}
