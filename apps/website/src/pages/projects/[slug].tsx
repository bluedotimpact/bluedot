import {
  CTALinkOrButton,
  HeroSection,
  HeroH1,
  HeroH2,
  Section,
  Breadcrumbs,
  BluedotRoute,
  ErrorSection,
  ProgressDots,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { useRouter } from 'next/router';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import { ROUTES } from '../../lib/routes';
import { GetProjectResponse } from '../api/cms/projects/[slug]';
import MarkdownExtendedRenderer from '../../components/courses/MarkdownExtendedRenderer';
import { A } from '../../components/Text';

const ProjectPostPage = () => {
  const { query: { slug } } = useRouter();
  if (typeof slug !== 'string') {
    return <ProgressDots />;
  }

  const [{ data, loading, error }] = useAxios<GetProjectResponse>({
    method: 'get',
    url: `/api/cms/projects/${slug}`,
  });

  const currentRoute: BluedotRoute = {
    title: data?.project?.title || 'Project',
    url: `${ROUTES.projects.url}/${slug}`,
    parentPages: [...(ROUTES.projects.parentPages ?? []), ROUTES.projects],
  };

  const formattedDate = data?.project?.publishedAt
    ? new Date(data.project.publishedAt * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    })
    : '';

  return (
    <div>
      {loading && <ProgressDots />}
      {error && <ErrorSection error={error} />}
      {data?.project && (
        <>
          <Head>
            <title>{`${data.project.title} | BlueDot Impact`}</title>
            <meta name="description" content={`${data.project.title} - Project post by ${data.project.authorName}`} />
          </Head>
          <HeroSection>
            <HeroMiniTitle>{data.project.course} Project</HeroMiniTitle>
            <HeroH1>{data.project.title}</HeroH1>
            <HeroH2><A href={data.project.authorUrl || '#'} className="text-white">{data.project.authorName}</A>{data.project.tag?.length ? ` • ${data.project.tag.join(' • ')}` : ''} • {formattedDate}</HeroH2>
          </HeroSection>
          <Breadcrumbs route={currentRoute} />
          <Section className="max-w-3xl">
            <MarkdownExtendedRenderer>
              {data.project.body || ''}
            </MarkdownExtendedRenderer>
            <div className="my-8 border-t border-color-divider pt-8">
              <CTALinkOrButton url={ROUTES.projects.url} variant="secondary" withBackChevron>
                See other student projects
              </CTALinkOrButton>
            </div>
          </Section>
        </>
      )}
    </div>
  );
};

export default ProjectPostPage;
