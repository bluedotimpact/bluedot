import {
  Breadcrumbs,
  P,
  type BluedotRoute,
} from '@bluedot/ui';
import Head from 'next/head';
import GrantPageSection from '../../components/grants/GrantPageSection';
import GrantProgramHero from '../../components/grants/GrantProgramHero';
import GrantProgramViewTransitions from '../../components/grants/GrantProgramViewTransitions';
import FAQSection from '../../components/lander/components/FAQSection';
import LandingBanner from '../../components/lander/components/LandingBanner';
import { ROUTES } from '../../lib/routes';

const CURRENT_ROUTE: BluedotRoute = {
  title: 'The Bridge',
  url: '/grants/bridge',
  parentPages: [ROUTES.home, ROUTES.grants],
};

const FAQ_ITEMS = [
  {
    id: 'difference',
    question: 'How is this different from Rapid Grants?',
    answer: 'Rapid Grants cover small, concrete project costs.',
  },
  {
    id: 'apply',
    question: 'Can I apply?',
    answer: (
      <>
        Not yet. If you think you&apos;d be a strong fit when this launches, get in touch at{' '}
        <a href="mailto:team@bluedot.org" className="font-medium text-bluedot-navy underline underline-offset-4">
          team@bluedot.org
        </a>
        .
      </>
    ),
  },
];

const BridgePage = () => {
  return (
    <div className="bg-color-canvas">
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="Career transition grants for exceptional people going full-time on AI safety."
        />
      </Head>

      <GrantProgramViewTransitions />

      <GrantProgramHero
        slug="bridge"
        title="The Bridge"
        description="Career transition grants for exceptional people going full-time on AI safety."
        status="In development"
        primaryCta={{ text: 'Contact us', url: 'mailto:team@bluedot.org' }}
        secondaryCta={{ text: 'View all grant programs', url: '/grants' }}
        facts={[
          { label: 'Program status', value: 'In development' },
          { label: 'Focus', value: 'Career transitions' },
          { label: 'Current stage', value: 'Designing selection process and grant structure' },
          { label: 'Contact', value: 'team@bluedot.org' },
        ]}
      />

      <Breadcrumbs route={CURRENT_ROUTE} />

      <GrantPageSection contentClassName="flex flex-col gap-5">
        <div className="max-w-[760px] flex flex-col gap-5">
          <P>The field&apos;s biggest bottleneck isn&apos;t ideas or funding. It&apos;s getting the right people to go all-in. The Bridge is designed to back that move: selective grants for people with a strong track record who are ready to leave their current career and commit fully to work that matters.</P>
          <P>This could mean joining a top AI safety or biosecurity organization, founding a new project, or spending a focused period building the skills, relationships, and strategy needed to have outsized impact.</P>
          <P>Program status: In development. We&apos;re designing the selection process and grant structure now.</P>
        </div>
      </GrantPageSection>

      <FAQSection
        title="FAQ"
        items={FAQ_ITEMS}
        background="canvas"
      />

      <LandingBanner
        title="Think you might be a fit?"
        ctaText="Email team@bluedot.org"
        ctaUrl="mailto:team@bluedot.org"
        imageSrc="/images/courses/courses-gradient.webp"
        imageAlt="The Bridge banner"
        iconSrc="/images/logo/BlueDot_Impact_Icon_White.svg"
        iconAlt="BlueDot icon"
        noiseImageSrc="/images/agi-strategy/noise.webp"
      />
    </div>
  );
};

export default BridgePage;
