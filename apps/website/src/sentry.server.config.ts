import * as Sentry from '@sentry/nextjs';
import env from './lib/api/env';

Sentry.init({
  dsn: env.SENTRY_DSN,

  environment: env.SENTRY_ENVIRONMENT ?? 'development',

  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  includeLocalVariables: true,
});
