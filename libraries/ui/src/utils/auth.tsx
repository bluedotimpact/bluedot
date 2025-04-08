import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Navigate } from '../legacy/Navigate';

export interface Auth {
  token: string,
  expiresAt: number,
}

export const useAuthStore = create<{
  auth: Auth | null,
  setAuth:(auth: Auth | null) => void,

  _authClearTimer: NodeJS.Timeout | null
}>()(persist((set, get) => ({
  auth: null,
  setAuth: (auth) => {
    // eslint-disable-next-line no-underscore-dangle
    const existingTimer = get()._authClearTimer;
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const newTimer = auth
      ? setTimeout(
        () => set({ auth: null, _authClearTimer: null }),
        // Clear auth 5 seconds before expiry
        // This is to prevent a request being sent just before expiry, but reaching the server just after auth expiry
        (auth.expiresAt * 1000) - Date.now() - 5000,
      )
      : null;

    set({ auth, _authClearTimer: newTimer });
  },
  _authClearTimer: null,
}), {
  name: 'bluedot_auth',
  version: 20231213,

  // On rehydration, set the state again
  // This starts the expiry logic
  onRehydrateStorage: () => (state) => {
    if (state && state.auth) {
      state.setAuth(state.auth);
    }
  },
}));

export const withAuth = (Component: React.FC<{ auth: Auth, setAuth: (s: Auth | null) => void }>, loginRoute = '/login'): React.FC => {
  return () => {
    const auth = useAuthStore((s) => s.auth);
    const setAuth = useAuthStore((s) => s.setAuth);

    if (!auth) {
      if (typeof window === 'undefined') {
        return null;
      }

      return (
        <Navigate url={`${loginRoute}?redirect_to=${encodeURIComponent(window.location.href.slice(window.location.origin.length))}`} />
      );
    }

    return <Component auth={auth} setAuth={setAuth} />;
  };
};
