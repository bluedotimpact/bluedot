import {
  addQueryParam, cn, Collapsible, H2, P, ProgressDots, useLatestUtmParams,
} from '@bluedot/ui';
import { COURSE_CONFIG } from '../../lib/constants';
import { appendPosthogSessionIdPrefill } from '../../lib/appendPosthogSessionIdPrefill';
import { COURSE_INFORMATION_DETAILS } from '../../lib/courseInformationDetails';
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

// TODO: replace with a real fetched count once the metric is available.
const COMMUNITY_SIZE_LABEL = '2,847 professionals';

const AVATAR_IMAGES = [
  '/images/graduates/adam.webp',
  '/images/graduates/ana.webp',
  '/images/graduates/belle.webp',
  '/images/graduates/cameron.webp',
  '/images/graduates/chiara.webp',
];

const SocialProof = () => (
  <div className="flex items-center gap-3">
    <div className="flex -space-x-2">
      {AVATAR_IMAGES.map((src) => (
        <img
          key={src}
          src={src}
          alt=""
          className="size-7 rounded-full object-cover ring-2 ring-white"
        />
      ))}
    </div>
    <p className="text-[14px] leading-[1.4] text-bluedot-navy">
      <span className="font-semibold text-bluedot-normal">{COMMUNITY_SIZE_LABEL}</span>
      {' '}have joined a facilitated cohort
    </p>
  </div>
);

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

    const info = COURSE_INFORMATION_DETAILS[courseSlug];
    const accentColor = info?.accentColor ?? COURSE_CONFIG[courseSlug]?.accentColor;
    // Schedule is rendered as separate RoundGroup blocks below — drop the schedule
    // entry from details so it doesn't duplicate inside the accordion.
    const detailsWithoutSchedule = info?.details.filter((d) => !d.isSchedule) ?? [];

    return (
      <div className={cn('flex flex-col gap-12', className)}>
        <div className="flex flex-col items-center gap-8 pt-24 pb-8 text-center max-w-[640px] mx-auto">
          <CourseIcon courseSlug={courseSlug} size="xlarge" className="rounded-[12px] shadow-md" />
          <div className="flex flex-col gap-3">
            <H2 className="font-bold text-[28px] md:text-[32px] leading-[1.3] tracking-[-0.015em] text-bluedot-navy">
              Join a facilitated cohort to get certified
            </H2>
            <P className="text-[16px] leading-[1.6] tracking-[-0.002em] text-bluedot-navy">
              Take part in facilitated discussions with a small group, work on projects, and earn your certificate.
            </P>
          </div>
          <SocialProof />
        <div className="container-lined bg-white p-6">
          {roundsData.intense.length > 0 && (
            <RoundGroup
              type="intensive"
              rounds={roundsData.intense}
              applicationUrl={applicationUrlWithUtm}
              accentColor={accentColor}
            />
          )}

          {roundsData.partTime.length > 0 && (
            <div className={cn(roundsData.intense.length > 0 && 'mt-6')}>
              <RoundGroup
                type="part-time"
                rounds={roundsData.partTime}
                applicationUrl={applicationUrlWithUtm}
                accentColor={accentColor}
              />
            </div>
          )}
        </div>

        {detailsWithoutSchedule.length > 0 && (
          <div className="container-lined bg-white px-6">
            <Collapsible title={info?.title ?? 'How the course works'} className="border-b-0">
              <div className="flex flex-col gap-4">
                {detailsWithoutSchedule.map((detail) => (
                  <div key={detail.label} className="flex flex-col md:flex-row md:items-start gap-2 md:gap-8">
                    <div className="md:w-[160px] shrink-0 flex items-center gap-2">
                      <detail.icon className="size-5 text-bluedot-navy/70" />
                      <P className="text-[16px] font-semibold leading-[125%] text-bluedot-navy">
                        {detail.label}
                      </P>
                    </div>
                    <div className="flex-1 min-w-0">
                      <P className="text-[15px] leading-[160%] text-bluedot-navy/80 font-normal">
                        {detail.description}
                      </P>
                    </div>
                  </div>
                ))}
              </div>
            </Collapsible>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <Congratulations courseTitle={courseTitle} coursePath={`/courses/${courseSlug}`} courseSlug={courseSlug} courseId={courseId} />
    </div>
  );
}
