import {
  ProgressDots, withAuth, ErrorSection, Modal,
} from '@bluedot/ui';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { ROUTES } from '../../lib/routes';
import { P } from '../../components/Text';
import SettingsLayout from '../../components/settings/SettingsLayout';
import ProfileNameEditor from '../../components/settings/ProfileNameEditor';
import PasswordSection from '../../components/settings/PasswordSection';
import { trpc } from '../../utils/trpc';

const CURRENT_ROUTE = ROUTES.settingsAccount;

const AccountSettingsPage = withAuth(({ auth }) => {
  const {
    data: user, isLoading: userLoading, error: userError, refetch,
  } = trpc.users.getUser.useQuery();

  // Add state for the welcome modal
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Check if name is empty when user data loads
  useEffect(() => {
    if (user && (!user.name || user.name.trim() === '')) {
      setShowWelcomeModal(true);
    }
  }, [user]);

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      </Head>
      {userLoading && <ProgressDots />}
      {userError && <ErrorSection error={userError} />}
      {user && (
        <>
          <SettingsLayout activeTab="account" route={CURRENT_ROUTE}>
            <div className="p-8">
              {/* Profile Name Editor */}
              <ProfileNameEditor
                initialName={user.name}
                authToken={auth.token}
                onSave={() => refetch()}
              />

              {/* Divider */}
              <div className="border-t border-color-divider my-6" />

              {/* Email Section */}
              <div className="mb-6">
                <P className="font-semibold mb-2">Email*</P>
                <P className="text-gray-600">{user.email}</P>
              </div>

              {/* Divider */}
              <div className="border-t border-color-divider my-6" />

              {/* Password Section */}
              <PasswordSection />
            </div>
          </SettingsLayout>

          {/* Welcome Modal */}
          <Modal
            isOpen={showWelcomeModal}
            setIsOpen={setShowWelcomeModal}
            title="Welcome to BlueDot Impact!"
          >
            <div className="space-y-4">
              <P>
                Before you continue, please take a moment to set your profile name.
                This name will be used across our platform and in your course interactions.
              </P>
              <ProfileNameEditor
                initialName={user.name}
                authToken={auth.token}
                onSave={() => {
                  setShowWelcomeModal(false);
                  refetch();
                }}
              />
            </div>
          </Modal>
        </>
      )}
    </div>
  );
});

export default AccountSettingsPage;
