import clsx from 'clsx';
import { useState } from 'react';
import { A, ProgressDots, Tag } from '@bluedot/ui';
import { useRouter } from 'next/router';
import { FaChevronDown } from 'react-icons/fa6';

import { ROUTES } from '../../lib/routes';
import { FOAI_COURSE_SLUG } from '../../lib/constants';
import { useCourses } from '../../lib/hooks/useCourses';
import { usePrimaryCourseURL } from '../../lib/hooks/usePrimaryCourseURL';
import { useDismissible } from '../../lib/hooks/useDismissible';
import { AI_SECURITY_BOOTCAMP } from '../../lib/publicPrograms';
import { getGrantPath } from '../../lib/grantTypes';
import { trpc } from '../../utils/trpc';
import {
  DRAWER_CLASSES,
  DRAWER_ROW_CLASS,
  NAV_LINK_ANIMATION_CLASS,
  NAV_LINK_CLASS,
  type NavMenu,
  type NavSection,
} from './utils';

type NavDropdownLink = {
  title: string;
  url: string;
  isNew?: boolean | null;
  external?: boolean;
  footer?: boolean;
  startHere?: boolean;
};

type NavLinksProps = {
  menu: NavMenu;
  className?: string;
  isOnDark?: boolean;
  inMobileDrawer?: boolean;
};

export const NavLinks = ({
  menu,
  className,
  isOnDark = false,
  inMobileDrawer = false,
}: NavLinksProps) => {
  const router = useRouter();
  const { courses, loading: coursesLoading } = useCourses();
  const { getPrimaryCourseURL } = usePrimaryCourseURL();
  const { data: programs, isLoading: programsLoading } = trpc.programs.getInPerson.useQuery();
  const { data: grants, isLoading: grantsLoading } = trpc.programs.getGrants.useQuery();

  // Filter FoAI from the dynamic list at the slug level (not URL): getPrimaryCourseURL
  // returns deep-link URLs like /courses/future-of-ai/1/1 for enrolled users, so a URL-based
  // filter would let those slip through and double-list FoAI.
  const courseLinks = (courses ?? [])
    .filter((course) => course.slug !== FOAI_COURSE_SLUG)
    .map((course) => ({
      title: course.title,
      url: getPrimaryCourseURL(course.slug),
      isNew: course.isNew ?? false,
    }));

  const sections: { section: NavSection; title: string; links: NavDropdownLink[]; loading: boolean }[] = [
    {
      section: 'courses',
      title: 'Courses',
      loading: coursesLoading,
      links: [
        { title: 'Future of AI', url: `/courses/${FOAI_COURSE_SLUG}`, startHere: true },
        ...courseLinks,
        { title: 'See all courses', url: ROUTES.courses.url, footer: true },
      ],
    },
    {
      section: 'grants',
      title: 'Grants',
      loading: grantsLoading,
      links: [
        ...(grants ?? [])
          .map((grant) => ({ grant, url: getGrantPath(grant.slug) }))
          .filter((entry): entry is typeof entry & { url: string } => Boolean(entry.url))
          .map(({ grant, url }) => ({ title: grant.name, url })),
        { title: 'See all grants', url: ROUTES.grants.url, footer: true },
      ],
    },
    {
      section: 'programs',
      title: 'Programs',
      loading: programsLoading,
      links: [
        ...(programs ?? [])
          .filter((program): program is typeof program & { slug: string } => Boolean(program.slug))
          .map((program) => ({ title: program.name, url: `/programs/${program.slug}` })),
        { title: AI_SECURITY_BOOTCAMP.title, url: AI_SECURITY_BOOTCAMP.url, external: true },
        { title: 'See all programs', url: `${ROUTES.programs.url}?utm_source=website&utm_campaign=nav`, footer: true },
      ],
    },
  ];

  const toneClass = isOnDark ? 'text-on-dark hover:text-on-dark nav-link-animation-dark' : 'text-primary hover:text-primary';
  const topLevelLinkClasses = clsx(NAV_LINK_CLASS, toneClass, inMobileDrawer ? DRAWER_ROW_CLASS : NAV_LINK_ANIMATION_CLASS);

  const isCurrent = (url: string) => router.pathname === url || router.pathname.startsWith(`${url}/`);

  const renderTopLevelLink = (title: string, url: string) => (
    <A
      href={url}
      className={topLevelLinkClasses}
      aria-current={isCurrent(url) ? 'page' : undefined}
      onClick={menu.closeAll}
    >
      {title}
    </A>
  );

  // Local state, not menu.openSection: the hidden desktop twin would otherwise treat drawer clicks as click-outside
  const [drawerSection, setDrawerSection] = useState<NavSection | null>(null);
  const openSection = inMobileDrawer ? drawerSection : menu.openSection;
  const toggleSection = inMobileDrawer
    ? (section: NavSection) => setDrawerSection((prev) => (prev === section ? null : section))
    : menu.toggleSection;

  return (
    <div className={clsx('flex', inMobileDrawer ? 'flex-col' : 'gap-9', className)}>
      {sections.map(({ section, title, links, loading }) => (
        <NavDropdown
          key={section}
          title={title}
          panelId={`${section}-dropdown${inMobileDrawer ? '-mobile' : ''}`}
          links={links}
          loading={loading}
          isExpanded={openSection === section}
          onToggle={() => toggleSection(section)}
          onClose={menu.closeSection}
          onNavigate={menu.closeAll}
          toneClass={toneClass}
          inMobileDrawer={inMobileDrawer}
        />
      ))}
      {renderTopLevelLink('Alumni', ROUTES.alumni.url)}
      {renderTopLevelLink('About', ROUTES.about.url)}
      {renderTopLevelLink('Join us', ROUTES.joinUs.url)}
    </div>
  );
};

