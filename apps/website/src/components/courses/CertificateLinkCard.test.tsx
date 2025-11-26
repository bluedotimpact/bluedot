import { useAuthStore } from '@bluedot/ui';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { createMockCourseRegistration, createMockMeetPerson } from '../../__tests__/testUtils';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { FOAI_COURSE_ID } from '../../lib/constants';
import CertificateLinkCard from './CertificateLinkCard';

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    useAuthStore: vi.fn(),
  };
});

describe('CertificateLinkCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      asPath: '/courses/test-course',
    } as ReturnType<typeof useRouter>);
  });

  describe('Not authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(null);
    });

    test('renders regular course', () => {
      render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      // Verify login prompt is shown
      expect(screen.getByText('Your Certificate')).toBeInTheDocument();
      expect(screen.getByText('Create a free account to earn your course certificate.')).toBeInTheDocument();
      expect(screen.getByText('Log in')).toBeInTheDocument();
    });

    test('renders FoAI course with different content', () => {
      render(<CertificateLinkCard courseId={FOAI_COURSE_ID} />, { wrapper: TrpcProvider });

      // Verify FoAI-specific content
      expect(screen.getByText("Download your certificate, show you're taking AI seriously")).toBeInTheDocument();
      expect(
        screen.getByText(
          'Complete all exercises to unlock your certificate, then share your accomplishment on social media.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('Download Certificate')).toBeInTheDocument();
    });
  });

  describe('Authenticated states', () => {
    const mockAuth = { token: 'test-token', expiresAt: Date.now() + 10000 };

    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(mockAuth as ReturnType<typeof useAuthStore>);
    });

    test('renders loading state', () => {
      // Never resolves to simulate loading
      server.use(trpcMsw.courseRegistrations.getByCourseId.query(() => new Promise(() => {})));
      render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      // Verify loading indicator is shown
      expect(screen.getByText('Your Certificate')).toBeInTheDocument();
      // Check for progress dots (ProgressDots component)
      expect(document.querySelector('.progress-dots')).toBeInTheDocument();
    });

    test('renders course without certificate - non-FoAI with meetPerson returns null (ActionPlanCard shows instead)', async () => {
      // Mock query response with no certificate for non-FoAI course with meetPerson record
      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(({ input }) => createMockCourseRegistration({
          courseId: input.courseId,
          certificateId: null,
        })),
        trpcMsw.meetPerson.getByCourseRegistrationId.query(() => createMockMeetPerson({
          role: 'Participant',
          projectSubmission: [], // No action plan submitted
        })),
      );

      const { container } = render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      // Wait for queries to complete and verify card returns null (ActionPlanCard will show instead)
      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    test('renders course without certificate - non-FoAI without meetPerson shows certificate card as fallback', async () => {
      // Mock query with no certificate and meetPerson returns null
      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(({ input }) => createMockCourseRegistration({
          courseId: input.courseId,
          certificateId: null,
        })),
        trpcMsw.meetPerson.getByCourseRegistrationId.query(() => null),
      );

      render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      // Should show certificate card as safe fallback when meetPerson is null (edge case)
      // Since meetPerson is null, dynamic subtitle shows non-participant version (no action plan mention)
      await waitFor(() => {
        expect(screen.getByText('Your Certificate')).toBeInTheDocument();
        expect(screen.getByText("If you've engaged in >80% of discussions, you'll receive a certificate.")).toBeInTheDocument();
        expect(screen.getByText('Request Certificate')).toBeInTheDocument();
      });
    });

    test('renders course without certificate when meetPerson errors - shows request certificate as fallback', async () => {
      // Mock query with no certificate and meetPerson query errors
      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(({ input }) => createMockCourseRegistration({
          courseId: input.courseId,
          certificateId: null,
        })),
        trpcMsw.meetPerson.getByCourseRegistrationId.query(() => {
          throw new Error('Failed to fetch meetPerson');
        }),
      );

      render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      // Should show request certificate as fallback when meetPerson errors
      // Note: meetPerson is undefined due to error, so dynamic subtitle shows non-participant version (no action plan mention)
      await waitFor(() => {
        expect(screen.getByText('Your Certificate')).toBeInTheDocument();
        expect(screen.getByText("If you've engaged in >80% of discussions, you'll receive a certificate.")).toBeInTheDocument();
        expect(screen.getByText('Request Certificate')).toBeInTheDocument();
      });
    });

    test('renders course without certificate - FoAI shows request button', async () => {
      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(({ input }) => createMockCourseRegistration({
          courseId: input.courseId,
          certificateId: null,
          email: 'user@example.com',
          fullName: 'Test User',
        })),
        trpcMsw.meetPerson.getByCourseRegistrationId.query(() => createMockMeetPerson()),
      );

      render(<CertificateLinkCard courseId={FOAI_COURSE_ID} />, { wrapper: TrpcProvider });

      // Wait for the query to complete and verify download certificate button is shown
      await waitFor(() => {
        expect(screen.getByText('Download Certificate')).toBeInTheDocument();
      });

      // Verify the button is actually a button element using React Testing Library best practices
      const downloadButton = screen.getByRole('button', { name: 'Download Certificate' });
      expect(downloadButton).toBeInTheDocument();

      // Verify FoAI-specific content is shown
      expect(screen.getByText("Download your certificate, show you're taking AI seriously")).toBeInTheDocument();
      expect(
        screen.getByText(
          'Complete all exercises to unlock your certificate, then share your accomplishment on social media.',
        ),
      ).toBeInTheDocument();

      // Verify community section DOES appear for FoAI course
      expect(screen.getByText('Join the Community')).toBeInTheDocument();
    });

    test('renders regular course with certificate - no community section', async () => {
      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(({ input }) => createMockCourseRegistration({
          courseId: input.courseId,
          certificateId: 'cert123',
          certificateCreatedAt: 1704067200, // 2024-01-01 in Unix timestamp
        })),
        trpcMsw.meetPerson.getByCourseRegistrationId.query(() => createMockMeetPerson()),
      );

      render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      // Wait for the query to complete and verify certificate content
      await waitFor(() => {
        expect(screen.getByText('Earned by Test User')).toBeInTheDocument();
      });
      // Use a flexible date check to tolerate locale-specific ordering
      expect(screen.getByText(/^\s*Issued on .*20\d{2}/)).toBeInTheDocument();
      expect(screen.getByText('View Certificate')).toBeInTheDocument();

      // Verify the certificate link opens in a new tab
      const viewCertificateLink = screen.getByRole('link', { name: 'View Certificate' });
      expect(viewCertificateLink.getAttribute('target')).toBe('_blank');

      // Community section should NOT appear for regular courses
      expect(screen.queryByText('Join the Community')).toBeNull();
    });

    test('renders FoAI course with certificate - includes community section', async () => {
      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(({ input }) => createMockCourseRegistration({
          courseId: input.courseId,
          certificateId: 'cert123',
          certificateCreatedAt: 1704067200, // 2024-01-01 in Unix timestamp
        })),
        trpcMsw.meetPerson.getByCourseRegistrationId.query(() => createMockMeetPerson()),
      );

      render(<CertificateLinkCard courseId={FOAI_COURSE_ID} />, { wrapper: TrpcProvider });

      // Wait for the query to complete and verify certificate content
      await waitFor(() => {
        expect(screen.getByText('Earned by Test User')).toBeInTheDocument();
      });
      expect(screen.getByText('View Certificate')).toBeInTheDocument();

      // Community section SHOULD appear for FoAI course
      expect(screen.getByText('Join the Community')).toBeInTheDocument();
    });

    test('renders Facilitator without certificate - shows certificate card immediately', async () => {
      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(({ input }) => createMockCourseRegistration({
          courseId: input.courseId,
          certificateId: null,
        })),
        trpcMsw.meetPerson.getByCourseRegistrationId.query(() => createMockMeetPerson({
          role: 'Facilitator',
        })),
      );

      render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByText('Your Certificate')).toBeInTheDocument();
        expect(screen.getByText("If you've engaged in >80% of discussions, you'll receive a certificate.")).toBeInTheDocument();
        expect(screen.getByText('Request Certificate')).toBeInTheDocument();
      });
    });

    test('renders Participant without certificate - returns null (ActionPlanCard shows)', async () => {
      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(({ input }) => createMockCourseRegistration({
          courseId: input.courseId,
          certificateId: null,
        })),
        trpcMsw.meetPerson.getByCourseRegistrationId.query(() => createMockMeetPerson({
          role: 'Participant',
          projectSubmission: [],
        })),
      );

      const { container } = render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    test('renders facilitator role with case variations - shows certificate card', async () => {
      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(({ input }) => createMockCourseRegistration({
          courseId: input.courseId,
          certificateId: null,
        })),
        trpcMsw.meetPerson.getByCourseRegistrationId.query(() => createMockMeetPerson({
          role: 'facilitator',
        })),
      );

      render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByText('Your Certificate')).toBeInTheDocument();
        expect(screen.getByText("If you've engaged in >80% of discussions, you'll receive a certificate.")).toBeInTheDocument();
      });
    });
  });
});
