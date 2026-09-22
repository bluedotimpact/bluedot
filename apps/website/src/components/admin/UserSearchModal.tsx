import { useState, useEffect, useRef } from 'react';
import {
  ErrorSection, Input, Modal, ProgressDots, useCurrentTimeMs,
} from '@bluedot/ui';
import { RiCloseLine, RiSearchLine } from 'react-icons/ri';
import { trpc } from '../../utils/trpc';
import { formatDateTimeRelative } from '../../lib/utils';
import type { UserSearchResult } from '../../server/routers/admin';

type UserSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  scope: 'impersonate' | 'all';
  onSelectUser: (user: UserSearchResult) => void;
};

export const UserSearchModal = ({
  isOpen,
  onClose,
  title,
  scope,
  onSelectUser,
}: UserSearchModalProps) => {
  const [searchTermInput, setSearchTermInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const currentTimeMs = useCurrentTimeMs();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const searchTerm = searchTermInput.trim();
  const { data: searchResults, isLoading, error } = trpc.admin.searchUsers.useQuery(
    { searchTerm: searchTerm || undefined, scope },
    { enabled: isOpen },
  );

  const handleSelectUser = (user: UserSearchResult) => {
    onClose();
    onSelectUser(user);
  };

  const showNoResults = !isLoading && searchResults?.length === 0 && searchTermInput.length > 0;

  return (
    <Modal bottomDrawerOnMobile isOpen={isOpen} setIsOpen={(open) => !open && onClose()} title={title}>
      <div className="w-full max-w-modal mx-auto">
        {/* Spacer to stop the desktop modal shrinking when there are no results */}
        <div className="hidden md:block w-[600px] max-w-full h-0" />
        <Input
          ref={inputRef}
          type="search"
          value={searchTermInput}
          onChange={(e) => setSearchTermInput(e.target.value)}
          placeholder="Search by name or email..."
          aria-label="Search by name or email"
          className="mb-4"
          leading={<RiSearchLine aria-hidden />}
          trailing={searchTermInput ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearchTermInput('');
                inputRef.current?.focus();
              }}
              className="-mr-3 flex size-11 items-center justify-center text-secondary hover:text-primary"
            >
              <RiCloseLine aria-hidden />
            </button>
          ) : undefined}
        />

        <div className="md:h-[400px] overflow-y-auto">
          {error && <ErrorSection error={error} />}
          {isLoading && <ProgressDots />}
          {showNoResults && <p className="text-gray-500 text-center py-4">No users found</p>}
          {searchResults && searchResults.length > 0 && searchResults.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelectUser(user)}
              className="w-full cursor-pointer text-left px-3 py-2 hover:bg-gray-100 rounded"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-4">
                <div className="min-w-0">
                  {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
                  <div className="font-medium truncate">{user.name || '(No name)'}</div>
                  <div className="text-size-sm text-gray-500 truncate">{user.email}</div>
                </div>
                <div className="text-size-sm text-gray-400 md:flex-shrink-0 md:text-right">
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
