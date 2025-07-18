import { ProgressDots, withAuth, ErrorSection } from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { GetUserResponse } from '../api/users/me';
import { ROUTES } from '../../lib/routes';
import { P } from '../../components/Text';
import SettingsLayout from '../../components/settings/SettingsLayout';
import ProfileNameEditor from '../../components/settings/ProfileNameEditor';
import PasswordSection from '../../components/settings/PasswordSection';

const CURRENT_ROUTE = ROUTES.settingsAccount;

const AccountSettingsPage = ({ auth }: { auth: { token: string } }) => {
  const [{ data: userData, loading: userLoading, error: userError }] = useAxios<GetUserResponse>({
    method: 'get',
    url: '/api/users/me',
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      </Head>
      {userLoading && <ProgressDots />}
      {userError && <ErrorSection error={userError} />}
      {userData?.user && (
        <SettingsLayout activeTab="account" route={CURRENT_ROUTE}>
          <div className="p-8">
            {/* Profile Name Editor */}
            <ProfileNameEditor
              initialName={userData.user.name}
              authToken={auth.token}
            />

            {/* Divider */}
            <div className="border-t border-color-divider my-6" />

            {/* Email Section */}
            <div className="mb-6">
              <P className="font-semibold mb-2">Email*</P>
              <P className="text-gray-600">{userData.user.email}</P>
            </div>

            {/* Divider */}
            <div className="border-t border-color-divider my-6" />

            {/* Password Section */}
            <PasswordSection authToken={auth.token} />
          </div>
        </SettingsLayout>
      )}
    </div>
  );
};

export default withAuth(AccountSettingsPage);
