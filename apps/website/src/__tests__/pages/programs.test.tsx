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
    id: 'rec-rapid',
    name: 'Rapid grant',
    status: 'Active',
    description: 'Funding for the BlueDot community to ship projects, run events, and do other concrete work on AI safety and biosecurity.',
    applicationForm: 'https://example.com/rapid',
    category: 'Funding',
    slug: 'rapid',
    order: '2',
  },
  {
    id: 'rec-ct',
    name: 'Career transition grant',
    status: 'Active',
    description: 'Funding and support to help you go full-time on AI safety and biosecurity.',
    applicationForm: 'https://example.com/ct',
    category: 'Funding',
    slug: 'career-transition',
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

const contextWeek = mockPrograms.find((program) => program.slug === 'context-week')!;

beforeEach(() => {
  (useRouter as unknown as Mock).mockReturnValue(mockRouter);
  server.use(
    trpcMsw.programs.getInPerson.query(() => mockPrograms.filter((program) => program.category !== 'Funding')),
    trpcMsw.programs.getGrants.query(() => []),
    trpcMsw.courses.getAll.query(() => []),
  );
});

describe('ProgramsPage', () => {
  test('renders in-person programs without grants', async () => {
    render(<ProgramsPage />, { wrapper: TrpcProvider });

    await waitFor(() => {
      const contextWeekTitle = screen.getByRole('heading', { name: 'Context Week', level: 2 });
      const incubatorWeekTitle = screen.getByRole('heading', { name: 'Incubator week', level: 2 });

      expect(screen.getByText('A four-day residential programme for people who want to understand the AI safety field and decide where they could contribute.')).toBeInTheDocument();
      expect(contextWeekTitle.closest('li')).not.toBe(incubatorWeekTitle.closest('li'));
      expect(screen.getByRole('heading', { name: 'AI Security Bootcamp (opens in a new tab)', level: 2 })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Rapid grant' })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Explore courses instead' })).toBeInTheDocument();
      expect(screen.getByText('Subscribe to get AI safety news and course updates delivered directly to your inbox')).toBeInTheDocument();
    });
  });

  test('preserves full program details and external destinations, and omits entries without a destination', async () => {
    server.use(trpcMsw.programs.getInPerson.query(() => [
      {
        ...contextWeek, id: 'external-program', name: 'External program', slug: null,
        description: 'Full catalogue description for a future program.',
        applicationForm: 'https://example.com/apply?round=2#form',
      },
      {
        ...contextWeek, id: 'unpublished', name: 'No destination', slug: null, applicationForm: null,
      },
    ]));
    render(<ProgramsPage />, { wrapper: TrpcProvider });

    const external = await screen.findByRole('link', { name: 'External program (opens in a new tab)' });
    expect(external).toHaveAttribute('href', 'https://example.com/apply?round=2#form');
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('Full catalogue description for a future program.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'No destination' })).not.toBeInTheDocument();
    const bootcamp = screen.getByRole('link', { name: 'AI Security Bootcamp (opens in a new tab)' });
    expect(bootcamp).toHaveAttribute('href', 'https://aisb.dev/');
    expect(bootcamp).toHaveAttribute('target', '_blank');
    expect(screen.getByText('An intensive, in-person program for technical talent building practical skills for AI security work.')).toBeInTheDocument();
  });
});
