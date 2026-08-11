import { Breadcrumbs } from '@bluedot/ui';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import InviteOnlySection from '../../components/advising/InviteOnlySection';
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
      <InviteOnlySection />
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
