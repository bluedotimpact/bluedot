import '@testing-library/jest-dom';
import { render, waitFor } from '@testing-library/react';
import { TRPCError } from '@trpc/server';
import {
  beforeEach, describe, expect, type Mock, test, vi,
} from 'vitest';
import { useRouter } from 'next/router';
import FacilitatorFeedbackPage from '../../../pages/facilitator-feedback/[groupId]';
import { TrpcProvider } from '../../trpcProvider';
import { server, trpcMsw } from '../../trpcMswSetup';

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

const mockRouter = {
  query: { groupId: 'rec-facilitator' },
  isReady: true,
  asPath: '/facilitator-feedback/rec-facilitator',
  pathname: '/facilitator-feedback/[groupId]',
  push: vi.fn(),
  replace: vi.fn(),
};

beforeEach(() => {
  (useRouter as unknown as Mock).mockReturnValue(mockRouter);
});

describe('FacilitatorFeedbackPage', () => {
  test('renders an error fallback when getFeedbackFormData fails with a non-404 error', async () => {
    server.use(trpcMsw.facilitators.getFeedbackFormData.query(() => {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'boom' });
    }));

    render(<FacilitatorFeedbackPage />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(document.body).toHaveTextContent(/Error:/i);
    });
  });
});
