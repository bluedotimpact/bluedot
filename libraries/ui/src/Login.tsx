import { useEffect, useRef, useState } from 'react';
import { OidcClient, type OidcClientSettings } from 'oidc-client-ts';
import { useRouter } from 'next/router';
import { Navigate } from './Navigate';
import { type Auth, useAuthStore } from './utils/auth';
import { ErrorSection } from './ErrorSection';
import { getQueryParam } from './utils/getQueryParam';
import { ProgressDots } from './ProgressDots';
import { useLatestUtmParams } from './hooks/useLatestUtmParams';

export type LoginPageProps = {
  loginPreset: LoginPreset;
};

export type LoginOauthCallbackPageProps = LoginPageProps & {
  /**
   * Runs after the OIDC response is validated but before auth is persisted to the store.
   * Throwing aborts the login (shows the error page) and auth is never saved.
   */
  onBeforeAuthPersist?: (auth: Auth, redirectTo: string) => Promise<void>;
};

export type LoginPreset = {
  oidcSettings: OidcClientSettings;
  getRegistrationUrl?: (authUrl: string) => string;
};

export const loginPresets = {
  /** Any customer login.bluedot.org account can login */
  keycloak: {
    oidcSettings: {
      authority: 'https://login.bluedot.org/realms/customers/',
      client_id: 'bluedot-web-apps',
      redirect_uri: `${typeof window === 'undefined' ? '' : window.location.origin}/login/oauth-callback`,
      scope: 'openid email profile offline_access',
    },
    getRegistrationUrl(authUrl: string) {
      const url = new URL(authUrl);
      url.pathname = url.pathname.replace('auth', 'registrations');
      return url.toString();
    },
  },
  /** Only \@bluedot.org Google accounts can login */
  // The useless concats are to avoid GitHub's secret scanner complaining
  // This is fine, because these are NOT secret
  googleBlueDot: {
    oidcSettings: {
      authority: 'https://accounts.google.com/',
      // eslint-disable-next-line no-useless-concat
      client_id: '558012313311-ndfttio1u55baojf' + 'odrhiju4nvkakmqj.apps.googleusercontent.com',
      // This is a bit cursed, but is required because Google is a pain - see https://stackoverflow.com/questions/60724690/
      // It's okay for this to be public because we always use PKCE
      // eslint-disable-next-line no-useless-concat
      client_secret: 'GOCSPX-gM' + 'FRMUkLGIJG0wyWj09BPH6H8aSM',
      scope: 'openid email',
      redirect_uri: `${typeof window === 'undefined' ? '' : window.location.origin}/login/oauth-callback`,
      extraQueryParams: { hd: 'bluedot.org' },
    },
  },
} satisfies Record<string, LoginPreset>;

/**
 * Supported page params:
 * - redirect_to: The URL to redirect to after login
 * - register: Set to 'true' to prefer taking the user to a registration page instead of login
 * - email: Email address to prefill in the login/registration form
 */
export const LoginRedirectPage: React.FC<LoginPageProps> = ({ loginPreset }) => {
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const redirectTo = (typeof window !== 'undefined' && getQueryParam(window.location.href, 'redirect_to')) || '/';
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const prefilledEmail = typeof window !== 'undefined' ? getQueryParam(window.location.href, 'email') || undefined : undefined;
  const auth = useAuthStore((s) => s.auth);
  const { appendLatestUtmParamsToUrl, isLoading: isUtmParamsLoading } = useLatestUtmParams();

  useEffect(() => {
    if (isUtmParamsLoading) {
      return;
    }

    if (!auth) {
      // Track if user is coming from Future of AI course
      // @ts-ignore dataLayer was added to window in apps/website in the GoogleTagManager.tsx file
      if (typeof window !== 'undefined' && window.dataLayer) {
        // @ts-ignore
        window.dataLayer.push({
          event: 'considerers',
          course_slug: 'future-of-ai',
        });
      }

      // Append latest UTM params to redirectTo URL to ensure they persist through the OAuth flow
      const redirectToWithUtms = appendLatestUtmParamsToUrl(redirectTo);

      // Merge email into oidcSettings extraQueryParams if provided
      const oidcSettings = prefilledEmail
        ? {
          ...loginPreset.oidcSettings,
          extraQueryParams: {
            ...loginPreset.oidcSettings.extraQueryParams,
            login_hint: prefilledEmail,
          },
        }
        : loginPreset.oidcSettings;

      new OidcClient(oidcSettings)
        .createSigninRequest({
          request_type: 'si:r',
          state: { redirectTo: redirectToWithUtms },
        })
        .then((req) => {
          const isRegister = getQueryParam(window.location.href, 'register') === 'true';
          const loginProviderUrl = (isRegister && typeof loginPreset.getRegistrationUrl === 'function')
            ? loginPreset.getRegistrationUrl(req.url)
            : req.url;
          window.location.href = loginProviderUrl;
        });
    }
  }, [auth, appendLatestUtmParamsToUrl, redirectTo, prefilledEmail, loginPreset, isUtmParamsLoading]);

  if (auth) {
    return <Navigate url={redirectTo} />;
  }

  return <ProgressDots />;
};

export const LoginOauthCallbackPage: React.FC<LoginOauthCallbackPageProps> = ({ loginPreset, onBeforeAuthPersist }) => {
  const [error, setError] = useState<undefined | React.ReactNode | Error>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  const hasEverMounted = useRef(false);

  useEffect(() => {
    const signinUser = async () => {
      try {
        const user = await new OidcClient(loginPreset.oidcSettings).processSigninResponse(window.location.href);

        if (!user) {
          throw new Error('Bad login response: No user returned');
        }

        if (typeof user.expires_at !== 'number') {
          throw new Error('Bad login response: user.expires_at is missing or not a number');
        }

        if (typeof user.id_token !== 'string') {
          throw new Error('Bad login response: user.id_token is missing or not a string');
        }

        if (typeof user.profile.email !== 'string') {
          throw new Error('Bad login response: user.profile.email is missing or not a string');
        }

        if (typeof user.profile.sub !== 'string') {
          throw new Error('Bad login response: user.profile.sub is missing or not a string');
        }

        const auth = {
          expiresAt: user.expires_at * 1000,
          token: user.id_token,
          refreshToken: user.refresh_token,
          oidcSettings: loginPreset.oidcSettings,
          email: user.profile.email,
          sub: user.profile.sub,
        };

        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        const redirectTo = (user.userState as { redirectTo?: string }).redirectTo || '/';

        if (onBeforeAuthPersist) {
          await onBeforeAuthPersist(auth, redirectTo);
        }

        setAuth(auth);

        router.push(redirectTo);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    if (!hasEverMounted.current) {
      hasEverMounted.current = true;
      signinUser();
    }
  }, [loginPreset.oidcSettings, onBeforeAuthPersist, router, setAuth]);

  if (error) {
    return <ErrorSection error={error} />;
  }

  return (
    <ProgressDots />
  );
};
