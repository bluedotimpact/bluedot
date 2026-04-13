import {
  addQueryParam, cn, ProgressDots, useLatestUtmParams,
} from '@bluedot/ui';
import { COURSE_CONFIG } from '../../lib/constants';
import { appendPosthogSessionIdPrefill } from '../../lib/appendPosthogSessionIdPrefill';
import { trpc } from '../../utils/trpc';
import RoundGroup from '../shared/RoundGroup';
import Congratulations from './Congratulations';
import { CourseIcon } from './CourseIcon';

type CourseCompletionSectionProps = {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  className?: string;
};

// eslint-disable-next-line react/function-component-definition
export default function CourseCompletionSection({
  courseId,
  courseTitle,
  courseSlug,
  className,
}: CourseCompletionSectionProps) {
  const { latestUtmParams } = useLatestUtmParams();

  const { data: applyCTAProps, isLoading: isApplyCTALoading } = trpc.courseRounds.getApplyCTAProps.useQuery({
    courseSlug,
  });

  const shouldFetchRounds = Boolean(applyCTAProps) && !applyCTAProps?.hasApplied;

  const { data: roundsData, isLoading: isRoundsLoading } = trpc.courseRounds.getRoundsForCourse.useQuery(
    { courseSlug },
    { enabled: shouldFetchRounds },
  );

  const isLoading = isApplyCTALoading || (shouldFetchRounds && (isRoundsLoading || !roundsData));
  const hasRounds = Boolean(roundsData && (roundsData.intense.length > 0 || roundsData.partTime.length > 0));
  const showEnrollmentCTA = shouldFetchRounds && !isRoundsLoading && hasRounds && applyCTAProps && roundsData;

  if (isLoading) {
    return (
      <div className={className}>
        <ProgressDots />
      </div>
    );
  }

  if (showEnrollmentCTA) {
    const applicationUrlWithUtm = appendPosthogSessionIdPrefill(latestUtmParams.utm_source
      ? addQueryParam(applyCTAProps.applicationUrl, 'prefill_Source', latestUtmParams.utm_source)
      : applyCTAProps.applicationUrl);

    return (
      <div className={className}>
        <div className="container-lined bg-white p-6">
          <div className="flex flex-col gap-4 pb-6 min-[680px]:flex-row min-[680px]:items-center">
            <CourseIcon courseSlug={courseSlug} size="xlarge" className="rounded-[12px]" />
            <div>
              <h2 className="text-bluedot-navy text-[24px] leading-[1.4] font-semibold tracking-[-0.5px]">
                {courseTitle}
              </h2>
              <p className="text-[16px]">Enroll today to receive your certificate</p>
            </div>
          </div>

          {roundsData.intense.length > 0 && (
            <RoundGroup
              type="intensive"
              rounds={roundsData.intense}
              applicationUrl={applicationUrlWithUtm}
              accentColor={COURSE_CONFIG[courseSlug]?.accentColor}
            />
          )}

          {roundsData.partTime.length > 0 && (
            <div className={cn(roundsData.intense.length > 0 && 'mt-6')}>
              <RoundGroup
                type="part-time"
                rounds={roundsData.partTime}
                applicationUrl={applicationUrlWithUtm}
                accentColor={COURSE_CONFIG[courseSlug]?.accentColor}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Congratulations courseTitle={courseTitle} coursePath={`/courses/${courseSlug}`} courseSlug={courseSlug} courseId={courseId} />
    </div>
  );
}
