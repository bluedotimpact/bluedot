import { Card, CTALinkOrButton, Section } from '@bluedot/ui';
import { isMobile } from 'react-device-detect';
import { P } from '../Text';
import { CmsBlog } from '../../lib/api/db/tables';

export type BlogListSectionProps = {
  blogs: Omit<CmsBlog, 'body'>[]
};

const BlogListSection = ({ blogs }: BlogListSectionProps) => {
  return (
    <Section className="blog-list-section" title="Latest Articles">
      <div id="blog-articles-anchor" className="invisible relative bottom-48" />
      {blogs.length === 0 ? (
        <P>
          No blog posts available at the moment.
        </P>
      ) : (
        <div className="blog-list__container flex flex-col gap-8">
          {blogs.map((blog) => (
            <BlogListItem key={blog.id} blog={blog} />
          ))}
        </div>
      )}
    </Section>
  );
};

const BlogListItem = ({ blog }: {
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
