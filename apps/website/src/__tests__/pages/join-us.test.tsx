import '@testing-library/jest-dom';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import JoinUsPage from '../../pages/join-us';
import { server, trpcMsw } from '../trpcMswSetup';
import { TrpcProvider } from '../trpcProvider';

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
