import { useRouter } from 'next/router';
import {
  CTALinkOrButton, H1, P, withAuth,
} from '@bluedot/ui';

const HomePage = withAuth(({ auth, setAuth }) => {
  const router = useRouter();

  return (
    <div className="section-body gap-4">
      <H1>Scout</H1>
      <P>Signed in as {auth.email}. Nothing to review yet.</P>
      <CTALinkOrButton
        variant="secondary"
        onClick={() => {
          // Navigate first: setting auth to null while on this page would make withAuth redirect to login
          router.push('/');
          setTimeout(() => setAuth(null), 1000);
        }}
      >
        Log out
      </CTALinkOrButton>
    </div>
  );
});

export default HomePage;
