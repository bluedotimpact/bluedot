import * as Sentry from '@sentry/nextjs';
import env from './lib/api/env';

Sentry.init({
  dsn: env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
});
