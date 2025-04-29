import {
  HeroSection,
  HeroH1,
  Breadcrumbs,
  ErrorSection,
} from '@bluedot/ui';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
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
      </Head>
      <HeroSection>
        <HeroMiniTitle>{CURRENT_ROUTE.title}</HeroMiniTitle>
        <HeroH1>The expertise you need to shape safe AI</HeroH1>
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
