import {
  HeroSection,
  HeroH1,
  Breadcrumbs,
  ErrorSection,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { useEffect, useState } from 'react';
import { ROUTES } from '../../lib/routes';
import type { CoursesRequestBody, GetCoursesResponse } from '../api/courses';
import CourseDirectory from '../../components/courses/CourseDirectory';

const CURRENT_ROUTE = ROUTES.courses;

const CoursePage = () => {
  const [requestBody, setRequestBody] = useState<CoursesRequestBody>();

  const [{ data, loading, error }] = useAxios<GetCoursesResponse>({
    url: '/api/courses',
    method: 'POST',
    data: requestBody,
  });
  const [{ data: allCoursesData, loading: allCoursesLoading, error: allCoursesError }, fetchAllCourses] = useAxios<GetCoursesResponse>({
    url: '/api/courses',
    method: 'POST',
  }, { manual: true });

  const noResults = !!(data?.courses && data.courses.length === 0);

  useEffect(() => {
    if (noResults) {
      fetchAllCourses();
    }
  }, [noResults, fetchAllCourses]);

  const displayData = !noResults ? data : allCoursesData;
  const displayLoading = loading || (noResults && allCoursesLoading);
  const displayError = !noResults ? error : allCoursesError;

  return (
    <div>
      <Head>
        <title>AI safety courses with certificates</title>
        <meta name="description" content="Courses that support you to develop the knowledge, community and network needed to pursue a high-impact career." />
        {displayData?.courses && (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                itemListElement: displayData.courses.map((course, index) => ({
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
      {displayError && <ErrorSection error={displayError} />}
      <CourseDirectory
        displayData={displayData}
        displayLoading={displayLoading}
        noResults={noResults}
        refetch={setRequestBody}
      />
    </div>
  );
};

export default CoursePage;
