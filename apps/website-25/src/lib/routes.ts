import type { BluedotRoute } from '@bluedot/ui';

const home: BluedotRoute = {
  title: 'BlueDot Impact',
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
  title: 'Join our team',
  url: '/careers',
  parentPages: [home],
};

export const ROUTES = {
  home,
  about,
  privacyPolicy,
  careers,
} as const;
