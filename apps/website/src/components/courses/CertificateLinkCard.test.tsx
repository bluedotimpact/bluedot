import { useAuthStore } from '@bluedot/ui';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { createMockCourseRegistration } from '../../__tests__/testUtils';
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
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2024-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Not authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(null);
    });

    test('renders regular course', () => {
      render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      // Verify login prompt is shown
      expect(screen.getByText('Your Certificate')).toBeTruthy();
      expect(screen.getByText('Create a free account to collect course certificates.')).toBeTruthy();
      expect(screen.getByText('Log in')).toBeTruthy();
    });

    test('renders FoAI course with different content', () => {
      render(<CertificateLinkCard courseId={FOAI_COURSE_ID} />, { wrapper: TrpcProvider });

      // Verify FoAI-specific content
      expect(screen.getByText("Download your certificate, show you're taking AI seriously")).toBeTruthy();
      expect(screen.getByText('Complete all answers to unlock your certificate, then share your accomplishment on social media.')).toBeTruthy();
      expect(screen.getByText('Download Certificate')).toBeTruthy();
    });
  });

  describe('Authenticated states', () => {
    const mockAuth = { token: 'test-token', expiresAt: Date.now() + 10000 };

    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(mockAuth as ReturnType<typeof useAuthStore>);
    });

    test('renders loading state', () => {
      // Don't set up a handler - this will keep the component in loading state
      render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      // Verify loading indicator is shown
      expect(screen.getByText('Your Certificate')).toBeTruthy();
      // Check for progress dots (ProgressDots component)
      expect(document.querySelector('.progress-dots')).toBeTruthy();
    });

    test('renders course without certificate - non-FoAI shows not eligible', async () => {
      // Mock query response with no certificate for non-FoAI course
      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(() => createMockCourseRegistration({
          courseId: 'rec123456789',
          certificateId: null,
        })),
      );

      render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      // Wait for the query to complete and verify not eligible message
      await waitFor(() => {
        expect(screen.getByText("This course doesn't currently issue certificates to independent learners. Join a facilitated version to get a certificate.")).toBeTruthy();
      });
      expect(screen.getByText('Your Certificate')).toBeTruthy();
      // Community section should NOT appear for non-FoAI courses
      expect(screen.queryByText('Join the Community')).toBeNull();
    });

    test('renders course without certificate - FoAI shows request button', async () => {
      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(({input}) => createMockCourseRegistration({
          courseId: input.courseId,
          certificateId: null,
          email: 'user@example.com',
          fullName: 'Test User',
        })),
      );

      render(<CertificateLinkCard courseId={FOAI_COURSE_ID} />, { wrapper: TrpcProvider });

      // Wait for the query to complete and verify download certificate button is shown
      await waitFor(() => {
        expect(screen.getByText('Download Certificate')).toBeTruthy();
      });

      // Verify the button is actually a button element using React Testing Library best practices
      const downloadButton = screen.getByRole('button', { name: 'Download Certificate' });
      expect(downloadButton).toBeTruthy();

      // Verify FoAI-specific content is shown
      expect(screen.getByText("Download your certificate, show you're taking AI seriously")).toBeTruthy();
      expect(screen.getByText('Complete all answers to unlock your certificate, then share your accomplishment on social media.')).toBeTruthy();

      // Verify community section DOES appear for FoAI course
      expect(screen.getByText('Join the Community')).toBeTruthy();
    });

    test('renders regular course with certificate - no community section', async () => {
      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(() => createMockCourseRegistration({
          courseId: 'rec123456789',
          certificateId: 'cert123',
          certificateCreatedAt: 1704067200, // 2024-01-01 in Unix timestamp
        })),
      );

      render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      // Wait for the query to complete and verify certificate content
      await waitFor(() => {
        expect(screen.getByText('Earned by Test User')).toBeTruthy();
      });
      // Use a flexible date check to tolerate locale-specific ordering
      expect(screen.getByText(/^\s*Issued on .*20\d{2}/)).toBeTruthy();
      expect(screen.getByText('View Certificate')).toBeTruthy();

      // Verify the certificate link opens in a new tab
      const viewCertificateLink = screen.getByRole('link', { name: 'View Certificate' });
      expect(viewCertificateLink.getAttribute('target')).toBe('_blank');

      // Community section should NOT appear for regular courses
      expect(screen.queryByText('Join the Community')).toBeNull();
    });

    test('renders FoAI course with certificate - includes community section', async () => {
      server.use(
        trpcMsw.courseRegistrations.getByCourseId.query(() => createMockCourseRegistration({
          courseId: FOAI_COURSE_ID,
          certificateId: 'cert123',
          certificateCreatedAt: 1704067200, // 2024-01-01 in Unix timestamp
        })),
      );

      render(<CertificateLinkCard courseId={FOAI_COURSE_ID} />, { wrapper: TrpcProvider });

      // Wait for the query to complete and verify certificate content
      await waitFor(() => {
        expect(screen.getByText('Earned by Test User')).toBeTruthy();
      });
      expect(screen.getByText('View Certificate')).toBeTruthy();

      // Community section SHOULD appear for FoAI course
      expect(screen.getByText('Join the Community')).toBeTruthy();
    });
  });
});
