import {
  Breadcrumbs, ErrorSection, ProgressDots, Section, useAuthStore,
} from '@bluedot/ui';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { RiSearchLine } from 'react-icons/ri';
import { UserSearchModal } from '../../../components/admin/UserSearchModal';
import MarkdownExtendedRenderer from '../../../components/courses/MarkdownExtendedRenderer';
import { ROUTES } from '../../../lib/routes';
import { maskEmail } from '../../../lib/utils';
import type { UserExerciseResponseItem } from '../../../server/routers/admin';
import { trpc } from '../../../utils/trpc';

const CURRENT_ROUTE = ROUTES.adminUserExerciseResponses;
const PAGE_SIZE = 20;

type StatusFilter = 'all' | 'completed' | 'in-progress';

const PageChrome = ({ children }: { children: React.ReactNode }) => (
  <div>
    <Head>
      <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      <meta name="robots" content="noindex" />
    </Head>
    <Breadcrumbs route={CURRENT_ROUTE} />
    {children}
  </div>
);

const readUrlParam = (key: string): string => {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(key) ?? '';
};

const writeUrlParams = (changes: Record<string, string | undefined>) => {
  if (typeof window === 'undefined') return;
  // We bypass next/router here because `router.replace` updates `router.asPath`, which is used as
  // the `key` of an ErrorBoundary wrapping every page in `_app.tsx` — any URL change there fully
  // unmounts and remounts the page (losing input focus, local state, etc.). `history.replaceState`
  // keeps the URL shareable without disturbing Next.js router state.
  const params = new URLSearchParams(window.location.search);
  for (const [k, v] of Object.entries(changes)) {
    if (v && v.length > 0) params.set(k, v);
    else params.delete(k);
  }

  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
  window.history.replaceState(window.history.state, '', url);
};

