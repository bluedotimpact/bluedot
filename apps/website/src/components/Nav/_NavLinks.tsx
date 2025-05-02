import clsx from 'clsx';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa6';

import { ROUTES } from '../../lib/routes';
import { A, H3 } from '../Text';
import {
  DRAWER_CLASSES,
  ExpandedSectionsState,
  NAV_LINK_CLASSES,
  TRANSITION_DURATION_CLASS,
} from './utils';

const isCurrentPath = (url: string): boolean => {
  if (typeof window === 'undefined') return false;
  const currentPath = window.location.pathname;
  return url === currentPath || (url !== '/' && currentPath.startsWith(url));
};

export const NavLinks: React.FC<{
  courses: { title: string; url: string; isNew?: boolean }[];
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  className?: string;
  isScrolled: boolean;
}> = ({
  courses,
  expandedSections,
  updateExpandedSections,
  className,
  isScrolled,
}) => {
  return (
    <div className={clsx('nav-links flex gap-9 [&>*]:w-fit', className)}>
      <ExploreDropdown
        expanded={expandedSections.explore}
        courses={courses}
        isScrolled={isScrolled}
        expandedSections={expandedSections}
        updateExpandedSections={updateExpandedSections}
      />
      <A href={ROUTES.about.url} className={NAV_LINK_CLASSES(isScrolled, isCurrentPath(ROUTES.about.url))}>About us</A>
      <A href={ROUTES.joinUs.url} className={NAV_LINK_CLASSES(isScrolled, isCurrentPath(ROUTES.joinUs.url))}>Join us</A>
      <A href={ROUTES.blog.url} className={NAV_LINK_CLASSES(isScrolled, isCurrentPath(ROUTES.blog.url))}>Blog</A>
      <A href="https://lu.ma/aisafetycommunityevents?utm_source=website&utm_campaign=nav" className={NAV_LINK_CLASSES(isScrolled)}>Events</A>
    </div>
  );
};

const ExploreDropdown: React.FC<{
  expanded: boolean;
  className?: string;
  courses: { title: string; url: string; isNew?: boolean }[];
  isScrolled: boolean;
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
}> = ({
  expanded,
  className,
  courses,
  isScrolled,
  expandedSections,
  updateExpandedSections,
}) => {
  const onToggleExplore = () => updateExpandedSections({
    mobileNav: expandedSections.mobileNav,
    explore: !expandedSections.explore,
    profile: false,
  });

  return (
    <div className="explore-dropdown">
      <button
        type="button"
        onClick={onToggleExplore}
        className={clsx('explore-dropdown__btn flex items-center gap-2 cursor-pointer', NAV_LINK_CLASSES(isScrolled))}
      >
        Explore
        {expandedSections.explore ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      <div
        className={clsx(
          `explore-dropdown__content-wrapper overflow-hidden transition-[max-height,opacity] ${TRANSITION_DURATION_CLASS}`,
          expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
          !expandedSections.mobileNav && DRAWER_CLASSES(isScrolled, expanded),
          className,
        )}
      >
        <div className={clsx('explore-dropdown___dropdown-content flex flex-col gap-[14px] w-fit overflow-hidden mx-auto text-pretty', !expandedSections.explore && 'hidden')}>
          <H3 className="explore-dropdown__dropdown-title font-bold pt-4">Our courses</H3>
          {courses?.map((course) => (
            <A key={course.url} href={course.url} className={NAV_LINK_CLASSES(isScrolled)}>
              {course.isNew && (
                <span className="explore-dropdown__new-badge text-bluedot-normal font-black pr-2">
                  New!
                </span>
              )}
              {course.title}
            </A>
          ))}
        </div>
      </div>
    </div>
  );
};
