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
import { GetJobResponse } from '../api/jobs/[slug]';
import { BodyEditor } from '../../components/BodyEditor';

const JobPostPage = withAuth(({ auth }) => {
  const { query: { slug } } = useRouter();
  if (typeof slug !== 'string') {
    return 'Invalid job slug';
  }

  const [{ data, loading, error }] = useAxios<GetJobResponse>({
    method: 'get',
    url: `/api/jobs/${slug}`,
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  const saveJob = async (body: string) => {
    await axios({
      method: 'put',
      url: `/api/jobs/${slug}`,
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
        <title>{`${data.job.title} | BlueDot Editor`}</title>
      </Head>
      <BodyEditor auth={auth} onSave={saveJob}>
        {data.job.body}
      </BodyEditor>
      <NewText.P><NewText.A href={`https://airtable.com/app63L1YChHfS6RJF/pagJUhKs6oHyiFhQd?QaMci=${data.job.id}`}>Return to Airtable</NewText.A></NewText.P>
    </>
  );
});

export default JobPostPage;
