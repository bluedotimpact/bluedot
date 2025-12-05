import { ProgressDots, ErrorSection } from '@bluedot/ui';
import { H1 } from '@bluedot/ui/src/Text';
import type { inferRouterOutputs } from '@trpc/server';
import clsx from 'clsx';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { AppRouter } from '../../server/routers/_app';
import { trpc } from '../../utils/trpc';

/* Hero Section Component */
const CoursesHero = () => {
  return (
    <section className="relative w-full min-h-[317px] min-[680px]:min-h-[366px] overflow-hidden">
      {/* Background Image */}
      <img
        src="/images/homepage/hero.webp"
        alt=""
        className="absolute inset-0 size-full object-cover -scale-x-100"
        fetchPriority="high"
      />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col justify-end h-full min-h-[317px] min-[680px]:min-h-[366px] px-5 pb-12 pt-20 min-[680px]:px-8 min-[680px]:pb-16 min-[680px]:pt-20 min-[1024px]:px-12 min-[1280px]:px-16 min-[1920px]:px-0">
        <div className="w-full mx-auto min-[1920px]:max-w-[1360px]">
          <div className="flex flex-col gap-6 max-w-[780px]">
            {/* Title */}
            <H1 className="text-[32px] min-[680px]:text-[40px] min-[1024px]:text-[48px] leading-tight font-medium tracking-[-1px] text-white">
              Course Schedule
            </H1>

            {/* Description */}
            <p className="text-size-sm min-[680px]:text-[18px] min-[1024px]:text-[20px] leading-[1.55] tracking-[-0.1px] text-white">
              Join our next cohort and learn from AI safety experts. All courses are freely available on a pay-what-you-want model.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

type Course = inferRouterOutputs<AppRouter>['courses']['getAll'][number];
type CourseRounds = inferRouterOutputs<AppRouter>['courseRounds']['getRoundsForCourse'];

/* Course Menu Configuration */
const COURSE_MENU_ITEMS = [
  { slug: 'future-of-ai', title: 'The Future of AI', isNew: false },
  { slug: 'ai-governance', title: 'AI Governance', isNew: false },
  { slug: 'agi-strategy', title: 'AGI Strategy', isNew: false },
  { slug: 'technical-ai-safety', title: 'Technical AI Safety', isNew: true },
  { slug: 'biosecurity', title: 'Biosecurity', isNew: true },
] as const;

/* Course Icon Mapping */
const COURSE_ICONS: Record<string, string> = {
  'future-of-ai': '/images/courses/future-of-ai-icon.svg',
  'ai-governance': '/images/courses/ai-governance-icon.svg',
  'agi-strategy': '/images/courses/agi-strategy-icon.svg',
  'technical-ai-safety': '/images/courses/technical-ai-safety-icon.svg',
  'biosecurity': '/images/courses/biosecurity-icon.svg',
};

const COURSE_DESCRIPTIONS: Record<string, string> = {
  'future-of-ai': 'An introduction to what AI can do today, where it\'s going over the next decade, and how you can start contributing to a better future.',
  'ai-governance': 'Learn about the policy landscape, regulatory tools, and institutional reforms needed to navigate the transition to transformative AI.',
  'agi-strategy': 'A deep dive into the incentives driving the AI companies, what\'s at stake, and the strategies for ensuring AI benefits humanity. You\'ll finish with your own action plan.',
  'technical-ai-safety': 'For technical talent who want to drive AI safety research and policy professionals building governance solutions.',
  'biosecurity': 'For people who want to build a pandemic-proof world. Learn how we can defend against AI-enabled bioattacks.',
};

/* Self-paced courses have no cohort rounds - just open access content */
const isSelfPacedCourse = (course: Course): boolean =>
  course.cadence?.toLowerCase() === 'self-paced' || course.slug === 'future-of-ai';

/* Custom hook to fetch and sort courses with their round data */
const useSortedCourses = () => {
  const { data: courses, isLoading: coursesLoading, error } = trpc.courses.getAll.useQuery();

  const displayedCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter((course) => course.displayOnCourseHubIndex);
  }, [courses]);

  // Prefetch all course rounds to enable sorting
  const roundsQueries = trpc.useQueries((t) => displayedCourses.map((course) => t.courseRounds.getRoundsForCourse({ courseSlug: course.slug })));

  const allRoundsLoaded = roundsQueries.every((q) => !q.isLoading);
  const isLoading = coursesLoading || !allRoundsLoaded;

  // Build a map of course slug to their earliest upcoming round date
  const courseRoundsMap = useMemo(() => {
    const map = new Map<string, { earliestDeadline: string | null; rounds: CourseRounds }>();

    displayedCourses.forEach((course, index) => {
      const roundsData = roundsQueries[index]?.data;
      if (roundsData) {
        // Get the earliest application deadline across all rounds
        const allRounds = [...(roundsData.intense || []), ...(roundsData.partTime || [])];
        const deadlines = allRounds
          .map((r) => r.applicationDeadlineRaw)
          .filter((d): d is string => !!d);

        const earliestDeadline = deadlines.length > 0
          ? deadlines.reduce((a, b) => (new Date(a) < new Date(b) ? a : b))
          : null;

        map.set(course.slug, { earliestDeadline, rounds: roundsData });
      }
    });

    return map;
  }, [displayedCourses, roundsQueries]);

  // Sort courses: self-paced first, then by earliest upcoming round
  const sortedCourses = useMemo(() => {
    if (!allRoundsLoaded) return displayedCourses;

    return [...displayedCourses].sort((a, b) => {
      const aIsSelfPaced = isSelfPacedCourse(a);
      const bIsSelfPaced = isSelfPacedCourse(b);

      // Self-paced courses come first
      if (aIsSelfPaced && !bIsSelfPaced) return -1;
      if (!aIsSelfPaced && bIsSelfPaced) return 1;

      // Both self-paced or both cohort-based: sort by earliest upcoming round
      const aDeadline = courseRoundsMap.get(a.slug)?.earliestDeadline;
      const bDeadline = courseRoundsMap.get(b.slug)?.earliestDeadline;

      // Courses with no upcoming rounds go to the end
      if (!aDeadline && !bDeadline) return a.title.localeCompare(b.title);
      if (!aDeadline) return 1;
      if (!bDeadline) return -1;

      // Sort by earliest deadline (soonest first)
      return new Date(aDeadline).getTime() - new Date(bDeadline).getTime();
    });
  }, [displayedCourses, courseRoundsMap, allRoundsLoaded]);

  return {
    courses: sortedCourses,
    isLoading,
    error,
    courseRoundsMap,
  };
};

