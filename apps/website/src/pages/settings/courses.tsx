import {
  ProgressDots,
  withAuth,
  ErrorSection,
} from '@bluedot/ui';
import Head from 'next/head';
import { ROUTES } from '../../lib/routes';
import SettingsLayout from '../../components/settings/SettingsLayout';
import CoursesContent from '../../components/settings/CoursesContent';
import { trpc } from '../../utils/trpc';

const CURRENT_ROUTE = ROUTES.settingsCourses;

const CoursesSettingsPage = withAuth(({ auth }) => {
  const { data: user, isLoading: userLoading, error: userError } = trpc.users.getUser.useQuery();

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      </Head>
      {userLoading && <ProgressDots />}
      {userError && <ErrorSection error={userError} />}
      {user && (
        <SettingsLayout activeTab="courses" route={CURRENT_ROUTE}>
          <CoursesContent authToken={auth.token} />
        </SettingsLayout>
      )}
    </div>
  );
});

export default CoursesSettingsPage;
