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
import Congratulations from './Congratulations';

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

const defaultProps = {
  courseTitle: 'AGI Strategy',
  coursePath: '/courses/agi-strategy',
  courseSlug: 'agi-strategy',
  courseId: 'rec123456789',
};

const foaiProps = {
  courseTitle: 'Future of AI',
  coursePath: '/courses/future-of-ai',
  courseSlug: 'future-of-ai',
  courseId: FOAI_COURSE_ID,
};

const hasCertificateResponse = {
  status: 'has-certificate' as const,
  certificateId: 'cert-abc-123',
  certificateCreatedAt: 1704067200, // 2024-01-01
  recipientName: 'Test User',
  courseName: 'AGI Strategy',
  courseSlug: 'agi-strategy',
  certificationDescription: 'Demonstrated understanding of AGI strategy.',
  courseDetailsUrl: 'https://bluedot.org/courses/agi-strategy',
};

describe('Congratulations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      asPath: '/courses/agi-strategy/5/7',
    } as ReturnType<typeof useRouter>);
  });

  describe('hero and sharing cards', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(null);
    });

    test('renders hero with course title', () => {
      render(<Congratulations {...defaultProps} />, { wrapper: TrpcProvider });

      expect(screen.getByText(/Congratulations on finishing the AGI Strategy course/)).toBeInTheDocument();
    });

    test('renders share and refer cards', () => {
      render(<Congratulations {...defaultProps} />, { wrapper: TrpcProvider });

      expect(screen.getByText(/Share with your network/)).toBeInTheDocument();
      expect(screen.getByText(/Refer a friend or colleague/)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Share on LinkedIn/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Share on X/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Copy Message/ })).toBeInTheDocument();
    });

    test('does not render certificate hero when courseId is absent', () => {
      render(<Congratulations {...defaultProps} courseId={undefined} />, { wrapper: TrpcProvider });

      expect(screen.queryByText(/Create a free account to earn your course certificate/)).toBeNull();
    });
  });

  describe('certificate hero — not authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(null);
    });

    test('shows log in prompt', () => {
      render(<Congratulations {...defaultProps} />, { wrapper: TrpcProvider });

      expect(screen.getByText('Create a free account to earn your course certificate.')).toBeInTheDocument();
      expect(screen.getByText('Log in')).toBeInTheDocument();
    });
  });

  describe('certificate hero — authenticated, has-certificate', () => {
    const mockAuth = { token: 'test-token', expiresAt: Date.now() + 10000 };

    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(mockAuth as ReturnType<typeof useAuthStore>);
    });

    test('renders CertificateCard with recipient and copy-link button', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => hasCertificateResponse));

      render(<Congratulations {...defaultProps} />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
      expect(screen.getByText('cert-abc-123')).toBeInTheDocument();
    });
  });

  describe('FoAI-specific behaviour', () => {
    const mockAuth = { token: 'test-token', expiresAt: Date.now() + 10000 };

    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(mockAuth as ReturnType<typeof useAuthStore>);
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        ...hasCertificateResponse,
        courseName: 'Future of AI',
        courseSlug: 'future-of-ai',
      })));
    });

    test('shows "Want to go deeper?" section for FoAI', async () => {
      render(<Congratulations {...foaiProps} />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByText('Want to go deeper?')).toBeInTheDocument();
      });

      expect(screen.getByRole('link', { name: /Apply now/ })).toBeInTheDocument();
    });

    test('does not show "Want to go deeper?" for non-FoAI courses', async () => {
      render(<Congratulations {...defaultProps} />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByText(/Congratulations on finishing/)).toBeInTheDocument();
      });

      expect(screen.queryByText('Want to go deeper?')).toBeNull();
    });
  });
});
