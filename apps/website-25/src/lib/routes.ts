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

const makeCoursePageRoute = (courseSlug: string, courseTitle?: string, unitNumber?: number): BluedotRoute => ({
  title: unitNumber !== undefined ? `Unit ${unitNumber}` : courseTitle ?? 'Course',
  url: `/courses/${courseSlug}${unitNumber !== undefined ? `/units/${unitNumber}/` : ''}`,
  parentPages: [home, courses, ...(unitNumber !== undefined ? [makeCoursePageRoute(courseSlug, courseTitle)] : [])],
});

export const ROUTES = {
  home,
  about,
  privacyPolicy,
  joinUs,
  contact,
  certification,
  courses,
  makeCoursePageRoute,
} as const;
