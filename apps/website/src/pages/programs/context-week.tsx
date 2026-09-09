import {
  Breadcrumbs, CTALinkOrButton, H3, P, type BluedotRoute,
} from '@bluedot/ui';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import OverviewSection from '../../components/context-week/OverviewSection';
import { useGrantApplicationUrl } from '../../components/grants/useGrantApplicationUrl';
import { linkPreviewMetaTags, LINK_PREVIEW_FALLBACK_IMAGE_URL } from '../../lib/linkPreviewMetaTags';
import {
  getProgramDetailPageStaticProps,
  type ProgramDetailPageProps,
} from '../../lib/programDetailPage';
import { ROUTES } from '../../lib/routes';

const PROGRAM_SLUG = 'context-week';
const FALLBACK_NAME = 'Context Week';
const PROGRAM_DESCRIPTION = 'Context Week was a four-day residential experiment about AI safety. The experiment has concluded.';
const APPLICATION_NOTICE = 'You can still fill out the application form as an expression of interest, but you may not hear back.';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';

const ContextWeekProgramPage = ({ programName }: ProgramDetailPageProps) => {
  const applicationUrl = useGrantApplicationUrl('context-week');
  const description = `${PROGRAM_DESCRIPTION} ${APPLICATION_NOTICE}`;
  const currentRoute: BluedotRoute = {
    title: programName,
    url: '/programs/context-week',
    parentPages: [ROUTES.home, ROUTES.programs],
  };

  return (
    <div>
      <Head>
        <title>{`${programName} | BlueDot Impact`}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${programName} | BlueDot Impact`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${SITE_URL}/programs/context-week`} />
        {linkPreviewMetaTags({ imageUrl: LINK_PREVIEW_FALLBACK_IMAGE_URL, alt: 'BlueDot Impact logo' })}
        <meta name="twitter:title" content={`${programName} | BlueDot Impact`} />
        <meta name="twitter:description" content={description} />
      </Head>
      <MarketingHero
        title={programName}
        subtitle={PROGRAM_DESCRIPTION}
        cta={applicationUrl && (
          <CTALinkOrButton
            variant="unstyled"
            withChevron
            url={applicationUrl}
            target="_blank"
            className="min-h-11 bg-white text-bluedot-darker hover:bg-white/90"
          >
            Express interest
          </CTALinkOrButton>
        )}
      />
      <Breadcrumbs route={currentRoute} />
      <OverviewSection />
      <section className="section section-body">
        <div className="w-full max-w-prose flex flex-col gap-6">
          <H3>Express interest</H3>
          <P>{APPLICATION_NOTICE}</P>
          {applicationUrl && (
            <CTALinkOrButton
              variant="primary"
              withChevron
              url={applicationUrl}
              target="_blank"
              className="min-h-11"
            >
              Express interest
            </CTALinkOrButton>
          )}
        </div>
      </section>
    </div>
  );
};

export const getStaticProps: GetStaticProps<ProgramDetailPageProps> = () => getProgramDetailPageStaticProps(
  PROGRAM_SLUG,
  { programName: FALLBACK_NAME, programDescription: PROGRAM_DESCRIPTION },
);

ContextWeekProgramPage.pageRendersOwnNav = true;

export default ContextWeekProgramPage;
