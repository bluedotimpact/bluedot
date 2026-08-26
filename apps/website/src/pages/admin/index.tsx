import { Breadcrumbs, Section } from '@bluedot/ui';
import Head from 'next/head';
import { withAdminGuard } from '../../components/admin/withAdminGuard';
import { ROUTES } from '../../lib/routes';

const CURRENT_ROUTE = ROUTES.admin;

const AdminHome = withAdminGuard(() => (
  <div>
    <Head>
      <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      <meta name="robots" content="noindex" />
    </Head>
    <Breadcrumbs route={CURRENT_ROUTE} />
    <Section className="min-h-[50vh]">
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
        <li>
          <a href={ROUTES.adminDeletionRequests.url} className="text-bluedot-normal underline hover:opacity-80">
            {ROUTES.adminDeletionRequests.title}
          </a>
        </li>
      </ul>
    </Section>
  </div>
));

export default AdminHome;
