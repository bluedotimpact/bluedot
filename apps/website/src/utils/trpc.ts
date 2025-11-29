import { REFRESH_BEFORE_EXPIRY_MS, useAuthStore } from '@bluedot/ui';
import { httpBatchLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import type { AppRouter } from '../server/routers/_app';

const TEN_SECONDS_MS = 10 * 1000;

export const IMPERSONATION_STORAGE_KEY = 'bluedot_impersonating';

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // browser should use relative path
    return '';
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:8000';
}

/**
 * Custom headers function that ensures the access token is valid before making a request.
 * If the token is close to expiry (< 50s remaining) or expired, it will refresh the token first.
 */
export async function getHeadersWithValidToken() {
  let { auth, refresh } = useAuthStore.getState();

  if (!auth) {
    return { authorization: '' };
  }

  const now = Date.now();
  const timeUntilExpiry = auth.expiresAt - now;

  // If it is past the time the token should have been refreshed, attempt to refresh it before making the request
  if (
    timeUntilExpiry < REFRESH_BEFORE_EXPIRY_MS - TEN_SECONDS_MS
    && auth.refreshToken
    && auth.oidcSettings
  ) {
    await refresh();

    const refreshedAuth = useAuthStore.getState();
    auth = refreshedAuth.auth;
    refresh = refreshedAuth.refresh;
  }

  const headers: Record<string, string> = {
    authorization: auth?.token ? `Bearer ${auth.token}` : '',
  };

  const isImpersonating = typeof window !== 'undefined' ? sessionStorage.getItem(IMPERSONATION_STORAGE_KEY) : null;
  if (isImpersonating) {
    headers['x-impersonate-user'] = isImpersonating;
  }

  return headers;
}

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          /**
           * If you want to use SSR, you need to use the server's full URL
           * @see https://trpc.io/docs/v11/ssr
           * */
          url: `${getBaseUrl()}/api/trpc`,
          // You can pass any HTTP headers you wish here
          headers: getHeadersWithValidToken,
        }),
      ],
    };
  },
  /**
   * @see https://trpc.io/docs/v11/ssr
   * */
  ssr: false,
});
