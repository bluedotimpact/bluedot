import { useState, useEffect } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import { IMPERSONATION_STORAGE_KEY, trpc } from '../../utils/trpc';

/**
 * Mask email `example@test.com` to `ex***le@test.com`.
 */
const maskEmail = (email: string): string => {
  try {
    const [local, domain] = email.split('@');

    if (!local || !domain || local.length === 0 || domain.length === 0) return '***';

    const masked = local.length <= 4 ? '*'.repeat(local.length) : `${local.slice(0, 2)}${'*'.repeat(local.length - 4)}${local.slice(-2)}`;
    return `${masked}@${domain}`;
  } catch {
    // This is a low-importance convenience function, so never error, just return the strictest masking
    // if an error is thrown above.
    return '***';
  }
};

export const ImpersonationBadge = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserId(sessionStorage.getItem(IMPERSONATION_STORAGE_KEY));
    }
  }, []);

  const { data: user } = trpc.users.getUser.useQuery(undefined, { enabled: !!userId });

  if (!userId || !user) return null;

  // Mask the user's email. The admin viewing the page is allowed to see the email, this is just
  // a practical safeguard to reduce the risk of exposing the email in e.g. screen recordings
  const maskedEmail = maskEmail(user.email);

  return (
    <div className="fixed z-50 bottom-4 px-4 max-w-[100vw]">
      <div className="max-w-full bg-yellow-400 text-black px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-size-sm font-medium">
        <span className="truncate">Impersonating: {maskedEmail}</span>
        <button
          type="button"
          onClick={() => { sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY); window.location.reload(); }}
          className="p-0.5 hover:bg-yellow-500 rounded"
          aria-label="Stop impersonating"
        >
          <RiCloseLine size={16} />
        </button>
      </div>
    </div>
  );
};
