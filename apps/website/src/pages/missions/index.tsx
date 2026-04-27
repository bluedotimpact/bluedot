import {
  Breadcrumbs,
  ErrorSection,
  ProgressDots,
} from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import PageNewsletter from '../../components/PageNewsletter';
import MissionsListSection from '../../components/missions/MissionsListSection';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';

const CURRENT_ROUTE = ROUTES.missions;
const MISSIONS_SUBTITLE = 'Concrete projects we\'d love someone to take on with our support.';

const MissionsPage = () => {
  const { data: missions, isLoading, error } = trpc.missions.getAll.useQuery();

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="description" content={MISSIONS_SUBTITLE} />
      </Head>
      <MarketingHero title="Missions" subtitle={MISSIONS_SUBTITLE} />
      <Breadcrumbs route={CURRENT_ROUTE} />
      {isLoading && (
        <section className="section section-body">
          <ProgressDots />
        </section>
      )}
      {error && <ErrorSection error={error} />}
      {missions && <MissionsListSection missions={missions} />}
      <PageNewsletter />
    </div>
  );
};

MissionsPage.pageRendersOwnNav = true;

export default MissionsPage;
