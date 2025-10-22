import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import React from 'react';
import { IdTokenClaims, OidcClient, OidcClientSettings } from 'oidc-client-ts';
import posthog from 'posthog-js';
import { Navigate } from '../Navigate';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const FIVE_MIN_MS = 20 * 1000;
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

let lastRefreshAttemptMs = -Infinity;
const ensureAuthRefreshed = async ({ auth, setAuth }: { auth: Auth | null; setAuth: (auth: Auth | null) => void; }) => {
  if (!auth) return;

  const now = Date.now();
  const expiresInMs = auth.expiresAt - now;
  const sinceLastRefreshAttemptMs = now - lastRefreshAttemptMs;

  if (expiresInMs > ONE_WEEK_MS || sinceLastRefreshAttemptMs < ONE_MIN_MS) return;

  try {
    lastRefreshAttemptMs = Date.now();
    const newAuth = await oidcRefresh(auth);
    setAuth(newAuth);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[auth.tsx] Token refresh failed:', error);
    if (expiresInMs < ONE_MIN_MS) {
      setAuth(null);
    }
  }
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
}>()(persist((set, get) => ({
  auth: null,
  setAuth: (auth) => {
    if (!auth) {
      set({ auth: null });
      posthog.reset();
      return;
    }

    posthog.identify(auth.email, {
      email: auth.email,
      ...(auth.attribution || {}),
    });

    set({ auth });

    // Attempt to refresh the token as soon as auth is set. This is mainly to cover the case of rehydration
    ensureAuthRefreshed({ auth, setAuth: get().setAuth });
  },
}), {
  name: 'bluedot_auth',
  version: 20251022,
  // Only persist the auth object to localStorage, not the setAuth function
  partialize: (state) => ({ auth: state.auth }),
  onRehydrateStorage: () => (state) => {
    if (state?.auth) {
      state.setAuth(state.auth);
    }
  },
}));

let refreshIntervalId: NodeJS.Timeout | null = null;
if (typeof window !== 'undefined') {
  // For HMR: Clear any existing interval
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
  }

  refreshIntervalId = setInterval(async () => {
    const { auth, setAuth } = useAuthStore.getState();
    await ensureAuthRefreshed({ auth, setAuth });
  }, FIVE_MIN_MS);
}

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
