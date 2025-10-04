import { render, RenderResult } from '@testing-library/react';
import type { Course } from '@bluedot/db';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface IntrinsicElements {
      'head-proxy': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

/**
 * Mock <Head> for testing. Based on the workaround described here:
 * https://github.com/vercel/next.js/discussions/11060#discussioncomment-33628
 *
 * Usage:
 * ```
 * vi.mock('next/head', () => ({
 *   __esModule: true,
 *   default: ({ children }: { children: React.ReactNode }) => (
 *     <head-proxy data-testid="head-proxy">{children}</head-proxy>
 *   ),
 * }));
 * ```
 */
export const renderWithHead = (ui: React.ReactElement): RenderResult => {
  const result = render(ui);

  const headProxies = document.querySelectorAll('head-proxy');
  headProxies.forEach((proxy) => {
    Array.from(proxy.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const clone = (child as Element).cloneNode(true);
        document.head.appendChild(clone);
      }
    });
  });

  return result;
};

export const mockCourse = (overrides: Partial<Course>): Course => ({
  averageRating: 4.5,
  cadence: 'Weekly',
  certificationBadgeImage: 'badge.png',
  certificationDescription: 'Certificate description',
  description: 'Course description',
  detailsUrl: 'https://example.com',
  displayOnCourseHubIndex: true,
  durationDescription: '4 weeks',
  durationHours: 40,
  id: 'course-id',
  image: '/images/courses/default.jpg',
  isFeatured: false,
  isNew: false,
  level: 'Beginner',
  path: '/courses/course-slug',
  publicLastUpdated: null,
  shortDescription: 'Short description',
  slug: 'course-slug',
  status: 'published',
  title: 'Course Title',
  units: [],
  ...overrides,
});
