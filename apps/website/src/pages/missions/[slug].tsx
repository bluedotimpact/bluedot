import {
  Breadcrumbs,
  type BluedotRoute,
  CTALinkOrButton,
  Section,
} from '@bluedot/ui';
import Head from 'next/head';
import { type GetStaticProps, type GetStaticPaths } from 'next';
import { type Mission, missionTable } from '@bluedot/db';
import MarketingHero from '../../components/MarketingHero';
import { ROUTES } from '../../lib/routes';
import { ONE_MINUTE_SECONDS } from '../../lib/constants';
import MarkdownExtendedRenderer from '../../components/courses/MarkdownExtendedRenderer';
import db from '../../lib/api/db';

type MissionPostPageProps = {
  slug: string;
  mission: Mission;
};

const MissionPostPage = ({ slug, mission }: MissionPostPageProps) => {
  const currentRoute: BluedotRoute = {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    title: mission.title || 'Mission',
    url: `${ROUTES.missions.url}/${slug}`,
    parentPages: [...(ROUTES.missions.parentPages ?? []), ROUTES.missions],
  };

  return (
    <div>
      <Head>
        <title>{`${mission.title} | BlueDot Impact`}</title>
        <meta name="description" content={mission.subtitle ?? undefined} />
      </Head>
      <MarketingHero title={currentRoute.title} subtitle={mission.subtitle ?? undefined} />
      <Breadcrumbs route={currentRoute} />
      <Section className="max-w-3xl">
        <MarkdownExtendedRenderer>
          {mission.description ?? undefined}
        </MarkdownExtendedRenderer>
        <div className="my-8 border-t border-color-divider pt-8">
          <CTALinkOrButton url={ROUTES.missions.url} variant="secondary" withBackChevron>
            See other missions
          </CTALinkOrButton>
        </div>
      </Section>
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<MissionPostPageProps> = async ({ params }) => {
  const slug = params?.slug as string;

  if (!slug) {
    return {
      notFound: true,
      revalidate: ONE_MINUTE_SECONDS,
    };
  }

  try {
    const mission = await db.get(missionTable, { slug, status: 'Live' });

    return {
      props: {
        slug,
        mission,
      },
      revalidate: 5 * ONE_MINUTE_SECONDS,
    };
  } catch {
    return {
      notFound: true,
      revalidate: ONE_MINUTE_SECONDS,
    };
  }
};

MissionPostPage.pageRendersOwnNav = true;

export default MissionPostPage;
