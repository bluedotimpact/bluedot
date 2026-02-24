import {
  Card, CTALinkOrButton, ErrorSection, P, ProgressDots, Section,
} from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import { ROUTES } from '../../lib/routes';
import type { AppRouter } from '../../server/routers/_app';
import { trpc } from '../../utils/trpc';

export type BlogListSectionProps = {
  maxItems?: number | undefined;
};

const BlogListSection = ({ maxItems }: BlogListSectionProps) => {
  const { data: blogs, isLoading: loading, error } = trpc.blogs.getAll.useQuery();

  const title = 'Latest articles';

  if (error) {
    return <ErrorSection error={error} />;
  }

  if (loading) {
    return (
      <Section title={title}>
        <ProgressDots />
      </Section>
    );
  }

  return (
    <Section title={title}>
      {blogs?.length === 0 ? (
        <P>No blog posts available at the moment.</P>
      ) : (
        <ul className="list-none flex flex-col gap-8">
          {blogs?.slice(0, maxItems).map((blog) => (
            <li key={blog.id}>
              <BlogListItem blog={blog} />
            </li>
          ))}
        </ul>
      )}
      {maxItems && blogs && blogs.length > maxItems && (
        <CTALinkOrButton url={ROUTES.blog.url} variant="secondary" withChevron className="mt-8">
          Read more
        </CTALinkOrButton>
      )}
    </Section>
  );
};

const BlogListItem = ({ blog }: { blog: inferRouterOutputs<AppRouter>['blogs']['getAll'][number] }) => {
  const url = `/blog/${blog.slug}`;
  const formattedDate = blog.publishedAt
    ? new Date(blog.publishedAt * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    : 'Unknown date';

  return (
    <Card
      className="container-lined hover:container-elevated p-8"
      ctaText="Read"
      ctaUrl={url}
      isEntireCardClickable
      isFullWidth
      subtitle={`${blog.authorName || 'Unknown author'} • ${formattedDate}`}
      title={blog.title || 'Untitled'}
      subtitleBadge={blog.isFeatured ? 'FEATURED' : undefined}
    />
  );
};

export default BlogListSection;
