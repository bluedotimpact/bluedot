import {
  Card, CTALinkOrButton, ErrorSection, ProgressDots, Section,
} from '@bluedot/ui';
import { isMobile } from 'react-device-detect';
import useAxios from 'axios-hooks';
import { P } from '../Text';
import { CmsBlog } from '../../lib/api/db/tables';
import { GetBlogsResponse } from '../../pages/api/cms/blogs';
import { ROUTES } from '../../lib/routes';

export type BlogListSectionProps = {
  maxItems?: number | undefined,
};

const BlogListSection = ({ maxItems }: BlogListSectionProps) => {
  const [{ data, loading, error }] = useAxios<GetBlogsResponse>({
    method: 'get',
    url: '/api/cms/blogs',
  });
  const title = 'Latest articles';

  if (error) {
    return <ErrorSection error={error} />;
  }

  if (loading) {
    return <Section title={title}><ProgressDots /></Section>;
  }

  return (
    <Section className="blog-list-section" title={title}>
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
  const formattedDate = new Date(blog.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="blog-list__listing">
      {isMobile ? (
        <Card
          className="blog-list__card--mobile container-lined p-6 max-w-full"
          title={blog.title}
          subtitle={`${formattedDate} • ${blog.authorName}`}
          ctaText="Read more"
          ctaUrl={url}
        />
      ) : (
        <div className="blog-list__card--desktop w-full flex flex-row items-center justify-between p-8 container-lined">
          <div className="flex-1">
            <strong className="blog-list__title">{blog.title}</strong>
            <P className="blog-list__subtitle">{formattedDate} • {blog.authorName}</P>
          </div>
          <CTALinkOrButton
            className="blog-list__cta-button"
            variant="secondary"
            withChevron
            url={url}
          >
            Read more
          </CTALinkOrButton>
        </div>
      )}
    </div>
  );
};

export default BlogListSection;
