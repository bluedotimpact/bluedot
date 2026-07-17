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

const CoursesPage = () => {
  const {
    courses: displayedCourses,
    projects: displayedProjects,
    isLoading,
    error,
  } = useSortedCourses();
  const allDisplayed = [...displayedCourses, ...displayedProjects];

  return (
    <div className="bd-md:pb-16 xl:pb-24">
      <Head>
        <title>AI safety courses with certificates</title>
        <meta name="description" content="Courses that support you to develop the knowledge, community and network needed to pursue a high-impact career." />
        {allDisplayed.length > 0 && (
          <script
            type="application/ld+json"

            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                itemListElement: allDisplayed.map((course, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  item: {
                    '@type': 'Course',
                    availableLanguage: 'en',
                    name: course.title,
                    description: course.shortDescription,
                    provider: {
                      '@type': 'Organization',
                      name: 'BlueDot Impact',
                      sameAs: 'https://bluedot.org',
                    },
                    url: `https://bluedot.org/courses/${course.slug}`,
                    offers: [{
                      '@type': 'Offer',
                      category: 'Free',
                    }],
                    hasCourseInstance: [{
                      '@type': 'CourseInstance',
                      courseMode: 'Online',
                      ...course.durationHours ? {
                        courseWorkload: `PT${course.durationHours}H`,
                      } : {},
                    }],
                    educationalCredentialAwarded: [{
                      '@type': 'EducationalOccupationalCredential',
                      name: 'BlueDot Certificate',
                      credentialCategory: 'Certificate',
                    }],
                    ...(course.averageRating && {
                      aggregateRating: {
                        '@type': 'AggregateRating',
                        ratingValue: course.averageRating,
                        bestRating: '5',
                        worstRating: '1',
                      },
                    }),
                  },
                })),
              }),
            }}
          />
        )}
      </Head>

      <MarketingHero
        title="Course Schedule"
        subtitle="Learn how you can have a positive impact on the future of AI via one of our upcoming free courses and projects."
      />
      <Breadcrumbs route={ROUTES.courses} />

      {/* Main Content Area */}
      {/* 1024/1280 stay arbitrary on this line: lg:/xl: would emit after the 1440/1920 arbitrary
          variants in Tailwind v4's cascade and shadow them at higher viewports. */}
      <div className="w-full mx-auto px-5 bd-md:px-8 min-[1024px]:px-12 min-[1280px]:px-16 min-[1440px]:px-20 min-[1920px]:max-w-[1360px] min-[1920px]:px-0">
        <div className="pt-8 bd-md:pt-16 xl:pt-24">
          <div className="flex flex-col xl:flex-row xl:gap-16">
            {/* Breadcrumb Menu */}
            <CourseScheduleMenu
              sections={[
                { label: 'Courses', items: displayedCourses },
                { label: 'Projects', items: displayedProjects },
              ]}
            />

            {/* Horizontal divider - only visible on stacked layout (below 1280px) */}
            <div className="xl:hidden mt-16 pt-16 border-t border-bluedot-navy/10" />

            {/* Course Cards Section */}
            <div className="flex-1 max-w-[780px] xl:max-w-none">
              {error && <ErrorSection error={error} />}
              {isLoading && <ProgressDots />}
              {!isLoading && !error && (
                <>
                  <CourseScheduleList courses={displayedCourses} />
                  {displayedProjects.length > 0 && (
                    <>
                      <div id="projects" className="my-12 lg:my-16 xl:my-20 border-t border-bluedot-navy/10" />
                      <h2 className="text-size-xxs leading-snug font-semibold text-bluedot-normal uppercase tracking-wide mb-12 xl:hidden">
                        Projects
                      </h2>
                      <CourseScheduleList courses={displayedProjects} />
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Newsletter Banner - ml-[316px] aligns with courses list (breadcrumb 252px + gap 64px) */}
        <div className="-mx-5 mt-16 bd-md:mx-0 bd-md:mt-12 lg:mt-16 xl:ml-[316px] xl:mt-20">
          <NewsletterBanner />
        </div>
      </div>
    </div>
  );
};

CoursesPage.pageRendersOwnNav = true;

export default CoursesPage;
