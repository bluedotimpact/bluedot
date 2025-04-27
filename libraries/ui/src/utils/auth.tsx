import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import React from 'react';
import { IdTokenClaims, OidcClient, OidcClientSettings } from 'oidc-client-ts';
import { Navigate } from '../Navigate';

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

  if (!user || typeof user.expires_at !== 'number' || !user.access_token) {
    throw new Error('Invalid refresh response');
  }

  return {
    token: user.access_token,
    expiresAt: user.expires_at * 1000,
    refreshToken: user.refresh_token ?? auth.refreshToken,
    oidcSettings: auth.oidcSettings,
  };
};

export type Auth = {
  token: string,
  /** ms unix timestamp */
  expiresAt: number,
  refreshToken?: string,
  oidcSettings?: OidcClientSettings,
};

export const useAuthStore = create<{
  auth: Auth | null,
  setAuth:(auth: Auth | null) => void,
  internal_clearTimer: NodeJS.Timeout | null,
  internal_refreshTimer: NodeJS.Timeout | null
}>()(persist((set, get) => ({
  auth: null,
  setAuth: (auth) => {
    // Clear existing timers
    const existingTimer = get().internal_clearTimer;
    const existingRefreshTimer = get().internal_refreshTimer;
    if (existingTimer) clearTimeout(existingTimer);
    if (existingRefreshTimer) clearTimeout(existingRefreshTimer);

    if (!auth) {
      set({ auth: null, internal_clearTimer: null, internal_refreshTimer: null });
      return;
    }

    const now = Date.now();
    const expiresInMs = auth.expiresAt - now;
    const clearInMs = expiresInMs - 5_000;
    const refreshInMs = expiresInMs - 60_000;

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

    set({
      auth,
      internal_clearTimer: clearTimer,
      internal_refreshTimer: refreshTimer,
    });
  },
  internal_clearTimer: null,
  internal_refreshTimer: null,
}), {
  name: 'bluedot_auth',
  version: 20250427,

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
