import {
  Breadcrumbs,
  CTALinkOrButton,
  Input,
  P,
  ProgressDots,
  Section,
} from '@bluedot/ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';

const CURRENT_ROUTE = ROUTES.adminChangeEmail;

type SelectedUser = {
  id: string;
  email: string;
  name: string | null;
};

const AdminChangeEmail = () => {
  const router = useRouter();
  const accessQuery = trpc.admin.isUserAdmin.useQuery(undefined, { retry: false });
  const isAdmin = accessQuery.data === true;
  const shouldShow404 = accessQuery.data === false;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [newEmail, setNewEmail] = useState('');

  const searchQuery = trpc.admin.searchUsers.useQuery(
    { searchTerm, scope: 'all' },
    { enabled: isAdmin && searchTerm.trim().length > 1 },
  );

  const requestMutation = trpc.emailChange.request.useMutation();

  useEffect(() => {
    if (shouldShow404) router.replace('/404');
  }, [shouldShow404, router]);

  const selectUser = (user: SelectedUser) => {
    setSelectedUser(user);
    setNewEmail('');
    requestMutation.reset();
  };

  const submit = () => {
    if (!selectedUser || !newEmail.trim()) return;
    requestMutation.mutate({ userId: selectedUser.id, newEmail: newEmail.trim() });
  };

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section className="min-h-[50vh] max-w-3xl">
        {!isAdmin ? (
          <ProgressDots className="py-8" />
        ) : (
          <div className="flex flex-col gap-6">
            <P>
              Request an email change for a user. A verification email is sent to the new address;
              the change only takes effect when the user clicks the link in it.
            </P>

            <div className="flex flex-col gap-2">
              <P className="font-semibold">Find user</P>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email or name"
                aria-label="Search users"
              />
              {searchQuery.isFetching && <ProgressDots className="py-2" />}
              {searchQuery.data?.length === 0 && (
                <P className="text-bluedot-navy/60">No users found</P>
              )}
              {searchQuery.data && searchQuery.data.length > 0 && (
                <ul className="container-lined divide-y divide-color-divider">
                  {searchQuery.data.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => selectUser(user)}
                        className={`w-full text-left p-3 hover:bg-color-canvas ${selectedUser?.id === user.id ? 'bg-color-canvas font-semibold' : ''}`}
                      >
                        {user.email}
                        {user.name ? ` — ${user.name}` : ''}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selectedUser && (
              <div className="flex flex-col gap-2">
                <P className="font-semibold">
                  New email for {selectedUser.email}
                </P>
                <div className="flex gap-2 items-center">
                  <Input
                    inputClassName="flex-1"
                    labelClassName="flex-1 min-w-0"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submit();
                    }}
                    placeholder="new@example.com"
                    aria-label="New email address"
                  />
                  <CTALinkOrButton
                    variant="primary"
                    onClick={submit}
                    disabled={requestMutation.isPending || !newEmail.trim()}
                    className="whitespace-nowrap"
                  >
                    {requestMutation.isPending ? 'Sending...' : 'Send verification email'}
                  </CTALinkOrButton>
                </div>
                {requestMutation.isSuccess && (
                  <p className="text-green-700" role="status">
                    Verification email sent to {requestMutation.data.sentTo}. The change takes effect when the user clicks the link in it (valid for 48 hours).
                  </p>
                )}
                {requestMutation.error && (
                  <p className="text-red-600" role="alert">
                    {requestMutation.error.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  );
};

export default AdminChangeEmail;