/* Main Page Component */
const CoursesPage = () => {
  const { courses: displayedCourses, isLoading, error } = useSortedCourses();

  return (
    <div className="bg-white">
      <Head>
        <title>AI safety courses with certificates</title>
        <meta name="description" content="Courses that support you to develop the knowledge, community and network needed to pursue a high-impact career." />
        {displayedCourses.length > 0 && (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                itemListElement: displayedCourses.map((course, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  item: {
                    '@type': 'Course',
                    availableLanguage: 'en',
                    name: course.title,
                    description: course.shortDescription,
                    provider: {
                      '@type': 'Organization',
                      name: 'BlueDot Impact',
                      sameAs: 'https://bluedot.org',
                    },
                    url: `https://bluedot.org${course.path}`,
                    offers: [{
                      '@type': 'Offer',
                      category: 'Free',
                    }],
                    hasCourseInstance: [{
                      '@type': 'CourseInstance',
                      courseMode: 'Online',
                      ...course.durationHours ? {
                        courseWorkload: `PT${course.durationHours}H`,
                      } : {},
                    }],
                    educationalLevel: course.level,
                    educationalCredentialAwarded: [{
                      '@type': 'EducationalOccupationalCredential',
                      name: 'BlueDot Certificate',
                      credentialCategory: 'Certificate',
                    }],
                    ...(course.averageRating && {
                      aggregateRating: {
                        '@type': 'AggregateRating',
                        ratingValue: course.averageRating,
                        bestRating: '5',
                        worstRating: '1',
                      },
                    }),
                  },
                })),
              }),
            }}
          />
        )}
      </Head>

      {/* Hero Section */}
      <CoursesHero />

      {/* Main Content Area - Responsive container widths and margins per spec */}
      {/* 1280px: 64px padding (px-16), 1024px: 48px padding (px-12) */}
      <div className="w-full mx-auto px-5 min-[680px]:px-8 min-[1024px]:px-12 min-[1280px]:px-16 min-[1440px]:px-20 min-[1920px]:max-w-[1360px] min-[1920px]:px-0">
        {/* Section padding: 32px top / 64px bottom at 320px, 64px at 680px+, 96px at 1280px+ */}
        <div className="pt-8 pb-16 min-[680px]:py-16 min-[1280px]:py-24">
          {/* At 1280px+: side-by-side (sidebar LEFT, content right) with 64px gap */}
          {/* At 1024px and below: stacked (breadcrumb ABOVE, divider, then courses) */}
          <div className="flex flex-col min-[1280px]:flex-row min-[1280px]:gap-16">
            {/* Breadcrumb Menu - LEFT side at 1280px+, ABOVE at 1024px and below */}
            <BreadcrumbMenu courses={displayedCourses} />

            {/* Horizontal divider - only visible on stacked layout (below 1280px) */}
            {/* At 1024px: 64px margin above divider, 64px padding below */}
            <div className="min-[1280px]:hidden mt-16 pt-16 border-t border-[rgba(19,19,46,0.1)]" />

            {/* Course Cards Section */}
            <div className="flex-1">
              {error && <ErrorSection error={error} />}
              {isLoading && <ProgressDots />}
              {!isLoading && !error && (
                <CoursesList courses={displayedCourses} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;

/* Breadcrumb Menu Component */
type BreadcrumbMenuProps = {
  courses: Course[];
};

/* Hook to track active section via IntersectionObserver */
const useActiveSection = (sectionIds: string[]): string | null => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (intersecting.length > 0 && intersecting[0]) {
          setActiveSection(intersecting[0].target.id);
        }
      },
      {
        /* Offset for sticky nav (~96px) and observe when section enters top half of viewport */
        rootMargin: '-96px 0px -50% 0px',
        threshold: 0,
      },
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeSection;
};

