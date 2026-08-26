import {
  Breadcrumbs, CTALinkOrButton, Input, P, Section,
} from '@bluedot/ui';
import Head from 'next/head';
import { useState } from 'react';
import { withAdminGuard } from '../../components/admin/withAdminGuard';
import { UserSearchModal } from '../../components/admin/UserSearchModal';
import { ROUTES } from '../../lib/routes';
import type { UserSearchResult } from '../../server/routers/admin';
import { trpc } from '../../utils/trpc';

const CURRENT_ROUTE = ROUTES.adminChangeEmail;

const AdminChangeEmail = withAdminGuard(() => {
  const [isSelectUserModalOpen, setIsSelectUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [newEmail, setNewEmail] = useState('');

  const requestMutation = trpc.users.requestEmailChange.useMutation();
  const { reset: resetMutation } = requestMutation;

  const selectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setNewEmail('');
    resetMutation();
  };

  const submit = () => {
    if (!selectedUser || !newEmail.trim() || requestMutation.isPending) return;
    requestMutation.mutate({ userId: selectedUser.id, newEmail: newEmail.trim() });
  };

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section className="min-h-[50vh]">
        <div className="flex flex-col gap-6 max-w-prose">
          <P>
            Nothing changes when you submit this form: we email the new address a confirmation link,
            and the account only moves across once the user clicks it. The link is valid for 48 hours.
          </P>

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
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Input
                  type="email"
                  labelClassName="flex-1 min-w-0"
                  inputClassName="w-full"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    if (requestMutation.isSuccess || requestMutation.isError) resetMutation();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submit();
                  }}
                  placeholder="new@example.com"
                  aria-label={`New email address for ${selectedUser.email}`}
                />
                <CTALinkOrButton
                  variant="primary"
                  onClick={submit}
                  disabled={requestMutation.isPending || !newEmail.trim()}
                  className="whitespace-nowrap"
                >
                  {requestMutation.isPending ? 'Sending...' : 'Send confirmation email'}
                </CTALinkOrButton>
              </div>
              {requestMutation.isSuccess && (
                <p role="status" className="text-size-xs text-green-700">
                  Confirmation email sent to {requestMutation.data.sentTo}. {selectedUser.email} stays on the
                  account until the user clicks the link.
                </p>
              )}
              {requestMutation.error && (
                <p role="alert" className="text-size-xs text-red-600">{requestMutation.error.message}</p>
              )}
            </div>
          )}
        </div>
      </Section>
      <UserSearchModal
        isOpen={isSelectUserModalOpen}
        onClose={() => setIsSelectUserModalOpen(false)}
        title="Select a user to change the email of"
        scope="all"
        onSelectUser={selectUser}
      />
    </div>
  );
});

export default AdminChangeEmail;
