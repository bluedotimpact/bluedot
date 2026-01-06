import type { BluedotRoute } from '@bluedot/ui';

const login: BluedotRoute = {
  title: 'Login',
  url: '/login',
};

const join: BluedotRoute = {
  title: 'Join for free',
  url: '/login?register=true',
};

const home: BluedotRoute = {
  title: 'Home',
  url: '/',
};

const about: BluedotRoute = {
  title: 'About us',
  url: '/about',
  parentPages: [home],
};

const privacyPolicy: BluedotRoute = {
  title: 'Privacy Policy',
  url: '/privacy-policy',
  parentPages: [home],
};

const joinUs: BluedotRoute = {
  title: 'Join us',
  url: '/join-us',
  parentPages: [home],
};

const blog: BluedotRoute = {
  title: 'Blog',
  url: 'https://blog.bluedot.org',
  parentPages: [home],
};

const contact: BluedotRoute = {
  title: 'Contact us',
  url: 'mailto:team@bluedot.org',
  parentPages: [home],
};

const certification: BluedotRoute = {
  title: 'Certification',
  url: '/certification',
  parentPages: [home],
};

const courses: BluedotRoute = {
  title: 'Courses',
  url: '/courses',
  parentPages: [home],
};

const profile: BluedotRoute = {
  title: 'Profile',
  url: '/profile',
  parentPages: [home],
};

const projects: BluedotRoute = {
  title: 'Projects',
  url: '/projects',
  parentPages: [home],
};

const logout: BluedotRoute = {
  title: 'Log out',
  url: '/login/clear',
  parentPages: [home],
};

const settings: BluedotRoute = {
  title: 'Settings',
  url: '/settings',
  parentPages: [home],
};

const settingsAccount: BluedotRoute = {
  title: 'Account',
  url: '/settings/account',
  parentPages: [home, settings],
};

const settingsCourses: BluedotRoute = {
  title: 'Courses',
  url: '/settings/courses',
  parentPages: [home, settings],
};

export const ROUTES = {
  about,
  blog,
  certification,
  contact,
  courses,
  home,
  join,
  joinUs,
  login,
  logout,
  privacyPolicy,
  profile,
  projects,
  settings,
  settingsAccount,
  settingsCourses,
} as const;

/**
 * Determines if a user should be redirected back to a given path after logout.
 * Returns false for auth-required pages to avoid showing error states.
 *
 * @param path - The path to check (e.g., "/courses/governance" or "/settings/account")
 * @returns true if safe to redirect back, false if should redirect to home instead
 */
export const shouldRedirectBackAfterLogout = (path: string): boolean => {
  // Don't redirect to auth-required pages (would show errors after logout)
  // Don't redirect to login pages (confusing UX - user just logged out)
  const blockedPrefixes = ['/settings', '/profile', '/login'];

  return !blockedPrefixes.some((prefix) => path.startsWith(prefix));
};
