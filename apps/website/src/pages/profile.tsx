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
import { useState } from 'react';
import {
  FaCheck, FaClock, FaAward, FaBookOpen, FaShare,
  FaCubesStacked, FaPen,
} from 'react-icons/fa6';
import { GetUserResponse } from './api/users/me';
import { GetCourseRegistrationsResponse } from './api/course-registrations';
import { GetCoursesResponse } from './api/courses';
import { ROUTES } from '../lib/routes';
import { H2, H3, P } from '../components/Text';
import SocialShare from '../components/courses/SocialShare';
import { Course, CourseRegistration } from '../lib/api/db/tables';
import MarkdownExtendedRenderer from '../components/courses/MarkdownExtendedRenderer';
import CircleSpaceEmbed from '../components/courses/exercises/CircleSpaceEmbed';

const CURRENT_ROUTE = ROUTES.profile;

// Main ProfilePage Component - Contains all API logic
const ProfilePage = withAuth(({ auth }) => {
  // API calls
  const [{ data: userData, loading: userLoading, error: userError }, refetchUser] = useAxios<GetUserResponse>({
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

  // State for name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  // Name editing handlers
  const handleSave = async () => {
    const trimmedName = tempName.trim();
    
    // Check if name hasn't changed
    if (trimmedName === userData?.user.name) {
      setIsEditingName(false);
      return;
    }

    setIsSaving(true);
    setNameError('');

    try {
      await axios.patch(
        '/api/users/me',
        { name: trimmedName },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      // Refetch user data to update UI
      await refetchUser();
      setIsEditingName(false);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setNameError('Session expired. Please refresh the page and try again.');
      } else if (err.response?.status === 400) {
        setNameError(parseZodValidationError(err));
      } else {
        setNameError('Failed to update name. Please try again.');
      }
      console.error('Name update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempName(userData?.user.name || '');
    setIsEditingName(false);
    setNameError('');
  };

  const handleEditStart = () => {
    setTempName(userData?.user.name || '');
    setIsEditingName(true);
    setNameError('');
  };

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
                userName={userData.user.name}
                userEmail={userData.user.email}
                isEditingName={isEditingName}
                tempName={tempName}
                isSaving={isSaving}
                nameError={nameError}
                onEditStart={handleEditStart}
                onNameChange={setTempName}
                onSave={handleSave}
                onCancel={handleCancel}
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

// ProfileAccountDetails Component - Pure UI Component
type ProfileAccountDetailsProps = {
  userName: string;
  userEmail: string;
  isEditingName: boolean;
  tempName: string;
  isSaving: boolean;
  nameError: string;
  onEditStart: () => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

const ProfileAccountDetails: React.FC<ProfileAccountDetailsProps> = ({
  userName,
  userEmail,
  isEditingName,
  tempName,
  isSaving,
  nameError,
  onEditStart,
  onNameChange,
  onSave,
  onCancel,
}) => {
  return (
    <>
      <H3>Account details</H3>
      <div className="flex flex-col gap-4 container-lined bg-white p-8 h-fit">
        <div className="profile-name">
          {!isEditingName ? (
            <div 
              className="profile-name__display cursor-pointer hover:bg-gray-50 group p-2 -m-2 rounded-lg flex items-center justify-between"
              onClick={onEditStart}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onEditStart();
                }
              }}
            >
              <P><span className="font-bold">Name:</span> {userName || 'Not set'}</P>
              <FaPen size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ) : (
            <div className="profile-name--editing">
              <div className="flex flex-col gap-2">
                <P><span className="font-bold">Name:</span></P>
                <div className="flex gap-2 items-center">
                  <Input
                    inputClassName="profile-name__input"
                    labelClassName="flex-1 min-w-0"
                    value={tempName}
                    onChange={(e) => onNameChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSave();
                      if (e.key === 'Escape') onCancel();
                    }}
                    placeholder="Enter your name"
                    autoFocus
                  />
                  <div className="profile-name__buttons flex gap-2 flex-shrink-0">
                    <CTALinkOrButton
                      variant="primary"
                      onClick={onSave}
                      disabled={isSaving}
                      className="whitespace-nowrap"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </CTALinkOrButton>
                    <CTALinkOrButton
                      variant="secondary"
                      onClick={onCancel}
                      disabled={isSaving}
                    >
                      Cancel
                    </CTALinkOrButton>
                  </div>
                </div>
                {nameError && (
                  <p className="profile-name--error text-red-600 text-sm mt-1">{nameError}</p>
                )}
              </div>
            </div>
          )}
        </div>
        <P><span className="font-bold">Email:</span> {userEmail}</P>
      </div>
    </>
  );
};

// ProfileCourseList Component - Pure UI Component
type ProfileCourseListProps = {
  enrolledCourses: Array<{
    course: Course;
    courseRegistration: CourseRegistration;
  }>;
};

const ProfileCourseList: React.FC<ProfileCourseListProps> = ({ enrolledCourses }) => {
  return (
    <>
      <H3>Your courses</H3>
      {enrolledCourses.length === 0 && (
        <div className="profile__no-courses flex flex-col gap-4 container-lined bg-white p-8 mb-4">
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

// ProfileCourseCard Component
type ProfileCourseCardProps = {
  course: Course;
  courseRegistration: CourseRegistration;
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
              <ClickTarget url={addQueryParam(ROUTES.certification.url, 'id', courseRegistration.certificateId || '')} className="flex items-center text-bluedot-normal hover:text-bluedot-dark">
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

const parseZodValidationError = (err: any): string => {
  const errorString = err.response?.data?.error;
  if (typeof errorString === 'string' && errorString.startsWith('Invalid request body: ')) {
    try {
      // Extract the JSON array from the error string
      const jsonPart = errorString.replace('Invalid request body: ', '');
      const validationErrors = JSON.parse(jsonPart);
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        return validationErrors[0].message || 'Invalid name format';
      } else {
        return 'Invalid name format';
      }
    } catch {
      return 'Invalid name format';
    }
  } else {
    return errorString || 'Invalid name format';
  }
};

export default ProfilePage;
