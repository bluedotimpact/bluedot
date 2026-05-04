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

const mockPrograms = [
  {
    id: 'rec-advising',
    name: '1-1 advising',
    status: 'Active',
    description: 'A 30 min calls with the BlueDot team to accelerate you towards doing impactful work in AI safety',
    applicationForm: 'https://web.miniextensions.com/example',
    category: null,
    slug: 'advising',
    order: '1',
  },
  {
    id: 'rec-rapid',
    name: 'Rapid grant',
    status: 'Active',
    description: 'Funding for the BlueDot community to ship projects, run events, and do other concrete work on AI safety.',
    applicationForm: 'https://example.com/rapid',
    category: 'Funding',
    slug: 'rapid-grants',
    order: '2',
  },
  {
    id: 'rec-ct',
    name: 'Career transition grant',
    status: 'Active',
    description: 'Funding and support to help you go full-time on AI safety.',
    applicationForm: 'https://example.com/ct',
    category: 'Funding',
    slug: 'career-transition-grant',
    order: '3',
  },
  {
    id: 'rec-incubator',
    name: 'Incubator week',
    status: 'Active',
    description: 'Fly to London to turn your AI safety idea into a funded org.',
    applicationForm: 'https://example.com/incubator',
    category: 'Found',
    slug: 'incubator-week',
    order: '4',
  },
];

beforeEach(() => {
  (useRouter as unknown as Mock).mockReturnValue(mockRouter);
  server.use(
    trpcMsw.programs.getAll.query(() => mockPrograms),
    trpcMsw.grants.getRapidGrantStats.query(() => ({ count: 104, totalAmountUsd: 105000 })),
    trpcMsw.grants.getCareerTransitionGrantStats.query(() => ({ count: 1, totalAmountUsd: 67500 })),
  );
});

describe('ProgramsPage', () => {
  test('renders active programs from the Airtable router', async () => {
    render(<ProgramsPage />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByText('1-1 advising', { selector: 'p' })).toBeInTheDocument();
      expect(screen.getByText('Rapid grant', { selector: 'p' })).toBeInTheDocument();
      expect(screen.getByText('Career transition grant', { selector: 'p' })).toBeInTheDocument();
      expect(screen.getByText('Incubator week', { selector: 'p' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Explore courses instead' })).toBeInTheDocument();
      expect(screen.getByText('Subscribe to get AI safety news and course updates delivered directly to your inbox')).toBeInTheDocument();
    });
  });
});