type NavDropdownProps = {
  title: string;
  panelId: string;
  links: NavDropdownLink[];
  loading: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
  onNavigate: () => void;
  toneClass: string;
  inMobileDrawer: boolean;
};

const NavDropdown = ({
  title,
  panelId,
  links,
  loading,
  isExpanded,
  onToggle,
  onClose,
  onNavigate,
  toneClass,
  inMobileDrawer,
}: NavDropdownProps) => {
  // Inside the drawer, dismissal belongs to the drawer
  const { containerRef, triggerRef } = useDismissible(onClose, isExpanded && !inMobileDrawer);

  return (
    <div ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className={clsx(
          'flex items-center cursor-pointer',
          NAV_LINK_CLASS,
          toneClass,
          inMobileDrawer ? clsx(DRAWER_ROW_CLASS, 'justify-between') : clsx(NAV_LINK_ANIMATION_CLASS, 'gap-2'),
        )}
      >
        {title}
        <FaChevronDown
          aria-hidden="true"
          className={clsx(
            'size-3 shrink-0 transition-transform duration-300 ease-in-out motion-reduce:transition-none',
            isExpanded && 'rotate-180',
          )}
        />
      </button>
      <div
        id={panelId}
        className={inMobileDrawer ? clsx('pl-4', !isExpanded && 'hidden') : DRAWER_CLASSES(isExpanded)}
      >
        <div className={clsx('flex flex-col text-pretty', inMobileDrawer ? 'w-full' : 'w-fit mx-auto')}>
          {loading ? (
            <ProgressDots className="py-2" />
          ) : (
            links.map((link) => (
              <A
                key={link.url}
                href={link.url}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={clsx(
                  NAV_LINK_CLASS,
                  inMobileDrawer ? DRAWER_ROW_CLASS : clsx(NAV_LINK_ANIMATION_CLASS, 'flex min-h-11 items-center'),
                  link.footer ? 'text-link hover:text-link' : 'text-primary hover:text-primary',
                )}
                onClick={onNavigate}
              >
                {link.title}
                {link.footer && <span aria-hidden="true">&nbsp;→</span>}
                {link.isNew && (
                  <Tag variant="secondary" className="uppercase ml-2 !p-1">
                    New
                  </Tag>
                )}
                {link.startHere && (
                  <Tag variant="secondary" className="uppercase ml-2 !p-1">
                    Start Here
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
