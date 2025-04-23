import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import React from 'react';
import { IdTokenClaims, OidcClient, OidcClientSettings } from 'oidc-client-ts';
import { Navigate } from '../legacy/Navigate';

const oidcRefresh = async (auth: Auth): Promise<Auth> => {
  if (!auth.refreshToken) {
    throw new Error('No refresh token available');
  }

  // Create a UserManager instance for token refresh
  const oidcClient = new OidcClient(auth.oidcSettings);

  // Use the refresh token to get a new access token
  const user = await oidcClient.useRefreshToken({
    state: {
      refresh_token: auth.refreshToken,
      session_state: null,
      profile: {} as IdTokenClaims,
    },
  });

  console.log('refreshed user: ', user);

  if (!user || typeof user.expires_at !== 'number' || !user.access_token) {
    throw new Error('Invalid refresh response');
  }

  return {
    token: user.access_token,
    expiresAt: user.expires_at,
    refreshToken: user.refresh_token ?? auth.refreshToken,
    oidcSettings: auth.oidcSettings,
  };
};

export interface Auth {
  token: string,
  expiresAt: number,
  refreshToken?: string,
  oidcSettings: OidcClientSettings,
}

export const useAuthStore = create<{
  auth: Auth | null,
  setAuth:(auth: Auth | null) => void,
  authClearTimer: NodeJS.Timeout | null,
  refreshTimer: NodeJS.Timeout | null
}>()(persist((set, get) => ({
  auth: null,
  setAuth: (auth) => {
    // Clear existing timers
    const existingTimer = get().authClearTimer;
    const existingRefreshTimer = get().refreshTimer;
    if (existingTimer) clearTimeout(existingTimer);
    if (existingRefreshTimer) clearTimeout(existingRefreshTimer);

    if (!auth) {
      set({ auth: null, authClearTimer: null, refreshTimer: null });
      return;
    }

    const now = Date.now();

    // Set up refresh timer if we have refresh capability
    let refreshTimer: NodeJS.Timeout | null = null;
    if (auth.refreshToken) {
      const refreshAt = (auth.expiresAt * 1000) - (50 * 1000); // Refresh 30 seconds before expiry
      if (refreshAt > now) {
        refreshTimer = setTimeout(async () => {
          console.log(`refreshing token. expires: ${auth.expiresAt}, in ${refreshAt - now}ms`);

          try {
            const newAuth = await oidcRefresh(auth);
            get().setAuth(newAuth);
          } catch (error) {
            console.error('Token refresh failed:', error);
            set({ auth: null, authClearTimer: null, refreshTimer: null });
          }
        }, refreshAt - now);
      }
    }

    // Set up clear timer as fallback
    const clearTimer = setTimeout(
      () => set({ auth: null, authClearTimer: null, refreshTimer: null }),
      // Clear auth 5 seconds before expiry
      (auth.expiresAt * 1000) - now - 5000,
    );

    set({
      auth,
      authClearTimer: clearTimer,
      refreshTimer,
    });
  },
  authClearTimer: null,
  refreshTimer: null,
}), {
  name: 'bluedot_auth',
  version: 20250423,

  // On rehydration, set the state again
  // This starts the expiry logic
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
