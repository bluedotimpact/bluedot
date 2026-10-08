import clsx from 'clsx';

export const MOBILE_NAV_DRAWER_ID = 'mobile-nav-drawer';
export const PROFILE_DRAWER_ID = 'profile-menu-drawer';

export const NAV_LINK_CLASS = 'no-underline text-size-sm font-medium leading-relaxed align-middle';
// Desktop only: hover is meaningless on touch and the underline needs a text-width element
export const NAV_LINK_ANIMATION_CLASS = 'nav-link-animation w-fit';
// Full-width rows would stretch the underline across the drawer, so current page uses weight + colour
export const DRAWER_ROW_CLASS = 'flex min-h-11 w-full items-center aria-[current=page]:font-semibold aria-[current=page]:text-accent aria-[current=page]:hover:text-accent';

// z-40 sits inside the nav's own z-50 stacking context; Modal is 60, Toast 70
export const DRAWER_CLASSES = (isOpen: boolean) => clsx(
  'absolute top-full inset-x-0 w-full',
  'px-spacing-x transition-all duration-300 ease-in-out motion-reduce:transition-none',
  'bg-canvas',
  isOpen
    ? 'max-h-[calc(100dvh-var(--nav-height-mobile))] lg:max-h-[calc(100dvh-var(--nav-height-desktop))] opacity-100 pt-4 pb-6 border-b border-strong z-40 overflow-y-auto'
    : 'max-h-0 opacity-0 pb-0 pointer-events-none overflow-hidden invisible',
);

export type NavSection = 'courses' | 'grants' | 'programs' | 'profile';

export type NavMenuState = {
  mobileNavOpen: boolean;
  openSection: NavSection | null;
};

export type NavMenu = NavMenuState & {
  toggleSection: (section: NavSection) => void;
  closeSection: () => void;
  toggleMobileNav: () => void;
  closeAll: () => void;
};

export const CLOSED_MENU: NavMenuState = { mobileNavOpen: false, openSection: null };
