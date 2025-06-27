import {
  ProgressDots,
  withAuth,
  ErrorSection,
  CTALinkOrButton,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import React from 'react';
import { courseRegistrationTable, courseTable } from '@bluedot/db';
import { GetUserResponse } from '../api/users/me';
import { GetCourseRegistrationsResponse } from '../api/course-registrations';
import { GetCoursesResponse } from '../api/courses';
import { ROUTES } from '../../lib/routes';
import { H3, P } from '../../components/Text';
import SettingsLayout from '../../components/settings/SettingsLayout';
import SettingsCourseCard from '../../components/settings/SettingsCourseCard';

const CURRENT_ROUTE = ROUTES.settingsCourses;

function CoursesSettingsPage({ auth }: { auth: { token: string } }) {
  const [{ data: userData, loading: userLoading, error: userError }] = useAxios<GetUserResponse>({
    method: 'get',
    url: '/api/users/me',
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      </Head>
      {userLoading && <ProgressDots />}
      {userError && <ErrorSection error={userError} />}
      {userData?.user && (
        <SettingsLayout activeTab="courses" route={CURRENT_ROUTE}>
          <div className="p-8">
            <H3 className="mb-6">Your Courses</H3>
            <CoursesList authToken={auth.token} />
          </div>
        </SettingsLayout>
      )}
    </div>
  );
}

function CoursesList({ authToken }: { authToken: string }) {
  const [{ data: courseRegistrationsData, loading: courseRegistrationsLoading, error: courseRegistrationsError }] = useAxios<GetCourseRegistrationsResponse>({
    method: 'get',
    url: '/api/course-registrations',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const [{ data: coursesData, loading: coursesLoading, error: coursesError }] = useAxios<GetCoursesResponse>({
    method: 'get',
    url: '/api/courses',
  });

  // Combine courses and enrollments
  const enrolledCourses = (courseRegistrationsData?.courseRegistrations || [])
    .map((courseRegistration) => {
      const course = coursesData?.courses.find((c) => c.id === courseRegistration.courseId);
      return course ? [{ course, courseRegistration }] : [];
    })
    .flat()
    // Sort courses: in-progress courses first, then completed courses (oldest at bottom)
    .sort((a, b) => {
      if (!a.courseRegistration.certificateCreatedAt && !b.courseRegistration.certificateCreatedAt) return 0;
      if (!a.courseRegistration.certificateCreatedAt) return -1;
      if (!b.courseRegistration.certificateCreatedAt) return 1;
      return b.courseRegistration.certificateCreatedAt - a.courseRegistration.certificateCreatedAt;
    });

  const loading = courseRegistrationsLoading || coursesLoading;
  const error = courseRegistrationsError || coursesError;

  if (loading) return <ProgressDots />;
  if (error) return <ErrorSection error={error} />;

  return (
    <>
      {enrolledCourses.length === 0 && (
        <div className="flex flex-col gap-4 mb-4">
          <P>You haven't started any courses yet</P>
          <CTALinkOrButton url={ROUTES.courses.url}>Join a course</CTALinkOrButton>
        </div>
      )}
      {enrolledCourses.length > 0 && (
        <div className="space-y-4">
          {enrolledCourses.map(({ course, courseRegistration }) => (
            <SettingsCourseCard
              key={courseRegistration.id}
              course={course}
              courseRegistration={courseRegistration}
            />
          ))}
          <CTALinkOrButton url={ROUTES.courses.url}>Join another course</CTALinkOrButton>
        </div>
      )}
    </>
  );
}


export default withAuth(CoursesSettingsPage);