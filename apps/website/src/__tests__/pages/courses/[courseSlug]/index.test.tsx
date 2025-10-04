import {
  describe, expect, test, beforeEach, vi,
} from 'vitest';
import { Course, Unit } from '@bluedot/db';
import CoursePage from '../../../../pages/courses/[courseSlug]/index';
import { renderWithHead } from '../../../testUtils';

// Mock <Head>, which doesn't work in tests. See docstring of
// `renderWithHead` for more details.
vi.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => {
    if (children) {
      return (
        <head-proxy data-testid="head-proxy">
          {children}
        </head-proxy>
      );
    }
    return null;
  },
}));

const mockCourse: Course = {
  id: 'recCourse123',
  title: 'AI Safety Fundamentals',
  slug: 'ai-safety-fundamentals',
  description: 'Learn about AI safety and alignment',
  path: '/courses/ai-safety-fundamentals',
  status: 'published',
  durationHours: 40,
  durationDescription: '8 weeks',
  level: 'Beginner',
  cadence: 'Weekly',
  shortDescription: 'Introduction to AI safety',
  image: '/images/courses/ai-safety.jpg',
  detailsUrl: 'https://example.com/details',
  certificationDescription: 'Certificate description',
  certificationBadgeImage: 'badge.png',
  displayOnCourseHubIndex: true,
  averageRating: 4.8,
  isFeatured: true,
  isNew: false,
  publicLastUpdated: null,
  units: [],
};

const mockUnits: Unit[] = [
  {
    id: 'recUnit1',
    courseId: 'recCourse123',
    unitNumber: '1',
    title: 'Introduction to AI Safety',
    path: '/courses/ai-safety-fundamentals/1',
    courseSlug: 'ai-safety-fundamentals',
    courseTitle: 'AI Safety Fundamentals',
    coursePath: '/courses/ai-safety-fundamentals',
    courseUnit: null,
    content: 'Unit content',
    description: 'Unit description',
    learningOutcomes: 'Learning outcomes',
    duration: 30,
    chunks: ['recChunk1'],
    menuText: 'Introduction',
    unitPodcastUrl: '',
    unitStatus: 'Active',
    autoNumberId: 1,
  },
];

describe('CoursePage SSR/SEO', () => {
  beforeEach(() => {
    // Required for `renderWithHead`
    document.head.innerHTML = '';
  });

  test('renders SEO meta tags during SSR without API calls', () => {
    renderWithHead(
      <CoursePage
        courseSlug="ai-safety-fundamentals"
        courseData={{ course: mockCourse, units: mockUnits }}
      />,
    );

    expect(document.title).toBe('AI Safety Fundamentals | BlueDot Impact');

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe('Learn about AI safety and alignment');
  });
});
