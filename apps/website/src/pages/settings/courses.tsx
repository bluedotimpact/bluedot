import {
  ProgressDots,
  withAuth,
  ErrorSection,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { GetUserResponse } from '../api/users/me';
import { ROUTES } from '../../lib/routes';
import SettingsLayout from '../../components/settings/SettingsLayout';
import CoursesContent from '../../components/settings/CoursesContent';

const CURRENT_ROUTE = ROUTES.settingsCourses;

const CoursesSettingsPage = ({ auth }: { auth: { token: string } }) => {
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
        <SettingsLayout activeTab="courses" route={CURRENT_ROUTE}>
          <CoursesContent authToken={auth.token} />
        </SettingsLayout>
      )}
    </div>
  );
};

export default withAuth(CoursesSettingsPage);
