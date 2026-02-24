import {
  Card, CTALinkOrButton, ErrorSection, H3, P, ProgressDots, Section,
} from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import React from 'react';
import { ROUTES } from '../../lib/routes';
import type { AppRouter } from '../../server/routers/_app';
import { trpc } from '../../utils/trpc';

type CmsProject = inferRouterOutputs<AppRouter>['projects']['getAll'][number];

export type ProjectsListSectionProps = {
  maxItems?: number;
};

// Component for rendering a single project item
export const ProjectListItem = ({ project }: { project: CmsProject }) => {
  const url = `/projects/${project.slug}`;
  const tags = project.tag || [];

  return (
    <Card
      className="container-lined hover:container-elevated p-8"
      ctaText="Read more"
      ctaUrl={url}
      isEntireCardClickable
      subtitle={`${project.authorName}${tags.length > 0 ? ` • ${tags.join(' • ')}` : ''}`}
      title={project.title}
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      imageSrc={project.coverImageSrc || undefined}
    />
  );
};

// Component for rendering the projects list view
type ProjectsListViewProps = {
  title: string;
  projects: CmsProject[];
  maxItems?: number;
};

export const ProjectsListView = ({ title, projects, maxItems }: ProjectsListViewProps) => {
  // Group projects by course
  const groupedSortedProjects = React.useMemo(() => {
    const groups = projects.reduce<Record<string, CmsProject[]>>((acc, project) => {
      const course = project.course || 'Uncategorized';
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      if (!acc[course]) {
        acc[course] = [];
      }

      acc[course].push(project);
      return acc;
    }, {});

    // Convert to array of [course, projects] pairs
    const groupsArray = Object.entries(groups);

    // Sort groups by the latest publishedAt date of any project in the group
    groupsArray.sort((a, b) => {
      const aLatest = Math.max(...a[1].map((p) => p.publishedAt || Infinity));
      const bLatest = Math.max(...b[1].map((p) => p.publishedAt || Infinity));
      return bLatest - aLatest; // Sort newest first
    });

    return groupsArray;
  }, [projects]);

  return (
    <Section title={title}>
      {projects.length === 0 ? (
        <P>No projects available at the moment.</P>
      ) : (
        <>
          {groupedSortedProjects.map(([course, courseProjects]) => (
            <div key={course} className="mb-12">
              <H3>{course}</H3>
              <ul className="list-none mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {courseProjects.slice(0, maxItems).map((project) => (
                  <li key={project.id}>
                    <ProjectListItem project={project} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
      {maxItems && projects.length > maxItems && (
        <CTALinkOrButton url={ROUTES.projects.url} variant="secondary" withChevron className="mt-8">
          See more projects
        </CTALinkOrButton>
      )}
    </Section>
  );
};

// Main component that handles data loading
const ProjectsListSection = ({ maxItems }: ProjectsListSectionProps) => {
  const { data: projects, isLoading: loading, error } = trpc.projects.getAll.useQuery();
  const title = 'Latest projects';

  if (error) {
    return <ErrorSection error={error} />;
  }

  if (loading) {
    return (
      <Section title={title}>
        <ProgressDots />
      </Section>
    );
  }

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  return <ProjectsListView title={title} projects={projects || []} maxItems={maxItems} />;
};

export default ProjectsListSection;
