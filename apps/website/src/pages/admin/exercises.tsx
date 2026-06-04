import {
  Breadcrumbs, ErrorSection, ProgressDots, Section,
} from '@bluedot/ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { RiSearchLine } from 'react-icons/ri';
import { UserSearchModal } from '../../components/admin/UserSearchModal';
import MarkdownExtendedRenderer from '../../components/courses/MarkdownExtendedRenderer';
import { ROUTES } from '../../lib/routes';
import { maskEmail } from '../../lib/utils';
import type { UserExerciseResponseItem } from '../../server/routers/admin';
import { trpc } from '../../utils/trpc';

const CURRENT_ROUTE = ROUTES.adminUserExerciseResponses;
const PAGE_SIZE = 20;

const readUrlParam = (key: string): string => {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get(key) ?? '';
};

const writeUrlParams = (changes: Record<string, string | undefined>) => {
  if (typeof window === 'undefined') return;
  // Bypass next/router: _app.tsx keys ErrorBoundary on router.asPath, so router.replace remounts the page.
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
  const userId = typeof router.query.userId === 'string' ? router.query.userId : undefined;

  // Page-level admin gate. Until this resolves we render ProgressDots; on `false` we redirect to /404.
  const accessQuery = trpc.admin.isUserAdmin.useQuery(undefined, { retry: false });
  const isAdmin = accessQuery.data === true;
  const shouldShow404 = accessQuery.data === false;
  useEffect(() => {
    if (shouldShow404) router.replace('/404');
  }, [shouldShow404, router]);

  const [courseId, setCourseIdState] = useState<string | undefined>(undefined);
  const [includeInProgress, setIncludeInProgressState] = useState<boolean>(false);
  const [search, setSearchState] = useState<string>('');
  useEffect(() => {
    setCourseIdState(readUrlParam('courseId') || undefined);
    setIncludeInProgressState(readUrlParam('includeInProgress') === 'true');
    setSearchState(readUrlParam('search'));
  }, []);

  const setCourseId = (next: string | undefined) => {
    setCourseIdState(next);
    writeUrlParams({ courseId: next });
  };

  const setIncludeInProgress = (next: boolean) => {
    setIncludeInProgressState(next);
    writeUrlParams({ includeInProgress: next ? 'true' : undefined });
  };

  const setSearch = (next: string) => {
    setSearchState(next);
    writeUrlParams({ search: next || undefined });
  };

  const metaQuery = trpc.admin.getUserExerciseResponsesMetaInfo.useQuery(
    { userId: userId ?? '' },
    { enabled: !!userId && isAdmin, retry: false },
  );

  const exerciseResponseQuery = trpc.admin.getUserExerciseResponses.useInfiniteQuery(
    {
      userId: userId ?? '', courseId, includeInProgress, search: search || undefined, limit: PAGE_SIZE,
    },
    {
      enabled: !!userId && isAdmin,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialCursor: 0,
      retry: false,
    },
  );

  const infiniteScrollSentinelRef = useRef<HTMLDivElement | null>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = exerciseResponseQuery;
  useEffect(() => {
    const node = infiniteScrollSentinelRef.current;

    if (!node) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { rootMargin: '300px' });
    observer.observe(node);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = useMemo(() => exerciseResponseQuery.data?.pages.flatMap((p) => p.items) ?? [], [exerciseResponseQuery.data]);
  const user = metaQuery.data?.user;
  const courses = metaQuery.data?.courses ?? [];

  const [isSelectUserModalOpen, setIsSelectUserModalOpen] = useState(false);

  const renderResults = () => {
    if (!userId) return null;
    if (exerciseResponseQuery.error && !exerciseResponseQuery.data) return <ErrorSection error={exerciseResponseQuery.error} />;
    if (!exerciseResponseQuery.data) return <ProgressDots className="py-8" />;
    if (items.length === 0) return <p className="text-bluedot-navy/60 py-8 text-center">No exercise responses match these filters.</p>;

    return (
      <ol className="flex flex-col gap-3">
        {items.map((item) => (
          <ResponseCard key={item.response.id} {...item} />
        ))}
      </ol>
    );
  };

  const renderHeader = () => (
    <>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Breadcrumbs route={CURRENT_ROUTE} />
    </>
  );

  if (!isAdmin) {
    return (
      <div>
        {renderHeader()}
        <Section>
          <ProgressDots className="py-8" />
        </Section>
      </div>
    );
  }

  return (
    <div>
      {renderHeader()}
      <Section>
        {metaQuery.error && <ErrorSection error={metaQuery.error} />}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left column: identity + filters */}
          <div className="md:w-64 shrink-0 flex flex-col gap-6">
            <div className="container-lined p-4 flex flex-col gap-1">
              {user && (
                <>
                  <p className="font-semibold text-bluedot-navy break-words">{user.name || '(no name)'}</p>
                  <p className="text-size-xs text-bluedot-navy/70 break-words" title={user.email}>{maskEmail(user.email)}</p>
                  {user.lastSeenAt && (
                    <p className="text-size-xxs text-bluedot-navy/50 mt-1">Last seen: {new Date(user.lastSeenAt).toLocaleString()}</p>
                  )}
                </>
              )}
              {!user && userId && <p className="text-size-xs text-bluedot-navy/50">Loading user...</p>}
              {userId && <p className="text-size-xxs text-bluedot-navy/50">User ID: <code>{userId}</code></p>}
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
                checked={includeInProgress}
                onChange={(e) => setIncludeInProgress(e.target.checked)}
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
          </div>

          {/* Main (right column): search + results */}
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
              <div ref={infiniteScrollSentinelRef} className="py-4 text-center text-size-xs text-bluedot-navy/50">
                {exerciseResponseQuery.isFetchingNextPage && 'Loading...'}
                {!exerciseResponseQuery.hasNextPage && 'End of responses'}
              </div>
            )}
          </div>
        </div>
      </Section>
      <UserSearchModal
        isOpen={isSelectUserModalOpen}
        onClose={() => setIsSelectUserModalOpen(false)}
        title="Select a user to view"
        scope="all"
        onSelectUser={(id) => {
          // Invalidate the existing filter selection
          setCourseIdState(undefined);
          setIncludeInProgressState(false);
          setSearchState('');
          router.push({ pathname: '/admin/exercises', query: { userId: id } });
        }}
      />
    </div>
  );
};

const ResponseCard = ({
  response, exercise, unit, chunkPosition, exercisePosition,
}: UserExerciseResponseItem) => {
  const [expanded, setExpanded] = useState(false);
  const responseText = response.response ?? '';
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
          <div className={`leading-relaxed ${!expanded && canTruncate ? 'line-clamp-8' : ''}`}>
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

export default AdminUserExerciseResponses;
