import {
  Breadcrumbs, CTALinkOrButton, ProgressDots, Section,
} from '@bluedot/ui';
import Head from 'next/head';
import { useState } from 'react';
import { withAdminGuard } from '../../components/admin/withAdminGuard';
import { UserSearchModal } from '../../components/admin/UserSearchModal';
import DeleteAccountModal from '../../components/settings/DeleteAccountModal';
import { ROUTES } from '../../lib/routes';
import type { UserSearchResult } from '../../server/routers/admin';
import { trpc } from '../../utils/trpc';

const CURRENT_ROUTE = ROUTES.adminDeletionRequests;

const AdminDeletionRequests = withAdminGuard(() => {
  const [isSelectUserModalOpen, setIsSelectUserModalOpen] = useState(false);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

  const requestsQuery = trpc.deletionRequests.list.useQuery(undefined, { refetchInterval: 15_000 });
  const { refetch: refetchRequests } = requestsQuery;

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section className="min-h-[50vh]">
        <div className="flex flex-col gap-6 max-w-prose">
          <div className="container-lined p-4 flex flex-col gap-1">
            {selectedUser ? (
              <>
                {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
                <p className="font-semibold text-bluedot-navy break-words">{selectedUser.name || '(no name)'}</p>
                <p className="text-size-xs text-bluedot-navy/70 break-words">{selectedUser.email}</p>
                <p className="text-size-xxs text-bluedot-navy/50">User ID: <code>{selectedUser.id}</code></p>
              </>
            ) : (
              <p className="text-size-xs text-bluedot-navy/70">No user selected.</p>
            )}
            <button
              type="button"
              onClick={() => setIsSelectUserModalOpen(true)}
              className="self-start text-size-xxs text-bluedot-normal underline hover:opacity-80 cursor-pointer"
            >
              {selectedUser ? 'Select a different user' : 'Select user'}
            </button>
          </div>

          {selectedUser && (
            <CTALinkOrButton
              variant="secondary"
              onClick={() => setIsConfirmDeleteModalOpen(true)}
              className="self-start whitespace-nowrap border-red-600 text-red-600 hover:bg-red-50"
            >
              Delete account (confirm modal opens)
            </CTALinkOrButton>
          )}

          <div className="flex flex-col gap-2">
            <h2 className="text-size-md font-semibold text-bluedot-navy">Requests</h2>
            {requestsQuery.isLoading && <ProgressDots className="py-4" />}
            {requestsQuery.data?.length === 0 && (
              <p className="text-size-xs text-bluedot-navy/70">No deletion requests yet.</p>
            )}
            {requestsQuery.data?.map((request) => (
              <div key={request.id} className="container-lined p-4 flex flex-col gap-1">
                <p className="font-semibold text-bluedot-navy break-words">{request.email}</p>
                <p className="text-size-xs text-bluedot-navy/70">
                  {request.status} &middot; requested {request.requestedAt}
                  {request.completedAt && ` · completed ${request.completedAt}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>
      <UserSearchModal
        isOpen={isSelectUserModalOpen}
        onClose={() => setIsSelectUserModalOpen(false)}
        title="Select a user to delete the account of"
        scope="all"
        onSelectUser={setSelectedUser}
      />
      {selectedUser && (
        <DeleteAccountModal
          isOpen={isConfirmDeleteModalOpen}
          setIsOpen={(isOpen) => {
            setIsConfirmDeleteModalOpen(isOpen);
            if (!isOpen) {
              setSelectedUser(null);
              refetchRequests();
            }
          }}
          initiatedBy="admin"
          userId={selectedUser.id}
        />
      )}
    </div>
  );
});

export default AdminDeletionRequests;
