import * as Sentry from '@sentry/nextjs';

export async function register() {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');

    const { registerDefaultInstrumentation } = await import('@bluedot/ui/src/default-config/instrumentation');
    const { default: env } = await import('./lib/api/env');

    await registerDefaultInstrumentation(env);
  }

  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
