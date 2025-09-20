import clsx from 'clsx';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa6';
import { Tag, ProgressDots } from '@bluedot/ui';

import { ROUTES } from '../../lib/routes';
import { A } from '../Text';
import { useCourses } from '../../lib/hooks/useCourses';
import {
  DRAWER_CLASSES,
  ExpandedSectionsState,
  NAV_LINK_CLASSES,
  TRANSITION_DURATION_CLASS,
} from './utils';

const ABOUT = [
  { title: 'Our story', url: ROUTES.about.url },
  { title: 'Careers', url: ROUTES.joinUs.url },
  { title: 'Contact', url: ROUTES.contact.url },
];

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
}> = ({
  expandedSections,
  updateExpandedSections,
  className,
  isScrolled,
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

  return (
    <div className={clsx('nav-links flex gap-9 [&>*]:w-fit', className)}>
      <NavDropdown
        expandedSections={expandedSections}
        isExpanded={expandedSections.explore}
        isScrolled={isScrolled}
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
      <NavDropdown
        expandedSections={expandedSections}
        isExpanded={expandedSections.about}
        isScrolled={isScrolled}
        links={ABOUT}
        onToggle={() => updateExpandedSections({
          about: !expandedSections.about,
          explore: false,
          mobileNav: expandedSections.mobileNav,
          profile: false,
        })}
        title="About"
        loading={false}
      />
      <A href={ROUTES.blog.url} className={NAV_LINK_CLASSES(isScrolled, isCurrentPath(ROUTES.blog.url))}>Blog</A>
      <A
        href="https://lu.ma/bluedotevents?utm_source=website&utm_campaign=nav"
        target="_blank"
        rel="noopener noreferrer"
        className={NAV_LINK_CLASSES(isScrolled)}
        aria-label="Events (opens in new tab)"
      >
        Events
      </A>
      <A
        href="https://shop.bluedot.org/"
        target="_blank"
        rel="noopener noreferrer"
        className={NAV_LINK_CLASSES(isScrolled)}
        aria-label="Shop (opens in new tab)"
      >
        Shop
      </A>
      <A href={ROUTES.joinUs.url} className={clsx(NAV_LINK_CLASSES(isScrolled), 'text-bluedot-primary font-medium')}>We're hiring!</A>
    </div>
  );
};

const NavDropdown: React.FC<{
  // Required
  expandedSections: ExpandedSectionsState;
  isExpanded: boolean;
  isScrolled: boolean;
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
  links,
  onToggle,
  title,
  className,
  loading,
}) => {
  return (
    <div className="nav-dropdown">
      <button
        type="button"
        onClick={onToggle}
        className={clsx('nav-dropdown__btn flex items-center gap-2 cursor-pointer', NAV_LINK_CLASSES(isScrolled))}
      >
        {title}
        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      <div
        className={clsx(
          `nav-dropdown__content-wrapper overflow-hidden transition-[max-height,opacity] ${TRANSITION_DURATION_CLASS}`,
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 hidden',
          !expandedSections.mobileNav ? DRAWER_CLASSES(isScrolled, isExpanded) : 'pt-4',
          className,
        )}
      >
        <div className={clsx('nav-dropdown__dropdown-content flex flex-col gap-3 w-fit overflow-hidden mx-auto text-pretty', !isExpanded && 'hidden')}>
          {loading ? (
            <div className="py-2">
              <ProgressDots />
            </div>
          ) : (
            links?.map((link) => (
              <A
                key={link.url}
                href={link.url}
                className={clsx(NAV_LINK_CLASSES(isScrolled), 'pt-1')}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};
