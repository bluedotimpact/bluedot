import {
  Breadcrumbs,
  CTALinkOrButton,
  H1,
  P,
  Section,
} from '@bluedot/ui';
import Head from 'next/head';
import { Nav } from '../components/Nav/Nav';
import IntroSection from '../components/about/IntroSection';
import HistorySection from '../components/about/HistorySection';
import TeamSection from '../components/about/TeamSection';
import JoinUsCta from '../components/about/JoinUsCta';
import BeliefsSection from '../components/about/BeliefsSection';
import { ROUTES } from '../lib/routes';

const CURRENT_ROUTE = ROUTES.about;

const AboutHero = () => {
  return (
    <section className="relative w-full min-h-[317px] min-[680px]:min-h-[366px]">
      <Nav />
      <img
        src="/images/homepage/hero.webp"
        alt=""
        className="absolute inset-0 size-full object-cover -scale-x-100"
        {...{ fetchpriority: 'high' }}
      />
      <div className="relative z-10 flex flex-col justify-end h-full min-h-[317px] min-[680px]:min-h-[366px] pb-12 pt-20 min-[680px]:pb-16 min-[680px]:pt-20">
        <div className="w-full mx-auto max-w-max-width px-spacing-x">
          <div className="flex flex-col gap-6 max-w-[780px]">
            <H1 className="text-[32px] min-[680px]:text-[40px] min-[1024px]:text-[48px] leading-tight font-medium tracking-[-1px] text-white">
              About us
            </H1>
            <p className="text-size-sm min-[680px]:text-[18px] min-[1024px]:text-[20px] leading-[1.55] tracking-[-0.1px] text-white">
              Our mission is to build the workforce needed to safely navigate AGI.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const AboutPage = () => {
  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="description" content="Our mission is to build the workforce needed to safely navigate AGI." />
      </Head>
      <AboutHero />
      <Breadcrumbs route={CURRENT_ROUTE} />
      <IntroSection />
      <BeliefsSection />
      <HistorySection />
      <TeamSection />
      <JoinUsCta />
      <Section title="Contact us">
        <P>We love hearing from people, and are keen for people to reach out to us with any questions or feedback!</P>
        <CTALinkOrButton url={ROUTES.contact.url} variant="secondary" withChevron className="mt-5">Contact us</CTALinkOrButton>
      </Section>
    </div>
  );
};

export default AboutPage;
