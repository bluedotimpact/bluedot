import {
  CTALinkOrButton,
  HeroSection,
  HeroH1,
  HeroH2,
  Section,
  Breadcrumbs,
  BluedotRoute,
} from '@bluedot/ui';
import Head from 'next/head';
import { GetStaticProps, GetStaticPaths } from 'next';
import { Project, projectTable } from '@bluedot/db';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import { ROUTES } from '../../lib/routes';
import MarkdownExtendedRenderer from '../../components/courses/MarkdownExtendedRenderer';
import { A } from '../../components/Text';
import db from '../../lib/api/db';

type ProjectPostPageProps = {
  slug: string;
  project: Project;
};

const ProjectPostPage = ({ slug, project }: ProjectPostPageProps) => {
  const currentRoute: BluedotRoute = {
    title: project.title || 'Project',
    url: `${ROUTES.projects.url}/${slug}`,
    parentPages: [...(ROUTES.projects.parentPages ?? []), ROUTES.projects],
  };

  const formattedDate = project.publishedAt
    ? new Date(project.publishedAt * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    })
    : '';

  return (
    <div>
      <Head>
        <title>{`${project.title} | BlueDot Impact`}</title>
        <meta name="description" content={`${project.title} - Project post by ${project.authorName}`} />
      </Head>
      <HeroSection>
        <HeroMiniTitle>{project.course} Project</HeroMiniTitle>
        <HeroH1>{project.title}</HeroH1>
        <HeroH2><A href={project.authorUrl || '#'} className="text-white">{project.authorName}</A>{project.tag?.length ? ` • ${project.tag.join(' • ')}` : ''} • {formattedDate}</HeroH2>
      </HeroSection>
      <Breadcrumbs route={currentRoute} />
      <Section className="max-w-3xl">
        <MarkdownExtendedRenderer>
          {project.body}
        </MarkdownExtendedRenderer>
        <div className="my-8 border-t border-color-divider pt-8">
          <CTALinkOrButton url={ROUTES.projects.url} variant="secondary" withBackChevron>
            See other student projects
          </CTALinkOrButton>
        </div>
      </Section>
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // CI is not currently set up to support connecting to the database at build
  // time, so return no paths, and rely on `fallback: 'blocking'` to render the pages on demand.
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<ProjectPostPageProps> = async ({ params }) => {
  const slug = params?.slug as string;

  if (!slug) {
    return {
      notFound: true,
    };
  }

  try {
    const project = await db.get(projectTable, { slug, publicationStatus: { '!=': 'Unpublished' } });

    return {
      props: {
        slug,
        project,
      },
      revalidate: 300,
    };
  } catch (error) {
    // Error fetching project data (likely not found)
    return {
      notFound: true,
    };
  }
};

export default ProjectPostPage;
