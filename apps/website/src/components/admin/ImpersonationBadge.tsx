import { useState, useEffect } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import { IMPERSONATION_STORAGE_KEY, trpc } from '../../utils/trpc';

const IMPERSONATE_QUERY_PARAM = 'impersonate';

const stripParamFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  params.delete(IMPERSONATE_QUERY_PARAM);
  const newQuery = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${window.location.hash}`);
};

export const ImpersonationBadge = () => {
  const utils = trpc.useUtils();
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // On mount, either pick up an existing impersonation from sessionStorage OR handle a
  // `?impersonate=...` URL param:
  //   `?impersonate=<email>` resolves via admin.searchUsers (handled below).
  //   `?impersonate=clear` removes any active impersonation.
  // The server enforces permissions; this is purely a UX shortcut over the UserSearchModal.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handle = () => {
      const target = new URLSearchParams(window.location.search).get(IMPERSONATE_QUERY_PARAM);

      if (target === null) {
        setUserId(sessionStorage.getItem(IMPERSONATION_STORAGE_KEY));
        return;
      }

      if (target === 'clear' || target === '') {
        sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
        setUserId(null);
        // Cancel any in-flight email lookup
        setPendingEmail(null);
        stripParamFromUrl();
        void utils.invalidate();
        return;
      }

      setPendingEmail(target);
    };

    handle();
    // This 'popstate' handler is to allow AI tools to control user impersonation while the browser
    // isn't focused. Without this, a full reload would be needed, which causes the tab to go to
    // sleep if not focused.
    window.addEventListener('popstate', handle);
    return () => window.removeEventListener('popstate', handle);
  }, [utils]);

  const lookup = trpc.admin.searchUsers.useQuery(
    { searchTerm: pendingEmail ?? undefined },
    { enabled: !!pendingEmail, retry: false },
  );

  useEffect(() => {
    if (!pendingEmail) return;

    if (lookup.error) {
      // eslint-disable-next-line no-console
      console.error(`Could not impersonate ${pendingEmail}:`, lookup.error.message);
      stripParamFromUrl();
      setPendingEmail(null);
      return;
    }

    if (!lookup.data) return;

    const exact = lookup.data.find((u) => u.email.toLowerCase() === pendingEmail.toLowerCase());
    if (!exact) {
      // eslint-disable-next-line no-console
      console.error(`Could not impersonate ${pendingEmail}: no user found with that email`);
      stripParamFromUrl();
      setPendingEmail(null);
      return;
    }

    sessionStorage.setItem(IMPERSONATION_STORAGE_KEY, exact.id);
    setUserId(exact.id);
    setPendingEmail(null);
    stripParamFromUrl();
    void utils.invalidate();
  }, [pendingEmail, lookup.data, lookup.error, utils]);

  const { data: user } = trpc.users.getUser.useQuery(undefined, { enabled: !!userId });

  if (!userId || !user) {
    return null;
  }

  // Mask the user's email. The admin viewing the page is allowed to see the email, this is just
  // a practical safeguard to reduce the risk of exposing the email in e.g. screen recordings
  const maskedEmail = maskEmail(user.email);

  return (
    <div className="fixed z-50 bottom-4 px-4 max-w-[100vw]">
      <div className="max-w-full bg-yellow-400 text-black px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-size-sm font-medium">
        <span className="truncate">Impersonating: {maskedEmail}</span>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY);
            window.location.reload();
          }}
          className="p-0.5 hover:bg-yellow-500 rounded"
          aria-label="Stop impersonating"
        >
          <RiCloseLine size={16} />
        </button>
      </div>
    </div>
  );
};

/**
 * Mask email `example@test.com` to `ex***le@test.com`.
 */
export const maskEmail = (email: string): string => {
  try {
    const [local, domain] = email.split('@');

    if (!local || !domain || local.length === 0 || domain.length === 0) {
      return '***';
    }

    const masked = local.length <= 4 ? '*'.repeat(local.length) : `${local.slice(0, 2)}${'*'.repeat(local.length - 4)}${local.slice(-2)}`;
    return `${masked}@${domain}`;
  } catch {
    // This is a low-importance convenience function, so never error, just return the strictest masking
    // if an error is thrown above.
    return '***';
  }
};
