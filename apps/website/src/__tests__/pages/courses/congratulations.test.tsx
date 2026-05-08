import { render, waitFor } from '@testing-library/react';
import {
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { TrpcProvider } from '../../trpcProvider';
import { server, trpcMsw } from '../../trpcMswSetup';
import { createMockUnit } from '../../testUtils';
import CongratulationsPage from '../../../pages/courses/[courseSlug]/congratulations';

const mockReplace = vi.fn();

vi.mock('next/router', () => ({
  useRouter: vi.fn(() => ({
    query: { courseSlug: 'test-course' },
    pathname: '/courses/test-course/congratulations',
    replace: mockReplace,
    push: vi.fn(),
  })),
}));

vi.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const UNITS = [
  createMockUnit({ unitNumber: '1', title: 'Unit One' }),
  createMockUnit({ unitNumber: '2', title: 'Unit Two' }),
];

const ALL_UNIT_CHUNKS: Record<string, { id: string; chunkTitle: string; chunkOrder: string; estimatedTime: number | null }[]> = {
  'unit-1': [{
    id: 'chunk-1', chunkTitle: 'Chunk 1', chunkOrder: '1', estimatedTime: null,
  }],
  'unit-2': [{
    id: 'chunk-2', chunkTitle: 'Chunk 2', chunkOrder: '1', estimatedTime: null,
  }],
};

const DEFAULT_PROPS = {
  courseSlug: 'test-course',
  courseId: 'course-id',
  courseTitle: 'Test Course',
  units: UNITS,
  allUnitChunks: ALL_UNIT_CHUNKS,
};

describe('CongratulationsPage', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    server.use(trpcMsw.groupDiscussions.getByCourseSlug.query(() => null));
  });

  test('redirects to first unit when user is ineligible (action-plan-pending)', async () => {
    server.use(trpcMsw.certificates.getStatus.query(() => ({
      status: 'action-plan-pending' as const,
      meetPersonId: 'mp1',
      hasSubmittedActionPlan: false,
      isLastDiscussionSoonOrPassed: false,
    })));

    render(<CongratulationsPage {...DEFAULT_PROPS} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/courses/test-course/1/1');
    });
  });

  test('redirects when user is a facilitator', async () => {
    server.use(trpcMsw.certificates.getStatus.query(() => ({ status: 'is-facilitator' as const })));

    render(<CongratulationsPage {...DEFAULT_PROPS} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/courses/test-course/1/1');
    });
  });

  test('renders content when user has certificate', async () => {
    server.use(trpcMsw.certificates.getStatus.query(() => ({
      status: 'has-certificate' as const,
      certificateId: 'cert-1',
      certificateCreatedAt: Math.floor(Date.now() / 1000),
      courseName: 'Test Course',
      courseSlug: 'test-course',
      courseDetailsUrl: '/courses/test-course',
      recipientName: 'Jane Smith',
      certificationDescription: 'Completed the course.',
    })));

    const { container } = render(<CongratulationsPage {...DEFAULT_PROPS} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
      expect(container.querySelector('.sidebar')).not.toBeNull();
    });
  });

  test('redirects when FOAI exercises are still incomplete', async () => {
    server.use(trpcMsw.certificates.getStatus.query(() => ({ status: 'exercises-incomplete' as const })));

    render(<CongratulationsPage {...DEFAULT_PROPS} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/courses/test-course/1/1');
    });
  });

  test('does not redirect when attendance-ineligible but last discussion passed', async () => {
    server.use(trpcMsw.certificates.getStatus.query(() => ({
      status: 'attendance-ineligible' as const,
      uniqueDiscussionAttendance: 2,
      numUnits: 5,
      isLastDiscussionSoonOrPassed: true,
    })));

    const { container } = render(<CongratulationsPage {...DEFAULT_PROPS} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
      expect(container.querySelector('.sidebar')).not.toBeNull();
    });
  });

  test('redirects when attendance-ineligible and last discussion has not yet passed', async () => {
    server.use(trpcMsw.certificates.getStatus.query(() => ({
      status: 'attendance-ineligible' as const,
      uniqueDiscussionAttendance: 2,
      numUnits: 5,
      isLastDiscussionSoonOrPassed: false,
    })));

    render(<CongratulationsPage {...DEFAULT_PROPS} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/courses/test-course/1/1');
    });
  });
});
