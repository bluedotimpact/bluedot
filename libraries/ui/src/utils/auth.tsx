import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import React from 'react';
import { IdTokenClaims, OidcClient, OidcClientSettings } from 'oidc-client-ts';
import posthog from 'posthog-js';
import { Navigate } from '../Navigate';

const FIVE_SEC_MS = 5 * 1000;
const ONE_MIN_MS = 60 * 1000;

const oidcRefresh = async (auth: Auth): Promise<Auth> => {
  if (!auth.refreshToken) {
    throw new Error('oidcRefresh: Missing refresh token');
  }
  if (!auth.oidcSettings) {
    throw new Error('oidcRefresh: Missing OIDC configuration');
  }

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
    attribution: auth.attribution,
  };
};

export type Auth = {
  token: string,
  /** ms unix timestamp */
  expiresAt: number,
  refreshToken?: string,
  oidcSettings?: OidcClientSettings,
  email: string,
  /** Marketing attribution data */
  attribution?: {
    referralCode?: string,
    utmSource?: string,
    utmCampaign?: string,
    utmTerm?: string,
    utmMedium?: string,
  }
};

export const useAuthStore = create<{
  auth: Auth | null,
  setAuth:(auth: Auth | null) => void,
  internal_clearTimer: NodeJS.Timeout | null,
  internal_refreshTimer: NodeJS.Timeout | null,
  internal_visibilityHandler: (() => void) | null
}>()(persist((set, get) => ({
  auth: null,
  setAuth: (auth) => {
    // Clear existing timers
    const existingTimer = get().internal_clearTimer;
    const existingRefreshTimer = get().internal_refreshTimer;
    const existingVisibilityHandler = get().internal_visibilityHandler;
    if (existingTimer) clearTimeout(existingTimer);
    if (existingRefreshTimer) clearTimeout(existingRefreshTimer);
    if (existingVisibilityHandler) document.removeEventListener('visibilitychange', existingVisibilityHandler);

    if (!auth) {
      set({ auth: null, internal_clearTimer: null, internal_refreshTimer: null, internal_visibilityHandler: null });
      posthog.reset();
      return;
    }

    posthog.identify(auth.email, {
      email: auth.email,
      ...(auth.attribution || {}),
    });

    const now = Date.now();
    const expiresInMs = auth.expiresAt - now;
    const clearInMs = expiresInMs - FIVE_SEC_MS; // Clear/logout 5 seconds before expiry. This only happens if refresh fails
    const refreshInMs = expiresInMs - ONE_MIN_MS; // Refresh 1 minute before expiry

    // Set up refresh timer if we have refresh capability
    let refreshTimer: NodeJS.Timeout | null = null;
    if (auth.refreshToken && auth.oidcSettings) {
      refreshTimer = setTimeout(async () => {
        try {
          const newAuth = await oidcRefresh(auth);
          get().setAuth(newAuth);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Token refresh failed:', error);
          get().setAuth(null);
        }
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

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        const currentAuth = get().auth;
        if (!currentAuth?.refreshToken || !currentAuth?.oidcSettings) return;
        // If token expires within the next minute, refresh now
        if (currentAuth.expiresAt - Date.now() < ONE_MIN_MS) {
          oidcRefresh(currentAuth).then((newAuth) => {
            get().setAuth(newAuth);
          }).catch((err) => {
            // eslint-disable-next-line no-console
            console.error('Token refresh on visibility failed:', err);
            get().setAuth(null);
          });
        }
      }
    };

    document.addEventListener('visibilitychange', visibilityHandler);

    set({
      auth,
      internal_clearTimer: clearTimer,
      internal_refreshTimer: refreshTimer,
      internal_visibilityHandler: visibilityHandler,
    });
  },
  internal_clearTimer: null,
  internal_refreshTimer: null,
  internal_visibilityHandler: null,
}), {
  name: 'bluedot_auth',
  version: 20250513,

  // On rehydration, set the state again
  // This starts the refresh and expiry logic
  onRehydrateStorage: () => (state) => {
    if (state && state.auth) {
      state.setAuth(state.auth);
    }
  },
}));

export const withAuth = (Component: React.FC<{ auth: Auth, setAuth: (s: Auth | null) => void }>, loginRoute = '/login'): React.FC => {
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
