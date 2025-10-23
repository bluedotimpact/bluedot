import { useAuthStore } from '@bluedot/ui';
import { httpBatchLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import type { AppRouter } from '../server/routers/_app';

const ONE_MIN_MS = 60 * 1000;

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
async function getHeadersWithValidToken() {
  const { auth, refresh } = useAuthStore.getState();

  if (!auth) {
    return { authorization: '' };
  }

  const now = Date.now();
  const timeUntilExpiry = auth.expiresAt - now;

  // If token expires within 1 minute or is already expired, refresh it
  if (timeUntilExpiry < ONE_MIN_MS && auth.refreshToken && auth.oidcSettings) {
    await refresh();
    // Get the updated auth after refresh
    const { auth: refreshedAuth } = useAuthStore.getState();
    return {
      authorization: refreshedAuth?.token ? `Bearer ${refreshedAuth.token}` : '',
    };
  }

  return {
    authorization: auth.token ? `Bearer ${auth.token}` : '',
  };
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
