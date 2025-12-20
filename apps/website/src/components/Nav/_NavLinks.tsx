import clsx from 'clsx';
import React from 'react';
import { Tag, ProgressDots, A } from '@bluedot/ui';
import { CgChevronDown } from 'react-icons/cg';

import { ROUTES } from '../../lib/routes';
import { useCourses } from '../../lib/hooks/useCourses';
import { usePrimaryCourseURL } from '../../lib/hooks/usePrimaryCourseURL';
import { useClickOutside } from '../../lib/hooks/useClickOutside';
import {
  DRAWER_CLASSES,
  ExpandedSectionsState,
} from './utils';

const isCurrentPath = (url: string): boolean => {
  if (typeof window === 'undefined') return false;
  const currentPath = window.location.pathname;
  return url === currentPath || (url !== '/' && currentPath.startsWith(url));
};

export const NavLinks: React.FC<{
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  className?: string;
  isHomepage?: boolean;
}> = ({
  expandedSections,
  updateExpandedSections,
  className,
  isHomepage = false,
}) => {
  const { courses, loading } = useCourses();
  const { getPrimaryCourseURL } = usePrimaryCourseURL();

  const navCourses = loading ? [] : [
    ...(courses || []).map((course) => ({
      title: course.title,
      url: getPrimaryCourseURL(course.slug),
      isNew: course.isNew || false,
    })),
    { title: 'See upcoming rounds', url: ROUTES.courses.url },
  ];
  const getLinkClasses = (isCurrentPathValue?: boolean) => {
    // Mobile drawer always has white background, so always use dark text
    // Desktop navbar uses white text on homepage, dark text elsewhere
    let textColor = 'text-color-text hover:text-color-text';
    if (!expandedSections.mobileNav && isHomepage) {
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
        isExpanded={expandedSections.explore}
        isHomepage={isHomepage}
        links={navCourses}
        onToggle={() => updateExpandedSections({
          about: false,
          explore: !expandedSections.explore,
          mobileNav: expandedSections.mobileNav,
          profile: false,
        })}
        onClose={() => updateExpandedSections({ explore: false })}
        title="Courses"
        loading={loading}
      />
      <A
        href="https://lu.ma/bluedotevents?utm_source=website&utm_campaign=nav"
        target="_blank"
        rel="noopener noreferrer"
        className={getLinkClasses()}
        aria-label="Events (opens in new tab)"
      >
        Events
      </A>
      <A
        href={ROUTES.blog.url}
        target="_blank"
        rel="noopener noreferrer"
        className={getLinkClasses(isCurrentPath(ROUTES.blog.url))}
        aria-label="Blog (opens in new tab)"
      >
        Blog
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
        Jobs
      </A>
    </div>
  );
};

const NavDropdown: React.FC<{
  // Required
  expandedSections: ExpandedSectionsState;
  isExpanded: boolean;
  isHomepage: boolean;
  links: { title: string; url: string; isNew?: boolean | null }[];
  onToggle: () => void;
  onClose: () => void;
  title: string;
  // Optional
  className?: string;
  loading: boolean;
}> = ({
  expandedSections,
  isExpanded,
  isHomepage,
  links,
  onToggle,
  onClose,
  title,
  className,
  loading,
}) => {
  const dropdownRef = useClickOutside<HTMLDivElement>(onClose, isExpanded);

  const getDropdownButtonClasses = () => {
    // Mobile drawer always has white background, so always use dark text
    // Desktop navbar uses white text on homepage, dark text elsewhere
    if (expandedSections.mobileNav) {
      return 'text-color-text hover:text-color-text';
    }
    if (isHomepage) {
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
    <div ref={dropdownRef} className="nav-dropdown">
      <button
        type="button"
        onClick={onToggle}
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
        className={clsx(
          'nav-dropdown__content-wrapper overflow-hidden',
          isExpanded ? 'z-40' : 'pointer-events-none',
          getDropdownContentClasses(),
          className,
        )}
      >
        <div className={clsx('nav-dropdown__dropdown-content flex flex-col gap-3 w-fit overflow-hidden mx-auto text-pretty')}>
          {loading ? (
            <ProgressDots className="py-2" />
          ) : (
            links?.map((link) => {
              // Dropdown links: always dark text on white background
              const linkTextColor = 'text-[#02034B] hover:text-[#02034B]';

              return (
                <React.Fragment key={link.url}>
                  {/* Add separator before "See upcoming rounds" */}
                  {link.title === 'See upcoming rounds' && (
                    <div className="border-t border-gray-200 my-2" />
                  )}
                  <A
                    href={link.url}
                    className={clsx(
                      'nav-link nav-link-animation w-fit no-underline text-size-sm font-[450] leading-[160%] align-middle',
                      'pt-1',
                      linkTextColor,
                    )}
                    onClick={() => {
                      onToggle();
                    }}
                  >
                    {link.title}
                    {link.isNew && (
                      <Tag variant="secondary" className="uppercase ml-2 !p-1">
                        New
                      </Tag>
                    )}
                  </A>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
