import {
  Card,
  ErrorSection,
  ProgressDots,
  withAuth,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { type GetJobsResponse } from '../api/jobs';

const JobsPage = withAuth(({ auth }) => {
  const [{ data, loading, error }] = useAxios<GetJobsResponse>({
    method: 'get',
    url: '/api/jobs',
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

  if (data.jobs.length === 0) {
    return <div>No jobs available at the moment.</div>;
  }

  return (
    <div className="job-list__container flex flex-col gap-4">
      {data.jobs.map((job) => (
        <Card
          key={job.id}
          className="p-8"
          ctaText="Edit"
          url={`/jobs/${job.slug}`}
          isFullWidth
          subtitle={`${job.subtitle} • ${job.publicationStatus}`}
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          title={job.title || 'Untitled'}
        />
      ))}
    </div>
  );
});

export default JobsPage;
