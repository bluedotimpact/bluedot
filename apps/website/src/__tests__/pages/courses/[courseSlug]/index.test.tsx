import {
  describe, expect, test, beforeEach, vi,
} from 'vitest';
import CoursePage from '../../../../pages/courses/[courseSlug]/index';
import { createMockUnit, mockCourse as createMockCourse, renderWithHead } from '../../../testUtils';

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
      />,
    );

    expect(document.title).toBe('AI Safety Fundamentals | BlueDot Impact');

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe('Learn about AI safety and alignment');
  });
});
