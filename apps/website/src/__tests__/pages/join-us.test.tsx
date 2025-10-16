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
    await waitFor(() => expect(container.querySelector('section')).toBeInTheDocument());
    expect(container).toMatchSnapshot();
  });
});
