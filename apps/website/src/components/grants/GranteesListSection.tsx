import {
  CTALinkOrButton, ErrorSection, P, ProgressDots,
} from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import { useState } from 'react';
import { RiSearchLine } from 'react-icons/ri';
import type { AppRouter } from '../../server/routers/_app';
import { formatAmountUsd } from '../../lib/utils';
import { trpc } from '../../utils/trpc';
import { PageListGroup, PageListRow } from '../PageListRow';

type PublicRapidGrant = inferRouterOutputs<AppRouter>['grants']['getAllPublicRapidGrantees'][number];

const GranteeRow = ({ grantee }: { grantee: PublicRapidGrant }) => {
  const amount = grantee.amountUsd !== null ? formatAmountUsd(grantee.amountUsd) : null;
  const summary = [grantee.granteeName, amount, grantee.projectSummary]
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
    <div className="flex flex-col gap-3 min-[680px]:flex-row min-[680px]:items-center min-[680px]:justify-between min-[680px]:gap-6">
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
  title?: string;
  subtitle?: string;
  limit?: number;
};

const GranteesListSection = ({
  id,
  title,
  subtitle,
  limit,
}: GranteesListSectionProps) => {
  const { data: grantees, isLoading, error } = trpc.grants.getAllPublicRapidGrantees.useQuery();
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  if (error) {
    return <ErrorSection error={error} />;
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredGrantees = grantees?.filter((grantee) => {
    if (!normalizedSearchTerm) {
      return true;
    }

    const searchableText = [
      grantee.projectTitle,
      grantee.granteeName,
      grantee.projectSummary ?? '',
    ].join(' ').toLowerCase();

    return searchableText.includes(normalizedSearchTerm);
  });

  const shouldLimitResults = !!limit && !showAll && !normalizedSearchTerm;
  const visibleGrantees = shouldLimitResults
    ? filteredGrantees?.slice(0, limit)
    : filteredGrantees;
  const hasHiddenGrantees = !!limit && !normalizedSearchTerm && !!filteredGrantees && filteredGrantees.length > limit;
  const hiddenGranteeCount = hasHiddenGrantees && limit && filteredGrantees
    ? filteredGrantees.length - limit
    : 0;
  const showCollapsedPreview = hasHiddenGrantees && !showAll;

  return (
    <div
      id={id}
      className="w-full scroll-mt-28"
    >
      <div>
        <div className="mb-8 min-[680px]:mb-10 flex flex-col gap-5 min-[960px]:flex-row min-[960px]:items-end min-[960px]:justify-between">
          {(title ?? subtitle) && (
            <div className="max-w-[760px]">
              {title && (
                <h2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] tracking-[-0.01em] text-bluedot-navy">
                  {title}
                </h2>
              )}
              {subtitle && (
                <P className="text-[16px] min-[680px]:text-[18px] leading-[160%] text-bluedot-navy/75 mt-4">
                  {subtitle}
                </P>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 min-[680px]:flex-row min-[680px]:items-center min-[680px]:gap-4 min-[960px]:max-w-[unset]">
            <label className="flex w-full min-[960px]:w-[340px] items-center gap-2 rounded-[8px] border border-bluedot-navy/12 bg-white px-3 py-2.5 font-sans">
              <RiSearchLine className="shrink-0 text-bluedot-navy/40" size={18} />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects or grantees"
                className="w-full border-0 bg-transparent font-sans text-[15px] text-bluedot-navy outline-none placeholder:text-bluedot-navy/42"
                aria-label="Search projects or grantees"
              />
            </label>
            {hasHiddenGrantees && showAll && (
              <CTALinkOrButton
                variant="secondary"
                onClick={() => setShowAll(false)}
              >
                Show fewer projects
              </CTALinkOrButton>
            )}
          </div>
        </div>

        {isLoading && <ProgressDots />}
        {!isLoading && (!grantees || grantees.length === 0) && (
          <P>No grants to show yet.</P>
        )}
        {!isLoading && !!grantees?.length && normalizedSearchTerm && (
          <P className="mb-5 text-[14px] text-bluedot-navy/62">
            {filteredGrantees?.length ?? 0} result{filteredGrantees?.length === 1 ? '' : 's'} for &quot;{searchTerm.trim()}&quot;
          </P>
        )}
        {!isLoading && !!grantees?.length && normalizedSearchTerm && filteredGrantees?.length === 0 && (
          <div className="rounded-[8px] border border-bluedot-navy/10 bg-white px-5 py-6">
            <P>No projects match that search yet.</P>
          </div>
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
          <div className="mt-8">
            <CTALinkOrButton
              variant="secondary"
              onClick={() => setShowAll(false)}
            >
              Show fewer projects
            </CTALinkOrButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default GranteesListSection;
