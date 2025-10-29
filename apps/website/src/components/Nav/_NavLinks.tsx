import clsx from 'clsx';
import { Tag, ProgressDots } from '@bluedot/ui';

import { ROUTES } from '../../lib/routes';
import { A } from '../Text';
import { useCourses } from '../../lib/hooks/useCourses';
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
  isScrolled: boolean;
  isHomepage?: boolean;
}> = ({
  expandedSections,
  updateExpandedSections,
  className,
  isScrolled,
  isHomepage = false,
}) => {
  const { courses, loading } = useCourses();

  const navCourses = loading ? [] : [
    ...(courses.slice(0, 2) || []).map((course) => ({
      title: course.title,
      url: course.path,
      isNew: course.isNew || false,
    })),
    { title: 'Browse all', url: ROUTES.courses.url },
  ];
  const getLinkClasses = (isCurrentPathValue?: boolean) => {
    if (expandedSections.mobileNav) {
      return clsx(
        'nav-link nav-link-animation w-fit no-underline text-size-sm font-[450] leading-[160%] align-middle',
        'text-[#02034B]',
        isCurrentPathValue && 'font-bold',
      );
    }
    return clsx(
      'nav-link nav-link-animation w-fit no-underline text-size-sm font-[450] leading-[160%] align-middle',
      (isHomepage || isScrolled) ? 'text-white hover:text-white nav-link-animation-dark' : 'text-color-text hover:text-color-text',
      isCurrentPathValue && 'font-bold',
    );
  };

  return (
    <div className={clsx('nav-links flex gap-9 [&>*]:w-fit', className)}>
      <NavDropdown
        expandedSections={expandedSections}
        isExpanded={expandedSections.explore}
        isScrolled={isScrolled}
        isHomepage={isHomepage}
        links={navCourses}
        onToggle={() => updateExpandedSections({
          about: false,
          explore: !expandedSections.explore,
          mobileNav: expandedSections.mobileNav,
          profile: false,
        })}
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
      <A href={ROUTES.blog.url} className={getLinkClasses(isCurrentPath(ROUTES.blog.url))}>
        Blog
      </A>
      <A href={ROUTES.about.url} className={getLinkClasses(isCurrentPath(ROUTES.about.url))}>
        About
      </A>
      <A href={ROUTES.joinUs.url} className={getLinkClasses(isCurrentPath(ROUTES.joinUs.url))}>
        Jobs
      </A>
    </div>
  );
};

const NavDropdown: React.FC<{
  // Required
  expandedSections: ExpandedSectionsState;
  isExpanded: boolean;
  isScrolled: boolean;
  isHomepage: boolean;
  links: { title: string; url: string; isNew?: boolean | null }[];
  onToggle: () => void;
  title: string;
  // Optional
  className?: string;
  loading: boolean;
}> = ({
  expandedSections,
  isExpanded,
  isScrolled,
  isHomepage,
  links,
  onToggle,
  title,
  className,
  loading,
}) => {
  const getDropdownButtonClasses = () => {
    if (expandedSections.mobileNav) {
      return 'text-[#02034B]';
    }
    if (isHomepage || isScrolled) {
      return 'text-white hover:text-white nav-link-animation-dark';
    }
    return 'text-color-text hover:text-color-text';
  };

  const getDropdownContentClasses = () => {
    if (!expandedSections.mobileNav) {
      return DRAWER_CLASSES(isHomepage || isScrolled, isExpanded);
    }
    return isExpanded ? 'pt-4' : '';
  };

  return (
    <div className="nav-dropdown">
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
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={clsx('flex-shrink-0 transition-transform duration-300 ease', isExpanded && 'rotate-45')}
        >
          <path d="M10.0003 4.1665V15.8332M4.16699 9.99984H15.8337" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="16" />
        </svg>
      </button>
      <div
        className={clsx(
          'nav-dropdown__content-wrapper overflow-hidden transition-all duration-300 ease-in-out',
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
          getDropdownContentClasses(),
          className,
        )}
      >
        <div className={clsx('nav-dropdown__dropdown-content flex flex-col gap-3 w-fit overflow-hidden mx-auto text-pretty')}>
          {loading ? (
            <div className="py-2">
              <ProgressDots />
            </div>
          ) : (
            links?.map((link) => {
              const isDark = isHomepage || isScrolled;
              let linkTextColor = 'text-[#02034B]';
              if (!expandedSections.mobileNav && isDark) {
                linkTextColor = 'text-white';
              }

              return (
                <A
                  key={link.url}
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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
