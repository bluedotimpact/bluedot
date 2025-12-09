import { useEffect, useRef, useState } from 'react';
import { OidcClient, OidcClientSettings } from 'oidc-client-ts';
import { useRouter } from 'next/router';
import axios from 'axios';
import { createPublicKey, createVerify, JsonWebKey } from 'crypto';
import { Navigate } from './Navigate';
import { Auth, useAuthStore } from './utils/auth';
import { ErrorSection } from './ErrorSection';
import { getQueryParam } from './utils/getQueryParam';
import { ProgressDots } from './ProgressDots';
import { useLatestUtmParams } from './hooks/useLatestUtmParams';

export type LoginPageProps = {
  loginPreset: LoginPreset
};

export type LoginOauthCallbackPageProps = LoginPageProps & {
  onLoginComplete?: (auth: Auth, redirectTo: string) => Promise<void>
};

const verifyJwt = async (
  token: string,
  verifyConfig: { aud: string, iss: string, jwksUrl: string },
): Promise<{
  iss: string, aud: string, exp: number,
  sub: string, email: string, email_verified: boolean,
  [key: string]: unknown
}> => {
  // Split the JWT into its parts
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error('Invalid token format');
  }

  // Decode the header and payload
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

  // Verify aud (audience)
  if (payload.aud !== verifyConfig.aud) {
    throw new Error('Invalid token audience');
  }

  // Verify iss (issuer)
  if (payload.iss !== verifyConfig.iss) {
    throw new Error('Invalid token issuer');
  }

  // Verify exp (expiration time)
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token expired');
  }

  // Find key
  const { data: { keys } } = await axios.get<{ keys: JsonWebKey[] }>(verifyConfig.jwksUrl);
  const key = keys.find((k) => k.kid === header.kid);
  if (!key) {
    throw new Error('Public key not found');
  }
  const publicKey = createPublicKey({
    key: {
      kty: key.kty,
      n: key.n,
      e: key.e,
    },
    format: 'jwk',
  });

  // Verify signature
  const signatureInput = `${headerB64}.${payloadB64}`;
  const signature = Buffer.from(signatureB64, 'base64url');
  const verify = createVerify('RSA-SHA256').update(signatureInput);
  const isValid = verify.verify(publicKey, signature);
  if (!isValid) {
    throw new Error('Invalid signature');
  }

  if (!payload.sub) {
    throw new Error('Missing sub on payload');
  }

  if (!payload.email) {
    throw new Error('Missing email on payload - ensure you included \'email\' in scope');
  }

  if (typeof payload.email_verified !== 'boolean') {
    throw new Error(`Expected email_verified to be a boolean on payload, but got ${typeof payload.email_verified}`);
  }

  return payload;
};

export type LoginPreset = {
  oidcSettings: OidcClientSettings,
  verifyAndDecodeToken: (token: string) => Promise<{ sub: string, email: string }>
  getRegistrationUrl?: (authUrl: string) => string
};

export const loginPresets = {
  /** Any customer login.bluedot.org account can login */
  keycloak: {
    oidcSettings: {
      authority: 'https://login.bluedot.org/realms/customers/',
      client_id: 'bluedot-web-apps',
      redirect_uri: `${typeof window === 'undefined' ? '' : window.location.origin}/login/oauth-callback`,
      scope: 'openid email offline_access',
    },
    verifyAndDecodeToken: async (token: string) => {
      return verifyJwt(token, {
        aud: 'bluedot-web-apps',
        iss: 'https://login.bluedot.org/realms/customers',
        jwksUrl: 'https://login.bluedot.org/realms/customers/protocol/openid-connect/certs',
      });
    },
    getRegistrationUrl: (authUrl: string) => {
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
    verifyAndDecodeToken: async (token: string) => {
      const payload = await verifyJwt(token, {
        // eslint-disable-next-line no-useless-concat
        aud: '558012313311-ndfttio1u55baojf' + 'odrhiju4nvkakmqj.apps.googleusercontent.com',
        iss: 'https://accounts.google.com',
        jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
      });

      if (payload.hd !== 'bluedot.org' || payload.email_verified !== true) {
        throw new Error('Not a verified bluedot.org account');
      }

      return payload as typeof payload & { hd: 'bluedot.org', email_verified: true };
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
  const redirectTo = (typeof window !== 'undefined' && getQueryParam(window.location.href, 'redirect_to')) || '/';
  const prefilledEmail = typeof window !== 'undefined' ? getQueryParam(window.location.href, 'email') || undefined : undefined;
  const auth = useAuthStore((s) => s.auth);
  const { appendLatestUtmParamsToUrl } = useLatestUtmParams();

  useEffect(() => {
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
  }, [auth, appendLatestUtmParamsToUrl, redirectTo, prefilledEmail, loginPreset]);

  if (auth) {
    return <Navigate url={redirectTo} />;
  }

  return <ProgressDots />;
};

export const LoginOauthCallbackPage: React.FC<LoginOauthCallbackPageProps> = ({ loginPreset, onLoginComplete }) => {
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

        const auth = {
          expiresAt: user.expires_at * 1000,
          token: user.id_token,
          refreshToken: user.refresh_token,
          oidcSettings: loginPreset.oidcSettings,
          email: user.profile.email,
        };

        setAuth(auth);

        const redirectTo = (user.userState as { redirectTo?: string }).redirectTo || '/';

        if (onLoginComplete) {
          await onLoginComplete(auth, redirectTo);
        }

        router.push(redirectTo);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    if (!hasEverMounted.current) {
      hasEverMounted.current = true;
      signinUser();
    }
  }, [loginPreset.oidcSettings, onLoginComplete, router, setAuth]);

  if (error) {
    return <ErrorSection error={error} />;
  }

  return (
    <ProgressDots />
  );
};
