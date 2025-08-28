import { useRouter } from 'next/router';
import useAxios from 'axios-hooks';
import { ErrorSection, ProgressDots, Section } from '@bluedot/ui';
import Head from 'next/head';
import { GetAllChunksResponse } from '../../api/courses/[courseSlug]/all';
import AllChunksLayout from '../../../components/courses/AllChunksLayout';

const AllChunksPage = () => {
  const { query: { courseSlug } } = useRouter();

  if (typeof courseSlug !== 'string') {
    return <ProgressDots />;
  }

  const [{ data, loading, error }] = useAxios<GetAllChunksResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/all`,
  });

  if (loading) {
    return <ProgressDots />;
  }

  if (error || !data) {
    return <ErrorSection error={error ?? new Error('Missing data from API')} />;
  }

  return (
    <div>
      <Head>
        <title>{`${data.course.title} - Full Course | BlueDot Impact`}</title>
        <meta name="description" content={`Complete ${data.course.title} course content in a single page`} />
      </Head>
      <AllChunksLayout
        course={data.course}
        allChunks={data.allChunks}
      />
    </div>
  );
};

AllChunksPage.hideFooter = true;

export default AllChunksPage;
