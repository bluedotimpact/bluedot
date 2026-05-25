import { render, waitFor } from '@testing-library/react';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { createMockRound } from '../../__tests__/testUtils';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import CourseCompletionSection from './CourseCompletionSection';

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/courses/agi-strategy/5/2',
    query: {},
    asPath: '/courses/agi-strategy/5/2',
  }),
}));

const mockApplication = {
  applicationDeadline: '15 Jan',
  applicationUrl: 'https://bluedot.org/apply',
  hasApplied: false,
};

const mockRounds = {
  intense: [createMockRound({ dateRange: '20 – 24 Jan' })],
  partTime: [createMockRound({ intensity: 'part-time', dateRange: '17 Feb – 24 Mar', numberOfUnits: 6 })],
};

const defaultProps = {
  courseId: 'course-1',
  courseTitle: 'AGI Strategy',
  courseSlug: 'agi-strategy',
};

describe('CourseCompletionSection', () => {
  beforeEach(() => {
    server.use(trpcMsw.certificates.getStatus.query(() => ({ status: 'not-eligible' as const, hasUpcomingRounds: true })));
  });

  test('shows ProgressDots while getCourseApplication is loading', () => {
    // No handler - query stays pending
    const { container } = render(<CourseCompletionSection {...defaultProps} />, { wrapper: TrpcProvider });

    expect(container.querySelector('.progress-dots')).toBeTruthy();
    expect(container.querySelector('.congratulations')).toBeFalsy();
  });

  test('shows enrollment CTA when rounds are available and user has not applied', async () => {
    server.use(
      trpcMsw.courseRounds.getCourseApplication.query(() => mockApplication),
      trpcMsw.courseRounds.getRoundsForCourse.query(() => mockRounds),
    );

    const { container } = render(<CourseCompletionSection {...defaultProps} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(container.textContent).toContain('Join the next AGI Strategy cohort');
    });

    expect(container.querySelector('.congratulations')).toBeFalsy();
  });

  test('shows Congratulations when getCourseApplication returns null', async () => {
    server.use(trpcMsw.courseRounds.getCourseApplication.query(() => null));

    const { container } = render(<CourseCompletionSection {...defaultProps} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(container.querySelector('.congratulations')).toBeTruthy();
    });
    expect(container.textContent).not.toContain('Join a facilitated cohort');
  });

  test('shows Congratulations when user has already applied', async () => {
    server.use(trpcMsw.courseRounds.getCourseApplication.query(() => ({ ...mockApplication, hasApplied: true })));

    const { container } = render(<CourseCompletionSection {...defaultProps} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(container.querySelector('.congratulations')).toBeTruthy();
    });
    expect(container.textContent).not.toContain('Join a facilitated cohort');
  });

  test('shows Congratulations when no rounds are available', async () => {
    server.use(
      trpcMsw.courseRounds.getCourseApplication.query(() => mockApplication),
      trpcMsw.courseRounds.getRoundsForCourse.query(() => ({ intense: [], partTime: [] })),
    );

    const { container } = render(<CourseCompletionSection {...defaultProps} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(container.querySelector('.congratulations')).toBeTruthy();
    });
    expect(container.textContent).not.toContain('Join a facilitated cohort');
  });

  test('caps each round group to the next 3 upcoming rounds', async () => {
    server.use(
      trpcMsw.courseRounds.getCourseApplication.query(() => mockApplication),
      trpcMsw.courseRounds.getRoundsForCourse.query(() => ({
        intense: [
          createMockRound({ dateRange: '1 – 5 Jun' }),
          createMockRound({ dateRange: '15 – 19 Jun' }),
          createMockRound({ dateRange: '29 Jun – 3 Jul' }),
          createMockRound({ dateRange: '13 – 17 Jul' }),
          createMockRound({ dateRange: '27 – 31 Jul' }),
        ],
        partTime: [
          createMockRound({ intensity: 'part-time', dateRange: '1 Jun – 5 Jul' }),
          createMockRound({ intensity: 'part-time', dateRange: '6 Jul – 9 Aug' }),
          createMockRound({ intensity: 'part-time', dateRange: '3 Aug – 6 Sep' }),
          createMockRound({ intensity: 'part-time', dateRange: '7 Sep – 12 Oct' }),
        ],
      })),
    );

    const { container } = render(<CourseCompletionSection {...defaultProps} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(container.textContent).toContain('Join the next AGI Strategy cohort');
    });

    const applyLinks = Array.from(container.querySelectorAll('a')).filter((a) => a.textContent?.trim() === 'Apply now');
    expect(applyLinks).toHaveLength(6);

    expect(container.textContent).toContain('29 Jun – 3 Jul');
    expect(container.textContent).not.toContain('13 – 17 Jul');
    expect(container.textContent).toContain('3 Aug – 6 Sep');
    expect(container.textContent).not.toContain('7 Sep – 12 Oct');
  });
});
