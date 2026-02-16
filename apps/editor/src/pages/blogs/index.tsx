import {
  Card,
  ErrorSection,
  ProgressDots,
  withAuth,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { type GetBlogsResponse } from '../api/blogs';

const BlogsPage = withAuth(({ auth }) => {
  const [{ data, loading, error }] = useAxios<GetBlogsResponse>({
    method: 'get',
    url: '/api/blogs',
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  if (loading) {
    return <ProgressDots />;
  }

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (error || !data) {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    return <ErrorSection error={error || new Error('Missing data')} />;
  }

  if (data.blogs.length === 0) {
    return <div>No blog posts available at the moment.</div>;
  }

  return (
    <div className="blog-list__container flex flex-col gap-4">
      {data.blogs.map((blog) => (
        <Card
          key={blog.id}
          className="blog-list__card container-lined hover:container-elevated p-8"
          ctaText="Edit"
          ctaUrl={`/blogs/${blog.slug}`}
          isEntireCardClickable
          isFullWidth
          subtitle={`${blog.authorName} • ${blog.publicationStatus} • ${new Date(blog.publishedAt * 1000).toLocaleDateString()}`}
          title={blog.title || 'Untitled'}
        />
      ))}
    </div>
  );
});

export default BlogsPage;
