import { Breadcrumbs } from '@bluedot/ui';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import StatsStrip from '../../components/StatsStrip';
import GrantFaqSection from '../../components/grants/sections/GrantFaqSection';
import GrantCta from '../../components/grants/sections/GrantCta';
import WhatThisIsForSection from '../../components/seed-grants/WhatThisIsForSection';
import WhatWeLookForSection from '../../components/seed-grants/WhatWeLookForSection';
import WhatYouReceiveSection from '../../components/seed-grants/WhatYouReceiveSection';
import ExpectationsSection from '../../components/seed-grants/ExpectationsSection';
import NextStepsSection from '../../components/seed-grants/NextStepsSection';
import FundedOrganizationsSection from '../../components/seed-grants/FundedOrganizationsSection';
import { ROUTES } from '../../lib/routes';
import {
  getProgramDetailPageStaticProps,
  type ProgramDetailPageProps,
} from '../../lib/programDetailPage';
import { type GrantTypeSlug } from '../../lib/grantTypes';
import { pageMetaTags } from '../../lib/linkPreviewMetaTags';

const GRANT_TYPE: GrantTypeSlug = 'seed';
const FALLBACK_NAME = 'Seed Grants';
const HERO_DESCRIPTION = 'Funding to get a new AI safety or biosecurity project or organization off the ground.';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';
const PAGE_PATH = '/grants/seed';

const SeedGrantsPage = ({ programName, programDescription }: ProgramDetailPageProps) => {
  return (
    <div>
      <Head>
        {pageMetaTags({ title: `${programName} | BlueDot Impact`, description: programDescription })}
        <link rel="canonical" href={`${SITE_URL}${PAGE_PATH}`} />
      </Head>
      <MarketingHero
        title={programName}
        subtitle={programDescription}
      />
      <Breadcrumbs
        route={{
          title: programName,
          url: PAGE_PATH,
          parentPages: [ROUTES.home, ROUTES.grants],
        }}
      />
      <StatsStrip
        slug={GRANT_TYPE}
        compact
        stats={[
          { label: 'Grant funding', value: '$20k-$200k' },
          { label: 'Grant length', value: '6-12 months' },
          { label: 'Decision time', value: 'About 4 weeks' },
        ]}
      />
      <WhatThisIsForSection />
      <WhatWeLookForSection />
      <WhatYouReceiveSection />
      <ExpectationsSection />
      <NextStepsSection />
      <FundedOrganizationsSection />
      <GrantFaqSection grantType={GRANT_TYPE} />
      <GrantCta grantType={GRANT_TYPE} />
    </div>
  );
};

export const getStaticProps: GetStaticProps<ProgramDetailPageProps> = () => getProgramDetailPageStaticProps(
  GRANT_TYPE,
  { programName: FALLBACK_NAME, programDescription: HERO_DESCRIPTION },
);

SeedGrantsPage.pageRendersOwnNav = true;

export default SeedGrantsPage;
