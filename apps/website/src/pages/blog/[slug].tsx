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
import { Blog, blogTable } from '@bluedot/db';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import { ROUTES } from '../../lib/routes';
import MarkdownExtendedRenderer from '../../components/courses/MarkdownExtendedRenderer';
import { A } from '../../components/Text';
import db from '../../lib/api/db';

type BlogPostPageProps = {
  slug: string;
  blog: Blog;
};

const BlogPostPage = ({ slug, blog }: BlogPostPageProps) => {
  const currentRoute: BluedotRoute = {
    title: blog.title || 'Blog Post',
    url: `${ROUTES.blog.url}/${slug}`,
    parentPages: [...(ROUTES.blog.parentPages ?? []), ROUTES.blog],
  };

  const formattedDate = blog.publishedAt
    ? new Date(blog.publishedAt * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : '';

  return (
    <div>
      <Head>
        <title>{`${blog.title} | BlueDot Impact`}</title>
        <meta name="description" content={`${blog.title} - Blog post by ${blog.authorName}`} />
        <meta key="og:title" property="og:title" content={blog.title} />
        <meta key="og:site_name" property="og:site_name" content="BlueDot Impact" />
        <meta key="og:description" property="og:description" content={blog.title} />
        <meta key="og:type" property="og:type" content="article" />
        <meta key="og:url" property="og:url" content={`https://bluedot.org/blog/${encodeURIComponent(slug)}`} />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: blog.title,
              author: {
                '@type': 'Person',
                name: blog.authorName,
                url: blog.authorUrl,
              },
              ...(blog.publishedAt ? {
                datePublished: new Date(blog.publishedAt * 1000).toISOString(),
                dateModified: new Date(blog.publishedAt * 1000).toISOString(),
              } : {}),
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `${ROUTES.blog.url}/${slug}`,
              },
              description: blog.title,
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
        <HeroH1>{blog.title}</HeroH1>
        <HeroH2><A href={blog.authorUrl || '#'} className="text-white">{blog.authorName || 'Unknown Author'}</A> • {formattedDate}</HeroH2>
      </HeroSection>
      <Breadcrumbs route={currentRoute} />
      <Section className="max-w-3xl">
        <MarkdownExtendedRenderer>
          {blog.body ?? ''}
        </MarkdownExtendedRenderer>
        <div className="my-8 border-t border-color-divider pt-8">
          <CTALinkOrButton url={ROUTES.blog.url} variant="secondary" withBackChevron>
            See our other articles
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

export const getStaticProps: GetStaticProps<BlogPostPageProps> = async ({ params }) => {
  const slug = params?.slug as string;

  if (!slug) {
    return {
      notFound: true,
    };
  }

  try {
    const blog = await db.get(blogTable, { slug, publicationStatus: { '!=': 'Unpublished' } });

    return {
      props: {
        slug,
        blog,
      },
      revalidate: 300,
    };
  } catch (error) {
    // Error fetching blog data (likely not found)
    return {
      notFound: true,
      revalidate: 60, // Cache 404s for only 1 minute instead of 1 year
    };
  }
};

export default BlogPostPage;
