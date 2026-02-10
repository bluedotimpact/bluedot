import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type React from 'react';
import { type IdTokenClaims, OidcClient, type OidcClientSettings } from 'oidc-client-ts';
import posthog from 'posthog-js';
import { Navigate } from '../Navigate';

const FIVE_SEC_MS = 5 * 1000;
/** Time before expiry at which we will attempt to refresh the access token */
export const REFRESH_BEFORE_EXPIRY_MS = 60 * 1000;
/** Maximum time between refresh attempts */
export const MAX_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 mins

const oidcRefreshWithRetries = async (auth: Auth): Promise<Auth> => {
  if (!auth.refreshToken) {
    throw new Error('oidcRefresh: Missing refresh token');
  }

  if (!auth.oidcSettings) {
    throw new Error('oidcRefresh: Missing OIDC configuration');
  }

  let lastError: Error | null = null;
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const user = await new OidcClient(auth.oidcSettings).useRefreshToken({
        state: {
          refresh_token: auth.refreshToken,
          session_state: null,
          profile: {} as IdTokenClaims,
        },
      });

      if (!user || typeof user.expires_at !== 'number' || !user.id_token) {
        throw new Error('Invalid refresh response');
      }

      return {
        token: user.id_token,
        expiresAt: user.expires_at * 1000,
        refreshToken: user.refresh_token ?? auth.refreshToken,
        oidcSettings: auth.oidcSettings,
        email: user.profile.email ?? auth.email,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts - 1) {
        // Exponential backoff: 1s, 2s
        const backoffMs = 1000 * (2 ** attempt);
        // eslint-disable-next-line no-await-in-loop
        await new Promise<void>((resolve) => {
          setTimeout(resolve, backoffMs);
        });
      }
    }
  }

  throw lastError || new Error('Refresh failed after all retry attempts');
};

export type Auth = {
  token: string;
  /** ms unix timestamp */
  expiresAt: number;
  refreshToken?: string;
  oidcSettings?: OidcClientSettings;
  email: string;
};

export const useAuthStore = create<{
  auth: Auth | null;
  setAuth: (auth: Auth | null) => void;
  refresh: () => Promise<void>;
  internal_clearTimer: NodeJS.Timeout | null;
  internal_refreshTimer: NodeJS.Timeout | null;
  internal_visibilityHandler: (() => void) | null;
  internal_refreshPromise: Promise<void> | null;
}>()(persist((set, get) => ({
  auth: null,
  setAuth(auth) {
    // Clear existing timers
    const existingTimer = get().internal_clearTimer;
    const existingRefreshTimer = get().internal_refreshTimer;
    const existingVisibilityHandler = get().internal_visibilityHandler;
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    if (existingRefreshTimer) {
      clearTimeout(existingRefreshTimer);
    }

    if (existingVisibilityHandler) {
      document.removeEventListener('visibilitychange', existingVisibilityHandler);
    }

    if (!auth) {
      set({
        auth: null, internal_clearTimer: null, internal_refreshTimer: null, internal_visibilityHandler: null,
      });
      posthog.reset();
      return;
    }

    set({ auth });

    posthog.identify(auth.email, {
      email: auth.email,
    });

    const now = Date.now();
    const expiresInMs = auth.expiresAt - now;
    const clearInMs = expiresInMs - FIVE_SEC_MS; // Clear/logout 5 seconds before expiry. This only happens if refresh fails
    const refreshInMs = Math.min(expiresInMs - REFRESH_BEFORE_EXPIRY_MS, MAX_REFRESH_INTERVAL_MS);

    // Set up refresh timer if we have refresh capability
    let refreshTimer: NodeJS.Timeout | null = null;
    if (auth.refreshToken && auth.oidcSettings) {
      refreshTimer = setTimeout(async () => {
        await get().refresh();
      }, refreshInMs);
    }

    // Set up clear timer as fallback
    const clearTimer = setTimeout(
      () => {
        // eslint-disable-next-line no-console
        console.warn('Auth token expired, logging out user...');
        set({ auth: null, internal_clearTimer: null });
      },
      clearInMs,
    );

    const visibilityHandler = async () => {
      if (document.visibilityState === 'visible') {
        const currentAuth = get().auth;
        // If token expires within the next minute, refresh now
        if (currentAuth?.refreshToken && currentAuth.oidcSettings && (currentAuth.expiresAt - Date.now() < REFRESH_BEFORE_EXPIRY_MS)) {
          await get().refresh();
        }
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler, { passive: true });

    set({
      internal_clearTimer: clearTimer,
      internal_refreshTimer: refreshTimer,
      internal_visibilityHandler: visibilityHandler,
    });
  },
  async refresh() {
    // Wait for any in-progress refresh to complete (with 5-second timeout)
    const existingPromise = get().internal_refreshPromise;
    if (existingPromise) {
      const result = await Promise.race([
        existingPromise.then(() => ({ timedOut: false })),
        new Promise<{ timedOut: boolean }>((resolve) => {
          setTimeout(() => resolve({ timedOut: true }), 5000);
        }),
      ]);
      // If the existing refresh completed successfully, we're done
      if (!result.timedOut) {
        return;
      }
      // If it timed out, try again
    }

    const refreshPromise = (async () => {
      const currentAuth = get().auth;
      if (!currentAuth?.refreshToken || !currentAuth.oidcSettings) {
        return;
      }

      try {
        const newAuth = await oidcRefreshWithRetries(currentAuth);
        get().setAuth(newAuth);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Token refresh failed:', error);

        // Force logout. Note: This isn't ideal because the error could just be due to a temporary
        // loss of network, we could improve on this in future.
        get().setAuth(null);
      } finally {
        set({ internal_refreshPromise: null });
      }
    })();

    set({ internal_refreshPromise: refreshPromise });
    await refreshPromise;
  },
  internal_clearTimer: null,
  internal_refreshTimer: null,
  internal_visibilityHandler: null,
  internal_refreshPromise: null,
}), {
  name: 'bluedot_auth',
  version: 20250513,
  // Only persist the auth object to localStorage, not the timers or event handlers
  partialize: (state) => ({ auth: state.auth }),

  // On rehydration, set the state again
  // This starts the refresh and expiry logic
  onRehydrateStorage: () => (state) => {
    if (state?.auth) {
      state.setAuth(state.auth);
    }
  },
}));

export const withAuth = (Component: React.FC<{ auth: Auth; setAuth: (s: Auth | null) => void }>, loginRoute = '/login'): React.FC => {
  return () => {
    const auth = useAuthStore((s) => s.auth);
    const setAuth = useAuthStore((s) => s.setAuth);

    if (!auth) {
      if (typeof window === 'undefined') {
        return null;
      }

      return (
        <Navigate url={`${loginRoute}?redirect_to=${encodeURIComponent(window.location.href.slice(window.location.origin.length))}`} />
      );
    }

    return <Component auth={auth} setAuth={setAuth} />;
  };
};
