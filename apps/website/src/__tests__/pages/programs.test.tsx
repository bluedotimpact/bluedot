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
    description: 'Funding for the BlueDot community to ship projects, run events, and do other concrete work on AI safety and biosecurity.',
    applicationForm: 'https://example.com/rapid',
    category: 'Funding',
    slug: 'rapid-grants',
    order: '2',
  },
  {
    id: 'rec-ct',
    name: 'Career transition grant',
    status: 'Active',
    description: 'Funding and support to help you go full-time on AI safety and biosecurity.',
    applicationForm: 'https://example.com/ct',
    category: 'Funding',
    slug: 'career-transition-grant',
    order: '3',
  },
  {
    id: 'rec-context-week',
    name: 'Context Week',
    status: 'Active',
    description: 'A four-day residential programme for people who want to understand the AI safety field and decide where they could contribute.',
    applicationForm: 'https://example.com/context-week',
    category: 'Explore',
    slug: 'context-week',
    order: '4',
  },
  {
    id: 'rec-incubator',
    name: 'Incubator week',
    status: 'Active',
    description: 'Fly to San Francisco to turn your AI safety idea into a funded org.',
    applicationForm: 'https://example.com/incubator',
    category: 'Found',
    slug: 'incubator-week',
    order: '5',
  },
];

beforeEach(() => {
  (useRouter as unknown as Mock).mockReturnValue(mockRouter);
  server.use(
    trpcMsw.programs.getInPerson.query(() => mockPrograms.filter((program) => ['context-week', 'incubator-week'].includes(program.slug))),
    trpcMsw.programs.getGrants.query(() => []),
    trpcMsw.courses.getAll.query(() => []),
  );
});

describe('ProgramsPage', () => {
  test('renders in-person programs without grants or advising', async () => {
    render(<ProgramsPage />, { wrapper: TrpcProvider });

    await waitFor(() => {
      const contextWeekTitle = screen.getByText('Context Week', { selector: 'p' });
      const incubatorWeekTitle = screen.getByText('Incubator week', { selector: 'p' });

      expect(screen.getByText('A four-day residential programme for people who want to understand the AI safety field and decide where they could contribute.')).toBeInTheDocument();
      expect(contextWeekTitle.closest('li')).not.toBe(incubatorWeekTitle.closest('li'));
      expect(screen.getByText('AI Security Bootcamp', { selector: 'p' })).toBeInTheDocument();
      expect(screen.queryByText('Rapid grant', { selector: 'p' })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Explore courses instead' })).toBeInTheDocument();
      expect(screen.getByText('Subscribe to get AI safety news and course updates delivered directly to your inbox')).toBeInTheDocument();
    });
  });
});
