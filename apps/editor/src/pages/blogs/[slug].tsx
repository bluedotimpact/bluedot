import {
  ErrorSection,
  ProgressDots,
  withAuth,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { GetBlogResponse } from '../api/blogs/[slug]';
import { PresignedPostResponse } from '../api/presigned-upload';

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

  const uploadFile = async (fileData: ArrayBuffer, fileType: string) => {
    const blob = new Blob([fileData], { type: fileType });

    const presignedResponse = await axios<PresignedPostResponse>({
      method: 'POST',
      url: '/api/presigned-upload',
      data: {
        contentType: fileType,
      },
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });

    const formData = new FormData();
    Object.entries(presignedResponse.data.fields).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    formData.append('file', blob);
    await axios.post(presignedResponse.data.uploadUrl, formData);

    return { url: presignedResponse.data.fileUrl };
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
        <title>{`${data.blog.title} | BlueDot Impact`}</title>
        <meta name="description" content={`${data.blog.title} - Blog post by ${data.blog.authorName}`} />
      </Head>
      <div className="max-w-3xl">
        <MarkdownEditor uploadFile={uploadFile} onChange={console.log}>
          {data.blog.body}
        </MarkdownEditor>
      </div>
    </>
  );
});

export default BlogPostPage;
