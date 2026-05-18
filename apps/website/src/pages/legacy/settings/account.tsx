import {
  ErrorSection, Modal, P, ProgressDots,
} from '@bluedot/ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { ROUTES } from '../../../lib/routes';
import SettingsLayout from '../../../components/settings/SettingsLayout';
import ProfileNameEditor from '../../../components/settings/ProfileNameEditor';
import PasswordSection from '../../../components/settings/PasswordSection';
import { trpc } from '../../../utils/trpc';

const CURRENT_ROUTE = ROUTES.legacySettingsAccount;

const LegacyAccountPage = () => {
  const {
    data: user, isLoading: userLoading, error: userError,
  } = trpc.users.getUser.useQuery();
  const utils = trpc.useUtils();
  const router = useRouter();

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (user && !user.isAdmin) {
      router.replace('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (user && (!user.name || user.name.trim() === '')) {
      setShowWelcomeModal(true);
    }
  }, [user]);

  if (userLoading) return <ProgressDots className="py-8" />;
  if (userError) return <ErrorSection error={userError} />;
  if (!user?.isAdmin) return null;

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      </Head>
      <SettingsLayout activeTab="account" route={CURRENT_ROUTE}>
        <div className="p-8">
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
        </div>
      </SettingsLayout>

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
    </div>
  );
};

export default LegacyAccountPage;
