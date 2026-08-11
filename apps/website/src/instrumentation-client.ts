import * as Sentry from '@sentry/nextjs';
import { type Auth, useAuthStore } from '@bluedot/ui';

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

// Sessions stored before #2755 have no sub until their first token refresh, so fall back to email - mirroring the PostHog identify call in @bluedot/ui's auth store.
const syncSentryUser = (auth: Auth | null) => {
  Sentry.setUser(auth ? { id: auth.sub ?? auth.email } : null);
};

syncSentryUser(useAuthStore.getState().auth);
useAuthStore.subscribe((state) => syncSentryUser(state.auth));

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
