import {
  Breadcrumbs, ErrorSection, ProgressDots,
} from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import NewsletterBanner from '../../components/homepage/NewsletterBanner';
import {
  CourseScheduleList,
  CourseScheduleMenu,
  useSortedCourses,
} from '../../components/courses/CourseSchedule';
import { ROUTES } from '../../lib/routes';

const ProjectsPage = () => {
  const { projects, isLoading, error } = useSortedCourses();

  return (
    <div className="bd-md:pb-16 xl:pb-24">
      <Head>
        <title>Projects | BlueDot Impact</title>
        <meta
          name="description"
          content="Structured project sprints for people who want to ship concrete AI safety work with expert support and accountability."
        />
        {projects.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                itemListElement: projects.map((project, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  item: {
                    '@type': 'Course',
                    availableLanguage: 'en',
                    name: project.title,
                    description: project.shortDescription,
                    provider: {
                      '@type': 'Organization',
                      name: 'BlueDot Impact',
                      sameAs: 'https://bluedot.org',
                    },
                    url: `https://bluedot.org/courses/${project.slug}`,
                  },
                })),
              }),
            }}
          />
        )}
      </Head>

      <MarketingHero
        title="Projects"
        subtitle="Ship a concrete piece of AI safety work, with expert support and a public output."
      />
      <Breadcrumbs route={ROUTES.projects} />

      <div className="w-full mx-auto px-5 bd-md:px-8 min-[1024px]:px-12 min-[1280px]:px-16 min-[1440px]:px-20 min-[1920px]:max-w-[1360px] min-[1920px]:px-0">
        <div className="pt-8 bd-md:pt-16 xl:pt-24">
          <div className="flex flex-col xl:flex-row xl:gap-16">
            <CourseScheduleMenu sections={[{ label: 'Projects', items: projects }]} />

            <div className="xl:hidden mt-16 pt-16 border-t border-bluedot-navy/10" />

            <div className="flex-1 max-w-[780px] xl:max-w-none">
              {error && <ErrorSection error={error} />}
              {isLoading && <ProgressDots />}
              {!isLoading && !error && projects.length > 0 && (
                <CourseScheduleList courses={projects} />
              )}
              {!isLoading && !error && projects.length === 0 && (
                <p className="text-size-md leading-[1.6] font-normal text-bluedot-navy/70">
                  No projects are running right now. Check back soon, or{' '}
                  <a href={`${ROUTES.courses.url}?utm_source=website&utm_campaign=projects-empty`} className="text-bluedot-normal font-medium hover:underline">
                    explore our courses
                  </a>{' '}
                  in the meantime.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="-mx-5 mt-16 bd-md:mx-0 bd-md:mt-12 lg:mt-16 xl:ml-[316px] xl:mt-20">
          <NewsletterBanner />
        </div>
      </div>
    </div>
  );
};

ProjectsPage.pageRendersOwnNav = true;

export default ProjectsPage;
