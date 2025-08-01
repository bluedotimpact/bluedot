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
import { GetBlogResponse } from '../api/cms/blogs/[slug]';
import MarkdownExtendedRenderer from '../../components/courses/MarkdownExtendedRenderer';
import { A } from '../../components/Text';

const BlogPostPage = () => {
  const { query: { slug } } = useRouter();
  if (typeof slug !== 'string') {
    return <ProgressDots />;
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
    ? new Date(data.blog.publishedAt * 1000).toLocaleDateString('en-US', {
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
            <meta key="og:title" property="og:title" content={data.blog.title} />
            <meta key="og:site_name" property="og:site_name" content="BlueDot Impact" />
            <meta key="og:description" property="og:description" content={data.blog.title} />
            <meta key="og:type" property="og:type" content="article" />
            <meta key="og:url" property="og:url" content={`https://bluedot.org/blog/${encodeURIComponent(slug)}`} />
            <script
              type="application/ld+json"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'BlogPosting',
                  headline: data.blog.title,
                  author: {
                    '@type': 'Person',
                    name: data.blog.authorName,
                    url: data.blog.authorUrl,
                  },
                  ...(data.blog.publishedAt ? {
                    datePublished: new Date(data.blog.publishedAt * 1000).toISOString(),
                    dateModified: new Date(data.blog.publishedAt * 1000).toISOString(),
                  } : {}),
                  mainEntityOfPage: {
                    '@type': 'WebPage',
                    '@id': `${ROUTES.blog.url}/${slug}`,
                  },
                  description: data.blog.title,
                  publisher: {
                    '@type': 'Organization',
                    name: 'BlueDot Impact',
                    url: 'https://bluedot.org',
                  },
                }),
              }}
            />
          </Head>
          <HeroSection>
            <HeroMiniTitle>Blog</HeroMiniTitle>
            <HeroH1>{data.blog.title}</HeroH1>
            <HeroH2><A href={data.blog.authorUrl || '#'} className="text-white">{data.blog.authorName || 'Unknown Author'}</A> • {formattedDate}</HeroH2>
          </HeroSection>
          <Breadcrumbs route={currentRoute} />
          <Section className="max-w-3xl">
            <MarkdownExtendedRenderer>
              {data.blog.body ?? ''}
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
