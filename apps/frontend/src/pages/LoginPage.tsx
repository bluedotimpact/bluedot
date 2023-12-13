import { Button, H1 } from '@bluedot/ui';
import { UserManager, UserManagerSettings } from 'oidc-client-ts';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ErrorPage } from './ErrorPage';
import { useAuthStore } from '../lib/authStore';

const userManagerSettings: UserManagerSettings = {
  authority: 'https://login.bluedotimpact.org/realms/main-realm/',
  client_id: 'bluedot-frontend',
  redirect_uri: `${window.location.origin}/login/oauth-callback`,
  extraQueryParams: {
    kc_idp_hint: 'bluedotimpact-google',
  },
};

export const LoginPage = () => {
  const redirectTo = new URLSearchParams(window.location.search).get('redirect_to') || '/';
  const auth = useAuthStore((s) => s.auth);

  if (auth) {
    return <Navigate to={redirectTo} />;
  }

  return (
    <div className="mx-8">
      <H1>Login page</H1>
      <Button onPress={async () => {
        await new UserManager({
          ...userManagerSettings,
          redirect_uri: `${userManagerSettings.redirect_uri}?redirect_to=${encodeURIComponent(redirectTo)}`,
        }).signinRedirect();
      }}
      >Log in
      </Button>
    </div>
  );
};

export const LoginOauthCallbackPage = () => {
  const [error, setError] = useState<undefined | React.ReactNode | Error>();
  const [auth, setAuth] = useAuthStore((s) => [s.auth, s.setAuth]);
  const redirectTo = new URLSearchParams(window.location.search).get('redirect_to') || '/';

  useEffect(() => {
    const signinUser = async () => {
      try {
        const user = await new UserManager(userManagerSettings).signinCallback();
        if (!user) {
          throw new Error('Bad login response: No user returned');
        }
        if (typeof user.expires_at !== 'number') {
          throw new Error('Bad login response: user.expires_at is missing or not a number');
        }
        if (typeof user.id_token !== 'string') {
          throw new Error('Bad login response: user.id_token is missing or not a string');
        }
        setAuth({ expiresAt: user.expires_at, token: user.id_token });
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };
    signinUser();
  }, []);

  if (auth) {
    return <Navigate to={redirectTo} />;
  }

  if (error) {
    return <ErrorPage error={error} />;
  }

  return (
    <div className="m-8"><H1>Logging you in...</H1></div>
  );
};
