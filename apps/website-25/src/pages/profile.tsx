import {
  HeroSection,
  HeroH1,
  ProgressDots,
  Section,
  withAuth,
  CTALinkOrButton,
  // useAuthStore,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { GetUserResponse } from './api/users/me';

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
      {loading && <ProgressDots />}
      {/* TODO: error page */}
      {data?.user && (
      <>
        <HeroSection>
          <HeroH1>Your profile</HeroH1>
        </HeroSection>
        <Section
          className="profile"
        >
          <pre className="profile__content flex flex-col gap-4">
            {JSON.stringify(data.user, null, 2)}
          </pre>
          <CTALinkOrButton url="/login/clear">
            Logout
          </CTALinkOrButton>
        </Section>
      </>
      )}
    </div>
  );
});

export default ProfilePage;
