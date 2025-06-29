import { withAuth } from '@bluedot/ui';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { ROUTES } from '../lib/routes';

const ProfilePage = withAuth(() => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new settings page
    router.replace(ROUTES.settingsAccount.url);
  }, [router]);

  return null;
});

export default ProfilePage;
