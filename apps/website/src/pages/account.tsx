import {
  ErrorSection, Modal, P, ProgressDots,
} from '@bluedot/ui';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { ROUTES } from '../lib/routes';
import MyBlueDotLayout from '../components/my-bluedot/MyBlueDotLayout';
import ProfileNameEditor from '../components/settings/ProfileNameEditor';
import PasswordSection from '../components/settings/PasswordSection';
import { trpc } from '../utils/trpc';

const CURRENT_ROUTE = ROUTES.account;

const AccountSettingsPage = () => {
  const {
    data: user, isLoading: userLoading, error: userError,
  } = trpc.users.getUser.useQuery();
  const utils = trpc.useUtils();

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
      {userLoading && <ProgressDots className="py-8" />}
      {userError && <ErrorSection error={userError} />}
      {user && (
        <>
          <MyBlueDotLayout route={CURRENT_ROUTE}>
            <ProfileNameEditor
              initialName={user.name}
              onSave={() => utils.users.getUser.invalidate()}
            />

            <div className="border-t border-color-divider my-6" />

            <div className="mb-6">
              <P className="font-semibold mb-2">Email*</P>
              <P className="text-gray-600">{user.email}</P>
            </div>

            <div className="border-t border-color-divider my-6" />

            <PasswordSection />
          </MyBlueDotLayout>

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
                onSave={() => {
                  setShowWelcomeModal(false);
                  utils.users.getUser.invalidate();
                }}
              />
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};

export default AccountSettingsPage;
