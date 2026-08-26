import { ProgressDots } from '@bluedot/ui';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { trpc } from '../../utils/trpc';

export const withAdminGuard = (Component: React.FC): React.FC => {
  return () => {
    const router = useRouter();
    const accessQuery = trpc.admin.isUserAdmin.useQuery(undefined, { retry: false });
    const isAdmin = accessQuery.data === true;
    const shouldShow404 = accessQuery.data === false;

    useEffect(() => {
      if (shouldShow404) router.replace('/404');
    }, [shouldShow404, router]);

    return isAdmin ? <Component /> : <ProgressDots className="py-8" />;
  };
};
