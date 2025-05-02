import clsx from 'clsx';

export const TRANSITION_DURATION_CLASS = 'duration-300';

export const DRAWER_CLASSES = (isScrolled: boolean, isOpen: boolean) => clsx(
  `absolute top-[71px] left-0 w-full lg:-left-spacing-x lg:w-[calc(100%+(var(--spacing-x)*2))] lg:top-[92px] px-spacing-x transition-[max-height,opacity,padding] ${TRANSITION_DURATION_CLASS}`,
  isScrolled ? 'bg-color-canvas-dark' : 'bg-color-canvas',
  isOpen ? 'max-h-[700px] opacity-100 pb-10' : 'max-h-0 opacity-0 pb-0',
);

export const NAV_LINK_CLASSES = (isScrolled: boolean, isCurrentPath?: boolean) => (
  clsx('nav-link nav-link-animation w-fit no-underline', isScrolled && 'nav-link-animation-dark', isCurrentPath && 'font-bold')
);

export type ExpandedSectionsState = {
  mobileNav: boolean;
  explore: boolean;
  profile: boolean;
};
