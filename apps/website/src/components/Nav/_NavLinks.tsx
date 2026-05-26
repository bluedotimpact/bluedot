import clsx from 'clsx';
import React from 'react';
import { Tag, ProgressDots, A } from '@bluedot/ui';
import { CgChevronDown } from 'react-icons/cg';

import { ROUTES } from '../../lib/routes';
import { FOAI_COURSE_SLUG } from '../../lib/constants';
import { useCourses } from '../../lib/hooks/useCourses';
import { usePrimaryCourseURL } from '../../lib/hooks/usePrimaryCourseURL';
import { useClickOutside } from '../../lib/hooks/useClickOutside';
import { trpc } from '../../utils/trpc';
import {
  DRAWER_CLASSES,
  type ExpandedSectionsState,
  NAV_DROPDOWN_CLASS,
} from './utils';

const FOAI_NAV_ENTRY = {
  title: 'Future of AI',
  url: `/courses/${FOAI_COURSE_SLUG}`,
};

const isCurrentPath = (url: string): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const currentPath = window.location.pathname;
  return url === currentPath || (url !== '/' && currentPath.startsWith(url));
};

export const NavLinks: React.FC<{
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  className?: string;
  onColoredBackground?: boolean;
}> = ({
  expandedSections,
  updateExpandedSections,
  className,
  onColoredBackground = false,
}) => {
  const { courses, loading } = useCourses();
  const { getPrimaryCourseURL } = usePrimaryCourseURL();
  const { data: programs, isLoading: programsLoading } = trpc.programs.getAll.useQuery();

  // Filter FoAI from the dynamic list at the slug level (not URL): getPrimaryCourseURL
  // returns deep-link URLs like /courses/future-of-ai/1/1 for enrolled users, so a URL-based
  // filter would let those slip through and double-list FoAI.
  const allCourses = loading ? [] : (courses || [])
    .filter((course) => course.slug !== FOAI_COURSE_SLUG)
    .map((course) => ({
      title: course.title,
      url: getPrimaryCourseURL(course.slug),
      isNew: course.isNew ?? false,
      type: course.type ?? null,
    }));

  const navCourses = [
    FOAI_NAV_ENTRY,
    ...allCourses.filter((course) => course.type !== 'Project'),
    { title: 'See upcoming rounds', url: ROUTES.courses.url },
  ];

  const navProjects = [
    ...allCourses.filter((course) => course.type === 'Project'),
    { title: 'See all projects', url: ROUTES.projects.url },
  ];

  const navPrograms = [
    ...(programs ?? [])
      .filter((program): program is typeof program & { slug: string } => Boolean(program.slug))
      .map((program) => ({
        title: program.name,
        url: `/programs/${program.slug}`,
      })),
    { title: 'See all programs', url: `${ROUTES.programs.url}?utm_source=website&utm_campaign=nav` },
  ];

  const getLinkClasses = (isCurrentPathValue?: boolean) => {
    // Mobile drawer always has white background, so always use dark text
    // Desktop navbar uses white text on colored background, dark text elsewhere
    let textColor = 'text-color-text hover:text-color-text';
    if (!expandedSections.mobileNav && onColoredBackground) {
      textColor = 'text-white hover:text-white nav-link-animation-dark';
    }

    return clsx(
      'nav-link nav-link-animation w-fit no-underline text-size-sm font-[450] leading-[160%] align-middle',
      textColor,
      isCurrentPathValue && 'font-bold',
    );
  };

  return (
    <div className={clsx('nav-links flex gap-9 [&>*]:w-fit', className)}>
      <NavDropdown
        expandedSections={expandedSections}
        isExpanded={expandedSections.courses}
        onColoredBackground={onColoredBackground}
        links={navCourses}
        onToggle={() => updateExpandedSections({
          courses: !expandedSections.courses,
          projects: false,
          programs: false,
          explore: false,
          mobileNav: expandedSections.mobileNav,
          profile: false,
        })}
        onClose={() => updateExpandedSections({ courses: false })}
        title="Courses"
        loading={loading}
      />
      <NavDropdown
        expandedSections={expandedSections}
        isExpanded={expandedSections.programs}
        onColoredBackground={onColoredBackground}
        links={navPrograms}
        onToggle={() => updateExpandedSections({
          courses: false,
          projects: false,
          programs: !expandedSections.programs,
          explore: false,
          mobileNav: expandedSections.mobileNav,
          profile: false,
        })}
        onClose={() => updateExpandedSections({ programs: false })}
        title="Programs"
        loading={programsLoading}
      />
      <NavDropdown
        expandedSections={expandedSections}
        isExpanded={expandedSections.projects}
        onColoredBackground={onColoredBackground}
        links={navProjects}
        onToggle={() => updateExpandedSections({
          courses: false,
          projects: !expandedSections.projects,
          programs: false,
          explore: false,
          mobileNav: expandedSections.mobileNav,
          profile: false,
        })}
        onClose={() => updateExpandedSections({ projects: false })}
        title="Projects"
        loading={loading}
      />
      <A
        href={ROUTES.alumni.url}
        className={getLinkClasses(isCurrentPath(ROUTES.alumni.url))}
      >
        Alumni
      </A>
      <A
        href={ROUTES.about.url}
        className={getLinkClasses(isCurrentPath(ROUTES.about.url))}
      >
        About
      </A>
      <A
        href={ROUTES.joinUs.url}
        className={getLinkClasses(isCurrentPath(ROUTES.joinUs.url))}
      >
        Join us
      </A>
    </div>
  );
};

