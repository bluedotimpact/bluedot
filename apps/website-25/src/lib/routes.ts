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

const coursesFutureOfAi: BluedotRoute = {
  title: 'Future of AI',
  url: '/courses/future-of-ai',
  parentPages: [home, courses],
};

const coursesFutureOfAiUnit1: BluedotRoute = {
  title: 'Unit 1',
  url: '/courses/future-of-ai/units/1',
  parentPages: [home, courses, coursesFutureOfAi],
};

const coursesFutureOfAiUnit2: BluedotRoute = {
  title: 'Unit 2',
  url: '/courses/future-of-ai/units/2',
  parentPages: [home, courses, coursesFutureOfAi],
};

const coursesFutureOfAiUnit3: BluedotRoute = {
  title: 'Unit 3',
  url: '/courses/future-of-ai/units/3',
  parentPages: [home, courses, coursesFutureOfAi],
};

const coursesFutureOfAiUnit4: BluedotRoute = {
  title: 'Unit 4',
  url: '/courses/future-of-ai/units/4',
  parentPages: [home, courses, coursesFutureOfAi],
};

export const ROUTES = {
  home,
  about,
  privacyPolicy,
  joinUs,
  contact,
  certification,
  courses,
  coursesFutureOfAi,
  coursesFutureOfAiUnit1,
  coursesFutureOfAiUnit2,
  coursesFutureOfAiUnit3,
  coursesFutureOfAiUnit4,
} as const;
