import { H1 } from '@bluedot/ui';
import { UserManager } from 'oidc-client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ErrorPage } from '../../components/ErrorPage';
import { useAuthStore } from '../../lib/authStore';
import { userManagerSettings } from '.';
import { Navigate } from '../../components/Navigate';

const LoginOauthCallbackPage: React.FC = () => {
  const [error, setError] = useState<undefined | React.ReactNode | Error>();
  const [auth, setAuth] = useAuthStore((s) => [s.auth, s.setAuth]);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect_to') || '/';

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

export default LoginOauthCallbackPage;
