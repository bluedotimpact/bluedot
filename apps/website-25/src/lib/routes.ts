import type { BluedotRoute } from '@bluedot/ui';

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

const careers: BluedotRoute = {
  title: 'Join the team',
  url: '/join-the-team',
  parentPages: [home],
};

export const ROUTES = {
  home,
  about,
  privacyPolicy,
  careers,
} as const;
