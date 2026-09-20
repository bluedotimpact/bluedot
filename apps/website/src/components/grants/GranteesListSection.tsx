import {
  CTALinkOrButton, ErrorSection, H2, H3, P, ProgressDots,
} from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import { useState } from 'react';
import type { AppRouter } from '../../server/routers/_app';
import { formatAmountUsd } from '../../lib/utils';
import { trpc } from '../../utils/trpc';
import { PageListGroup, PageListRow } from '../PageListRow';

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
          <p className="text-size-sm leading-normal font-semibold text-bluedot-navy">
            {grantee.projectTitle}
          </p>
          {summary && (
            <p className="mt-1 text-size-sm leading-relaxed text-bluedot-navy/62">
              {summary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const EditorialGranteeRow = ({ grantee }: { grantee: PublicRapidGrant }) => (
  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 bd-md:gap-8">
    <div className="min-w-0">
      <h3 className="text-size-sm bd-md:text-size-md font-medium leading-snug tracking-tight break-words">
        {grantee.link ? (
          <a href={grantee.link} target="_blank" rel="noopener noreferrer" className="hover:text-bluedot-normal underline decoration-bluedot-navy/25 underline-offset-4 hover:decoration-bluedot-normal">
            {grantee.projectTitle}
          </a>
        ) : grantee.projectTitle}
      </h3>
      {grantee.projectSummary && <p className="mt-2 max-w-[760px] text-size-sm leading-relaxed text-secondary">{grantee.projectSummary}</p>}
      <p className="mt-2 text-size-xs text-secondary">{[grantee.granteeName, grantee.monthLabel].filter(Boolean).join(' · ')}</p>
    </div>
    {grantee.amountUsd !== null && <p className="text-size-sm bd-md:text-size-md font-medium tabular-nums whitespace-nowrap">{formatAmountUsd(grantee.amountUsd)}</p>}
  </div>
);

type GranteesListSectionProps = {
  id?: string;
  heading?: string;
  title?: string;
  subtitle?: string;
  limit?: number;
  layout?: 'default' | 'editorial';
};

const GranteesListSection = ({
  id,
  heading,
  title,
  subtitle,
  limit,
  layout = 'default',
}: GranteesListSectionProps) => {
  const { data: grantees, isLoading, error } = trpc.grants.getAllPublicRapidGrantees.useQuery();
  const [showAll, setShowAll] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');

  if (error) {
    return <ErrorSection error={error} />;
  }

  const shouldLimitResults = !!limit && !showAll;
  // Public records have no ID, and recipients can receive multiple grants for the same project.
  const granteeRows = grantees?.map((grantee, index) => ({ grantee, key: index }));
  const sortedGrantees = sortOrder === 'largest'
    ? granteeRows?.sort((a, b) => (b.grantee.amountUsd ?? -Infinity) - (a.grantee.amountUsd ?? -Infinity))
    : granteeRows;
  const visibleGrantees = shouldLimitResults
    ? sortedGrantees?.slice(0, limit)
    : sortedGrantees;
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
        <div className={layout === 'editorial' ? 'mb-8 flex flex-wrap items-center justify-between gap-4' : 'mb-6 flex items-center justify-between gap-4'}>
          {layout === 'editorial' ? (
            <h2 className="text-size-lg font-medium tracking-tight">{heading}</h2>
          ) : <H3>{heading}</H3>}
          {layout === 'editorial' && (
            <label className="ml-auto flex items-center gap-2 text-size-xs text-secondary shrink-0">
              Sort:
              <select
                aria-label="Sort projects"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="min-h-11 cursor-pointer rounded bg-transparent py-2 pr-1 text-size-xs text-bluedot-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-bluedot-normal"
              >
                <option value="newest">Newest</option>
                <option value="largest">Largest grant</option>
              </select>
            </label>
          )}
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
            <H2>
              {title}
            </H2>
          )}
          {subtitle && (
            <P className="bd-md:text-size-md leading-relaxed text-bluedot-navy/80 mt-4">
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
            {visibleGrantees.map(({ grantee, key }) => (
              layout === 'editorial' ? (
                <EditorialGranteeRow key={key} grantee={grantee} />
              ) : (
                <GranteeRow key={key} grantee={grantee} />
              )
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