const AdminUserExerciseResponses = () => {
  const router = useRouter();
  const auth = useAuthStore((s) => s.auth);
  const userId = typeof router.query.userId === 'string' ? router.query.userId : undefined;

  // Filter state lives in React, synced to the URL via history.replaceState (not router.replace).
  // Initial values are read from the URL once on mount. Matches the modal search semantics: every
  // keystroke fires a fresh query, loading dots show in the results area, no debounce.
  const [courseId, setCourseIdState] = useState<string | undefined>(undefined);
  const [status, setStatusState] = useState<StatusFilter>('completed');
  const [search, setSearchState] = useState<string>('');
  useEffect(() => {
    const initialSearch = readUrlParam('search');
    const initialCourseId = readUrlParam('courseId') || undefined;
    const rawStatus = readUrlParam('status');
    const initialStatus: StatusFilter = rawStatus === 'all' || rawStatus === 'in-progress' ? rawStatus : 'completed';
    setCourseIdState(initialCourseId);
    setStatusState(initialStatus);
    setSearchState(initialSearch);
  }, []);

  const setCourseId = (next: string | undefined) => {
    setCourseIdState(next);
    writeUrlParams({ courseId: next });
  };

  const setStatus = (next: StatusFilter) => {
    setStatusState(next);
    // Default is 'completed' — omit it from the URL so the URL stays clean.
    writeUrlParams({ status: next === 'completed' ? undefined : next });
  };

  const setSearch = (next: string) => {
    setSearchState(next);
    writeUrlParams({ search: next || undefined });
  };

  // Context (user identity + the courses they've responded in) is static for a given userId —
  // it does NOT depend on filters/search, so it's a separate query that doesn't refetch when those
  // change. This is what keeps the LHS aside stable.
  const contextQuery = trpc.admin.getUserExerciseResponseContext.useQuery(
    { userId: userId ?? '' },
    { enabled: !!userId && !!auth, retry: false },
  );

  const query = trpc.admin.getUserExerciseResponses.useInfiniteQuery(
    {
      userId: userId ?? '', courseId, status, search: search || undefined, limit: PAGE_SIZE,
    },
    {
      enabled: !!userId && !!auth,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialCursor: 0,
      retry: false,
    },
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
        query.fetchNextPage();
      }
    }, { rootMargin: '300px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query]);

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const user = contextQuery.data?.user;
  const courses = contextQuery.data?.courses ?? [];

  const [isSelectUserModalOpen, setIsSelectUserModalOpen] = useState(false);

  // Any auth-related or not-found state → redirect to /404 (cleaner than inline error panels).
  // Includes the "not logged in" case: after a short grace period for auth to hydrate, we redirect.
  const errorCode = contextQuery.error?.data?.code ?? query.error?.data?.code;
  const shouldShow404 = errorCode === 'UNAUTHORIZED' || errorCode === 'FORBIDDEN' || errorCode === 'NOT_FOUND';
  useEffect(() => {
    if (shouldShow404) router.replace('/404');
  }, [shouldShow404, router]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!useAuthStore.getState().auth) router.replace('/404');
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!userId || shouldShow404) {
    return <PageChrome><Section><ProgressDots className="py-8" /></Section></PageChrome>;
  }

  const renderResults = () => {
    if (query.error && !query.data) return <ErrorSection error={query.error} />;
    if (!query.data) return <ProgressDots className="py-8" />;
    if (items.length === 0) return <p className="text-bluedot-navy/60 py-8 text-center">No exercise responses match these filters.</p>;
    return (
      <ol className="flex flex-col gap-3">
        {items.map((item) => (
          <ResponseCard key={item.response.id} {...item} />
        ))}
      </ol>
    );
  };

  return (
    <PageChrome>
      <Section>
        <div className="flex flex-col md:flex-row gap-6">
          {/* LHS: identity + filters (always rendered once auth/userId are present) */}
          <aside className="md:w-64 shrink-0 flex flex-col gap-6">
            <div className="container-lined p-4 flex flex-col gap-1">
              {user ? (
                <>
                  <p className="font-semibold text-bluedot-navy break-words">{user.name || '(no name)'}</p>
                  <p className="text-size-xs text-bluedot-navy/70 break-words" title={user.email}>{maskEmail(user.email)}</p>
                  {user.lastSeenAt && (
                    <p className="text-size-xxs text-bluedot-navy/50 mt-1">Last seen: {new Date(user.lastSeenAt).toLocaleString()}</p>
                  )}
                </>
              ) : (
                <p className="text-size-xs text-bluedot-navy/50">Loading user...</p>
              )}
              <p className="text-size-xxs text-bluedot-navy/50">User ID: <code>{userId}</code></p>
              <button
                type="button"
                onClick={() => setIsSelectUserModalOpen(true)}
                className="self-start text-size-xxs text-bluedot-normal underline hover:opacity-80 cursor-pointer"
              >
                Select user
              </button>
            </div>

            <label className="flex items-center gap-2 text-size-xs cursor-pointer">
              <input
                type="checkbox"
                checked={status !== 'completed'}
                onChange={(e) => setStatus(e.target.checked ? 'all' : 'completed')}
              />
              Show in-progress
            </label>

            {courses.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-size-xs font-semibold text-bluedot-navy">Course</p>
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 text-size-xs cursor-pointer">
                    <input
                      type="radio"
                      name="course"
                      checked={!courseId}
                      onChange={() => setCourseId(undefined)}
                    />
                    All courses
                  </label>
                  {courses.map((c) => (
                    <label key={c.id ?? '__none__'} className="flex items-center gap-2 text-size-xs cursor-pointer">
                      <input
                        type="radio"
                        name="course"
                        checked={courseId === c.id}
                        onChange={() => setCourseId(c.id ?? undefined)}
                      />
                      {c.title ?? '(untitled)'}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main: search + results */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2">
              <RiSearchLine className="text-gray-400 shrink-0" size={15} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search question or response..."
                className="flex-1 outline-none text-size-xs placeholder:text-gray-400"
              />
            </div>

            {renderResults()}

            {items.length > 0 && (
              <div ref={sentinelRef} className="py-4 text-center text-size-xs text-bluedot-navy/50">
                {query.isFetchingNextPage && 'Loading...'}
                {!query.hasNextPage && 'End of responses'}
              </div>
            )}
          </div>
        </div>
      </Section>
      <UserSearchModal
        isOpen={isSelectUserModalOpen}
        onClose={() => setIsSelectUserModalOpen(false)}
        title="Select a user to view"
        onSelectUser={(id) => router.push(`/admin/exercises/${id}`)}
      />
    </PageChrome>
  );
};

const ResponseCard = ({
  response, exercise, unit, chunkPosition, exercisePosition,
}: UserExerciseResponseItem) => {
  const [expanded, setExpanded] = useState(false);
  const responseText = response.response ?? '';
  // Same truncation thresholds as the facilitator GroupResponses view.
  const canTruncate = responseText.length > 640 || responseText.split('\n').length > 8;

  return (
    <li className="container-lined p-4 flex flex-col gap-3">
      <header className="flex flex-wrap justify-between gap-2 text-size-xs">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="font-semibold text-bluedot-navy break-words">
            {exercise?.title ?? '(unknown exercise)'}
          </p>
          <p className="text-bluedot-navy/60 break-words">
            {unit?.courseSlug ? (
              <a
                href={`/courses/${unit.courseSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-bluedot-normal underline hover:opacity-80"
              >
                {unit.courseTitle}
              </a>
            ) : (
              unit?.courseTitle ?? '(unknown course)'
            )}
            {unit?.courseSlug && unit?.unitNumber ? (
              <>
                {' · '}
                <a
                  href={chunkPosition ? `/courses/${unit.courseSlug}/${unit.unitNumber}/${chunkPosition}` : `/courses/${unit.courseSlug}/${unit.unitNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bluedot-normal underline hover:opacity-80"
                >
                  Unit {unit.unitNumber}: {unit.title}
                  {chunkPosition && (
                    <>
                      , chunk {chunkPosition}
                      {exercisePosition && <>, exercise {exercisePosition}</>}
                    </>
                  )}
                </a>
              </>
            ) : unit && (
              <> · Unit {unit.unitNumber}: {unit.title}</>
            )}
          </p>
        </div>
        <p className="text-bluedot-navy/50 whitespace-nowrap">
          {response.completedAt ? (
            new Date(response.completedAt).toLocaleString()
          ) : (
            <span className="text-orange-700">
              In progress
              {response.createdAt && <> · started {new Date(response.createdAt).toLocaleString()}</>}
            </span>
          )}
        </p>
      </header>

      <div className="border-l-2 border-bluedot-lighter pl-4">
        <div className="relative">
          <div
            className="leading-relaxed"
            style={!expanded && canTruncate ? {
              display: '-webkit-box',
              WebkitLineClamp: 8,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            } : undefined}
          >
            <MarkdownExtendedRenderer>{responseText}</MarkdownExtendedRenderer>
          </div>
          {!expanded && canTruncate && (
            <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          )}
        </div>
        {canTruncate && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-size-xs text-bluedot-normal font-medium mt-2 cursor-pointer hover:underline"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </li>
  );
};

AdminUserExerciseResponses.mainShrinkToContent = true;

// Force server-rendering so Next.js wires up `router.query.userId` for the dynamic param.
// Without this, the page is statically auto-exported and `router.query` stays empty.
export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

export default AdminUserExerciseResponses;
