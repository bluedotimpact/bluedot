import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import {
  beforeEach,
  describe,
  expect,
  type Mock,
  test,
  vi,
} from 'vitest';
import { useRouter } from 'next/router';
import ProgramsPage from '../../pages/programs';
import { server, trpcMsw } from '../trpcMswSetup';
import { TrpcProvider } from '../trpcProvider';

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

const mockRouter = {
  asPath: '/programs',
  pathname: '/programs',
  push: vi.fn(),
  query: {},
};

beforeEach(() => {
  (useRouter as unknown as Mock).mockReturnValue(mockRouter);
  server.use(
    trpcMsw.courses.getAll.query(() => []),
    trpcMsw.grants.getRapidGrantStats.query(() => ({ count: 104, totalAmountUsd: 105000 })),
    trpcMsw.grants.getCareerTransitionGrantStats.query(() => ({ count: 1, totalAmountUsd: 67500 })),
  );
});

describe('ProgramsPage', () => {
  test('renders the core program options', async () => {
    render(<ProgramsPage />, { wrapper: TrpcProvider });

    await waitFor(() => {
      // Funding appears twice (Rapid Grants + Career Transition Grant).
      expect(screen.getAllByText('Funding', { selector: 'p' })).toHaveLength(2);
      expect(screen.getByText('Rapid Grants', { selector: 'p' })).toBeInTheDocument();
      expect(screen.getByText('Career Transition Grants', { selector: 'p' })).toBeInTheDocument();
      expect(screen.getByText('Build', { selector: 'p' })).toBeInTheDocument();
      expect(screen.getByText('Technical AI Safety Project Sprint', { selector: 'p' })).toBeInTheDocument();
      expect(screen.getByText('Launch', { selector: 'p' })).toBeInTheDocument();
      expect(screen.getByText('Incubator Week', { selector: 'p' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Explore courses instead' })).toBeInTheDocument();
      expect(screen.getByText('Subscribe to get AI safety news and course updates delivered directly to your inbox')).toBeInTheDocument();
    });
  });
});
