import {
  Breadcrumbs, CTALinkOrButton, P, Section,
} from '@bluedot/ui';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import WhatThisIsForSection from '../../components/advising/WhatThisIsForSection';
import RecommendedReadingSection from '../../components/advising/RecommendedReadingSection';
import AdvisorsSection from '../../components/advising/AdvisorsSection';
import { ROUTES } from '../../lib/routes';
import {
  getProgramDetailPageStaticProps,
  type ProgramDetailPageProps,
} from '../../lib/programDetailPage';

const PROGRAM_SLUG = 'advising';
const FALLBACK_NAME = '1-1 advising';
const FALLBACK_DESCRIPTION = '30 min calls with the BlueDot team to accelerate you towards doing impactful work in AI safety and biosecurity.';

const OneOnOneAdvisingPage = ({ programName, programDescription }: ProgramDetailPageProps) => {
  return (
    <div>
      <Head>
        <title>{`${programName} | BlueDot Impact`}</title>
        <meta name="description" content={programDescription} />
      </Head>
      <MarketingHero
        title={programName}
        subtitle={programDescription}
      />
      <Breadcrumbs
        route={{
          title: programName,
          url: '/programs/advising',
          parentPages: [ROUTES.home, ROUTES.programs],
        }}
      />
      <Section title="1-1 advising is now by invitation" titleLevel="h3">
        <div className="w-full flex flex-col gap-6">
          <P>
            BlueDot supports the strongest people from our community to work on AI safety by connecting them to funding, programs, roles and collaborators. We can only hold a small number of calls at a time, so we invite people rather than reviewing applications.
          </P>
          <P>
            If we reach out, it&apos;s because something in your course application, your work, or your contributions in discussions stood out to us.
          </P>
          <div>
            <CTALinkOrButton variant="primary" withChevron url="/courses">
              Browse our courses
            </CTALinkOrButton>
          </div>
        </div>
      </Section>
      <WhatThisIsForSection />
      <RecommendedReadingSection />
      <AdvisorsSection />
    </div>
  );
};

export const getStaticProps: GetStaticProps<ProgramDetailPageProps> = () => getProgramDetailPageStaticProps(
  PROGRAM_SLUG,
  { programName: FALLBACK_NAME, programDescription: FALLBACK_DESCRIPTION },
);

OneOnOneAdvisingPage.pageRendersOwnNav = true;

export default OneOnOneAdvisingPage;
