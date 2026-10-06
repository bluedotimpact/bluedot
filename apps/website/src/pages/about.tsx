import { Breadcrumbs, Button } from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../components/MarketingHero';
import IntroSection from '../components/about/IntroSection';
import BeliefsSection from '../components/about/BeliefsSection';
import ValuesSection from '../components/about/ValuesSection';
import HistorySection from '../components/about/HistorySection';
import TeamSection from '../components/about/TeamSection';
import { ROUTES } from '../lib/routes';
import { pageMetaTags } from '../lib/linkPreviewMetaTags';

const CURRENT_ROUTE = ROUTES.about;

const AboutPage = () => {
  return (
    <div>
      <Head>
        {pageMetaTags({ title: `${CURRENT_ROUTE.title} | BlueDot Impact`, description: 'Building the workforce that protects humanity. BlueDot Impact trains people in AI safety, governance, and biosecurity.' })}
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
      <div className="w-full max-w-max-width mx-auto px-spacing-x mt-spacing-y mb-16 flex justify-center">
        <Button url={ROUTES.joinUs.url}>
          Join our team
        </Button>
      </div>
    </div>
  );
};

AboutPage.pageRendersOwnNav = true;

export default AboutPage;
