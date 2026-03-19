import {
  cn, ErrorSection, P, ProgressDots,
} from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import { useState } from 'react';
import type { AppRouter } from '../../server/routers/_app';
import { formatAmountUsd } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

type PublicGrant = inferRouterOutputs<AppRouter>['grants']['getAllPublicGrantees'][number];

const GranteeListItem = ({ grantee }: { grantee: PublicGrant }) => {
  const amount = grantee.amountUsd !== null ? formatAmountUsd(grantee.amountUsd) : null;
  const subtitle = amount ? `${grantee.granteeName} • ${amount}` : grantee.granteeName;
  const Container = grantee.link ? 'a' : 'div';

  return (
    <Container
      {...(grantee.link
        ? {
          href: grantee.link,
          target: '_blank',
        } : {})}
      className={cn(
        'group block rounded-[24px] border border-bluedot-navy/10 bg-white px-6 py-6 min-[680px]:px-8',
        grantee.link && 'transition-colors hover:border-bluedot-navy/18 hover:bg-white/90',
      )}
    >
      <div className="flex flex-col gap-4 min-[960px]:flex-row min-[960px]:items-start min-[960px]:justify-between min-[960px]:gap-8">
        <div className="min-w-0 max-w-[920px]">
          <h3 className="text-[20px] min-[680px]:text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-bluedot-navy">
            {grantee.projectTitle}
          </h3>
          <p className="mt-2 text-[15px] min-[680px]:text-[16px] leading-[1.55] text-bluedot-navy/72">
            {subtitle}
          </p>
          {grantee.projectSummary && (
            <P className="mt-4 max-w-[880px] text-[15px] min-[680px]:text-[16px] leading-[1.65] text-bluedot-navy/74">
              {grantee.projectSummary}
            </P>
          )}
        </div>

        {grantee.link && (
          <span className="inline-flex shrink-0 items-center gap-2 text-[14px] font-medium text-bluedot-navy/68 transition-colors group-hover:text-bluedot-navy min-[960px]:pt-1">
            View project
            <span aria-hidden="true" className="text-[18px]">→</span>
          </span>
        )}
      </div>
    </Container>
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
  title = 'Featured grantees',
  subtitle = 'Projects we have backed through rapid small grants.',
  limit,
}: GranteesListSectionProps) => {
  const { data: grantees, isLoading, error } = trpc.grants.getAllPublicGrantees.useQuery();
  const [showAll, setShowAll] = useState(false);

  if (error) {
    return <ErrorSection error={error} />;
  }

  const visibleGrantees = limit && !showAll
    ? grantees?.slice(0, limit)
    : grantees;
  const hasHiddenGrantees = !!limit && !!grantees && grantees.length > limit;

  return (
    <section
      id={id}
      className="w-full scroll-mt-28"
    >
      <div className="max-w-max-width mx-auto px-5 min-[680px]:px-8 lg:px-spacing-x py-8 min-[680px]:py-10 min-[1280px]:py-12">
        <div className="max-w-[1120px] mx-auto">
          <div className="mb-8 min-[680px]:mb-10 max-w-[760px]">
            <h2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] tracking-[-0.01em] text-bluedot-navy">
              {title}
            </h2>
            {subtitle && (
              <P className="text-[16px] min-[680px]:text-[18px] leading-[160%] text-bluedot-navy/75 mt-4">
                {subtitle}
              </P>
            )}
          </div>

          {isLoading && <ProgressDots />}
          {!isLoading && (!grantees || grantees.length === 0) && (
            <P>No grants to show yet.</P>
          )}
          {!!visibleGrantees?.length && (
            <ul className="list-none flex flex-col gap-4 min-[680px]:gap-5">
              {visibleGrantees.map((grantee) => (
                <li key={`${grantee.granteeName}-${grantee.projectTitle}`}>
                  <GranteeListItem grantee={grantee} />
                </li>
              ))}
            </ul>
          )}
          {hasHiddenGrantees && (
            <button
              type="button"
              onClick={() => setShowAll((previousValue) => !previousValue)}
              className="mt-8 inline-flex items-center gap-2 text-[14px] font-medium text-bluedot-navy transition-colors hover:text-[#0A2358]"
            >
              {showAll ? 'Show fewer grantees' : `Show all ${grantees?.length ?? 0} public grants`}
              <span aria-hidden="true">{showAll ? '↑' : '→'}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default GranteesListSection;
