import clsx from 'clsx';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa6';
import { constants } from '@bluedot/ui';

import { ROUTES } from '../../lib/routes';
import { A } from '../Text';
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
  return (
    <div className={clsx('nav-links flex gap-9 [&>*]:w-fit', className)}>
      <NavDropdown
        expandedSections={expandedSections}
        isExpanded={expandedSections.explore}
        isScrolled={isScrolled}
        links={constants.COURSES}
        onToggle={() => updateExpandedSections({
          about: false,
          explore: !expandedSections.explore,
          mobileNav: expandedSections.mobileNav,
          profile: false,
        })}
        title="Courses"
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
      />
      <A href={ROUTES.blog.url} className={NAV_LINK_CLASSES(isScrolled, isCurrentPath(ROUTES.blog.url))}>Blog</A>
      <A href="https://lu.ma/aisafetycommunityevents?utm_source=website&utm_campaign=nav" className={NAV_LINK_CLASSES(isScrolled)}>Events</A>
    </div>
  );
};

const NavDropdown: React.FC<{
  // Required
  expandedSections: ExpandedSectionsState;
  isExpanded: boolean;
  isScrolled: boolean;
  links: { title: string; url: string; isNew?: boolean }[];
  onToggle: () => void;
  title: string;
  // Optional
  className?: string;
}> = ({
  expandedSections,
  isExpanded,
  isScrolled,
  links,
  onToggle,
  title,
  className,
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
          {links?.map((link) => (
            <A key={link.url} href={link.url} className={clsx(NAV_LINK_CLASSES(isScrolled), 'pt-1')}>
              {link.title}
              {link.isNew && (
                <span className="nav-dropdown__new-badge bg-bluedot-lighter rounded-sm p-1 text-bluedot-normal text-size-xxs font-bold uppercase ml-2">
                  New
                </span>
              )}
            </A>
          ))}
        </div>
      </div>
    </div>
  );
};
