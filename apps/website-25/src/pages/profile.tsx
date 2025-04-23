import {
  HeroSection,
  HeroH1,
  HeroH2,
  ProgressDots,
  Section,
  withAuth,
  CTALinkOrButton,
  Breadcrumbs,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { GetUserResponse } from './api/users/me';
import Congratulations from '../components/courses/Congratulations';
import { ROUTES } from '../lib/routes';

const CURRENT_ROUTE = ROUTES.profile;

const ProfilePage = withAuth(({ auth }) => {
  const [{ data, loading }] = useAxios<GetUserResponse>({
    method: 'get',
    url: '/api/users/me',
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  const enrolledMoocCourse = data?.enrolledCourses.find((c) => c.title === 'Future of AI');
  const completedMooc = !!data?.user.completedMoocAt;
  const nonMoocCourses = data?.enrolledCourses.filter((c) => c !== enrolledMoocCourse) ?? [];

  return (
    <div>
      <Head>
        <title>{CURRENT_ROUTE.title} | BlueDot Impact</title>
      </Head>
      {loading && <ProgressDots />}
      {/* TODO: error page */}
      {data?.user && (
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
            <h3>Account details</h3>
            <p>Name: {data.user.name}</p>
            <p>Email: {data.user.email}</p>
          </div>
          {data.enrolledCourses.length === 0 && (
            <div className="profile__no-courses flex flex-col gap-4 container-lined bg-white p-8 mb-4">
              <p>You haven't started any courses yet</p>
              <CTALinkOrButton url={ROUTES.courses.url}>Join a course</CTALinkOrButton>
            </div>
          )}
          {nonMoocCourses.length > 0 && (nonMoocCourses.map((course) => (
            <div className="profile__course-progress flex flex-row justify-between items-center gap-4 container-lined bg-white p-8 mb-4" key={course.id}>
              <h3>{course.title}</h3>
              <CTALinkOrButton url={course.path} variant="primary">
                Continue
              </CTALinkOrButton>
            </div>
          )))}
          {enrolledMoocCourse && completedMooc && (
            <Congratulations
              className="profile__course-completion !container-active"
              courseTitle={enrolledMoocCourse.title}
              coursePath={enrolledMoocCourse.path}
              referralCode={data.user.referralId}
            />
          )}
        </Section>
      </>
      )}
    </div>
  );
});

export default ProfilePage;
