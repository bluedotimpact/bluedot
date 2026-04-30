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

const mockApplyCTAProps = {
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
    server.use(trpcMsw.certificates.getStatus.query(() => ({ status: 'not-eligible' as const })));
  });

  test('shows ProgressDots while getApplyCTAProps is loading', () => {
    // No handler - query stays pending
    const { container } = render(<CourseCompletionSection {...defaultProps} />, { wrapper: TrpcProvider });

    expect(container.querySelector('.progress-dots')).toBeTruthy();
    expect(container.querySelector('.congratulations')).toBeFalsy();
  });

  test('shows enrollment CTA when rounds are available and user has not applied', async () => {
    server.use(
      trpcMsw.courseRounds.getApplyCTAProps.query(() => mockApplyCTAProps),
      trpcMsw.courseRounds.getRoundsForCourse.query(() => mockRounds),
    );

    const { container } = render(<CourseCompletionSection {...defaultProps} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(container.textContent).toContain('Join a facilitated cohort to get certified');
    });

    expect(container.querySelector('.congratulations')).toBeFalsy();
  });

  test('shows Congratulations when getApplyCTAProps returns null', async () => {
    server.use(trpcMsw.courseRounds.getApplyCTAProps.query(() => null));

    const { container } = render(<CourseCompletionSection {...defaultProps} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(container.querySelector('.congratulations')).toBeTruthy();
    });
    expect(container.textContent).not.toContain('Join a facilitated cohort');
  });

  test('shows Congratulations when user has already applied', async () => {
    server.use(trpcMsw.courseRounds.getApplyCTAProps.query(() => ({ ...mockApplyCTAProps, hasApplied: true })));

    const { container } = render(<CourseCompletionSection {...defaultProps} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(container.querySelector('.congratulations')).toBeTruthy();
    });
    expect(container.textContent).not.toContain('Join a facilitated cohort');
  });

  test('shows Congratulations when no rounds are available', async () => {
    server.use(
      trpcMsw.courseRounds.getApplyCTAProps.query(() => mockApplyCTAProps),
      trpcMsw.courseRounds.getRoundsForCourse.query(() => ({ intense: [], partTime: [] })),
    );

    const { container } = render(<CourseCompletionSection {...defaultProps} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(container.querySelector('.congratulations')).toBeTruthy();
    });
    expect(container.textContent).not.toContain('Join a facilitated cohort');
  });
});
