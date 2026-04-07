import { useAuthStore } from '@bluedot/ui';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
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
      expect(screen.getByText('Download your certificate, show you\'re taking AI seriously')).toBeInTheDocument();
      expect(screen.getByText('Complete all exercises to unlock your certificate, then share your accomplishment on social media.')).toBeInTheDocument();
      expect(screen.getByText('Download Certificate')).toBeInTheDocument();
      expect(screen.getByText('Want to go deeper?')).toBeInTheDocument();
      expect(screen.getByText('Apply now')).toBeInTheDocument();
    });
  });

  describe('Authenticated states', () => {
    const mockAuth = { token: 'test-token', expiresAt: Date.now() + 10000 };

    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(mockAuth as ReturnType<typeof useAuthStore>);
    });

    test('renders loading state', () => {
      // Never resolves to simulate loading
      server.use(trpcMsw.certificates.getStatus.query(() => new Promise(() => {})));
      render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      // Verify loading indicator is shown
      expect(screen.getByText('Your Certificate')).toBeInTheDocument();
      // Check for progress dots (ProgressDots component)
      expect(document.querySelector('.progress-dots')).toBeInTheDocument();
    });

    test('renders null when action-plan-pending (ActionPlanCard shows instead)', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'action-plan-pending',
        meetPersonId: 'meet123',
        hasSubmittedActionPlan: false,
      })));

      const { container } = render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      // Wait for queries to complete and verify card returns null (ActionPlanCard will show instead)
      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    test('renders not-eligible message', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'not-eligible',
      })));

      render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByText('Your Certificate')).toBeInTheDocument();
        expect(screen.getByText('This course doesn\'t currently issue certificates to independent learners. Join a facilitated version to get a certificate.')).toBeInTheDocument();
      });

      // Should NOT show Request Certificate button
      expect(screen.queryByText('Request Certificate')).toBeNull();
    });

    test('renders error state when getStatus fails', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => {
        throw new Error('Failed to fetch certificate status');
      }));

      render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    test('renders course without certificate - FoAI shows request button', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'can-request',
      })));

      render(<CertificateLinkCard courseId={FOAI_COURSE_ID} />, { wrapper: TrpcProvider });

      // Wait for the query to complete and verify download certificate button is shown
      await waitFor(() => {
        expect(screen.getByText('Download Certificate')).toBeInTheDocument();
      });

      // Verify the button is actually a button element using React Testing Library best practices
      const downloadButton = screen.getByRole('button', { name: 'Download Certificate' });
      expect(downloadButton).toBeInTheDocument();

      // Verify FoAI-specific content is shown
      expect(screen.getByText('Download your certificate, show you\'re taking AI seriously')).toBeInTheDocument();
      expect(screen.getByText('Complete all exercises to unlock your certificate, then share your accomplishment on social media.')).toBeInTheDocument();

      // Verify AGI Strategy follow-on section appears for FoAI course
      expect(screen.getByText('Want to go deeper?')).toBeInTheDocument();
      expect(screen.getByText('Apply now')).toBeInTheDocument();
    });

    test('renders regular course with certificate - no community section', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'has-certificate',
        certificateId: 'cert123',
        issuedAt: 1704067200, // 2024-01-01 in Unix timestamp
        holderName: 'Test User',
      })));

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

      // FoAI-specific follow-on section should NOT appear for regular courses
      expect(screen.queryByText('Want to go deeper?')).toBeNull();
    });

    test('renders FoAI course with certificate - ends at view certificate', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'has-certificate',
        certificateId: 'cert123',
        issuedAt: 1704067200,
        holderName: 'Test User',
      })));

      render(<CertificateLinkCard courseId={FOAI_COURSE_ID} />, { wrapper: TrpcProvider });

      // Wait for the query to complete and verify certificate content
      await waitFor(() => {
        expect(screen.getByText('Earned by Test User')).toBeInTheDocument();
      });
      expect(screen.getByText('View Certificate')).toBeInTheDocument();

      // The certificate card should end after the certificate details and CTA
      expect(screen.queryByText('Want to go deeper?')).toBeNull();
      expect(screen.queryByText('Apply now')).toBeNull();
    });

    test('renders facilitator-pending message without request button', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'facilitator-pending',
      })));

      render(<CertificateLinkCard courseId="rec123456789" />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByText('Your Certificate')).toBeInTheDocument();
        expect(screen.getByText('To be eligible for a certificate, you need to submit your action plan/project and miss no more than 1 discussion.')).toBeInTheDocument();
      });

      expect(screen.queryByText('Request Certificate')).toBeNull();
    });
  });
});
