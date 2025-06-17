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
import { GetProjectResponse } from '../api/projects/[slug]';
import { BodyEditor } from '../../components/BodyEditor';

const ProjectPostPage = withAuth(({ auth }) => {
  const { query: { slug } } = useRouter();
  if (typeof slug !== 'string') {
    return <ProgressDots />;
  }

  const [{ data, loading, error }] = useAxios<GetProjectResponse>({
    method: 'get',
    url: `/api/projects/${slug}`,
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  const saveProject = async (body: string) => {
    await axios({
      method: 'put',
      url: `/api/projects/${slug}`,
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
        <title>{`${data.project.title} | BlueDot Editor`}</title>
      </Head>
      <BodyEditor auth={auth} onSave={saveProject}>
        {data.project.body || ''}
      </BodyEditor>
      <NewText.P><NewText.A href={`https://airtable.com/app63L1YChHfS6RJF/pagkPlWBx7S9LDhBJ?QaMci=${data.project.id}`}>Return to Airtable</NewText.A></NewText.P>
    </>
  );
});

export default ProjectPostPage;
