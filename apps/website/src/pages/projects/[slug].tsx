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
import { GetServerSideProps } from 'next';
import { Project } from '@bluedot/db';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import { ROUTES } from '../../lib/routes';
import { getProjectIfPublished } from '../api/cms/projects/[slug]';
import MarkdownExtendedRenderer from '../../components/courses/MarkdownExtendedRenderer';
import { A } from '../../components/Text';

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

export const getServerSideProps: GetServerSideProps<ProjectPostPageProps> = async ({ params }) => {
  const slug = params?.slug as string;

  if (!slug) {
    return {
      notFound: true,
    };
  }

  try {
    const project = await getProjectIfPublished(slug);

    return {
      props: {
        slug,
        project,
      },
    };
  } catch (error) {
    // Error fetching project data (likely not found)
    return {
      notFound: true,
    };
  }
};

export default ProjectPostPage;
