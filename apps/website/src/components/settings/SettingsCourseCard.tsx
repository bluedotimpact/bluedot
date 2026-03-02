import type React from 'react';
import {
  FaCheck, FaClock, FaAward, FaBookOpen, FaShare,
  FaCubesStacked,
} from 'react-icons/fa6';
import {
  addQueryParam,
  ClickTarget,
  CTALinkOrButton,
  H2,
  P,
  useCurrentTimeMs,
} from '@bluedot/ui';
import { type courseRegistrationTable, type courseTable } from '@bluedot/db';
import { ROUTES } from '../../lib/routes';
import SocialShare from '../courses/SocialShare';
import MarkdownExtendedRenderer from '../courses/MarkdownExtendedRenderer';

type SettingsCourseCardProps = {
  course: typeof courseTable.pg.$inferSelect;
  courseRegistration: typeof courseRegistrationTable.pg.$inferSelect;
};

const SettingsCourseCard: React.FC<SettingsCourseCardProps> = ({ course, courseRegistration }) => {
  const currentTimeMs = useCurrentTimeMs();
  const isCompleted = !!courseRegistration.certificateId;
  const formattedCompletionDate = new Date(courseRegistration.certificateCreatedAt ? courseRegistration.certificateCreatedAt * 1000 : currentTimeMs).toLocaleDateString(undefined, { dateStyle: 'long' });

  return (
    <div
      className="container-lined overflow-hidden bg-white"
      aria-label={`Course card for ${course.title}`}
    >
      {/* Status banner */}
      <div
        className={`px-6 py-3 text-sm flex items-center justify-between ${
          isCompleted ? 'bg-green-100 text-green-800' : 'bg-bluedot-lighter text-bluedot-dark'
        }`}
        role="status"
        aria-label={isCompleted ? `Course completed on ${formattedCompletionDate}` : 'Course in progress'}
      >
        {isCompleted ? (
          <>
            <span className="flex gap-1.5 items-center uppercase"><FaCheck size={16} aria-hidden="true" /> Completed</span>
            <span className="uppercase">{formattedCompletionDate}</span>
          </>
        ) : (
          <span className="flex gap-1.5 items-center uppercase"><FaClock size={16} aria-hidden="true" /> In progress</span>
        )}
      </div>

      {/* Course details */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-4">
            <H2 className="text-size-lg">{course.title}</H2>

            {course.description && (
              <MarkdownExtendedRenderer
                className="text-gray-600 line-clamp-2"
                aria-describedby={`course-title-${course.id}`}
              >
                {course.description}
              </MarkdownExtendedRenderer>
            )}

            {/* Course metadata */}
            <div className="flex gap-2 items-center text-gray-500" aria-label={`Course contains ${(course.units ?? []).length} ${(course.units ?? []).length === 1 ? 'unit' : 'units'}`}>
              <FaCubesStacked size={16} aria-hidden="true" />
              <span>{(course.units ?? []).length} {(course.units ?? []).length === 1 ? 'unit' : 'units'}</span>
            </div>

            {isCompleted && (
              <div className="flex flex-col gap-2" role="navigation" aria-label="Course completion actions">
                <ClickTarget
                  url={addQueryParam(ROUTES.certification.url, 'id', courseRegistration.certificateId!)}
                  className="flex items-center text-bluedot-normal hover:text-bluedot-dark"
                  aria-label="View your certificate for this completed course"
                >
                  <FaAward size={18} className="mr-2" aria-hidden="true" />
                  View your certificate
                </ClickTarget>
                <ClickTarget
                  url={course.path ?? undefined}
                  className="flex items-center text-bluedot-normal hover:text-bluedot-dark"
                  aria-label="Browse course materials for this completed course"
                >
                  <FaBookOpen size={18} className="mr-2" aria-hidden="true" />
                  Browse course materials
                </ClickTarget>
              </div>
            )}
          </div>

          {isCompleted && (
            <div className="bg-green-50 rounded-full p-3" aria-label="Completion badge">
              <FaAward size={28} className="text-green-600" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Sharing section */}
        {isCompleted && (
          <div className="mt-6 pt-6 pb-2 border-t border-color-divider flex flex-col gap-4" aria-label="Share achievement section">
            <P className="text-gray-600 flex items-center">
              <FaShare size={16} className="mr-2" aria-hidden="true" />
              Share your achievement
            </P>
            <SocialShare
              coursePath={course.path ?? ''}
              text={`🎉 I just completed the ${course.title} course from BlueDot Impact! It's free, self-paced, and packed with insights. Check it out and sign up with my link below:`}
              aria-label="Social media sharing options"
            />
          </div>
        )}
      </div>

      {/* Continue learning button */}
      {!isCompleted && (
        <div className="bg-stone-50 p-6">
          <CTALinkOrButton
            url={course.path ?? undefined}
            variant="primary"
            className="w-full"
            aria-label={`Continue learning ${course.title}`}
          >
            Continue learning
          </CTALinkOrButton>
        </div>
      )}
    </div>
  );
};

export default SettingsCourseCard;
