import type React from 'react';
import { Breadcrumbs } from '@bluedot/ui';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import GrantStatsStrip from '../../components/grants/sections/GrantStatsStrip';
import GrantFaqSection from '../../components/grants/sections/GrantFaqSection';
import GrantCta from '../../components/grants/sections/GrantCta';
import WhatThisIsForSection from '../../components/rapid-grants/WhatThisIsForSection';
import HowItWorksSection from '../../components/rapid-grants/HowItWorksSection';
import FundedProjectsSection from '../../components/rapid-grants/FundedProjectsSection';
import { ROUTES } from '../../lib/routes';
import { formatAmountUsd } from '../../lib/utils';
import { trpc } from '../../utils/trpc';
import {
  getProgramDetailPageStaticProps,
  type ProgramDetailPageProps,
} from '../../lib/programDetailPage';

const PROGRAM_SLUG = 'rapid-grants';
const FALLBACK_NAME = 'Rapid Grants';
const FALLBACK_DESCRIPTION = 'Funding for the BlueDot community to ship projects, run events, and do other concrete work on AI safety and biosecurity.';

const RapidGrantsPage = ({ programName, programDescription }: ProgramDetailPageProps) => {
  const { data: stats } = trpc.grants.getRapidGrantStats.useQuery();
  const grantsMadeLabel = stats ? String(stats.count) : '—';
  const fundingGivenOutLabel = stats ? formatAmountUsd(stats.totalAmountUsd) : '—';

  const scrollToGrantees = (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    const granteesSection = document.getElementById('grants-made');
    if (!granteesSection) {
      return;
    }

    const navOffset = 96;
    const targetTop = granteesSection.getBoundingClientRect().top + window.scrollY - navOffset;
    window.history.replaceState(null, '', '#grants-made');
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

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
          url: '/programs/rapid-grants',
          parentPages: [ROUTES.home, ROUTES.programs],
        }}
      />
      <GrantStatsStrip
        program="rapid-grants"
        compact
        stats={[
          { label: 'Typical grants', value: 'Up to $10k' },
          { label: 'Decision time', value: '~5 working days' },
          { label: 'Grants made', value: grantsMadeLabel },
          { label: 'Funding given', value: fundingGivenOutLabel },
        ]}
        secondaryAction={{
          label: 'See funded projects',
          url: '#grants-made',
          onClick: scrollToGrantees,
        }}
      />
      <WhatThisIsForSection />
      <HowItWorksSection />
      <FundedProjectsSection />
      <GrantFaqSection program="rapid-grants" />
      <GrantCta program="rapid-grants" />
    </div>
  );
};

export const getStaticProps: GetStaticProps<ProgramDetailPageProps> = () => getProgramDetailPageStaticProps(
  PROGRAM_SLUG,
  { programName: FALLBACK_NAME, programDescription: FALLBACK_DESCRIPTION },
);

RapidGrantsPage.pageRendersOwnNav = true;

export default RapidGrantsPage;
