import { useState, useEffect, useRef } from 'react';
import {
  ErrorSection, Modal, ProgressDots, useCurrentTimeMs,
} from '@bluedot/ui';
import { RiSearchLine } from 'react-icons/ri';
import { IMPERSONATION_STORAGE_KEY, trpc } from '../../utils/trpc';
import { formatDateTimeRelative } from '../../lib/utils';

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
    }
  }, [isOpen]);

  const query = searchQuery.trim() || 'test'; // Fallback to 'test' to show recently used test users
  const { data: searchResults, isLoading, error } = trpc.admin.searchUsers.useQuery(
    { query },
    { enabled: isOpen },
  );

  const handleSelectUser = (userId: string) => {
    sessionStorage.setItem(IMPERSONATION_STORAGE_KEY, userId);
    onClose();
    window.location.reload();
  };

  const showNoResults = !isLoading && searchResults?.length === 0 && searchQuery.length > 0;

  return (
    <Modal bottomDrawerOnMobile isOpen={isOpen} setIsOpen={(open) => !open && onClose()} title="Impersonate a user">
      <div className="max-w-[600px] mx-auto">
        {/* Spacer to stop the modal shrinking when there are no results */}
        <div className="w-[600px] max-w-full h-0" />
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
          {error && <ErrorSection error={error} />}
          {isLoading && <ProgressDots />}
          {showNoResults && <p className="text-gray-500 text-center py-4">No users found</p>}
          {searchResults && searchResults.length > 0 && searchResults.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelectUser(user.id)}
              className="w-full cursor-pointer text-left px-3 py-2 hover:bg-gray-100 rounded"
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
