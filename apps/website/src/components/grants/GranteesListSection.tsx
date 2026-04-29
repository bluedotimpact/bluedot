import {
  CTALinkOrButton, ErrorSection, P, ProgressDots,
} from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import { useState } from 'react';
import type { AppRouter } from '../../server/routers/_app';
import { formatAmountUsd } from '../../lib/utils';
import { trpc } from '../../utils/trpc';
import { PageListGroup, PageListRow, pageSectionHeadingClass } from '../PageListRow';

type PublicRapidGrant = inferRouterOutputs<AppRouter>['grants']['getAllPublicRapidGrantees'][number];

const GranteeRow = ({ grantee }: { grantee: PublicRapidGrant }) => {
  const amount = grantee.amountUsd !== null ? formatAmountUsd(grantee.amountUsd) : null;
  const summary = [grantee.granteeName, amount, grantee.monthLabel, grantee.projectSummary]
    .filter(Boolean)
    .join(' · ');

  if (grantee.link) {
    return (
      <PageListRow
        href={grantee.link}
        external
        title={grantee.projectTitle}
        summary={summary}
        ctaLabel="View project"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 bd-md:flex-row bd-md:items-center bd-md:justify-between bd-md:gap-6">
      <div className="flex items-stretch gap-4 min-w-0 flex-1">
        <div className="w-1 flex-shrink-0 rounded-sm bg-bluedot-normal/30" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-[1.45] font-semibold text-bluedot-navy">
            {grantee.projectTitle}
          </p>
          {summary && (
            <p className="mt-1 text-[15px] leading-[1.6] text-bluedot-navy/62">
              {summary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

type GranteesListSectionProps = {
  id?: string;
  heading?: string;
  title?: string;
  subtitle?: string;
  limit?: number;
};

const GranteesListSection = ({
  id,
  heading,
  title,
  subtitle,
  limit,
}: GranteesListSectionProps) => {
  const { data: grantees, isLoading, error } = trpc.grants.getAllPublicRapidGrantees.useQuery();
  const [showAll, setShowAll] = useState(false);

  if (error) {
    return <ErrorSection error={error} />;
  }

  const shouldLimitResults = !!limit && !showAll;
  const visibleGrantees = shouldLimitResults
    ? grantees?.slice(0, limit)
    : grantees;
  const hasHiddenGrantees = !!limit && !!grantees && grantees.length > limit;
  const hiddenGranteeCount = hasHiddenGrantees && limit && grantees
    ? grantees.length - limit
    : 0;
  const showCollapsedPreview = hasHiddenGrantees && !showAll;

  return (
    <div
      id={id}
      className="w-full scroll-mt-28"
    >
      {heading && (
        <div className="mb-6 flex items-center justify-between gap-4">
          <h3 className={pageSectionHeadingClass}>{heading}</h3>
          {hasHiddenGrantees && showAll && (
            <CTALinkOrButton
              variant="secondary"
              onClick={() => setShowAll(false)}
              className="shrink-0"
            >
              Close
            </CTALinkOrButton>
          )}
        </div>
      )}
      {(title ?? subtitle) && (
        <div className="mb-8 bd-md:mb-10 max-w-[760px]">
          {title && (
            <h2 className="text-[28px] bd-md:text-[32px] xl:text-[36px] font-semibold leading-[125%] tracking-[-0.01em] text-bluedot-navy">
              {title}
            </h2>
          )}
          {subtitle && (
            <P className="text-size-sm bd-md:text-size-md leading-[160%] text-bluedot-navy/75 mt-4">
              {subtitle}
            </P>
          )}
        </div>
      )}

      {isLoading && <ProgressDots />}
      {!isLoading && (!grantees || grantees.length === 0) && (
        <P>No grants to show yet.</P>
      )}
      {!!visibleGrantees?.length && (
        <div>
          <PageListGroup>
            {visibleGrantees.map((grantee) => (
              <GranteeRow
                key={`${grantee.granteeName}-${grantee.projectTitle}`}
                grantee={grantee}
              />
            ))}
          </PageListGroup>

          {showCollapsedPreview && (
            <div className="mt-6 flex justify-center">
              <CTALinkOrButton
                variant="secondary"
                onClick={() => setShowAll(true)}
              >
                {`Show ${hiddenGranteeCount} more project${hiddenGranteeCount === 1 ? '' : 's'}`}
              </CTALinkOrButton>
            </div>
          )}
        </div>
      )}
      {hasHiddenGrantees && showAll && (
        <div className="mt-8 flex justify-center">
          <CTALinkOrButton
            variant="secondary"
            onClick={() => setShowAll(false)}
          >
            Show fewer projects
          </CTALinkOrButton>
        </div>
      )}
    </div>
  );
};

export default GranteesListSection;
