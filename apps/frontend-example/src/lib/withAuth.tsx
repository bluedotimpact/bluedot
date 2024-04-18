import { Auth, useAuthStore } from './authStore';
import { Navigate } from '../components/Navigate';

export const withAuth = (Component: React.FC<{ auth: Auth, setAuth: (s: Auth | null) => void }>): React.FC => {
  return () => {
    const [auth, setAuth] = useAuthStore((s) => [s.auth, s.setAuth]);

    if (!auth) {
      if (typeof window === 'undefined') {
        return null;
      }

      return (
        <Navigate to={`/login?redirect_to=${encodeURIComponent(window.location.href.slice(window.location.origin.length))}`} />
      );
    }

    return <Component auth={auth} setAuth={setAuth} />;
  };
};
