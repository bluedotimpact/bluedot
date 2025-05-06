import {
  Card,
  ErrorSection,
  ProgressDots,
  withAuth,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { GetBlogsResponse } from '../api/blogs';

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

  if (error || !data) {
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
          title={blog.title}
        />
      ))}
    </div>
  );
});

export default BlogsPage;
