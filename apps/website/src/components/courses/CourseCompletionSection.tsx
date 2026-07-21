import {
  cn, Collapsible, H2, P, ProgressDots, useLatestUtmParams,
} from '@bluedot/ui';
import type { IconType } from 'react-icons';
import { PiCertificate, PiChalkboardTeacher, PiUsersThree } from 'react-icons/pi';
import { COURSE_CONFIG } from '../../lib/constants';
import { buildApplicationUrl } from '../../lib/utils';
import { COURSE_INFORMATION_DETAILS } from '../../lib/courseInformationDetails';
import { trpc } from '../../utils/trpc';
import RoundGroup from '../shared/RoundGroup';
import Congratulations from './Congratulations';

type CourseCompletionSectionProps = {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  className?: string;
};

const COMMUNITY_SIZE_LABEL = '8,000+ professionals';

const AVATAR_IMAGES = [
  '/images/graduates/adam.webp',
  '/images/graduates/ana.webp',
  '/images/graduates/belle.webp',
  '/images/graduates/cameron.webp',
  '/images/graduates/chiara.webp',
];

type FeatureCard = {
  icon: IconType;
  title: string;
  description: string;
};

const FEATURE_CARDS: FeatureCard[] = [
  {
    icon: PiUsersThree,
    title: 'Access community',
    description: 'Connect with a global network of peers across policy, research, engineering, and governance.',
  },
  {
    icon: PiChalkboardTeacher,
    title: 'Discuss with experts',
    description: 'Every course is led by an expert actively working in the field.',
  },
  {
    icon: PiCertificate,
    title: 'Earn a certificate',
    description: 'Earn a shareable certificate as your professional credential.',
  },
];

const FeatureCardItem = ({ card, accentColor }: { card: FeatureCard; accentColor?: string }) => (
  <div className="container-lined flex-1 bg-white p-5 flex flex-col gap-2 text-left">
    <div className="flex items-center gap-2">
      <card.icon className="size-5" style={{ color: accentColor }} />
      <p className="text-size-sm font-semibold leading-normal text-bluedot-navy">{card.title}</p>
    </div>
    <P className="text-size-sm leading-relaxed text-bluedot-navy/70">{card.description}</P>
  </div>
);

const SocialProof = ({ accentColor }: { accentColor?: string }) => (
  <div
    className="inline-flex flex-col items-center gap-3 rounded-[24px] px-4 py-3 max-w-full sm:flex-row sm:rounded-full sm:py-2"
    // 8-digit hex (#RRGGBBAA) — `1F` ≈ 12% opacity tint of the course accent.
    style={{ backgroundColor: accentColor ? `${accentColor}1F` : undefined }}
  >
    <div className="flex -space-x-2 shrink-0">
      {AVATAR_IMAGES.map((src) => (
        <img
          key={src}
          src={src}
          alt=""
          className="size-6 rounded-full object-cover ring-2 ring-white"
        />
      ))}
    </div>
    <p className="text-size-xs leading-normal text-bluedot-navy text-center sm:text-left">
      Join{' '}
      <span className="font-semibold" style={{ color: accentColor }}>{COMMUNITY_SIZE_LABEL}</span>
      {' '}already enrolled
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

  const { data: application, isLoading: isApplicationLoading } = trpc.courseRounds.getCourseApplication.useQuery({
    courseSlug,
  });

  const shouldFetchRounds = Boolean(application) && !application?.hasApplied;

  const { data: roundsData, isLoading: isRoundsLoading } = trpc.courseRounds.getRoundsForCourse.useQuery(
    { courseSlug },
    { enabled: shouldFetchRounds },
  );

  const isLoading = isApplicationLoading || (shouldFetchRounds && (isRoundsLoading || !roundsData));
  const hasRounds = Boolean(roundsData && (roundsData.intense.length > 0 || roundsData.partTime.length > 0));
  const showEnrollmentCTA = shouldFetchRounds && !isRoundsLoading && hasRounds && application && roundsData;

  if (isLoading) {
    return (
      <div className={className}>
        <ProgressDots />
      </div>
    );
  }

  if (showEnrollmentCTA) {
    const applicationUrlWithUtm = buildApplicationUrl(application.applicationUrl, latestUtmParams.utm_source);

    const info = COURSE_INFORMATION_DETAILS[courseSlug];
    const accentColor = COURSE_CONFIG[courseSlug]?.accentColor;
    // Schedule is rendered as separate RoundGroup blocks below — drop the schedule
    // entry from details so it doesn't duplicate inside the accordion.
    const detailsWithoutSchedule = info?.details.filter((d) => !d.isSchedule) ?? [];

    return (
      <div className={cn('flex flex-col gap-8', className)}>
        <div className="flex flex-col items-center gap-8 py-4 text-center max-w-[640px] mx-auto">
          <SocialProof accentColor={accentColor} />
          <div className="flex flex-col gap-3">
            {/* eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size */}
            <H2 className="text-[28px] md:text-[32px]">
              Join the next {courseTitle} cohort
            </H2>
            <P className="text-size-sm leading-relaxed text-bluedot-navy">
              Learn alongside field experts and leave with a clear next step.
            </P>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 max-w-text w-full mx-auto">
          {FEATURE_CARDS.map((card) => (
            <FeatureCardItem key={card.title} card={card} accentColor={accentColor} />
          ))}
        </div>

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
              <div className="flex flex-col">
                {detailsWithoutSchedule.map((detail) => (
                  <div
                    key={detail.label}
                    className="flex flex-col md:flex-row md:items-start gap-2 md:gap-8 py-5 border-t border-bluedot-navy/10"
                  >
                    <div className="md:w-[160px] shrink-0">
                      <P className="text-size-sm font-semibold leading-snug text-bluedot-navy">
                        {detail.label}
                      </P>
                    </div>
                    <div className="flex-1 min-w-0">
                      <P className="text-size-sm leading-relaxed text-bluedot-navy/80 font-normal">
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
