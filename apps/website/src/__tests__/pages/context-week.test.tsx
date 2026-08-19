import '@testing-library/jest-dom';
import { LatestUtmParamsProvider } from '@bluedot/ui';
import { screen, waitFor } from '@testing-library/react';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import ContextWeekProgramPage from '../../pages/programs/context-week';
import { renderWithHead } from '../testUtils';
import { server, trpcMsw } from '../trpcMswSetup';
import { TrpcProvider } from '../trpcProvider';

vi.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <head-proxy data-testid="head-proxy">{children}</head-proxy>
  ),
}));

vi.mock('next/router', () => ({
  useRouter: () => ({
    asPath: '/programs/context-week',
    pathname: '/programs/context-week',
    query: {},
  }),
}));

const programDescription = 'A four-day residential programme for people who want to understand the AI safety field and decide where they could contribute.';

beforeEach(() => {
  document.head.innerHTML = '';
  server.use(
    trpcMsw.courses.getAll.query(() => []),
    trpcMsw.programs.getInPerson.query(() => []),
    trpcMsw.programs.getGrants.query(() => []),
    trpcMsw.programs.getBySlug.query(() => ({
      id: 'rec-context-week',
      name: 'Context Week',
      status: 'Draft',
      description: programDescription,
      applicationForm: 'https://example.com/context-week-application',
      category: 'Programs',
      slug: 'context-week',
      order: '5',
    })),
  );
});

describe('ContextWeekProgramPage', () => {
  test('describes the programme, participants, and intended outcomes', async () => {
    renderWithHead(<TrpcProvider>
      <LatestUtmParamsProvider>
        <ContextWeekProgramPage
          programName="Context Week"
          programDescription={programDescription}
        />
      </LatestUtmParamsProvider>
    </TrpcProvider>);

    expect(screen.getByRole('heading', { name: 'Context Week', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Aug 30–Sept 4, 2026')).toBeInTheDocument();
    expect(screen.getByText('Berkeley')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'About Context Week' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Participants' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Context Week and Incubator Week' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Programme' })).toBeInTheDocument();
    expect(screen.getByText(/The detailed schedule is still being developed/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'After Context Week' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: 'Apply to Context Week' })).toHaveLength(2);
    });

    expect(document.title).toBe('Context Week | BlueDot Impact');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(programDescription);
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://bluedot.org/images/programs/link-preview/context-week.png');
  });
});
