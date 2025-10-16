import { render, screen } from '@testing-library/react';
import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import useAxios from 'axios-hooks';
import { useAuthStore } from '@bluedot/ui';
import { useRouter } from 'next/router';
import CertificateLinkCard from './CertificateLinkCard';
import { TrpcProvider } from '../../__tests__/trpcProvider';

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

vi.mock('axios-hooks');
vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    useAuthStore: vi.fn(),
  };
});

// Type helpers
type UseAxiosReturnType = ReturnType<typeof useAxios>;

describe('CertificateLinkCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      asPath: '/courses/test-course',
    } as ReturnType<typeof useRouter>);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01'));
  });

  describe('Not authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(null);
    });

    test('renders regular course', () => {
      render(
        <CertificateLinkCard courseId="rec123456789" />,
        { wrapper: TrpcProvider },
      );

      // Verify login prompt is shown
      expect(screen.getByText('Your Certificate')).toBeTruthy();
      expect(screen.getByText('Create a free account to collect course certificates.')).toBeTruthy();
      expect(screen.getByText('Log in')).toBeTruthy();
    });

    test('renders FoAI course with different content', () => {
      render(
        <CertificateLinkCard courseId="rec0Zgize0c4liMl5" />,
        { wrapper: TrpcProvider },
      );

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
      vi.mocked(useAxios).mockReturnValue([
        { data: undefined, loading: true, error: null },
        vi.fn(),
        vi.fn(),
      ] as UseAxiosReturnType);

      render(
        <CertificateLinkCard courseId="rec123456789" />,
        { wrapper: TrpcProvider },
      );

      // Verify loading indicator is shown
      expect(screen.getByText('Your Certificate')).toBeTruthy();
      // Check for progress dots (ProgressDots component)
      expect(document.querySelector('.progress-dots')).toBeTruthy();
    });

    test('renders course without certificate - non-FoAI shows not eligible', () => {
      vi.mocked(useAxios).mockReturnValue([
        {
          data: {
            courseRegistration: {
              courseId: 'rec123456789',
              certificateId: null,
              email: 'user@example.com',
              fullName: 'Test User',
            },
          },
          loading: false,
          error: null,
        },
        vi.fn(),
        vi.fn(),
      ] as UseAxiosReturnType);

      render(
        <CertificateLinkCard courseId="rec123456789" />,
        { wrapper: TrpcProvider },
      );

      // Verify not eligible message
      expect(screen.getByText('Your Certificate')).toBeTruthy();
      expect(screen.getByText("This course doesn't currently issue certificates to independent learners. Join a facilitated version to get a certificate.")).toBeTruthy();
      expect(screen.getByText('Join the Community')).toBeTruthy();
    });

    test('renders course without certificate - FoAI shows request button', () => {
      vi.mocked(useAxios).mockReturnValue([
        {
          data: {
            courseRegistration: {
              courseId: 'rec0Zgize0c4liMl5',
              certificateId: null,
              email: 'user@example.com',
              fullName: 'Test User',
            },
          },
          loading: false,
          error: null,
        },
        vi.fn(),
        vi.fn(),
      ] as UseAxiosReturnType);

      render(
        <CertificateLinkCard courseId="rec0Zgize0c4liMl5" />,
        { wrapper: TrpcProvider },
      );

      // Verify that download certificate button is shown for FoAI course
      expect(screen.getByText('Download Certificate')).toBeTruthy();

      // Verify the button is actually a button element using React Testing Library best practices
      const downloadButton = screen.getByRole('button', { name: 'Download Certificate' });
      expect(downloadButton).toBeTruthy();

      // Verify FoAI-specific content is shown
      expect(screen.getByText("Download your certificate, show you're taking AI seriously")).toBeTruthy();
      expect(screen.getByText('Complete all answers to unlock your certificate, then share your accomplishment on social media.')).toBeTruthy();
    });

    test('renders course with certificate (works for both regular and FoAI)', () => {
      vi.mocked(useAxios).mockReturnValue([
        {
          data: {
            courseRegistration: {
              courseId: 'rec123456789',
              certificateId: 'cert123',
              certificateCreatedAt: 1704067200, // 2024-01-01 in Unix timestamp
              email: 'user@example.com',
              fullName: 'Test User',
            },
          },
          loading: false,
          error: null,
        },
        vi.fn(),
        vi.fn(),
      ] as UseAxiosReturnType);

      render(
        <CertificateLinkCard courseId="rec123456789" />,
        { wrapper: TrpcProvider },
      );

      // Verify specific content
      expect(screen.getByText('Earned by Test User')).toBeTruthy();
      // Use a flexible date check to tolerate locale-specific ordering
      expect(screen.getByText(/^\s*Issued on .*20\d{2}/)).toBeTruthy();
      expect(screen.getByText('View Certificate')).toBeTruthy();

      // Verify the certificate link opens in a new tab
      const viewCertificateLink = screen.getByRole('link', { name: 'View Certificate' });
      expect(viewCertificateLink.getAttribute('target')).toBe('_blank');
    });
  });
});
