import { render, screen, waitFor } from '@testing-library/react';
import {
  describe, expect, test, vi, beforeEach,
} from 'vitest';
import { server, trpcMsw } from '../../trpcMswSetup';
import { TrpcProvider } from '../../trpcProvider';
import CoursesPage from '../../../pages/courses/index';
import { createMockCourse } from '../../testUtils';

vi.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/courses',
    query: {},
  }),
}));

const mockCourses = [
  createMockCourse({
    id: 'course-foai',
    slug: 'future-of-ai',
    title: 'The Future of AI',
    cadence: 'self-paced',
    path: '/courses/future-of-ai',
    displayOnCourseHubIndex: true,
  }),
  createMockCourse({
    id: 'course-gov',
    slug: 'ai-governance',
    title: 'AI Governance',
    cadence: 'Weekly',
    path: '/courses/ai-governance',
    displayOnCourseHubIndex: true,
  }),
];

const mockRounds = {
  intense: [
    {
      id: 'round-1',
      intensity: 'intensive' as const,
      applicationDeadline: '15 Jan',
      applicationDeadlineRaw: '2025-01-15',
      firstDiscussionDateRaw: '2025-01-20',
      dateRange: '20 Jan - 24 Jan',
      numberOfUnits: 5,
    },
  ],
  partTime: [],
};

describe('CoursesPage', () => {
  beforeEach(() => {
    server.use(
      trpcMsw.courses.getAll.query(() => mockCourses),
      trpcMsw.courseRounds.getRoundsForCourse.query(() => mockRounds),
    );
  });

  test('renders hero section with title', () => {
    const { container } = render(<CoursesPage />, { wrapper: TrpcProvider });

    const heroTitle = container.querySelector('h1');
    expect(heroTitle?.textContent).toBe('Course Schedule');
  });

  test('renders newsletter banner', async () => {
    const { container } = render(<CoursesPage />, { wrapper: TrpcProvider });

    await waitFor(() => {
      const emailInput = container.querySelector('input[type="email"]');
      expect(emailInput).not.toBeNull();
    });

    const subscribeButton = container.querySelector('button[type="submit"]');
    expect(subscribeButton?.textContent).toBe('Subscribe');
  });

  test('renders breadcrumb navigation', async () => {
    const { container } = render(<CoursesPage />, { wrapper: TrpcProvider });

    await waitFor(() => {
      const nav = container.querySelector('nav');
      expect(nav).not.toBeNull();
    });
  });

  test('displays courses when loaded', async () => {
    render(<CoursesPage />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.queryByText('The Future of AI')).not.toBeNull();
      expect(screen.queryByText('AI Governance')).not.toBeNull();
    });
  });
});
