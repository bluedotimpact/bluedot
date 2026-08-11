import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? 'development',

  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  // Noise from browser extensions, not our code.
  ignoreErrors: [
    /Failed to connect to MetaMask/i,
    /Talisman extension has not been configured/i,
  ],
  denyUrls: [
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    /^safari-(web-)?extension:\/\//,
    // Safari reports extension stack frames as webkit-masked-url://hidden/
    /webkit-masked-url:\/\//,
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
