import { Breadcrumbs } from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../components/MarketingHero';
import IntroSection from '../components/about/IntroSection';
import BeliefsSection from '../components/about/BeliefsSection';
import ValuesSection from '../components/about/ValuesSection';
import HistorySection from '../components/about/HistorySection';
import TeamSection from '../components/about/TeamSection';
import JoinUsCta from '../components/about/JoinUsCta';
import { ROUTES } from '../lib/routes';

const CURRENT_ROUTE = ROUTES.about;

const AboutPage = () => {
  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="description" content="Building the workforce that protects humanity. BlueDot Impact trains people in AI safety, governance, and biosecurity." />
      </Head>
      <MarketingHero
        title="About us"
        subtitle="Building the workforce that protects humanity"
      />
      <Breadcrumbs route={CURRENT_ROUTE} />
      <IntroSection />
      <BeliefsSection />
      <ValuesSection />
      <HistorySection />
      <TeamSection />
      <JoinUsCta />
    </div>
  );
};

AboutPage.pageRendersOwnNav = true;

export default AboutPage;
