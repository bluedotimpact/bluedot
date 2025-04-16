import {
  HeroSection,
  HeroH1,
  HeroH2,
  ProgressDots,
  Section,
  withAuth,
  CTALinkOrButton,
  Breadcrumbs,
  // useAuthStore,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { GetUserResponse } from './api/users/me';
import Congratulations from '../components/courses/Congratulations';
import { ROUTES } from '../lib/routes';

const CURRENT_ROUTE = ROUTES.profile;

// withAuth will redirect the user to login before viewing the page
// If you want to get the user's token without redirecting them, use useAuthStore (which will be null if they're not logged in)
const ProfilePage = withAuth(({ auth }) => {
  // const auth = useAuthStore((s) => s.auth);

  const [{ data, loading }] = useAxios<GetUserResponse>({
    method: 'get',
    url: '/api/users/me',
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  return (
    <div>
      <Head>
        <title>{CURRENT_ROUTE.title} | BlueDot Impact</title>
        <meta name="description" content="Our mission is to ensure humanity safely navigates the transition to transformative AI." />
      </Head>
      {loading && <ProgressDots />}
      {/* TODO: error page */}
      {data?.user && (
      <>
        <HeroSection>
          <HeroH1>Your profile</HeroH1>
          <HeroH2>See your progress and share your learnings</HeroH2>
        </HeroSection>
        <Breadcrumbs route={CURRENT_ROUTE} />
        <Section
          className="profile max-w-[728px]"
        >
          <div className="profile__account-details flex flex-col gap-4 container-lined bg-white p-8 mb-4">
            <h3>Account details</h3>
            <p>Name: {data.user.name}</p>
            <p>Email: {data.user.email}</p>
          </div>
          <div className="profile__course-progress flex flex-row justify-between items-center gap-4 container-lined bg-white p-8 mb-4">
            {data.user.courseSitesVisited.length > 0 ? (
              <>
                <h3>{data.user.courseSitesVisited}</h3>
                <p>{data.user.completedMoocAt ? 'Completed 🎉' : 'In progress'}</p>
              </>
            ) : (
              <p>You have not enrolled in any courses yet.</p>
            )}
          </div>
          {data.user.completedMoocAt && (
            <Congratulations
              className="profile__course-completion !container-active"
              courseTitle={data.user.courseSitesVisited}
              coursePath={data.user.courseSitesVisited}
              referralCode={data.user.referralId}
            />
          )}
        </Section>
        {/* TODO #644: Move to Nav */}
        <Section className="profile__cta-container flex flex-row justify-center">
          <CTALinkOrButton className="profile__logout" url="/login/clear" variant="secondary">
            Logout
          </CTALinkOrButton>
        </Section>
      </>
      )}
    </div>
  );
});

export default ProfilePage;
