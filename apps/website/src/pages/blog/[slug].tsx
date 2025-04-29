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
import { ROUTES } from '../../lib/routes';
import { GetBlogResponse } from '../api/cms/blogs/[slug]';
import MarkdownExtendedRenderer from '../../components/courses/MarkdownExtendedRenderer';

const BlogPostPage = () => {
  const { query: { slug } } = useRouter();
  if (typeof slug !== 'string') {
    return 'Invalid blog slug';
  }

  const [{ data, loading, error }] = useAxios<GetBlogResponse>({
    method: 'get',
    url: `/api/cms/blogs/${slug}`,
  });

  const currentRoute: BluedotRoute = {
    title: data?.blog?.title || 'Blog Post',
    url: `${ROUTES.blog.url}/${slug}`,
    parentPages: [...(ROUTES.blog.parentPages ?? []), ROUTES.blog],
  };

  const formattedDate = data?.blog?.publishedAt
    ? new Date(data.blog.publishedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : '';

  return (
    <div>
      {loading && <ProgressDots />}
      {error && <ErrorSection error={error} />}
      {data?.blog && (
        <>
          <Head>
            <title>{`${data.blog.title} | BlueDot Impact`}</title>
            <meta name="description" content={`${data.blog.title} - Blog post by ${data.blog.authorName}`} />
          </Head>
          <HeroSection>
            <HeroH1>{data.blog.title}</HeroH1>
            <HeroH2>{formattedDate} • {data.blog.authorName}</HeroH2>
          </HeroSection>
          <Breadcrumbs route={currentRoute} />
          <Section className="max-w-3xl">
            <MarkdownExtendedRenderer>
              {data.blog.body}
            </MarkdownExtendedRenderer>
            <div className="my-8 border-t border-color-divider pt-8">
              <CTALinkOrButton url={ROUTES.blog.url} variant="secondary" withBackChevron>
                See our other articles
              </CTALinkOrButton>
            </div>
          </Section>
        </>
      )}
    </div>
  );
};

export default BlogPostPage;
