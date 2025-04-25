import {
  HeroSection,
  HeroH1,
  HeroH2,
  ProgressDots,
  Section,
  withAuth,
  CTALinkOrButton,
  Breadcrumbs,
  ErrorSection,
  addQueryParam,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { GetUserResponse } from './api/users/me';
import { GetCourseRegistrationsResponse } from './api/course-registrations';
import { GetCoursesResponse } from './api/courses';
import { ROUTES } from '../lib/routes';
import { A, H3, P } from '../components/Text';
import Congratulations from '../components/courses/Congratulations';
import SocialShare from '../components/courses/SocialShare';
import { Course, CourseRegistration, User } from '../lib/api/db/tables';

const CURRENT_ROUTE = ROUTES.profile;

const ProfilePage = withAuth(({ auth }) => {
  const [{ data: userData, loading: userLoading, error: userError }] = useAxios<GetUserResponse>({
    method: 'get',
    url: '/api/users/me',
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  const [{ data: courseRegistrationsData, loading: courseRegistrationsLoading, error: courseRegistrationsError }] = useAxios<GetCourseRegistrationsResponse>({
    method: 'get',
    url: '/api/course-registrations',
    headers: {
      Authorization: `Bearer ${auth.token}`,
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
    .flat();

  const loading = userLoading || courseRegistrationsLoading || coursesLoading;
  const error = userError || courseRegistrationsError || coursesError;

  return (
    <div>
      <Head>
        <title>{CURRENT_ROUTE.title} | BlueDot Impact</title>
      </Head>
      {loading && <ProgressDots />}
      {error && <ErrorSection error={error} />}
      {userData?.user && (
      <>
        <HeroSection>
          <HeroH1>Your profile</HeroH1>
          <HeroH2>See your progress and share your learnings</HeroH2>
        </HeroSection>
        <Breadcrumbs route={CURRENT_ROUTE} />
        <Section
          className="profile max-w-[728px]"
        >
          <div className="profile__account-details flex flex-col gap-4 container-lined bg-white p-8 mb-4">
            <H3>Account details</H3>
            <P>Name: {userData.user.name}</P>
            <P>Email: {userData.user.email}</P>
          </div>
          {enrolledCourses.length === 0 && (
            <div className="profile__no-courses flex flex-col gap-4 container-lined bg-white p-8 mb-4">
              <P>You haven't started any courses yet</P>
              <CTALinkOrButton url={ROUTES.courses.url}>Join a course</CTALinkOrButton>
            </div>
          )}
          {enrolledCourses.length > 0 && (enrolledCourses.map(({ course, courseRegistration }) => <ProfileCourseCard key={courseRegistration.id} course={course} courseRegistration={courseRegistration} user={userData.user} />))}
        </Section>
      </>
      )}
    </div>
  );
});

interface ProfileCourseCardProps {
  course: Course;
  courseRegistration: CourseRegistration;
  user: User;
}

const ProfileCourseCard: React.FC<ProfileCourseCardProps> = ({ course, courseRegistration, user }) => {
  return (
    <div className="profile__course-progress flex flex-row justify-between items-center gap-4 container-lined bg-white p-8 mb-4" key={course.id}>
      <div className="flex flex-col gap-2">
        <P className="uppercase text-size-xs font-bold text-slate-600">{courseRegistration.certificateId ? 'Completed' : 'In progress'}</P>
        <H3>{course.title}</H3>
        {courseRegistration.certificateId && (
        <>
          <P><A href={addQueryParam(ROUTES.certification.url, 'id', courseRegistration.certificateId)}>View your certificate</A></P>
          <P>Share the course</P>
          <SocialShare
            coursePath={course.path}
            referralCode={user.referralId}
            text={`🎉 I just completed the ${course.title} course from BlueDot Impact! It’s free, self-paced, and packed with insights. Check it out and sign up with my link below:`}
          />
        </>
        )}
      </div>
      <CTALinkOrButton url={course.path} variant="primary">
        Continue
      </CTALinkOrButton>
    </div>
  );
};

export default ProfilePage;
