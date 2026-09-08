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
  test('describes the concluded experiment and keeps the form open for expressions of interest', async () => {
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
    expect(screen.getByText('Experiment concluded')).toBeInTheDocument();
    expect(screen.getByText('The Context Week experiment has concluded. You can still fill out the application form as an expression of interest, but you may not hear back.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'After Context Week' })).toBeInTheDocument();
    expect(screen.getByText(/about ten hours of reading/)).toBeInTheDocument();

    await waitFor(() => {
      const interestLinks = screen.getAllByRole('link', { name: 'Express interest' });
      expect(interestLinks).toHaveLength(2);
      interestLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', 'https://example.com/context-week-application');
      });
    });

    expect(document.title).toBe('Context Week | BlueDot Impact');
    const expectedDescription = `The Context Week experiment has concluded. You can still fill out the application form as an expression of interest, but you may not hear back. ${programDescription}`;
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(expectedDescription);
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe(expectedDescription);
    expect(document.querySelector('meta[name="twitter:description"]')?.getAttribute('content')).toBe(expectedDescription);
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe('https://bluedot.org/images/programs/link-preview/context-week.png');
  });
});
