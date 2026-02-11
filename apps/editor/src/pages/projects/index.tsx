import {
  Card,
  ErrorSection,
  ProgressDots,
  withAuth,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { type GetProjectsResponse } from '../api/projects';

const ProjectsPage = withAuth(({ auth }) => {
  const [{ data, loading, error }] = useAxios<GetProjectsResponse>({
    method: 'get',
    url: '/api/projects',
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  if (loading) {
    return <ProgressDots />;
  }

  if (error ?? !data) {
    return <ErrorSection error={error ?? new Error('Missing data')} />;
  }

  if (data.projects.length === 0) {
    return <div>No jobs available at the moment.</div>;
  }

  return (
    <div className="job-list__container flex flex-col gap-4">
      {data.projects.map((project) => (
        <Card
          key={project.id}
          className="job-list__card container-lined hover:container-elevated p-8"
          ctaText="Edit"
          ctaUrl={`/projects/${project.slug}`}
          isEntireCardClickable
          isFullWidth
          subtitle={`${project.course}${project.tag.length > 0 ? ` • ${project.tag.join(', ')}` : ''} • ${project.authorName} • ${project.publicationStatus}`}
          title={project.title || 'Untitled'}
        />
      ))}
    </div>
  );
});

export default ProjectsPage;
