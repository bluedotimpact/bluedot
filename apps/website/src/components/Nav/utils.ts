import clsx from 'clsx';

export const TRANSITION_DURATION_CLASS = 'duration-300';

export const DRAWER_CLASSES = (isScrolled: boolean, isOpen: boolean) => clsx(
  `absolute top-16 left-0 w-full lg:-left-spacing-x lg:w-[calc(100%+(var(--spacing-x)*2))] px-spacing-x transition-[max-height,opacity,padding] ${TRANSITION_DURATION_CLASS}`,
  isScrolled ? 'bg-color-canvas-dark' : 'bg-white',
  isOpen ? 'max-h-[700px] opacity-100 pt-4 pb-10 border-b border-color-border' : 'max-h-0 hidden pb-0',
);

export const NAV_LINK_CLASSES = (isScrolled: boolean, isCurrentPath?: boolean) => (
  clsx('nav-link nav-link-animation w-fit no-underline', isScrolled && 'nav-link-animation-dark', isCurrentPath && 'font-bold')
);

export type ExpandedSectionsState = {
  about: boolean;
  explore: boolean;
  mobileNav: boolean;
  profile: boolean;
};
