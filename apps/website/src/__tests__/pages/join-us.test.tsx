import '@testing-library/jest-dom';
import { render, waitFor } from '@testing-library/react';
import {
  beforeEach, describe, expect, Mock, test, vi,
} from 'vitest';
import { useRouter } from 'next/router';
import JoinUsPage from '../../pages/join-us';
import { server, trpcMsw } from '../trpcMswSetup';
import { TrpcProvider } from '../trpcProvider';

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

const mockRouter = {
  asPath: '/join-us',
  pathname: '/join-us',
  push: vi.fn(),
};

beforeEach(() => {
  (useRouter as unknown as Mock).mockReturnValue(mockRouter);
});

describe('JoinUsPage', () => {
  test('should render correctly', async () => {
    server.use(trpcMsw.jobs.getAll.query(() => []));
    const { container } = render(<JoinUsPage />, { wrapper: TrpcProvider });

    // Wait for loading to finish - check that ProgressDots are gone
    await waitFor(() => {
      expect(container.querySelector('.progress-dots')).not.toBeInTheDocument();
    }, { timeout: 5000 });

    expect(container).toMatchSnapshot();
  });
});
