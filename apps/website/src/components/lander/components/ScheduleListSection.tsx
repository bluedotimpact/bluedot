import { CTALinkOrButton, P } from '@bluedot/ui';
import { type ReactNode } from 'react';
import { trpc } from '../../../utils/trpc';
import { PageListGroup, PageListRow, pageSectionHeadingClass } from '../../PageListRow';
import { buildRoundApplyUrl } from '../../shared/RoundItem';

export type ScheduleListSectionProps = {
  id?: string;
  title: string;
  intro?: ReactNode;
  courseSlug: string;
  applicationUrl: string;
  fallbackText?: ReactNode;
  fallbackCtaText?: string;
};

const groupLabelClass = 'text-[13px] font-semibold uppercase tracking-[0.08em] text-bluedot-navy/72';

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

  const intenseRounds = (rounds?.intense ?? []).filter((r) => r.numberOfUnits != null).slice(0, 3);
  const partTimeRounds = (rounds?.partTime ?? []).filter((r) => r.numberOfUnits != null).slice(0, 3);
  const hasRounds = intenseRounds.length > 0 || partTimeRounds.length > 0;

  const intenseLabel = intenseRounds[0]?.numberOfUnits != null
    ? `Intensive · ${intenseRounds[0].numberOfUnits} days · 5h/day`
    : 'Intensive';
  const partTimeLabel = partTimeRounds[0]?.numberOfUnits != null
    ? `Part-time · ${partTimeRounds[0].numberOfUnits} weeks · 5h/week`
    : 'Part-time';

  const buildSubtitle = (round: { applicationDeadlineDetailed?: string | null; applicationDeadline?: string | null }) => {
    if (round.applicationDeadlineDetailed) return `Applications close ${round.applicationDeadlineDetailed}`;
    if (round.applicationDeadline) return `Applications close ${round.applicationDeadline} at 23:59 UTC`;
    return 'Applications open';
  };

  return (
    <section id={id} className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 py-12 bd-md:px-8 bd-md:py-16 lg:px-spacing-x xl:py-24">
        <div className="w-full bd-md:max-w-[840px] bd-md:mx-auto flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h3 className={pageSectionHeadingClass}>{title}</h3>
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
            <div className="flex flex-col gap-8">
              {intenseRounds.length > 0 && (
                <div className="flex flex-col gap-4">
                  <p className={groupLabelClass}>{intenseLabel}</p>
                  <PageListGroup>
                    {intenseRounds.map((round) => (
                      <PageListRow
                        key={round.id}
                        href={buildRoundApplyUrl(applicationUrl, round.id)}
                        title={round.dateRange}
                        summary={buildSubtitle(round)}
                        ctaLabel="Apply now"
                        external
                      />
                    ))}
                  </PageListGroup>
                </div>
              )}
              {partTimeRounds.length > 0 && (
                <div className="flex flex-col gap-4">
                  <p className={groupLabelClass}>{partTimeLabel}</p>
                  <PageListGroup>
                    {partTimeRounds.map((round) => (
                      <PageListRow
                        key={round.id}
                        href={buildRoundApplyUrl(applicationUrl, round.id)}
                        title={round.dateRange}
                        summary={buildSubtitle(round)}
                        ctaLabel="Apply now"
                        external
                      />
                    ))}
                  </PageListGroup>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ScheduleListSection;