const NavDropdown: React.FC<{
  // Required
  expandedSections: ExpandedSectionsState;
  isExpanded: boolean;
  onColoredBackground: boolean;
  links: { title: string; url: string; isNew?: boolean | null; external?: boolean }[];
  onToggle: () => void;
  onClose: () => void;
  title: string;
  // Optional
  className?: string;
  loading?: boolean;
}> = ({
  expandedSections,
  isExpanded,
  onColoredBackground,
  links,
  onToggle,
  onClose,
  title,
  className,
  loading = false,
}) => {
  const dropdownRef = useClickOutside(
    onClose,
    isExpanded,
    `.${NAV_DROPDOWN_CLASS}`,
  );

  const getDropdownButtonClasses = () => {
    // Mobile drawer always has white background, so always use dark text
    // Desktop navbar uses white text on colored background, dark text elsewhere
    if (expandedSections.mobileNav) {
      return 'text-color-text hover:text-color-text';
    }

    if (onColoredBackground) {
      return 'text-white hover:text-white nav-link-animation-dark';
    }

    return 'text-color-text hover:text-color-text';
  };

  const getDropdownContentClasses = () => {
    if (!expandedSections.mobileNav) {
      // Desktop dropdowns: always white background
      return DRAWER_CLASSES(isExpanded);
    }

    // Mobile dropdowns: apply collapse/expand classes
    return clsx(
      'transition-all duration-300 ease-in-out',
      isExpanded
        ? 'max-h-[500px] opacity-100 pt-4'
        : 'max-h-0 opacity-0 pt-0',
    );
  };

  return (
    <div ref={dropdownRef} className={NAV_DROPDOWN_CLASS}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`${title.toLowerCase()}-dropdown`}
        className={clsx(
          'nav-dropdown__btn flex items-center gap-2 cursor-pointer',
          'nav-link nav-link-animation w-fit no-underline text-size-sm font-[450] leading-[160%] align-middle',
          getDropdownButtonClasses(),
        )}
      >
        {title}
        <CgChevronDown
          className={clsx(
            'size-5 flex-shrink-0 transition-all duration-300 ease-in-out',
            isExpanded ? 'rotate-180 opacity-70' : 'opacity-100',
          )}
        />
      </button>
      <div
        id={`${title.toLowerCase()}-dropdown`}
        role="region"
        aria-label={`${title} menu`}
        className={clsx(
          'nav-dropdown__content-wrapper',
          isExpanded ? 'z-40' : 'pointer-events-none',
          getDropdownContentClasses(),
          className,
        )}
      >
        <div className={clsx('nav-dropdown__dropdown-content flex flex-col gap-3 w-fit mx-auto text-pretty')}>
          {loading ? (
            <ProgressDots className="py-2" />
          ) : (
            links?.map((link) => {
              // Dropdown links: always dark text on white background
              const linkTextColor = 'text-bluedot-darker hover:text-bluedot-darker';

              return (
                <React.Fragment key={link.url}>
                  {/* Add separator before footer links */}
                  {(link.title === 'See upcoming rounds' || link.title === 'See all programs' || link.title === 'See all projects') && (
                    <div className="border-t border-gray-200 my-2" />
                  )}
                  <A
                    href={link.url}
                    {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className={clsx(
                      'nav-link nav-link-animation w-fit no-underline text-size-sm font-[450] leading-[160%] align-middle',
                      'pt-1',
                      linkTextColor,
                    )}
                    onClick={() => {
                      onClose();
                    }}
                  >
                    {link.title}
                    {link.isNew && (
                      <Tag variant="secondary" className="uppercase ml-2 !p-1">
                        New
                      </Tag>
                    )}
                    {link.title === FOAI_NAV_ENTRY.title && (
                      <Tag variant="secondary" className="uppercase ml-2 !p-1">
                        Start Here
                      </Tag>
                    )}
                  </A>
                  {link.title === FOAI_NAV_ENTRY.title && (
                    <div className="border-t border-gray-200 my-2" />
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
