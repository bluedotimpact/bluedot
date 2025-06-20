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
  ClickTarget,
  Input,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import {
  FaCheck, FaClock, FaAward, FaBookOpen, FaShare,
  FaCubesStacked,
} from 'react-icons/fa6';
import { courseRegistrationTable, courseTable } from '@bluedot/db';
import { GetUserResponse } from './api/users/me';
import { GetCourseRegistrationsResponse } from './api/course-registrations';
import { GetCoursesResponse } from './api/courses';
import { ROUTES } from '../lib/routes';
import { H2, H3, P } from '../components/Text';
import SocialShare from '../components/courses/SocialShare';
import MarkdownExtendedRenderer from '../components/courses/MarkdownExtendedRenderer';
import CircleSpaceEmbed from '../components/courses/exercises/CircleSpaceEmbed';
import { meRequestBodySchema } from '../lib/schemas/user/me.schema';
import { parseZodValidationError } from '../lib/utils';

const CURRENT_ROUTE = ROUTES.profile;

type Course = typeof courseTable.pg.$inferSelect;
type CourseRegistration = typeof courseRegistrationTable.pg.$inferSelect;
type User = GetUserResponse['user'];

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
    .flat()
    // Sort courses: in-progress courses first, then completed courses (oldest at bottom)
    .sort((a, b) => {
      if (!a.courseRegistration.certificateCreatedAt && !b.courseRegistration.certificateCreatedAt) return 0;
      if (!a.courseRegistration.certificateCreatedAt) return -1;
      if (!b.courseRegistration.certificateCreatedAt) return 1;
      return b.courseRegistration.certificateCreatedAt - a.courseRegistration.certificateCreatedAt;
    });

  const loading = userLoading || courseRegistrationsLoading || coursesLoading;
  const error = userError || courseRegistrationsError || coursesError;

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
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
        <Section className="profile">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="profile__enrolled-courses flex flex-col gap-4">
              <ProfileAccountDetails
                user={userData.user}
                authToken={auth.token}
              />
              <ProfileCourseList enrolledCourses={enrolledCourses} />
            </div>
            <div className="profile__events flex flex-col gap-4">
              <H3>Connect with your community</H3>
              <CircleSpaceEmbed spaceSlug="events" style={{ width: '100%', height: '100%', minHeight: '510px' }} />
            </div>
          </div>
        </Section>
      </>
      )}
    </div>
  );
});

type ProfileAccountDetailsProps = {
  user: User;
  authToken: string;
};

