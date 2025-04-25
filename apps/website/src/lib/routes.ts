import type { BluedotRoute } from '@bluedot/ui';

const login: BluedotRoute = {
  title: 'Login',
  url: '/login',
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

// Avoid changing the /contact route - we reference it lots of places.
// If you are changing it, update libraries/ui/src/constants.ts
const contact: BluedotRoute = {
  title: 'Contact us',
  url: '/contact',
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

const logout: BluedotRoute = {
  title: 'Log out',
  url: '/login/clear',
  parentPages: [home],
};

export const ROUTES = {
  about,
  certification,
  contact,
  courses,
  home,
  joinUs,
  login,
  logout,
  privacyPolicy,
  profile,
} as const;
