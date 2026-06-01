import {
  Breadcrumbs, ErrorSection, ProgressDots, Section, useAuthStore,
} from '@bluedot/ui';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import MarketingHero from '../../../components/MarketingHero';
import MarkdownExtendedRenderer from '../../../components/courses/MarkdownExtendedRenderer';
import { ROUTES } from '../../../lib/routes';
import type { UserExerciseResponseItem } from '../../../server/routers/admin';
import { trpc } from '../../../utils/trpc';

const CURRENT_ROUTE = ROUTES.adminUserExerciseResponses;
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

type StatusFilter = 'all' | 'completed' | 'in-progress';

const PageChrome = ({ children }: { children: React.ReactNode }) => (
  <div>
    <Head>
      <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      <meta name="robots" content="noindex" />
    </Head>
    <MarketingHero title={CURRENT_ROUTE.title} subtitle="Read-only admin view of a user's exercise responses across all courses." />
    <Breadcrumbs route={CURRENT_ROUTE} />
    {children}
  </div>
);

const AdminUserExerciseResponses = () => {
  const router = useRouter();
  const auth = useAuthStore((s) => s.auth);
  const userId = typeof router.query.userId === 'string' ? router.query.userId : undefined;
  const courseId = typeof router.query.courseId === 'string' ? router.query.courseId : undefined;
  const status: StatusFilter = router.query.status === 'completed' || router.query.status === 'in-progress' ? router.query.status : 'all';
  const urlSearch = typeof router.query.search === 'string' ? router.query.search : '';

  const updateQuery = useCallback((changes: Record<string, string | undefined>) => {
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries({ ...router.query, ...changes })) {
      if (typeof v === 'string' && v.length > 0) next[k] = v;
    }

    router.replace({ pathname: router.pathname, query: next }, undefined, { shallow: true });
  }, [router]);

  // Search input is locally controlled; URL updates after debounce so the query doesn't refetch per keystroke.
  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);
  useEffect(() => {
    if (searchInput === urlSearch) return undefined;
    const timer = setTimeout(() => updateQuery({ search: searchInput || undefined }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, urlSearch, updateQuery]);

  const query = trpc.admin.getUserExerciseResponses.useInfiniteQuery(
    {
      userId: userId ?? '', courseId, status, search: urlSearch || undefined, limit: PAGE_SIZE,
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
  const user = query.data?.pages[0]?.user;
  const courses = query.data?.pages[0]?.courses ?? [];

  if (!userId) {
    return <PageChrome><Section><ProgressDots className="py-8" /></Section></PageChrome>;
  }

  if (!auth) {
    return (
      <PageChrome>
        <Section className="max-w-3xl">
          <div className="container-lined p-6 bg-red-50 border-red-200">
            <h3 className="font-bold text-red-800 mb-2">Login required</h3>
            <p className="text-red-700">Sign in with an admin account to view this page.</p>
          </div>
        </Section>
      </PageChrome>
    );
  }

  const errorCode = query.error?.data?.code;
  const isAccessDenied = errorCode === 'UNAUTHORIZED' || errorCode === 'FORBIDDEN';
  const isUserNotFound = errorCode === 'NOT_FOUND';

  const renderResults = () => {
    if (isAccessDenied) {
      return (
        <div className="container-lined p-6 bg-red-50 border-red-200">
          <h3 className="font-bold text-red-800 mb-2">Access denied</h3>
          <p className="text-red-700">You need to be logged in as an admin to view this page.</p>
        </div>
      );
    }

    if (isUserNotFound) {
      return (
        <div className="container-lined p-6">
          <h3 className="font-bold mb-2">User not found</h3>
          <p>No user with id <code>{userId}</code>.</p>
        </div>
      );
    }

    if (query.error) return <ErrorSection error={query.error} />;
    if (query.isLoading) return <ProgressDots className="py-8" />;
    if (items.length === 0) return <p className="text-bluedot-navy/60 py-8 text-center">No exercise responses match these filters.</p>;
    return (
      <ol className="flex flex-col gap-3">
        {items.map(({ response, exercise, unit }) => (
          <ResponseCard key={response.id} response={response} exercise={exercise} unit={unit} />
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
                  <p className="text-size-xs text-bluedot-navy/70 break-words">{user.email}</p>
                  {user.lastSeenAt && (
                    <p className="text-size-xxs text-bluedot-navy/50 mt-1">Last seen: {new Date(user.lastSeenAt).toLocaleString()}</p>
                  )}
                </>
              ) : (
                <p className="text-size-xs text-bluedot-navy/50">Loading user...</p>
              )}
              <p className="text-size-xxs text-bluedot-navy/50">User ID: <code>{userId}</code></p>
            </div>

            <label className="flex items-center gap-2 text-size-xs cursor-pointer">
              <input
                type="checkbox"
                checked={status !== 'completed'}
                onChange={(e) => updateQuery({ status: e.target.checked ? undefined : 'completed' })}
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
                      onChange={() => updateQuery({ courseId: undefined })}
                    />
                    All courses
                  </label>
                  {courses.map((c) => (
                    <label key={c.id ?? '__none__'} className="flex items-center gap-2 text-size-xs cursor-pointer">
                      <input
                        type="radio"
                        name="course"
                        checked={courseId === c.id}
                        onChange={() => updateQuery({ courseId: c.id ?? undefined })}
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
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search question or response..."
              className="w-full border border-gray-300 rounded-md p-2 text-size-xs"
            />

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
    </PageChrome>
  );
};

const ResponseCard = ({ response, exercise, unit }: UserExerciseResponseItem) => {
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
            {exercise?.exerciseNumber && <span className="text-bluedot-navy/50 font-normal"> · {exercise.exerciseNumber}</span>}
          </p>
          <p className="text-bluedot-navy/60 break-words">
            {unit?.courseTitle ?? '(unknown course)'}
            {unit && <> · Unit {unit.unitNumber}: {unit.title}</>}
          </p>
        </div>
        <p className="text-bluedot-navy/50 whitespace-nowrap">
          {response.completedAt
            ? new Date(response.completedAt).toLocaleString()
            : <span className="text-orange-700">In progress</span>}
        </p>
      </header>

      <div className="border-l-2 border-bluedot-lighter pl-4">
        <div
          className="leading-relaxed prose-sm"
          style={!expanded && canTruncate ? {
            display: '-webkit-box',
            WebkitLineClamp: 8,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } : undefined}
        >
          <MarkdownExtendedRenderer>{responseText}</MarkdownExtendedRenderer>
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

AdminUserExerciseResponses.pageRendersOwnNav = true;
AdminUserExerciseResponses.mainShrinkToContent = true;

// Force server-rendering so Next.js wires up `router.query.userId` for the dynamic param.
// Without this, the page is statically auto-exported and `router.query` stays empty.
export const getServerSideProps: GetServerSideProps = async () => ({ props: {} });

export default AdminUserExerciseResponses;
