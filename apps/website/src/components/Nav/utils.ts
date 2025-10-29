import clsx from 'clsx';

export const TRANSITION_DURATION_CLASS = 'duration-300';

export const DRAWER_CLASSES = (isDark: boolean, isOpen: boolean) => clsx(
  'absolute top-[60px] min-[1024px]:top-[76px] left-0 w-full',
  'lg:-left-spacing-x lg:w-[calc(100%+(var(--spacing-x)*2))]',
  'px-spacing-x transition-all duration-300 ease-in-out',
  isDark ? 'bg-color-canvas-dark' : 'bg-white',
  isOpen
    ? 'max-h-[700px] opacity-100 pt-4 pb-10 border-b border-color-border'
    : 'max-h-0 opacity-0 pb-0',
);

export type ExpandedSectionsState = {
  about: boolean;
  explore: boolean;
  mobileNav: boolean;
  profile: boolean;
};
