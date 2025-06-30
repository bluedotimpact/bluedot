import { loginPresets, LoginRedirectPage } from '@bluedot/ui';
import { useRouter } from 'next/router';

export default () => {
  const router = useRouter();
  const redirectTo = typeof window !== 'undefined'
    ? (Array.isArray(router.query.redirect_to) ? router.query.redirect_to[0] : router.query.redirect_to) || '/'
    : '/';

  return (
    <LoginRedirectPage
      loginPreset={loginPresets.keycloak}
      defaultRedirectTo={redirectTo}
    />
  );
};
