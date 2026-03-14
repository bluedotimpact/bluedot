import {
  Breadcrumbs,
  P,
  type BluedotRoute,
} from '@bluedot/ui';
import Head from 'next/head';
import GrantPageSection from '../../components/grants/GrantPageSection';
import GrantProgramHero from '../../components/grants/GrantProgramHero';
import GrantProgramViewTransitions from '../../components/grants/GrantProgramViewTransitions';
import LandingBanner from '../../components/lander/components/LandingBanner';
import { ROUTES } from '../../lib/routes';

const CURRENT_ROUTE: BluedotRoute = {
  title: 'AGI Strategy Fund',
  url: '/grants/agi-strategy-fund',
  parentPages: [ROUTES.home, ROUTES.grants],
};

const INCUBATOR_WEEK_URL = '/courses/incubator-week';

const AgiStrategyFundPage = () => {
  return (
    <div className="bg-white">
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="The AGI Strategy Fund deployed $5k-$50k grants to AGI Strategy Course participants building high-impact AI safety projects."
        />
      </Head>

      <GrantProgramViewTransitions />

      <GrantProgramHero
        slug="agi-strategy-fund"
        title="AGI Strategy Fund"
        description="Made $5k-$50k grants to AGI Strategy Course participants building high-impact AI safety projects and organizations. Applications are now closed. To be considered for this path now, apply to Incubator Week."
        status="Closed"
        primaryCta={{ text: 'Go to Incubator Week', url: INCUBATOR_WEEK_URL }}
        secondaryCta={{ text: 'View all grant programs', url: '/grants' }}
        facts={[
          { label: 'Program status', value: 'Closed' },
          { label: 'Grant size', value: '$5k-$50k' },
          { label: 'Grants made', value: '9' },
          { label: 'Funding given out', value: '$200k+' },
        ]}
      />

      <Breadcrumbs route={CURRENT_ROUTE} />

      <GrantPageSection
        title="AGI Strategy Fund grantees"
        tone="canvas"
        contentClassName="max-w-[760px]"
      >
        <P>We will publish the AGI Strategy Fund grantee archive here once the full set of organizations and projects backed through the fund is ready to share.</P>
      </GrantPageSection>

      <LandingBanner
        title="Organization-level funding?"
        ctaText="Go to Incubator Week"
        ctaUrl={INCUBATOR_WEEK_URL}
        imageSrc="/images/courses/courses-gradient.webp"
        imageAlt="Incubator Week banner"
        iconSrc="/images/logo/BlueDot_Impact_Icon_White.svg"
        iconAlt="BlueDot icon"
        noiseImageSrc="/images/agi-strategy/noise.webp"
      />
    </div>
  );
};

export default AgiStrategyFundPage;
