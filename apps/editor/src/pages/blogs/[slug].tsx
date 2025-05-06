import {
  ErrorSection,
  ProgressDots,
  withAuth,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { GetBlogResponse } from '../api/blogs/[slug]';

const MarkdownEditor = dynamic(() => import('../../components/MarkdownEditor'), { ssr: false });

const BlogPostPage = withAuth(({ auth }) => {
  const { query: { slug } } = useRouter();
  if (typeof slug !== 'string') {
    return 'Invalid blog slug';
  }

  const [{ data, loading, error }] = useAxios<GetBlogResponse>({
    method: 'get',
    url: `/api/blogs/${slug}`,
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

  return (
    <>
      <Head>
        <title>{`${data.blog.title} | BlueDot Impact`}</title>
        <meta name="description" content={`${data.blog.title} - Blog post by ${data.blog.authorName}`} />
      </Head>
      <div className="max-w-3xl">
        <MarkdownEditor>
          {data.blog.body}
        </MarkdownEditor>
      </div>
    </>
  );
});

export default BlogPostPage;
