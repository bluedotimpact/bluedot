import {
  A,
  Breadcrumbs,
  ErrorSection,
  P,
  ProgressDots,
} from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import PageNewsletter from '../../components/PageNewsletter';
import MissionsListSection from '../../components/missions/MissionsListSection';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';
import { pageMetaTags } from '../../lib/linkPreviewMetaTags';

const CURRENT_ROUTE = ROUTES.missions;
const MISSIONS_SUBTITLE = 'Concrete projects we\'d love someone to take on with our support.';
const SEED_GRANTS_URL = '/grants/seed';
const SUBMIT_MISSION_FORM_URL = 'https://forms.gle/WzQUoU6UdiXzdevn9';

const MissionsPage = () => {
  const { data: missions, isLoading, error } = trpc.missions.getAll.useQuery();

  return (
    <div>
      <Head>
        {pageMetaTags({ title: `${CURRENT_ROUTE.title} | BlueDot Impact`, description: MISSIONS_SUBTITLE })}
      </Head>
      <MarketingHero title="Missions" subtitle={MISSIONS_SUBTITLE} />
      <Breadcrumbs route={CURRENT_ROUTE} />
      <section className="section section-body gap-8">
        <div className="flex max-w-prose flex-col gap-4">
          <P>
            Each mission is a project, organization, or company that an entrepreneur could take on full-time.
            We only list a mission here once our team or one of our expert partner organizations has put at least 100 hours of research into it, and we think it would make a meaningful impact.
            We prioritize missions that are relevant to a broad distribution of potential threat models and are important, neglected, and tractable.
            The list itself is not ranked.
          </P>
          <P>
            If you want to take on a mission, our <A href={SEED_GRANTS_URL}>Seed Grants program</A> can fund you.
            Please contact the team member listed on each mission page to get started.
          </P>
          <P>
            If you are interested in submitting new projects, please fill out <A href={SUBMIT_MISSION_FORM_URL}>this form</A> to start working with us.
            This list is initially scoped to projects in biosecurity, with AI safety projects coming soon.
            Both are open for submissions.
          </P>
        </div>
        {isLoading && <ProgressDots />}
        {missions && <MissionsListSection missions={missions} />}
      </section>
      {error && <ErrorSection error={error} />}
      <PageNewsletter />
    </div>
  );
};

MissionsPage.pageRendersOwnNav = true;

export default MissionsPage;
