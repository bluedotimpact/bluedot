import { CTALinkOrButton, H3, P } from '@bluedot/ui';
import { type ReactNode } from 'react';
import { getCourseAccentColor } from '../../../lib/courseColors';
import { trpc } from '../../../utils/trpc';
import RoundGroup from '../../shared/RoundGroup';

export type ScheduleListSectionProps = {
  id?: string;
  title: string;
  intro?: ReactNode;
  courseSlug: string;
  applicationUrl: string;
  fallbackText?: ReactNode;
  fallbackCtaText?: string;
};

const ScheduleListSection = ({
  id,
  title,
  intro,
  courseSlug,
  applicationUrl,
  fallbackText = 'No rounds are open right now. Apply and we\'ll let you know when the next one opens.',
  fallbackCtaText = 'Apply now',
}: ScheduleListSectionProps) => {
  const { data: rounds, isLoading } = trpc.courseRounds.getRoundsForCourse.useQuery({ courseSlug });

  const intenseRounds = (rounds?.intense ?? []).filter((r) => r.numberOfUnits != null);
  const partTimeRounds = (rounds?.partTime ?? []).filter((r) => r.numberOfUnits != null);
  const hasRounds = intenseRounds.length > 0 || partTimeRounds.length > 0;

  const accentColor = getCourseAccentColor(courseSlug);

  return (
    <section id={id} className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 bd-md:px-8 bd-md:py-16 lg:px-spacing-x xl:py-24">
        <div className="w-full bd-md:max-w-text bd-md:mx-auto flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <H3>{title}</H3>
            {intro && <P>{intro}</P>}
          </div>

          {isLoading && (
            <div className="flex flex-col gap-3">
              <div className="h-16 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-16 w-full animate-pulse rounded bg-gray-200" />
            </div>
          )}

          {!isLoading && !hasRounds && (
            <div className="flex flex-col items-start gap-4">
              <P>{fallbackText}</P>
              {applicationUrl && (
                <CTALinkOrButton url={applicationUrl} target="_blank">
                  {fallbackCtaText}
                </CTALinkOrButton>
              )}
            </div>
          )}

          {!isLoading && hasRounds && (
            <div className="flex flex-col gap-16">
              {intenseRounds.length > 0 && (
                <RoundGroup
                  type="intensive"
                  rounds={intenseRounds}
                  applicationUrl={applicationUrl}
                  accentColor={accentColor}
                />
              )}
              {partTimeRounds.length > 0 && (
                <RoundGroup
                  type="part-time"
                  rounds={partTimeRounds}
                  applicationUrl={applicationUrl}
                  accentColor={accentColor}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ScheduleListSection;
