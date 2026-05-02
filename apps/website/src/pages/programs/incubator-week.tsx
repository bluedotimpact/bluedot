import { Breadcrumbs, type BluedotRoute } from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import GrantStatsStrip from '../../components/grants/sections/GrantStatsStrip';
import TrackRecordSection from '../../components/incubator-week/TrackRecordSection';
import TheWeekSection from '../../components/incubator-week/TheWeekSection';
import AboutYouSection from '../../components/incubator-week/AboutYouSection';
import AboutBlueDotSection from '../../components/incubator-week/AboutBlueDotSection';
import { useGrantApplicationUrl } from '../../components/grants/useGrantApplicationUrl';
import { ROUTES } from '../../lib/routes';

const PAGE_TITLE = 'Incubator Week';
const APPLICATION_DEADLINE = '26 May';
const CURRENT_ROUTE: BluedotRoute = {
  title: PAGE_TITLE,
  url: '/programs/incubator-week',
  parentPages: [ROUTES.home, ROUTES.programs],
};

const IncubatorWeekProgramPage = () => {
  const applicationUrl = useGrantApplicationUrl('incubator-week');

  return (
    <div>
      <Head>
        <title>{`${PAGE_TITLE} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="Most accelerators take 12 weeks and 7%. We take 5 days and 0%. Fly to London to turn your AI safety idea into a funded org. $50k if your pitch lands. More for the strongest teams. Equity-free."
        />
      </Head>
      <MarketingHero
        title="Incubator Week"
        subtitle="Most accelerators take 12 weeks and 7%. We take 5 days and 0%. Fly to London to turn your AI safety idea into a funded org. $50k if your pitch lands. More for the strongest teams. Equity-free."
      />
      <Breadcrumbs route={CURRENT_ROUTE} />
      <GrantStatsStrip
        program="incubator-week"
        compact
        primaryAction={{
          label: `Apply by ${APPLICATION_DEADLINE}`,
          url: applicationUrl,
        }}
        stats={[
          { label: 'Cohort', value: 'v4' },
          { label: 'Runs', value: '1–5 June' },
          { label: 'Funding', value: '$50k equity-free' },
          { label: 'Covered', value: 'Flights, stay, meals' },
        ]}
      />
      <TrackRecordSection />
      <TheWeekSection />
      <AboutYouSection />
      <AboutBlueDotSection
        applicationUrl={applicationUrl}
        applicationDeadline={APPLICATION_DEADLINE}
      />
    </div>
  );
};

IncubatorWeekProgramPage.pageRendersOwnNav = true;

export default IncubatorWeekProgramPage;
