import {
  addQueryParam, ProgressDots, useLatestUtmParams,
} from '@bluedot/ui';
import type { Course } from '@bluedot/db';
import clsx from 'clsx';
import Link from 'next/link';
import {
  useEffect, useMemo, useState,
} from 'react';
import { CourseIcon } from './CourseIcon';
import { COURSE_CONFIG } from '../../lib/constants';
import { appendPosthogSessionIdPrefill } from '../../lib/appendPosthogSessionIdPrefill';
import RoundGroup from '../shared/RoundGroup';
import { trpc } from '../../utils/trpc';

const COURSE_DISPLAY_ORDER = [
  'agi-strategy',
  'ai-governance',
  'biosecurity',
  'technical-ai-safety',
  'technical-ai-safety-project',
];

const isSelfPacedCourse = (course: Course): boolean => course.slug === 'future-of-ai' || course.slug === 'personal-theory-of-impact';

const getCourseAccentColor = (courseSlug: string): string => {
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  return COURSE_CONFIG[courseSlug]?.accentColor || 'var(--bluedot-normal)';
};

const sortByDisplayOrder = (items: Course[]) => [...items].sort((a, b) => {
  const aIndex = COURSE_DISPLAY_ORDER.indexOf(a.slug);
  const bIndex = COURSE_DISPLAY_ORDER.indexOf(b.slug);

  if (aIndex !== -1 && bIndex !== -1) {
    return aIndex - bIndex;
  }

  if (aIndex !== -1) {
    return -1;
  }

  if (bIndex !== -1) {
    return 1;
  }

  return a.title.localeCompare(b.title);
});

export const useSortedCourses = () => {
  const { data: courses, isLoading, error } = trpc.courses.getAll.useQuery();

  const displayedCourses = useMemo(() => {
    if (!courses) {
      return [];
    }

    return courses.filter((course) => course.displayOnCourseHubIndex);
  }, [courses]);

  const sortedCourses = useMemo(
    () => sortByDisplayOrder(displayedCourses.filter((c) => c.type !== 'Project')),
    [displayedCourses],
  );
  const sortedProjects = useMemo(
    () => sortByDisplayOrder(displayedCourses.filter((c) => c.type === 'Project')),
    [displayedCourses],
  );

  return {
    courses: sortedCourses,
    projects: sortedProjects,
    isLoading,
    error,
  };
};

/* Hook to track active section via IntersectionObserver */
const useActiveSection = (sectionIds: string[]): string | null => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (sectionIds.length === 0) {
      return undefined;
    }

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
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeSection;
};

export type CourseScheduleSection = {
  label: string;
  items: Course[];
};

type CourseScheduleMenuProps = {
  sections: CourseScheduleSection[];
};

