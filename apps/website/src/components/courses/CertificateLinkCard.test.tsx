import { render, screen } from '@testing-library/react';
import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import { useAuthStore } from '@bluedot/ui';
import { useRouter } from 'next/router';
import CertificateLinkCard from './CertificateLinkCard';
import { createMockCourseRegistration } from '../../__tests__/testUtils';

// Hoist the mock functions so they can be used in vi.mock
const { mockUseQuery, mockUseMutation } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseMutation: vi.fn(),
}));

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

vi.mock('../../utils/trpc', () => ({
  trpc: {
    courseRegistrations: {
      getById: {
        useQuery: mockUseQuery,
      },
    },
    certificates: {
      request: {
        useMutation: mockUseMutation,
      },
    },
  },
}));

describe('CertificateLinkCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      asPath: '/courses/test-course',
    } as ReturnType<typeof useRouter>);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01'));

    // Reset mutation mock to default state
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    });
  });

  describe('Not authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(null);
    });

    test('renders regular course', () => {
      render(<CertificateLinkCard courseId="rec123456789" />);

      // Verify login prompt is shown
      expect(screen.getByText('Your Certificate')).toBeTruthy();
      expect(screen.getByText('Create a free account to collect course certificates.')).toBeTruthy();
      expect(screen.getByText('Log in')).toBeTruthy();
    });

    test('renders FoAI course with different content', () => {
      render(<CertificateLinkCard courseId="rec0Zgize0c4liMl5" />);

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
      // Mock loading state
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      render(<CertificateLinkCard courseId="rec123456789" />);

      // Verify loading indicator is shown
      expect(screen.getByText('Your Certificate')).toBeTruthy();
      // Check for progress dots (ProgressDots component)
      expect(document.querySelector('.progress-dots')).toBeTruthy();
    });

    test('renders course without certificate - non-FoAI shows not eligible', () => {
      // Mock query response with no certificate for non-FoAI course
      mockUseQuery.mockReturnValue({
        data: createMockCourseRegistration({
          courseId: 'rec123456789',
          certificateId: null,
        }),
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<CertificateLinkCard courseId="rec123456789" />);

      // Verify not eligible message
      expect(screen.getByText('Your Certificate')).toBeTruthy();
      expect(screen.getByText("This course doesn't currently issue certificates to independent learners. Join a facilitated version to get a certificate.")).toBeTruthy();
      expect(screen.getByText('Join the Community')).toBeTruthy();
    });

    test('renders course without certificate - FoAI shows request button', () => {
      // Mock query response with no certificate for FoAI course
      mockUseQuery.mockReturnValue({
        data: createMockCourseRegistration({
          courseId: 'rec0Zgize0c4liMl5',
          certificateId: null,
          email: 'user@example.com',
          fullName: 'Test User',
        }),
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<CertificateLinkCard courseId="rec0Zgize0c4liMl5" />);

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
      // Mock query response with certificate
      mockUseQuery.mockReturnValue({
        data: createMockCourseRegistration({
          courseId: 'rec123456789',
          certificateId: 'cert123',
          certificateCreatedAt: 1704067200, // 2024-01-01 in Unix timestamp
        }),
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      });

      render(<CertificateLinkCard courseId="rec123456789" />);

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
