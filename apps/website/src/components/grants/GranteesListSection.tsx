import {
  cn, ErrorSection, P, ProgressDots,
} from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import {
  useEffect,
  useState,
} from 'react';
import { RiSearchLine } from 'react-icons/ri';
import type { AppRouter } from '../../server/routers/_app';
import { formatAmountUsd } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

type PublicGrant = inferRouterOutputs<AppRouter>['grants']['getAllPublicGrantees'][number];

const GranteeListItem = ({ grantee }: { grantee: PublicGrant }) => {
  const amount = grantee.amountUsd !== null ? formatAmountUsd(grantee.amountUsd) : null;
  const subtitle = grantee.granteeName;
  const Container = grantee.link ? 'a' : 'div';

  return (
    <Container
      {...(grantee.link
        ? {
          href: grantee.link,
          target: '_blank',
        } : {})}
      className={cn(
        'group block h-full rounded-[8px] border border-bluedot-navy/10 bg-white p-5',
        grantee.link && 'transition-colors hover:border-bluedot-navy/18 hover:bg-[#FBFCFE]',
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <h3 className="min-w-0 text-[20px] min-[680px]:text-[21px] font-semibold leading-[1.2] tracking-[-0.02em] text-bluedot-navy">
            {grantee.projectTitle}
          </h3>
          {amount && (
            <span className="shrink-0 rounded-[8px] border border-[#D7E4F5] bg-[#F4F8FD] px-2.5 py-1 text-[12px] font-semibold text-[#2A5FA8]">
              {amount}
            </span>
          )}
        </div>

        <div className="mt-3 min-w-0">
          <p className="text-[14px] min-[680px]:text-[15px] leading-[1.55] text-bluedot-navy/68">
            {subtitle}
          </p>
          {grantee.projectSummary && (
            <P className="mt-4 text-[15px] leading-[1.65] text-bluedot-navy/74">
              {grantee.projectSummary}
            </P>
          )}
        </div>

        {grantee.link && (
          <div className="mt-auto pt-5">
            <span className="inline-flex items-center gap-2 border-t border-bluedot-navy/10 pt-4 text-[14px] font-medium text-bluedot-navy/68 transition-colors group-hover:text-bluedot-navy">
              View project
              <span aria-hidden="true" className="text-[18px]">→</span>
            </span>
          </div>
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
  previewRows?: number;
};

const GranteesListSection = ({
  id,
  title,
  subtitle,
  limit,
  previewRows,
}: GranteesListSectionProps) => {
  const { data: grantees, isLoading, error } = trpc.grants.getAllPublicGrantees.useQuery();
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === 'undefined') {
      return 1120;
    }

    return window.innerWidth;
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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

  let previewColumns = 1;
  if (viewportWidth >= 1120) {
    previewColumns = 3;
  } else if (viewportWidth >= 680) {
    previewColumns = 2;
  }

  const previewLimit = previewRows
    ? previewRows * previewColumns
    : undefined;
  const effectiveLimit = previewLimit ?? limit;
  const shouldLimitResults = !!effectiveLimit && !showAll && !normalizedSearchTerm;
  const visibleGrantees = shouldLimitResults
    ? filteredGrantees?.slice(0, effectiveLimit)
    : filteredGrantees;
  const hasHiddenGrantees = !!effectiveLimit && !normalizedSearchTerm && !!filteredGrantees && filteredGrantees.length > effectiveLimit;
  const hiddenGranteeCount = hasHiddenGrantees && effectiveLimit && filteredGrantees
    ? filteredGrantees.length - effectiveLimit
    : 0;
  const showCollapsedPreview = hasHiddenGrantees && !showAll;

  return (
    <section
      id={id}
      className="w-full scroll-mt-28"
    >
      <div className="max-w-max-width mx-auto px-5 min-[680px]:px-8 lg:px-spacing-x pt-4 pb-8 min-[680px]:pt-6 min-[680px]:pb-10 min-[1280px]:pt-8 min-[1280px]:pb-12">
        <div className="max-w-[1120px] mx-auto">
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

            <label className="flex w-full min-[960px]:max-w-[340px] items-center gap-2 rounded-[8px] border border-bluedot-navy/12 bg-white px-3 py-2.5 font-sans">
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
            <div className={cn('relative', showCollapsedPreview && 'pb-20 min-[680px]:pb-24')}>
              <ul className="list-none grid gap-4 min-[680px]:grid-cols-2 min-[1120px]:grid-cols-3">
                {visibleGrantees.map((grantee) => (
                  <li key={`${grantee.granteeName}-${grantee.projectTitle}`} className="h-full">
                    <GranteeListItem grantee={grantee} />
                  </li>
                ))}
              </ul>

              {showCollapsedPreview && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-2 min-[680px]:pb-3">
                  <div className="absolute inset-x-0 bottom-0 h-28 min-[680px]:h-32 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.72)_34%,rgba(255,255,255,0.94)_62%,rgba(255,255,255,1)_100%)]" />
                  <div className="absolute inset-x-[12%] bottom-11 h-px bg-[linear-gradient(90deg,rgba(8,28,68,0)_0%,rgba(8,28,68,0.12)_18%,rgba(8,28,68,0.12)_82%,rgba(8,28,68,0)_100%)] min-[680px]:bottom-14" />
                  <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="pointer-events-auto relative inline-flex items-center gap-2 rounded-full border border-[#D7E4F5] bg-white/96 px-5 py-3 text-[14px] font-medium text-bluedot-navy shadow-[0_16px_40px_rgba(8,28,68,0.12)] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[#BED3EE] hover:shadow-[0_20px_44px_rgba(8,28,68,0.14)]"
                  >
                    <span aria-hidden="true" className="inline-flex size-6 items-center justify-center rounded-full bg-[#EEF5FD] text-[#2A5FA8]">
                      ↓
                    </span>
                    {`Show ${hiddenGranteeCount} more project${hiddenGranteeCount === 1 ? '' : 's'}`}
                  </button>
                </div>
              )}
            </div>
          )}
          {hasHiddenGrantees && showAll && (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-bluedot-navy/10 bg-white px-4 py-2.5 text-[14px] font-medium text-bluedot-navy transition-all hover:border-bluedot-navy/16 hover:bg-[#FBFCFE]"
            >
              Show fewer projects
              <span aria-hidden="true">↑</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default GranteesListSection;
