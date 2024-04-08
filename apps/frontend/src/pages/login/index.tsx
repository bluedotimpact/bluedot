import { Button, H1, P } from '@bluedot/ui';
import { UserManager, UserManagerSettings } from 'oidc-client-ts';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuthStore } from '../../lib/authStore';

export const userManagerSettings: UserManagerSettings = {
  authority: 'https://login.bluedotimpact.org/realms/main-realm/',
  client_id: 'bluedot-frontend',
  redirect_uri: `${window.location.origin}/login/oauth-callback`,
  extraQueryParams: {
    kc_idp_hint: 'bluedotimpact-google',
  },
};

const LoginPage = () => {
  const redirectTo = new URLSearchParams(window.location.search).get('redirect_to') || '/';
  const auth = useAuthStore((s) => s.auth);
  const router = useRouter();

  useEffect(() => {
    if (auth) {
      router.push(redirectTo);
    }
  }, [auth]);

  if (auth) {
    return <P>Redirecting...</P>;
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

export default LoginPage;
