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
  title: 'Work with us',
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

const missions: BluedotRoute = {
  title: 'Missions',
  url: '/missions',
  parentPages: [home],
};

const programs: BluedotRoute = {
  title: 'Programs',
  url: '/programs',
  parentPages: [home],
};

const projects: BluedotRoute = {
  title: 'Projects',
  url: '/projects',
  parentPages: [home],
};

const events: BluedotRoute = {
  title: 'Events',
  url: '/events',
  parentPages: [home],
};

const logout: BluedotRoute = {
  title: 'Log out',
  url: '/login/clear',
  parentPages: [home],
};

const account: BluedotRoute = {
  title: 'Account',
  url: '/account',
  parentPages: [home],
};

const myCourses: BluedotRoute = {
  title: 'My Courses',
  url: '/my-courses',
  parentPages: [home],
};

const facilitatedCourses: BluedotRoute = {
  title: 'Facilitated Courses',
  url: '/facilitated-courses',
  parentPages: [home],
};

const subscriptionPreferences: BluedotRoute = {
  title: 'Subscription Preferences',
  url: '/subscription-preferences',
  parentPages: [home],
};

const adminSyncDashboard: BluedotRoute = {
  title: 'Sync Dashboard',
  url: '/admin/sync-dashboard',
  parentPages: [home],
};

export const ROUTES = {
  about,
  adminSyncDashboard,
  blog,
  certification,
  contact,
  courses,
  events,
  home,
  join,
  joinUs,
  login,
  logout,
  missions,
  programs,
  projects,
  grants: programs,
  privacyPolicy,
  profile,
  account,
  myCourses,
  facilitatedCourses,
  subscriptionPreferences,
} as const;

/**
 * Determines if a user should be redirected back to a given path after logout.
 * Returns false for auth-required pages to avoid showing error states.
 *
 * @param path - The path to check (e.g., "/courses/governance" or "/account")
 * @returns true if safe to redirect back, false if should redirect to home instead
 */
export const shouldRedirectBackAfterLogout = (path: string): boolean => {
  // Don't redirect to auth-required pages (would show errors after logout)
  // Don't redirect to login pages (confusing UX - user just logged out)
  const blockedPrefixes = ['/settings', '/profile', '/login', '/my-courses', '/facilitated-courses'];

  return !blockedPrefixes.some((prefix) => path.startsWith(prefix));
};