export const CourseScheduleMenu = ({ sections }: CourseScheduleMenuProps) => {
  const sectionIds = useMemo(
    () => sections.flatMap((section) => section.items.map((course) => `course-${course.slug}`)),
    [sections],
  );

  const activeSection = useActiveSection(sectionIds);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
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

  const renderItems = (items: Course[]) => (
    <ul className="flex flex-col">
      {items.map((course) => {
        const isNew = course.isNew ?? false;
        const isActive = activeSection === `course-${course.slug}`;

        return (
          <li key={course.slug}>
            <button
              type="button"
              onClick={() => scrollToSection(`course-${course.slug}`)}
              className={clsx(
                'group flex items-center gap-3 h-11 pl-5 border-l-4 transition-colors cursor-pointer w-full text-left',
                isActive
                  ? 'border-bluedot-normal'
                  : 'border-[rgba(21,21,21,0.15)] hover:border-bluedot-normal',
              )}
            >
              <span
                className={clsx(
                  'text-size-sm leading-[24px] font-normal',
                  isActive ? 'text-bluedot-normal' : 'text-bluedot-navy',
                )}
              >
                {course.title}
              </span>
              {isNew && (
                <span className="bg-bluedot-lightest text-bluedot-normal text-size-xxs font-bold leading-[24px] px-[6px] rounded-[5px]">
                  NEW
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav className="w-[252px] flex-shrink-0 xl:sticky xl:top-24 xl:self-start">
      {sections.map((section, index) => (
        section.items.length > 0 && (
          <div key={section.label} className={index > 0 ? 'mt-8' : undefined}>
            <h2 className="text-size-xxs leading-[14px] font-semibold text-bluedot-normal uppercase tracking-[0.5px] mb-[30px]">
              {section.label}
            </h2>
            {renderItems(section.items)}
          </div>
        )
      ))}
    </nav>
  );
};

type CourseScheduleListProps = {
  courses: Course[];
};

export const CourseScheduleList = ({ courses }: CourseScheduleListProps) => {
  return (
    <div className="flex flex-col">
      {courses.map((course, index) => (
        <div key={course.id} id={`course-${course.slug}`}>
          <CourseScheduleCard course={course} />
          {index < courses.length - 1 && (
            <div className="my-12 lg:my-16 xl:my-20 border-t border-bluedot-navy/10" />
          )}
        </div>
      ))}
    </div>
  );
};

type CourseScheduleCardProps = {
  course: Course;
};

const CourseScheduleCard = ({ course }: CourseScheduleCardProps) => {
  const { data: rounds, isLoading: roundsLoading } = trpc.courseRounds.getRoundsForCourse.useQuery({ courseSlug: course.slug });
  const { latestUtmParams } = useLatestUtmParams();

  const baseApplicationUrl = course.applyUrl ?? '';
  const applicationUrlWithUtm = appendPosthogSessionIdPrefill(latestUtmParams.utm_source && baseApplicationUrl
    ? addQueryParam(baseApplicationUrl, 'prefill_Source', latestUtmParams.utm_source)
    : baseApplicationUrl);

  const isSelfPaced = isSelfPacedCourse(course);
  const hasIntense = rounds?.intense && rounds.intense.length > 0;
  const hasPartTime = rounds?.partTime && rounds.partTime.length > 0;
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const showRounds = hasIntense || hasPartTime;

  return (
    <article className="flex flex-col">
      <CourseScheduleHeader course={course} />

      <p className="mt-6 text-size-md leading-[1.6] font-normal text-bluedot-navy/80">
        {course.shortDescription}
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
              <RoundGroup
                type="intensive"
                rounds={rounds.intense}
                applicationUrl={applicationUrlWithUtm}
                accentColor={getCourseAccentColor(course.slug)}
                maxRounds={3}
              />
            )}
            {hasPartTime && (
              <RoundGroup
                type="part-time"
                rounds={rounds.partTime}
                applicationUrl={applicationUrlWithUtm}
                accentColor={getCourseAccentColor(course.slug)}
                maxRounds={3}
              />
            )}
          </div>
        )}

        {/* No Upcoming Rounds */}
        {!roundsLoading && !isSelfPaced && !showRounds && (
          <div className="flex items-center min-h-[48px] border-l-4 border-bluedot-navy/20 pl-5">
            <p className="text-size-sm leading-[1.6] font-normal text-bluedot-navy/50">
              No upcoming rounds.{' '}
              <Link href={`/courses/${course.slug}`} className="text-bluedot-normal font-medium hover:underline cursor-pointer">
                Learn more about this course
              </Link>
            </p>
          </div>
        )}
      </div>
    </article>
  );
};

type CourseScheduleHeaderProps = {
  course: Course;
};

const CourseScheduleHeader = ({ course }: CourseScheduleHeaderProps) => {
  return (
    <>
      {/* Mobile Layout */}
      <div className="flex flex-col bd-md:hidden">
        {/* Course Icon */}
        <div className="mb-6" aria-hidden="true">
          <CourseIcon courseSlug={course.slug} size="xlarge" className="rounded-[12px]" />
        </div>

        <Link
          href={`/courses/${course.slug}`}
          className="group flex items-center gap-2 cursor-pointer"
        >
          <h2 className="text-size-lg leading-[1.4] font-semibold tracking-[-0.5px] text-bluedot-navy">
            {course.title}
          </h2>
          <span className="text-size-lg leading-[1.4] text-bluedot-navy transition-opacity opacity-0 group-hover:opacity-100">
            →
          </span>
        </Link>
      </div>

      {/* Desktop Layout */}
      <div className="hidden bd-md:flex items-start gap-6">
        <CourseIcon courseSlug={course.slug} size="xlarge" className="rounded-[12px]" />

        <Link
          href={`/courses/${course.slug}`}
          className="group flex items-center gap-2 pt-[15px] cursor-pointer"
        >
          <h2 className="text-size-lg leading-[1.4] font-semibold tracking-[-0.5px] text-bluedot-navy">
            {course.title}
          </h2>
          <span className="text-size-lg leading-[1.4] text-bluedot-navy transition-opacity opacity-0 group-hover:opacity-100">
            →
          </span>
        </Link>
      </div>
    </>
  );
};

type SelfPacedSectionProps = {
  course: Course;
};

/** TODO: this is dead code, we can remove it.
 * In https://github.com/bluedotimpact/bluedot/pull/2062 we stopped FoAI course being shown. */
const SelfPacedSection = ({ course }: SelfPacedSectionProps) => {
  const accentColor = getCourseAccentColor(course.slug);

  return (
    <>
      {/* Mobile Layout */}
      <div className="flex bd-md:hidden">
        <div className="w-1 flex-shrink-0 rounded-sm" style={{ backgroundColor: accentColor }} />
        <div className="flex flex-col pl-5">
          <p className="text-size-sm leading-[1.6] font-semibold text-bluedot-navy">Self-paced learning</p>
          <p className="text-size-sm leading-[1.6] font-normal text-bluedot-navy/50">
            Open access · {course.durationHours ? `${course.durationHours} hours` : course.durationDescription}
          </p>
          <Link
            href={`/courses/${course.slug}/1/1`}
            className="mt-3 text-size-sm leading-[1.6] font-medium cursor-pointer text-bluedot-normal"
          >
            Start learning
          </Link>
        </div>
      </div>

      {/* Desktop Layout */}
      <Link
        href={`/courses/${course.slug}/1/1`}
        className="group hidden bd-md:flex flex-row items-center justify-between min-h-12 cursor-pointer"
      >
        <div className="flex items-stretch h-full">
          <div className="w-1 flex-shrink-0 rounded-sm opacity-30 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" style={{ backgroundColor: accentColor }} />
          <div className="flex flex-col justify-center pl-5">
            <span className="text-size-sm leading-none font-semibold text-bluedot-navy">Self-paced learning</span>
            <span className="text-size-sm leading-none font-normal text-bluedot-navy/50 mt-1">
              Open access · {course.durationHours ? `${course.durationHours} hours` : course.durationDescription}
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center text-size-sm leading-[1.6] font-medium text-bluedot-normal">
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
