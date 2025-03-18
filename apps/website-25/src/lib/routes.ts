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

const joinUs: BluedotRoute = {
  title: 'Join us',
  url: '/join-us',
  parentPages: [home],
};

const contact: BluedotRoute = {
  title: 'Contact us',
  url: '/contact',
  parentPages: [home],
};

export const ROUTES = {
  home,
  about,
  privacyPolicy,
  joinUs,
  contact,
} as const;
