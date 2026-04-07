import { useAuthStore } from '@bluedot/ui';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
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
      server.use(trpcMsw.certificates.getStatus.query(() => new Promise(() => {})));

      render(<ActionPlanCard courseId={FACILITATED_COURSE_ID} />, { wrapper: TrpcProvider });

      // Verify loading state
      expect(screen.getByText('Your Certificate')).toBeInTheDocument();
      expect(document.querySelector('.progress-dots')).toBeInTheDocument();
    });

    test('shows error state when query fails', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => {
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
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'action-plan-pending',
        meetPersonId: 'recABC123',
        hasSubmittedActionPlan: false,
      })));

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
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'action-plan-pending',
        meetPersonId: 'recABC123',
        hasSubmittedActionPlan: true,
      })));

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

    test('Scenario 3: has-certificate status → returns null', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'has-certificate',
        certificateId: 'cert123',
        issuedAt: 1704067200,
        holderName: 'Test User',
      })));

      const { container } = render(
        <ActionPlanCard courseId={FACILITATED_COURSE_ID} />,
        { wrapper: TrpcProvider },
      );

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    test('Scenario 4: non-action-plan-pending status → returns null', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'can-request',
      })));

      const { container } = render(
        <ActionPlanCard courseId={FACILITATED_COURSE_ID} />,
        { wrapper: TrpcProvider },
      );

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    test('Scenario 5: not-eligible status → returns null', async () => {
      server.use(trpcMsw.certificates.getStatus.query(() => ({
        status: 'not-eligible',
      })));

      const { container } = render(<ActionPlanCard courseId={FACILITATED_COURSE_ID} />, { wrapper: TrpcProvider });

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
  });
});
