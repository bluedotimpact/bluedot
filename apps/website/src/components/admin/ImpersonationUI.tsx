import { useState, useEffect, useRef } from 'react';
import { Modal, ProgressDots, useCurrentTimeMs } from '@bluedot/ui';
import { RiSearchLine, RiCloseLine } from 'react-icons/ri';
import { IMPERSONATION_STORAGE_KEY, trpc } from '../../utils/trpc';
import { formatDateTimeRelative } from '../../lib/utils';

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

export const UserSearchModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const currentTimeMs = useCurrentTimeMs();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const query = searchQuery.trim() || undefined;
  const { data: searchResults, isLoading } = trpc.admin.searchUsers.useQuery(
    { query },
    { enabled: isOpen },
  );

  const handleSelectUser = (email: string) => {
    sessionStorage.setItem(IMPERSONATION_STORAGE_KEY, email);
    onClose();
    window.location.reload();
  };

  const showNoResults = !isLoading && searchResults?.length === 0 && searchQuery.length > 0;

  return (
    <Modal bottomDrawerOnMobile isOpen={isOpen} setIsOpen={(open) => !open && onClose()} title="Impersonate a user">
      <div className="max-w-[600px] mx-auto">
        <div className="flex items-center gap-2 border border-gray-300 rounded px-3 py-2 mb-4">
          <RiSearchLine className="text-gray-400" size={18} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 outline-none"
          />
        </div>

        <div className="md:h-[400px] overflow-y-auto">
          {isLoading && <ProgressDots />}
          {showNoResults && <p className="text-gray-500 text-center py-4">No users found</p>}
          {searchResults && searchResults.length > 0 && searchResults.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelectUser(user.email)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{user.name || '(No name)'}</div>
                  <div className="text-size-sm text-gray-500 truncate">{user.email}</div>
                </div>
                <div className="text-size-sm text-gray-400 flex-shrink-0 text-right">
                  {user.courseCount > 0 && <div>{user.courseCount} course{user.courseCount !== 1 ? 's' : ''}</div>}
                  {user.lastSeenAt && (
                    <div>Last seen: {formatDateTimeRelative({ dateTimeMs: new Date(user.lastSeenAt).getTime(), currentTimeMs })}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export const ImpersonationBadge = () => {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEmail(sessionStorage.getItem(IMPERSONATION_STORAGE_KEY));
    }
  }, []);

  if (!email) return null;

  // Mask the user's email. The admin viewing the page is allowed to see the email, this is just
  // a practical safeguard to reduce the risk of exposing the email in e.g. screen recordings
  const maskedEmail = maskEmail(email);

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-yellow-400 text-black px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-size-sm font-medium">
      <span>Impersonating: {maskedEmail}</span>
      <button
        type="button"
        onClick={() => { sessionStorage.removeItem(IMPERSONATION_STORAGE_KEY); window.location.reload(); }}
        className="p-0.5 hover:bg-yellow-500 rounded"
        aria-label="Stop impersonating"
      >
        <RiCloseLine size={16} />
      </button>
    </div>
  );
};
