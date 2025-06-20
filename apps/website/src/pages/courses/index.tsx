import {
  HeroSection,
  HeroH1,
  Breadcrumbs,
  ErrorSection,
} from '@bluedot/ui';
import Head from 'next/head';
import { ROUTES } from '../../lib/routes';
import CourseDirectory from '../../components/courses/CourseDirectory';
import { useCourses } from '../../lib/hooks/useCourses';

const CURRENT_ROUTE = ROUTES.courses;

const CoursePage = () => {
  const { courses, loading, error } = useCourses();

  return (
    <div>
      <Head>
        <title>AI safety courses with certificates</title>
        <meta name="description" content="Courses that support you to develop the knowledge, community and network needed to pursue a high-impact career." />
        {courses && (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                itemListElement: courses.map((course, index) => ({
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
                    url: `https://bluedot.org${course.path}`,
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
                    educationalLevel: course.level,
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
      <HeroSection>
        <HeroH1>Our courses</HeroH1>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      {error && <ErrorSection error={error} />}
      <CourseDirectory
        courses={courses}
        loading={loading}
      />
    </div>
  );
};

export default CoursePage;
