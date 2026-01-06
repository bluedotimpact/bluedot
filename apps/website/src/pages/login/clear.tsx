import { Navigate, useAuthStore } from '@bluedot/ui';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { shouldRedirectBackAfterLogout } from '../../lib/routes';

const LogoutPage: React.FC = () => {
  const auth = useAuthStore((s) => s.auth);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  // Handle array query params (security edge case)
  const redirectTo = Array.isArray(router.query.redirect_to)
    ? router.query.redirect_to[0]
    : router.query.redirect_to;

  useEffect(() => {
    setAuth(null); // Clear local auth state
  }, [setAuth]);

  // Determine where Keycloak should redirect after logout
  const getPostLogoutRedirectUri = () => {
    // Validate redirect_to is:
    // 1. Present
    // 2. A relative path (security: prevent open redirects)
    // 3. Not a protocol-relative URL (security: prevent //evil.com)
    // 4. Not an auth-required page (UX: avoid error states)
    if (
      !redirectTo
      || !redirectTo.startsWith('/')
      || redirectTo.startsWith('//')
      || !shouldRedirectBackAfterLogout(redirectTo)
    ) {
      return window.location.origin; // Default to home page
    }

    // Safe to redirect back to the original page
    return `${window.location.origin}${redirectTo}`;
  };

  // Fallback for when auth is already cleared
  if (!auth) {
    // If we have a safe redirect target, use it even when already logged out
    const fallbackUrl = redirectTo?.startsWith('/')
      && !redirectTo.startsWith('//')
      && shouldRedirectBackAfterLogout(redirectTo)
      ? redirectTo
      : '/';
    return <Navigate url={fallbackUrl} />;
  }

  const postLogoutRedirectUri = getPostLogoutRedirectUri();

  return (
    <Navigate
      url={`https://login.bluedot.org/realms/customers/protocol/openid-connect/logout?id_token_hint=${encodeURIComponent(
        auth.token,
      )}&post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`}
    />
  );
};

export default LogoutPage;
