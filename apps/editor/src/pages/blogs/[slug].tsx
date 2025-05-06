import {
  ErrorSection,
  NewText,
  ProgressDots,
  withAuth,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { useRouter } from 'next/router';
import axios from 'axios';
import { GetBlogResponse } from '../api/blogs/[slug]';
import { BodyEditor } from '../../components/BodyEditor';

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

  const saveBlog = async (body: string) => {
    await axios({
      method: 'put',
      url: `/api/blogs/${slug}`,
      data: {
        body,
      },
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });
  };

  if (loading) {
    return <ProgressDots />;
  }

  if (error || !data) {
    return <ErrorSection error={error || new Error('Missing data')} />;
  }

  return (
    <>
      <Head>
        <title>{`${data.blog.title} | BlueDot Editor`}</title>
      </Head>
      <BodyEditor auth={auth} onSave={saveBlog}>
        {data.blog.body}
      </BodyEditor>
      <NewText.P><NewText.A href={`https://airtable.com/app63L1YChHfS6RJF/pagR4C2qmcFgavPlo?QaMci=${data.blog.id}`}>Return to Airtable</NewText.A></NewText.P>
    </>
  );
});

export default BlogPostPage;
