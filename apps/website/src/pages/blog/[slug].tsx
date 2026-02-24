import {
  A,
  Breadcrumbs,
  type BluedotRoute,
  CTALinkOrButton,
  HeroH1,
  HeroH2,
  HeroSection,
  Section,
} from '@bluedot/ui';
import Head from 'next/head';
import { type GetStaticProps, type GetStaticPaths } from 'next';
import { type Blog, blogTable } from '@bluedot/db';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import { ROUTES } from '../../lib/routes';
import MarkdownExtendedRenderer from '../../components/courses/MarkdownExtendedRenderer';
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
        <meta key="og:title" property="og:title" content={blog.title ?? undefined} />
        <meta key="og:site_name" property="og:site_name" content="BlueDot Impact" />
        <meta key="og:description" property="og:description" content={blog.title ?? undefined} />
        <meta key="og:type" property="og:type" content="article" />
        <meta key="og:url" property="og:url" content={`https://bluedot.org/blog/${encodeURIComponent(slug)}`} />
        <meta key="og:image" property="og:image" content="https://bluedot.org/images/logo/link-preview-fallback.png" />
        <meta key="og:image:width" property="og:image:width" content="1200" />
        <meta key="og:image:height" property="og:image:height" content="630" />
        <meta key="og:image:type" property="og:image:type" content="image/png" />
        <meta key="og:image:alt" property="og:image:alt" content="BlueDot Impact logo" />
        <script
          type="application/ld+json"

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
        {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
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
  } catch {
    // Error fetching blog data (likely not found)
    return {
      notFound: true,
      revalidate: 60, // Cache 404s for only 1 minute instead of 1 year
    };
  }
};

export default BlogPostPage;
