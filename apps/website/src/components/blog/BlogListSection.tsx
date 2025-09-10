import {
  Card, CTALinkOrButton, ErrorSection, ProgressDots, Section, Tag,
} from '@bluedot/ui';
import { isMobile } from 'react-device-detect';
import useAxios from 'axios-hooks';
import { blogTable, InferSelectModel } from '@bluedot/db';
import { P } from '../Text';
import { GetBlogsResponse } from '../../pages/api/cms/blogs';
import { ROUTES } from '../../lib/routes';

type CmsBlog = InferSelectModel<typeof blogTable.pg>;

export type BlogListSectionProps = {
  maxItems?: number | undefined,
};

const BlogListSection = ({ maxItems }: BlogListSectionProps) => {
  const [{ data, loading, error }] = useAxios<GetBlogsResponse>({
    method: 'get',
    url: '/api/cms/blogs',
  });

  if (error) {
    return <ErrorSection error={error} />;
  }

  if (loading) {
    return <Section><ProgressDots /></Section>;
  }

  return (
    <Section className="blog-list-section">
      <div id="blog-articles-anchor" className="invisible relative bottom-48" />
      {data?.blogs.length === 0 ? (
        <P>
          No blog posts available at the moment.
        </P>
      ) : (
        <div className="blog-list__container flex flex-col gap-8">
          {data?.blogs.slice(0, maxItems).map((blog) => (
            <BlogListItem key={blog.id} blog={blog} />
          ))}
        </div>
      )}
      {maxItems && data && data.blogs.length > maxItems && (
        <CTALinkOrButton url={ROUTES.blog.url} variant="secondary" withChevron className="mt-8">
          Read more blog articles
        </CTALinkOrButton>
      )}
    </Section>
  );
};

export const BlogListItem = ({ blog }: {
  blog: Omit<CmsBlog, 'body'>
}) => {
  const url = `/blog/${blog.slug}`;
  const formattedDate = blog.publishedAt
    ? new Date(blog.publishedAt * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : 'Unknown date';

  return (
    <div className="blog-list__listing">
      <Card
        className="blog-list__card container-lined hover:container-elevated p-8"
        ctaText="Read more"
        ctaUrl={url}
        isEntireCardClickable={!isMobile}
        isFullWidth={!isMobile}
        subtitle={`${blog.authorName || 'Unknown author'} • ${formattedDate}`}
        title={blog.title || 'Untitled'}
        subtitleBadge={blog.isFeatured && <Tag variant="secondary">FEATURED</Tag>}
      />
    </div>
  );
};

export default BlogListSection;
