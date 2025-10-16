import React from 'react';
import {
  Card, CTALinkOrButton, ErrorSection, ProgressDots, Section,
} from '@bluedot/ui';
import { isMobile } from 'react-device-detect';
import useAxios from 'axios-hooks';
import { projectTable, InferSelectModel } from '@bluedot/db';
import { H3, P } from '../Text';
import { GetProjectsResponse } from '../../pages/api/cms/projects';
import { ROUTES } from '../../lib/routes';

type CmsProject = InferSelectModel<typeof projectTable.pg>;

export type ProjectsListSectionProps = {
  maxItems?: number | undefined,
};

// Component for rendering a single project item
export const ProjectListItem = ({ project }: {
  project: Omit<CmsProject, 'body'>
}) => {
  const url = `/projects/${project.slug}`;
  const tags = project.tag || [];

  return (
    <Card
      className="project-list__card container-lined hover:container-elevated p-8"
      ctaText="Read more"
      ctaUrl={url}
      isEntireCardClickable={!isMobile}
      subtitle={`${project.authorName}${tags.length > 0 ? ` • ${tags.join(' • ')}` : ''}`}
      title={project.title}
      imageSrc={project.coverImageSrc || undefined}
    />
  );
};

// Component for rendering the projects list view
type ProjectsListViewProps = {
  title: string;
  projects: Omit<CmsProject, 'body'>[];
  maxItems?: number;
};

export const ProjectsListView = ({ title, projects, maxItems }: ProjectsListViewProps) => {
  // Group projects by course
  const groupedSortedProjects = React.useMemo(() => {
    // Group projects by course
    const groups = projects.reduce((acc, project) => {
      const course = project.course || 'Uncategorized';
      if (!acc[course]) {
        acc[course] = [];
      }
      acc[course].push(project);
      return acc;
    }, {} as Record<string, Omit<CmsProject, 'body'>[]>);

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
    <Section className="project-list-section" title={title}>
      <div id="project-articles-anchor" className="invisible relative bottom-48" />
      {projects.length === 0 ? (
        <P>
          No projects available at the moment.
        </P>
      ) : (
        <>
          {groupedSortedProjects.map(([course, courseProjects]) => (
            <div key={course} className="mb-12">
              <H3>{course}</H3>
              <ul className="list-none mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {courseProjects.slice(0, maxItems ? Math.min(maxItems, courseProjects.length) : undefined).map((project) => (
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
  const [{ data, loading, error }] = useAxios<GetProjectsResponse>({
    method: 'get',
    url: '/api/cms/projects',
  });
  const title = 'Latest projects';

  if (error) {
    return <ErrorSection error={error} />;
  }

  if (loading) {
    return <Section title={title}><ProgressDots /></Section>;
  }

  return (
    <ProjectsListView
      title={title}
      projects={data?.projects || []}
      maxItems={maxItems}
    />
  );
};

export default ProjectsListSection;
