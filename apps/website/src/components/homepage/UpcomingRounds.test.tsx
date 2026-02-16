import {
  describe, it, expect, vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UpcomingRounds } from './UpcomingRounds';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { trpc } from '../../utils/trpc';

vi.mock('../../utils/trpc', () => ({
  trpc: {
    courseRounds: {
      getAllUpcomingRounds: {
        useQuery: vi.fn(),
      },
    },
  },
}));

describe('UpcomingRounds', () => {
  it('uses applyUrl from round data to construct application links', () => {
    const mockApplyUrl = 'https://web.miniextensions.com/test-form';
    const mockRoundId = 'round-123';

    vi.mocked(trpc.courseRounds.getAllUpcomingRounds.useQuery).mockReturnValue({
      data: {
        intense: [
          {
            id: mockRoundId,
            courseId: 'course-1',
            courseTitle: 'Test Course',
            courseSlug: 'test-course',
            applyUrl: mockApplyUrl,
            intensity: 'intensive',
            applicationDeadline: '15 Jan',
            applicationDeadlineRaw: '2025-01-15',
            firstDiscussionDateRaw: '2025-02-01',
            dateRange: '1 Feb – 14 Feb',
            numberOfUnits: 14,
          },
        ],
        partTime: [],
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof trpc.courseRounds.getAllUpcomingRounds.useQuery>);

    render(<UpcomingRounds />, { wrapper: TrpcProvider });

    const applyLinks = screen.getAllByLabelText(/apply now/i);
    expect(applyLinks.length).toBeGreaterThan(0);

    const firstLink = applyLinks[0];
    expect(firstLink).toHaveAttribute('href');
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const href = firstLink?.getAttribute('href') || '';

    expect(href).toContain(mockApplyUrl);
    expect(href).toContain(`prefill_%5B%3E%5D%20Round=${mockRoundId}`);
  });

  it('renders empty apply link when applyUrl is null', () => {
    vi.mocked(trpc.courseRounds.getAllUpcomingRounds.useQuery).mockReturnValue({
      data: {
        intense: [
          {
            id: 'round-123',
            courseId: 'course-1',
            courseTitle: 'Test Course',
            courseSlug: 'test-course',
            applyUrl: null,
            intensity: 'intensive',
            applicationDeadline: '15 Jan',
            applicationDeadlineRaw: '2025-01-15',
            firstDiscussionDateRaw: '2025-02-01',
            dateRange: '1 Feb – 14 Feb',
            numberOfUnits: 14,
          },
        ],
        partTime: [],
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof trpc.courseRounds.getAllUpcomingRounds.useQuery>);

    render(<UpcomingRounds />, { wrapper: TrpcProvider });

    const applyLinks = screen.getAllByLabelText(/apply now/i);
    expect(applyLinks.length).toBeGreaterThan(0);

    const firstLink = applyLinks[0];
    expect(firstLink).toHaveAttribute('href', '');
  });

  it('shows loading state', () => {
    vi.mocked(trpc.courseRounds.getAllUpcomingRounds.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof trpc.courseRounds.getAllUpcomingRounds.useQuery>);

    render(<UpcomingRounds />, { wrapper: TrpcProvider });

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('returns null when no data', () => {
    vi.mocked(trpc.courseRounds.getAllUpcomingRounds.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as ReturnType<typeof trpc.courseRounds.getAllUpcomingRounds.useQuery>);

    const { container } = render(<UpcomingRounds />, { wrapper: TrpcProvider });

    expect(container.firstChild).toBeNull();
  });
});
