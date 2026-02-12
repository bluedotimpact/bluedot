import { useAuthStore } from '@bluedot/ui';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { createMockCourseRegistration, createMockMeetPerson } from '../../__tests__/testUtils';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { FOAI_COURSE_ID } from '../../lib/constants';
import ActionPlanCard from './ActionPlanCard';

vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    useAuthStore: vi.fn(),
  };
});

describe('ActionPlanCard', () => {
  const FACILITATED_COURSE_ID = 'rec123456789';
  const mockAuth = { token: 'test-token', expiresAt: Date.now() + 10000 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component states', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(mockAuth as ReturnType<typeof useAuthStore>);
    });

    test('shows loading state while fetching data', () => {
      // Never resolves to simulate loading
      server.use(trpcMsw.courseRegistrations.getByCourseId.query(() => new Promise(() => {})));

      render(<ActionPlanCard courseId={FACILITATED_COURSE_ID} />, { wrapper: TrpcProvider });

      // Verify loading state
      expect(screen.getByText('Your Certificate')).toBeInTheDocument();
      expect(document.querySelector('.progress-dots')).toBeInTheDocument();
    });

    test('shows error state when query fails', async () => {
      server.use(trpcMsw.courseRegistrations.getByCourseId.query(() => {
        throw new Error('Failed to fetch');
      }));

      render(<ActionPlanCard courseId={FACILITATED_COURSE_ID} />, { wrapper: TrpcProvider });

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Your Certificate')).toBeInTheDocument();
        expect(screen.getAllByText(/Error:/)[0]).toBeInTheDocument();
      });
    });
  });

  describe('User journey scenarios', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(mockAuth as ReturnType<typeof useAuthStore>);
    });

    test('Scenario 1: Facilitated course, no certificate, no action plan → shows ActionPlanCard', async () => {
      const mockMeetPerson = createMockMeetPerson({
        id: 'recABC123',
        role: 'Participant',
        projectSubmission: [],
      });

      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(() => createMockCourseRegistration({
          courseId: FACILITATED_COURSE_ID,
          certificateId: null,
        })),
        trpcMsw.meetPerson.getByCourseRegistrationId.query(() => mockMeetPerson),
      );

      render(<ActionPlanCard courseId={FACILITATED_COURSE_ID} />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByText('Your Certificate')).toBeInTheDocument();
        expect(screen.getByText('To be eligible for a certificate, you need to submit your action plan/project and miss no more than 1 discussion.')).toBeInTheDocument();
      });

      // Verify button and URL
      const submitButton = screen.getByRole('link', { name: 'Submit here' });
      expect(submitButton.getAttribute('href')).toBe('https://web.miniextensions.com/7WZKkZiusMiAO1RMznFv?prefill_Participant=recABC123');
      expect(submitButton.getAttribute('target')).toBe('_blank');
    });

    test('Scenario 2: Facilitated course, no certificate, action plan submitted → shows disabled button', async () => {
      const mockMeetPerson = createMockMeetPerson({
        id: 'recABC123',
        role: 'Participant',
        projectSubmission: ['submission-1'],
      });

      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(() => createMockCourseRegistration({
          courseId: FACILITATED_COURSE_ID,
          certificateId: null,
        })),
        trpcMsw.meetPerson.getByCourseRegistrationId.query(() => mockMeetPerson),
      );

      render(<ActionPlanCard courseId={FACILITATED_COURSE_ID} />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByText('Your Certificate')).toBeInTheDocument();
        expect(screen.getByText('To be eligible for a certificate, you need to submit your action plan/project and miss no more than 1 discussion.')).toBeInTheDocument();
      });

      // Verify button shows submitted state
      const submitButton = screen.getByRole('link', { name: 'Submitted!' });
      expect(submitButton.getAttribute('href')).toBe('https://web.miniextensions.com/7WZKkZiusMiAO1RMznFv?prefill_Participant=recABC123');
      // The button should have disabled styling classes
      expect(submitButton).toHaveClass('disabled:opacity-50', 'disabled:pointer-events-none');
    });

    test('Scenario 3: Facilitated course, has certificate → returns null', async () => {
      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(() => createMockCourseRegistration({
          courseId: FACILITATED_COURSE_ID,
          certificateId: 'cert123',
        })),
        trpcMsw.meetPerson.getByCourseRegistrationId.query(() => createMockMeetPerson()),
      );

      const { container } = render(
        <ActionPlanCard courseId={FACILITATED_COURSE_ID} />,
        { wrapper: TrpcProvider },
      );

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    test('Scenario 4: FOAI (self-paced) course → returns null', async () => {
      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(() => createMockCourseRegistration({
          courseId: FOAI_COURSE_ID,
          certificateId: null,
        })),
        trpcMsw.meetPerson.getByCourseRegistrationId.query(() => createMockMeetPerson()),
      );

      const { container } = render(
        <ActionPlanCard courseId={FOAI_COURSE_ID} />,
        { wrapper: TrpcProvider },
      );

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    test('Scenario 5: No meetPerson record → returns null', async () => {
      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(() => createMockCourseRegistration({
          courseId: FACILITATED_COURSE_ID,
          certificateId: null,
        })),
        trpcMsw.meetPerson.getByCourseRegistrationId.query(() => null),
      );

      const { container } = render(
        <ActionPlanCard courseId={FACILITATED_COURSE_ID} />,
        { wrapper: TrpcProvider },
      );

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    test('Scenario 6: Not logged in → returns null', () => {
      vi.mocked(useAuthStore).mockReturnValue(null);

      const { container } = render(
        <ActionPlanCard courseId={FACILITATED_COURSE_ID} />,
        { wrapper: TrpcProvider },
      );

      expect(container.firstChild).toBeNull();
    });

    test('Scenario 7: Facilitator role → returns null (no action plan needed)', async () => {
      const mockMeetPerson = createMockMeetPerson({
        id: 'recABC123',
        role: 'Facilitator',
        projectSubmission: [],
      });

      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(() => createMockCourseRegistration({
          courseId: FACILITATED_COURSE_ID,
          certificateId: null,
        })),
        trpcMsw.meetPerson.getByCourseRegistrationId.query(() => mockMeetPerson),
      );

      const { container } = render(
        <ActionPlanCard courseId={FACILITATED_COURSE_ID} />,
        { wrapper: TrpcProvider },
      );

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    test('Scenario 8: Null role → returns null (treated as non-participant)', async () => {
      const mockMeetPerson = createMockMeetPerson({
        id: 'recABC123',
        role: null,
        projectSubmission: [],
      });

      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(() => createMockCourseRegistration({
          courseId: FACILITATED_COURSE_ID,
          certificateId: null,
        })),
        trpcMsw.meetPerson.getByCourseRegistrationId.query(() => mockMeetPerson),
      );

      const { container } = render(
        <ActionPlanCard courseId={FACILITATED_COURSE_ID} />,
        { wrapper: TrpcProvider },
      );

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });
});
