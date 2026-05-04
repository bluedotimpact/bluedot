import {
  Breadcrumbs, ErrorSection, ProgressDots,
} from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import PageNewsletter from '../../components/PageNewsletter';
import { PageListGroup, PageListRow } from '../../components/PageListRow';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';

const ProjectsPage = () => {
  const { data: courses, isLoading, error } = trpc.courses.getAll.useQuery();
  const projects = (courses ?? []).filter((c) => c.type === 'Project');

  return (
    <div>
      <Head>
        <title>Projects | BlueDot Impact</title>
        <meta
          name="description"
          content="Structured project sprints for people who want to ship concrete AI safety work with expert support and accountability."
        />
      </Head>

      <MarketingHero
        title="Projects"
        subtitle="Ship a concrete piece of AI safety work, with expert support and a public output."
      />

      <Breadcrumbs route={ROUTES.projects} />

      <section className="section section-body">
        <div className="flex flex-col gap-12 lg:gap-14">
          {error && <ErrorSection error={error} />}
          {isLoading && <ProgressDots />}
          {!isLoading && !error && (
            <PageListGroup>
              {projects.map((project) => (
                <PageListRow
                  key={project.id}
                  href={`/courses/${project.slug}`}
                  title={project.title}
                  summary={project.shortDescription}
                  ctaLabel="Explore project"
                />
              ))}
            </PageListGroup>
          )}
        </div>
      </section>

      <PageNewsletter />
    </div>
  );
};

ProjectsPage.pageRendersOwnNav = true;

export default ProjectsPage;
