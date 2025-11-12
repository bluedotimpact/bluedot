import { Navigate, useAuthStore } from '@bluedot/ui';
import { useEffect } from 'react';

const LogoutPage: React.FC = () => {
  const auth = useAuthStore((s) => s.auth);
  const setAuth = useAuthStore((s) => s.setAuth);
  useEffect(() => {
    setAuth(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!auth) {
    return <Navigate url="/" />;
  }

  return (
    <Navigate url={`https://login.bluedot.org/realms/customers/protocol/openid-connect/logout?id_token_hint=${encodeURIComponent(auth.token)}&post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`} />
  );
};

export default LogoutPage;