const ProfileAccountDetails: React.FC<ProfileAccountDetailsProps> = ({ user, authToken }) => {
  // State for name editing
  const [tempName, setTempName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [currentSavedName, setCurrentSavedName] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state when user data loads
  useEffect(() => {
    if (user && !isInitialized) {
      const { name } = user;
      setTempName(name);
      setCurrentSavedName(name);
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  // Name editing handlers
  const handleSave = async () => {
    const trimmedName = tempName.trim();
    const validationResult = meRequestBodySchema.safeParse({ name: trimmedName });
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      setNameError(firstError?.message || 'Failed to update name. Please try again.');
      return;
    }

    setIsSaving(true);
    setNameError('');

    try {
      await axios.patch(
        '/api/users/me',
        { name: tempName },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      setCurrentSavedName(trimmedName);
      setTempName(trimmedName);
    } catch (err) {
      if (!axios.isAxiosError(err)) {
        setNameError('Failed to update name. Please try again.');
        return;
      }

      if (err.response?.status === 401) {
        setNameError('Session expired. Please refresh the page and try again.');
        return;
      }

      if (err.response?.status === 400) {
        setNameError(parseZodValidationError(err, 'Invalid name format'));
        return;
      }

      setNameError('Failed to update name. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempName(currentSavedName);
    setNameError('');
  };

  const handleFocus = () => {
    setNameError('');
  };

  const showButtons = tempName.trim() !== currentSavedName.trim();

  return (
    <div className="profile-account-details">
      <H3 className="profile-account-details__title">Account details</H3>
      <div className="profile-account-details__container flex flex-col gap-4 container-lined bg-white p-8 h-fit">
        <div className="profile-account-details__name-section">
          <div className="profile-account-details__name-container flex flex-col gap-2">
            <P className="profile-account-details__name-label"><span className="font-bold">Name:</span></P>
            <div className="profile-account-details__name-input-container flex gap-2 items-center">
              <Input
                inputClassName="profile-account-details__name-input"
                labelClassName="profile-account-details__name-input-wrapper flex-1 min-w-0"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onFocus={handleFocus}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                placeholder="Enter your name"
              />
              {showButtons && (
                <div className="profile-account-details__name-buttons flex gap-2 flex-shrink-0">
                  <CTALinkOrButton
                    variant="primary"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="profile-account-details__name-save-button whitespace-nowrap"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </CTALinkOrButton>
                  <CTALinkOrButton
                    variant="secondary"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="profile-account-details__name-cancel-button"
                  >
                    Cancel
                  </CTALinkOrButton>
                </div>
              )}
            </div>
            {nameError && (
              <p className="profile-account-details__name-error text-red-600 text-size-sm mt-1">{nameError}</p>
            )}
          </div>
        </div>
        <P className="profile-account-details__email"><span className="font-bold">Email:</span> {user.email}</P>
      </div>
    </div>
  );
};

type ProfileCourseListProps = {
  enrolledCourses: {
    course: Course;
    courseRegistration: CourseRegistration;
  }[];
};

const ProfileCourseList: React.FC<ProfileCourseListProps> = ({ enrolledCourses }) => {
  return (
    <>
      <H3>Your courses</H3>
      {enrolledCourses.length === 0 && (
        <div className="profile-course-list__no-courses flex flex-col gap-4 container-lined bg-white p-8 mb-4">
          <P>You haven't started any courses yet</P>
          <CTALinkOrButton url={ROUTES.courses.url}>Join a course</CTALinkOrButton>
        </div>
      )}
      {enrolledCourses.length > 0 && (
        <>
          {enrolledCourses.map(({ course, courseRegistration }) => (
            <ProfileCourseCard
              key={courseRegistration.id}
              course={course}
              courseRegistration={courseRegistration}
            />
          ))}
          <CTALinkOrButton url={ROUTES.courses.url}>Join another course</CTALinkOrButton>
        </>
      )}
    </>
  );
};

type ProfileCourseCardProps = {
  course: typeof courseTable.pg.$inferSelect;
  courseRegistration: typeof courseRegistrationTable.pg.$inferSelect;
};

const ProfileCourseCard: React.FC<ProfileCourseCardProps> = ({ course, courseRegistration }) => {
  const isCompleted = !!courseRegistration.certificateId;
  const formattedCompletionDate = new Date(
    courseRegistration.certificateCreatedAt ? courseRegistration.certificateCreatedAt * 1000 : Date.now(),
  ).toLocaleDateString(undefined, { dateStyle: 'long' });

  return (
    <div className="container-lined overflow-hidden bg-white">
      {/* Status banner */}
      <div className={`px-6 py-3 text-sm flex items-center justify-between ${
        isCompleted ? 'bg-green-100 text-green-800' : 'bg-bluedot-lighter text-bluedot-dark'
      }`}
      >
        {isCompleted ? (
          <>
            <span className="flex gap-1.5 items-center uppercase"><FaCheck size={16} /> Completed</span>
            <span className="uppercase">{formattedCompletionDate}</span>
          </>
        ) : (
          <span className="flex gap-1.5 items-center uppercase"><FaClock size={16} /> In progress</span>
        )}
      </div>

      {/* Course details */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-4">
            <H2 className="text-size-lg">{course.title}</H2>

            {course.description && (
              <MarkdownExtendedRenderer className="text-gray-600 line-clamp-2">{course.description}</MarkdownExtendedRenderer>
            )}

            {/* Course metadata */}
            <div className="flex gap-2 items-center text-gray-500">
              <FaCubesStacked size={16} />
              <span>{course.units.length} {course.units.length === 1 ? 'unit' : 'units'}</span>
            </div>

            {isCompleted && (
            <div className="flex flex-col gap-2">
              <ClickTarget url={addQueryParam(ROUTES.certification.url, 'id', courseRegistration.certificateId!)} className="flex items-center text-bluedot-normal hover:text-bluedot-dark">
                <FaAward size={18} className="mr-2" />
                View your certificate
              </ClickTarget>
              <ClickTarget url={course.path} className="flex items-center text-bluedot-normal hover:text-bluedot-dark">
                <FaBookOpen size={18} className="mr-2" />
                Browse course materials
              </ClickTarget>
            </div>
            )}
          </div>

          {isCompleted && (
            <div className="bg-green-50 rounded-full p-3">
              <FaAward size={28} className="text-green-600" />
            </div>
          )}
        </div>

        {/* Sharing section */}
        {isCompleted && (
          <div className="mt-6 pt-6 pb-2 border-t border-color-divider flex flex-col gap-4">
            <P className="text-gray-600 flex items-center">
              <FaShare size={16} className="mr-2" />
              Share your achievement
            </P>
            <SocialShare
              coursePath={course.path}
              text={`🎉 I just completed the ${course.title} course from BlueDot Impact! It's free, self-paced, and packed with insights. Check it out and sign up with my link below:`}
            />
          </div>
        )}
      </div>

      {/* Continue learning button */}
      {!isCompleted && (
      <div className="bg-stone-50 p-6">
        <CTALinkOrButton url={course.path} variant="primary" className="w-full">
          Continue learning
        </CTALinkOrButton>
      </div>
      )}
    </div>
  );
};

export default ProfilePage;
