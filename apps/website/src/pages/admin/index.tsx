import { Breadcrumbs, ProgressDots, Section } from '@bluedot/ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';

const CURRENT_ROUTE = ROUTES.admin;

const AdminHome = () => {
  const router = useRouter();
  const accessQuery = trpc.admin.isUserAdmin.useQuery(undefined, { retry: false });
  const isAdmin = accessQuery.data === true;
  const shouldShow404 = accessQuery.data === false;

  useEffect(() => {
    if (shouldShow404) router.replace('/404');
  }, [shouldShow404, router]);

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section className="min-h-[50vh]">
        {isAdmin ? (
          <ul className="list-disc list-inside flex flex-col gap-2">
            <li>
              <a href={ROUTES.adminSyncDashboard.url} className="text-bluedot-normal underline hover:opacity-80">
                {ROUTES.adminSyncDashboard.title}
              </a>
            </li>
            <li>
              <a href={ROUTES.adminUserExerciseResponses.url} className="text-bluedot-normal underline hover:opacity-80">
                {ROUTES.adminUserExerciseResponses.title}
              </a>
            </li>
            <li>
              <a href={ROUTES.adminChangeEmail.url} className="text-bluedot-normal underline hover:opacity-80">
                {ROUTES.adminChangeEmail.title}
              </a>
            </li>
          </ul>
        ) : (
          <ProgressDots className="py-8" />
        )}
      </Section>
    </div>
  );
};

export default AdminHome;
