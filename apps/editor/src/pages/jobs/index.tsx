import {
  Card,
  ErrorSection,
  ProgressDots,
  withAuth,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { GetJobsResponse } from '../api/jobs';

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

  if (error || !data) {
    return <ErrorSection error={error || new Error('Missing data')} />;
  }

  if (data.jobs.length === 0) {
    return <div>No blog posts available at the moment.</div>;
  }

  return (
    <div className="blog-list__container flex flex-col gap-4">
      {data.jobs.map((job) => (
        <Card
          className="blog-list__card container-lined hover:container-elevated p-8"
          ctaText="Edit"
          ctaUrl={`/jobs/${job.slug}`}
          isEntireCardClickable
          isFullWidth
          subtitle={`${job.subtitle} • ${job.publicationStatus}`}
          title={job.title}
        />
      ))}
    </div>
  );
});

export default JobsPage;