const BreadcrumbMenu = ({ courses }: BreadcrumbMenuProps) => {
  const sectionIds = useMemo(
    () => courses.map((course) => `course-${course.slug}`),
    [courses],
  );

  const activeSection = useActiveSection(sectionIds);

  const scrollToSection = (slug: string) => {
    const element = document.getElementById(`course-${slug}`);
    if (element) {
      /* Offset for sticky nav */
      const navHeight = 96;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav className="w-[252px] flex-shrink-0 min-[1280px]:sticky min-[1280px]:top-24 min-[1280px]:self-start">
      <h2 className="text-[12px] leading-[14px] font-semibold text-[#1144cc] uppercase tracking-[0.5px] mb-[30px]">
        Courses
      </h2>

      <ul className="flex flex-col">
        {courses.map((course) => {
          const menuItem = COURSE_MENU_ITEMS.find((item) => item.slug === course.slug);
          const isNew = menuItem?.isNew ?? false;
          const isActive = activeSection === `course-${course.slug}`;

          return (
            <li key={course.slug}>
              <button
                type="button"
                onClick={() => scrollToSection(course.slug)}
                className={clsx(
                  'group flex items-center gap-3 h-11 pl-5 border-l-4 transition-colors cursor-pointer w-full text-left',
                  isActive
                    ? 'border-[#1144cc]'
                    : 'border-[rgba(21,21,21,0.15)] hover:border-[#1144cc]',
                )}
              >
                <span
                  className={clsx(
                    'text-[16px] leading-[24px] font-normal',
                    isActive ? 'text-[#1144cc]' : 'text-[#151d42]',
                  )}
                >
                  {course.title}
                </span>
                {isNew && (
                  <span className="bg-[#e9ecf8] text-[#2244bb] text-[10px] font-bold leading-[24px] px-[6px] rounded-[5px]">
                    NEW
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

/* Course Cards List */
type CoursesListProps = {
  courses: Course[];
};

const CoursesList = ({ courses }: CoursesListProps) => {
  return (
    <div className="flex flex-col">
      {courses.map((course, index) => (
        <div key={course.id} id={`course-${course.slug}`}>
          <CourseCard course={course} />
          {index < courses.length - 1 && (
            /* Divider spacing: 48px at mobile, 64px at 1024px, 80px at 1280px+ */
            <div className="my-12 min-[1024px]:my-16 min-[1280px]:my-20 border-t border-[rgba(19,19,46,0.1)]" />
          )}
        </div>
      ))}
    </div>
  );
};

/* Course Card Component */
type CourseCardProps = {
  course: Course;
};

const CourseCard = ({ course }: CourseCardProps) => {
  const { data: rounds, isLoading: roundsLoading } = trpc.courseRounds.getRoundsForCourse.useQuery(
    { courseSlug: course.slug },
  );

  const isSelfPaced = isSelfPacedCourse(course);
  const hasIntense = rounds?.intense && rounds.intense.length > 0;
  const hasPartTime = rounds?.partTime && rounds.partTime.length > 0;
  const showRounds = hasIntense || hasPartTime;

  return (
    <article className="flex flex-col">
      <CourseHeader course={course} />

      <p className="mt-6 text-[18px] leading-[1.6] font-normal text-[#13132e] opacity-80">
        {COURSE_DESCRIPTIONS[course.slug] || course.shortDescription}
      </p>

      {/* Format Sections */}
      <div className="mt-12">
        {roundsLoading && <ProgressDots className="my-0" />}

        {/* Self-paced courses show only the self-paced section */}
        {!roundsLoading && isSelfPaced && (
          <SelfPacedSection course={course} />
        )}

        {/* Cohort-based courses show their rounds */}
        {!roundsLoading && !isSelfPaced && showRounds && (
          <div className="flex flex-col gap-16">
            {hasIntense && (
              <FormatSection
                type="intensive"
                rounds={rounds.intense}
                course={course}
              />
            )}
            {hasPartTime && (
              <FormatSection
                type="part-time"
                rounds={rounds.partTime}
                course={course}
              />
            )}
          </div>
        )}

        {/* No upcoming rounds message - only for cohort-based courses without rounds */}
        {!roundsLoading && !isSelfPaced && !showRounds && (
          <NoUpcomingRounds course={course} />
        )}
      </div>
    </article>
  );
};

/* Course Header */
type CourseHeaderProps = {
  course: Course;
};

const CourseHeader = ({ course }: CourseHeaderProps) => {
  const iconSrc = COURSE_ICONS[course.slug] || '/images/logo/BlueDot_Impact_Icon_White.svg';

  return (
    <>
      {/* Mobile Layout */}
      <div className="flex flex-col min-[680px]:hidden">
        {/* Course Icon */}
        <div className="w-16 h-16 rounded-[12px] bg-[#1144cc] flex items-center justify-center mb-6" aria-hidden="true">
          <img src={iconSrc} alt="" className="w-10 h-10" />
        </div>

        <Link
          href={course.path}
          className="group flex items-center gap-2 cursor-pointer"
        >
          <h2 className="text-[24px] leading-[1.4] font-semibold tracking-[-0.5px] text-[#13132e]">
            {course.title}
          </h2>
          <span className="text-[24px] leading-[1.4] text-[#13132e] transition-opacity opacity-0 group-hover:opacity-100">
            →
          </span>
        </Link>
      </div>

      {/* Desktop Layout */}
      <div className="hidden min-[680px]:flex items-start gap-6">
        <div className="w-16 h-16 flex-shrink-0 rounded-[12px] bg-[#1144cc] flex items-center justify-center" aria-hidden="true">
          <img src={iconSrc} alt="" className="w-10 h-10" />
        </div>

        <Link
          href={course.path}
          className="group flex items-center gap-2 pt-[15px] cursor-pointer"
        >
          <h2 className="text-[24px] leading-[1.4] font-semibold tracking-[-0.5px] text-[#13132e]">
            {course.title}
          </h2>
          <span className="text-[24px] leading-[1.4] text-[#13132e] transition-opacity opacity-0 group-hover:opacity-100">
            →
          </span>
        </Link>
      </div>
    </>
  );
};

/* Self-Paced Section */
type SelfPacedSectionProps = {
  course: Course;
};

const SelfPacedSection = ({ course }: SelfPacedSectionProps) => {
  return (
    <>
      {/* Mobile Layout */}
      <div className="flex min-[680px]:hidden">
        <div className="bg-[#1144cc] opacity-20 w-1 flex-shrink-0 rounded-sm" />
        <div className="flex flex-col pl-5">
          <p className="text-[15px] leading-[1.6] font-semibold text-[#13132e]">Self-paced learning</p>
          <p className="text-[15px] leading-[1.6] font-normal text-[#13132e] opacity-50">
            Open access · {course.durationHours ? `${course.durationHours} hours` : course.durationDescription}
          </p>
          <Link
            href={`${course.path}/1/1`}
            className="mt-3 text-[#1144cc] text-[15px] leading-[1.6] font-medium cursor-pointer"
          >
            Start learning
          </Link>
        </div>
      </div>

      {/* Desktop Layout */}
      <Link
        href={`${course.path}/1/1`}
        className="group hidden min-[680px]:flex flex-row items-center justify-between min-h-12 cursor-pointer"
      >
        <div className="flex items-stretch h-full">
          <div className="bg-[#1144cc] w-1 flex-shrink-0 rounded-sm opacity-30 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          <div className="flex flex-col justify-center pl-5">
            <span className="text-[15px] leading-none font-semibold text-[#13132e]">Self-paced learning</span>
            <span className="text-[15px] leading-none font-normal text-[#13132e] opacity-50 mt-1">
              Open access · {course.durationHours ? `${course.durationHours} hours` : course.durationDescription}
            </span>
          </div>
        </div>

        <div className="text-[#1144cc] ml-auto flex items-center text-[15px] leading-[1.6] font-medium">
          <span className="transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1">
            Start learning
          </span>
          <span className="ml-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            →
          </span>
        </div>
      </Link>
    </>
  );
};

/* Format Section (Intensive or Part-time) */
type Round = CourseRounds['intense'][number];

type FormatSectionProps = {
  type: 'intensive' | 'part-time';
  rounds: Round[];
  course: Course;
};

const FormatSection = ({ type, rounds, course }: FormatSectionProps) => {
  const firstRound = rounds[0];
  const numberOfUnits = firstRound?.numberOfUnits;
  const label = type === 'intensive' ? 'Intensive:' : 'Part-time:';
  const unitLabel = type === 'intensive' ? 'day' : 'week';
  const perLabel = type === 'intensive' ? '5h/day' : '5h/week';

  const description = numberOfUnits
    ? `${numberOfUnits} ${unitLabel} course (${perLabel})`
    : `${unitLabel} course`;

  return (
    <div className="flex flex-col">
      <div className="text-[15px] leading-[1.25] text-[#13132e] mb-6">
        <span className="font-semibold uppercase tracking-[0.45px]">{label}</span>
        <span className="ml-1 font-normal opacity-80">{description}</span>
      </div>

      <ul className="flex flex-col">
        {rounds.map((round, index) => (
          <li key={round.id}>
            <CourseRoundItem round={round} course={course} />
            {index < rounds.length - 1 && (
              /* 32px total spacing between rounds: 16px above divider + 16px below */
              <div className="my-4 border-t border-[rgba(19,19,46,0.1)]" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

/* Course Round Item */
type CourseRoundItemProps = {
  round: Round;
  course: Course;
};

const CourseRoundItem = ({ round, course }: CourseRoundItemProps) => {
  const applicationUrl = course.detailsUrl || course.path;
  const separator = applicationUrl.includes('?') ? '&' : '?';
  const applyUrl = `${applicationUrl}${separator}prefill_%5B%3E%5D%20Round=${round.id}`;

  // Format the date range with en dash instead of hyphen
  const formattedDateRange = round.dateRange?.replace(' - ', ' – ') || 'TBD';

  return (
    <>
      {/* Mobile Layout */}
      <div className="flex min-[680px]:hidden">
        <div className="bg-[#1144cc] w-1 flex-shrink-0 rounded-sm" />
        <div className="flex flex-col pl-5">
          <p className="text-[15px] leading-[1.6] font-semibold text-[#13132e]">{formattedDateRange}</p>
          <p className="text-[15px] leading-[1.6] font-normal text-[#13132e] opacity-50">
            Application closes {round.applicationDeadline}
          </p>
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Apply now (opens in a new tab)"
            className="mt-3 text-[#1144cc] text-[15px] leading-[1.6] font-medium cursor-pointer"
          >
            Apply now
          </a>
        </div>
      </div>

      {/* Desktop Layout */}
      <a
        href={applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Apply now (opens in a new tab)"
        className="group hidden min-[680px]:flex flex-row items-center justify-between min-h-12 cursor-pointer"
      >
        <div className="flex items-stretch h-full">
          <div className="bg-[#1144cc] w-1 flex-shrink-0 rounded-sm opacity-30 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          <div className="flex flex-col justify-center pl-5">
            <p className="text-[15px] leading-none font-semibold text-[#13132e]">{formattedDateRange}</p>
            <p className="text-[15px] leading-none font-normal text-[#13132e] opacity-50 mt-1">
              Application closes {round.applicationDeadline}
            </p>
          </div>
        </div>

        <div className="text-[#1144cc] ml-auto flex items-center text-[15px] leading-[1.6] font-medium">
          <span className="transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1">
            Apply now
          </span>
          <span className="ml-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            →
          </span>
        </div>
      </a>
    </>
  );
};

/* No Upcoming Rounds Fallback */
type NoUpcomingRoundsProps = {
  course: Course;
};

const NoUpcomingRounds = ({ course }: NoUpcomingRoundsProps) => {
  return (
    <div className="flex items-center min-h-[48px] border-l-[4px] border-[rgba(19,19,46,0.2)] pl-5">
      <p className="text-[15px] leading-[1.6] font-normal text-[#13132e] opacity-50">
        No upcoming rounds.{' '}
        <Link href={course.path} className="text-[#1144cc] font-medium hover:underline cursor-pointer">
          Learn more about this course
        </Link>
      </p>
    </div>
  );
};
