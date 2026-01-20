import {
  describe, expect, test, beforeEach, vi,
} from 'vitest';
import CoursePage from '../../../../pages/courses/[courseSlug]/index';
import { createMockCourse, createMockUnit, renderWithHead } from '../../../testUtils';

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

const mockCourse = createMockCourse({
  slug: 'ai-safety-fundamentals',
  title: 'AI Safety Fundamentals',
  description: 'Learn about AI safety and alignment',
});

const mockUnits = [
  createMockUnit(),
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
        courseOgImage={`https://bluedot.org/images/courses/link-preview/${mockCourse.slug}.png`}
        soonestDeadline={null}
      />,
    );

    expect(document.title).toBe('AI Safety Fundamentals | BlueDot Impact');

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe('Learn about AI safety and alignment');

    // Check Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle?.getAttribute('content')).toBe(mockCourse.title);

    const ogDescription = document.querySelector('meta[property="og:description"]');
    expect(ogDescription?.getAttribute('content')).toBe(mockCourse.shortDescription);

    const ogType = document.querySelector('meta[property="og:type"]');
    expect(ogType?.getAttribute('content')).toBe('website');

    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage?.getAttribute('content')).toBe(`https://bluedot.org/images/courses/link-preview/${mockCourse.slug}.png`);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    expect(ogUrl?.getAttribute('content')).toBe(`https://bluedot.org/courses/${encodeURIComponent(mockCourse.slug)}`);
  });

  test('uses fallback logo image when no `courseOgImage` provided', () => {
    renderWithHead(
      <CoursePage
        courseSlug="ai-safety-fundamentals"
        courseData={{ course: mockCourse, units: mockUnits }}
        soonestDeadline={null}
      />,
    );

    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage?.getAttribute('content')).toBe('https://bluedot.org/images/logo/link-preview-fallback.png');
  });
});
