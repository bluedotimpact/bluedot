import {
  H2, ProgressDots, useLatestUtmParams,
} from '@bluedot/ui';
import type { Course } from '@bluedot/db';
import clsx from 'clsx';
import Link from 'next/link';
import {
  useEffect, useMemo, useState,
} from 'react';
import { CourseIcon } from './CourseIcon';
import { buildApplicationUrl } from '../../lib/utils';
import { getCourseAccentColor } from '../../lib/courseColors';
import RoundGroup from '../shared/RoundGroup';
import { trpc } from '../../utils/trpc';

const COURSE_DISPLAY_ORDER = [
  'agi-strategy',
  'ai-governance',
  'biosecurity',
  'technical-ai-safety',
  'technical-ai-safety-project',
];

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
                  'text-size-sm leading-relaxed font-normal',
                  isActive ? 'text-bluedot-normal' : 'text-bluedot-navy',
                )}
              >
                {course.title}
              </span>
              {isNew && (
                <span className="bg-bluedot-lightest text-bluedot-normal text-size-xxs font-bold leading-[24px] px-1.5 rounded-md">
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
            <H2 className="text-size-xxs font-sans text-bluedot-normal uppercase tracking-wide mb-[30px]">
              {section.label}
            </H2>
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

  const applicationUrlWithUtm = buildApplicationUrl(course.applyUrl, latestUtmParams.utm_source);

  const hasIntense = rounds?.intense && rounds.intense.length > 0;
  const hasPartTime = rounds?.partTime && rounds.partTime.length > 0;
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const showRounds = hasIntense || hasPartTime;

  return (
    <article className="flex flex-col">
      <CourseScheduleHeader course={course} />

      <p className="mt-6 text-size-md leading-relaxed font-normal text-bluedot-navy/80">
        {course.shortDescription}
      </p>

      {/* Format Sections */}
      <div className="mt-12">
        {roundsLoading && <ProgressDots className="my-0" />}

        {!roundsLoading && showRounds && (
          <div className="flex flex-col gap-16">
            {hasIntense && (
              <RoundGroup
                type="intensive"
                rounds={rounds.intense}
                applicationUrl={applicationUrlWithUtm}
                accentColor={getCourseAccentColor(course.slug)}
              />
            )}
            {hasPartTime && (
              <RoundGroup
                type="part-time"
                rounds={rounds.partTime}
                applicationUrl={applicationUrlWithUtm}
                accentColor={getCourseAccentColor(course.slug)}
              />
            )}
          </div>
        )}

        {!roundsLoading && !showRounds && (
          <div className="flex items-center min-h-12 border-l-4 border-bluedot-navy/20 pl-5">
            <p className="text-size-sm leading-relaxed font-normal text-bluedot-navy/50">
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
          <CourseIcon courseSlug={course.slug} size="xlarge" className="rounded-xl" />
        </div>

        <Link
          href={`/courses/${course.slug}`}
          className="group flex items-center gap-2 cursor-pointer"
        >
          <H2 className="text-size-lg font-sans leading-normal">
            {course.title}
          </H2>
          <span className="text-size-lg leading-normal text-bluedot-navy transition-opacity opacity-0 group-hover:opacity-100">
            →
          </span>
        </Link>
      </div>

      {/* Desktop Layout */}
      <div className="hidden bd-md:flex items-start gap-6">
        <CourseIcon courseSlug={course.slug} size="xlarge" className="rounded-xl" />

        <Link
          href={`/courses/${course.slug}`}
          className="group flex items-center gap-2 pt-[15px] cursor-pointer"
        >
          <H2 className="text-size-lg font-sans leading-normal">
            {course.title}
          </H2>
          <span className="text-size-lg leading-normal text-bluedot-navy transition-opacity opacity-0 group-hover:opacity-100">
            →
          </span>
        </Link>
      </div>
    </>
  );
};

