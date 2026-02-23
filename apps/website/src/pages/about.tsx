import {
  Breadcrumbs,
  H1,
} from '@bluedot/ui';
import Head from 'next/head';
import { Nav } from '../components/Nav/Nav';
import IntroSection from '../components/about/IntroSection';
import BeliefsSection from '../components/about/BeliefsSection';
import ValuesSection from '../components/about/ValuesSection';
import HistorySection from '../components/about/HistorySection';
import TeamSection from '../components/about/TeamSection';
import { ROUTES } from '../lib/routes';

const CURRENT_ROUTE = ROUTES.about;

const AboutHero = () => {
  return (
    <section className="relative w-full min-h-[317px] min-[680px]:min-h-[366px]">
      <Nav variant="transparent" />
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
              Building the workforce that protects humanity
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
        <meta name="description" content="Building the workforce that protects humanity. BlueDot Impact trains people in AI safety, governance, and biosecurity." />
      </Head>
      <AboutHero />
      <Breadcrumbs route={CURRENT_ROUTE} />
      <IntroSection />
      <BeliefsSection />
      <ValuesSection />
      <HistorySection />
      <TeamSection />
    </div>
  );
};

export default AboutPage;
