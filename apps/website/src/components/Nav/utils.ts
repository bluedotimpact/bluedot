import clsx from 'clsx';

export const TRANSITION_DURATION_CLASS = 'duration-300';

export const DRAWER_Z_DEFAULT = 'z-40' as const;
export const DRAWER_Z_PROFILE = 'z-50' as const;

// Class names used for nav components - referenced by useClickOutside hook
export const NAV_DROPDOWN_CLASS = 'nav-dropdown' as const;
export const MOBILE_NAV_CLASS = 'mobile-nav-links' as const;
export const PROFILE_DROPDOWN_CLASS = 'profile-links' as const;

export const DRAWER_CLASSES = (isOpen: boolean, zIndex: typeof DRAWER_Z_DEFAULT | typeof DRAWER_Z_PROFILE = DRAWER_Z_DEFAULT) => clsx(
  'absolute top-[60px] min-[1024px]:top-[76px] left-0 w-full',
  'lg:-left-spacing-x lg:w-[calc(100%+(var(--spacing-x)*2))]',
  'px-spacing-x transition-all duration-300 ease-in-out overflow-hidden',
  'bg-white',
  isOpen
    ? `max-h-[700px] opacity-100 pt-4 pb-10 border-b border-color-border ${zIndex}`
    : 'max-h-0 opacity-0 pb-0 pointer-events-none',
);

export type ExpandedSectionsState = {
  about: boolean;
  explore: boolean;
  mobileNav: boolean;
  profile: boolean;
};
