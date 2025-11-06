import { render, RenderResult } from '@testing-library/react';
import type {
  Chunk, Course, CourseRegistration, Unit,
} from '@bluedot/db';

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

export const mockCourse = (overrides: Partial<Course> = {}): Course => ({
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

export const createMockCourseRegistration = (overrides: Partial<CourseRegistration> = {}): CourseRegistration => ({
  id: 'rec-test-id',
  role: 'Participant',
  email: 'user@example.com',
  autoNumberId: 1,
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  courseId: 'course-1',
  userId: 'user-1',
  courseApplicationsBaseId: 'base123',
  decision: 'Accept',
  certificateId: null,
  certificateCreatedAt: null,
  roundStatus: 'Active',
  lastVisitedUnitNumber: null,
  lastVisitedChunkIndex: null,
  source: null,
  ...overrides,
});

export const createMockUnit = (overrides: Partial<Unit> = {}): Unit => ({
  autoNumberId: 1,
  chunks: ['recuC87TILbjW4eF4'],
  content: null,
  courseId: 'rec8CeVOWU0mGu2Jf',
  coursePath: '/courses/test-course',
  courseSlug: 'test-course',
  courseTitle: 'Test Course',
  courseUnit: null,
  description: 'Unit description',
  duration: 30,
  id: 'unit-id',
  learningOutcomes: null,
  menuText: null,
  path: `/courses/test-course/${overrides.unitNumber || '1'}`,
  title: 'Unit title',
  unitNumber: '1',
  unitPodcastUrl: '',
  unitStatus: 'Active',
  ...overrides,
});

export const createMockChunk = (overrides: Partial<Chunk> = {}): Chunk => ({
  chunkContent: 'Test chunk content',
  chunkExercises: [],
  chunkId: 'recuC87TILbjW4eF4',
  chunkOrder: '1',
  chunkResources: [],
  chunkTitle: 'Test Chunk',
  chunkType: 'Reading',
  estimatedTime: null,
  id: 'chunk-id',
  metaDescription: null,
  status: 'Active',
  unitId: 'unit-id',
  ...overrides,
});
