import { useAuthStore } from '@bluedot/ui';
import '@testing-library/jest-dom';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
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

      expect(screen.getByText(/Hooray! You just finished the AGI Strategy course/)).toBeInTheDocument();
    });

    test('renders share and send cards', () => {
      render(<Congratulations {...defaultProps} />, { wrapper: TrpcProvider });

      expect(screen.getByText('Share your accomplishment')).toBeInTheDocument();
      expect(screen.getByText('Send it to someone personally')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Share on LinkedIn/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Share on X/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /WhatsApp/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Copy/ })).toBeInTheDocument();
    });

    test('does not render certificate card when courseId is absent', () => {
      render(<Congratulations {...defaultProps} courseId={undefined} />, { wrapper: TrpcProvider });

      expect(screen.queryByText('Grab your certificate')).toBeNull();
    });
  });

  describe('certificate card — not authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(null);
    });

    test('shows log in prompt', () => {
      const { container } = render(<Congratulations {...defaultProps} />, { wrapper: TrpcProvider });

      expect(screen.getByText('Grab your certificate')).toBeInTheDocument();
      expect(screen.getByText('Create a free account to earn your course certificate.')).toBeInTheDocument();
      expect(screen.getByText('Log in')).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });
  });

  describe('certificate card — authenticated', () => {
    const mockAuth = { token: 'test-token', expiresAt: Date.now() + 10000 };

    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(mockAuth as ReturnType<typeof useAuthStore>);
    });

    test('renders loading state', () => {
      server.use(trpcMsw.certificates.getStatus.query(() => new Promise(() => {})));

      const { container } = render(<Congratulations {...defaultProps} />, { wrapper: TrpcProvider });

      expect(screen.getByText('Grab your certificate')).toBeInTheDocument();
      expect(document.querySelector('.progress-dots')).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });

    test('renders error state with retry button', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => {
        throw new Error('Failed to fetch certificate status');
      }));

      render(<Congratulations {...defaultProps} />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
      });
    });

    test('has-certificate: shows holder name, date, and view link', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'has-certificate',
        certificateId: 'cert-abc-123',
        issuedAt: 1704067200, // 2024-01-01
        holderName: 'Test User',
      })));

      const { container } = render(<Congratulations {...defaultProps} />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByText(/Earned by Test User/)).toBeInTheDocument();
      });

      const viewLink = screen.getByRole('link', { name: 'View Certificate' });
      expect(viewLink.getAttribute('target')).toBe('_blank');
      expect(viewLink.getAttribute('href')).toContain('cert-abc-123');
      expect(container).toMatchSnapshot();
    });

    test('action-plan-pending: shows submit link with correct URL', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'action-plan-pending',
        meetPersonId: 'recABC123',
        hasSubmittedActionPlan: false,
      })));

      const { container } = render(<Congratulations {...defaultProps} />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByText(/submit an action plan/)).toBeInTheDocument();
      });

      const submitLink = screen.getByRole('link', { name: 'Submit your plan here' });
      expect(submitLink.getAttribute('href')).toContain('recABC123');
      expect(submitLink.getAttribute('target')).toBe('_blank');
      expect(container).toMatchSnapshot();
    });

    test('action-plan-pending: shows disabled button when plan already submitted', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'action-plan-pending',
        meetPersonId: 'recABC123',
        hasSubmittedActionPlan: true,
      })));

      const { container } = render(<Congratulations {...defaultProps} />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Submitted!' })).toBeInTheDocument();
      });
      expect(container).toMatchSnapshot();
    });

    test('can-request: shows download button for FoAI', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'can-request',
      })));

      const { container } = render(<Congratulations {...foaiProps} />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Download Certificate' })).toBeInTheDocument();
      });
      expect(container).toMatchSnapshot();
    });

    test('can-request: happy path — clicking Download Certificate transitions to has-certificate', async () => {
      server.use(
        trpcMsw.certificates.getStatus.query(() => ({ status: 'can-request' })),
        trpcMsw.certificates.request.mutation(() => undefined as never),
      );

      render(<Congratulations {...foaiProps} />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Download Certificate' })).toBeInTheDocument();
      });

      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'has-certificate',
        certificateId: 'cert-new-123',
        issuedAt: 1704067200,
        holderName: 'Test User',
      })));

      fireEvent.click(screen.getByRole('button', { name: 'Download Certificate' }));

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'View Certificate' })).toBeInTheDocument();
      });
    });

    test('facilitator-pending: shows message with no action button', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'facilitator-pending',
      })));

      const { container } = render(<Congratulations {...defaultProps} />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByText('Your certificate will be issued after your cohort ends, based on attendance.')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /certificate/i })).toBeNull();
      expect(screen.queryByRole('link', { name: /certificate/i })).toBeNull();
      expect(container).toMatchSnapshot();
    });

    test('not-eligible: shows ineligibility message', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'not-eligible',
      })));

      const { container } = render(<Congratulations {...defaultProps} />, { wrapper: TrpcProvider });

      await waitFor(() => {
        expect(screen.getByText(/doesn't currently issue certificates to independent learners/)).toBeInTheDocument();
      });
      expect(container).toMatchSnapshot();
    });
  });

  describe('FoAI-specific behaviour', () => {
    const mockAuth = { token: 'test-token', expiresAt: Date.now() + 10000 };

    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue(mockAuth as ReturnType<typeof useAuthStore>);
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'can-request',
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
        expect(screen.getByText('Grab your certificate')).toBeInTheDocument();
      });

      expect(screen.queryByText('Want to go deeper?')).toBeNull();
    });
  });
});
