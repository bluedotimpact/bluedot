import '@testing-library/jest-dom';
import { cleanup, screen, waitFor } from '@testing-library/react';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import SeedGrantsPage from '../../pages/grants/seed';
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
    asPath: '/grants/seed',
    pathname: '/grants/seed',
    query: {},
  }),
}));

const SEED_FORM_URL = 'https://airtable.com/appeeZXWP0NdMvWYd/pag4774gDcXQ0qWXd/form';

beforeEach(() => {
  document.head.innerHTML = '';
  server.use(
    trpcMsw.courses.getAll.query(() => []),
    trpcMsw.programs.getInPerson.query(() => []),
    trpcMsw.programs.getGrants.query(() => []),
    trpcMsw.programs.getBySlug.query(() => ({
      id: 'recSeed', name: 'Seed Grants', slug: 'seed', category: 'Funding', status: 'Active', description: null, applicationForm: SEED_FORM_URL, order: '4',
    })),
  );
});

afterEach(() => cleanup());

describe('SeedGrantsPage', () => {
  test('is indexable and links to the Seed Grants application form', async () => {
    renderWithHead(<TrpcProvider>
      <SeedGrantsPage programName="Seed Grants" programDescription="Funding to get a new AI safety or biosecurity project or organization off the ground." />
    </TrpcProvider>);

    expect(screen.getByRole('heading', { name: 'Seed Grants', level: 1 })).toBeInTheDocument();
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://bluedot.org/grants/seed');
    expect(screen.getByText('$20k-$200k')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Organizations we\'ve helped fund' })).toBeInTheDocument();
    expect(screen.getByText('Can you pay the grant to my organization?')).toBeInTheDocument();

    await waitFor(() => {
      const applyLinks = screen.getAllByRole('link', { name: /Apply now/ });
      expect(applyLinks.length).toBeGreaterThan(0);
      applyLinks.forEach((link) => expect(link.getAttribute('href')).toContain(SEED_FORM_URL));
    });
  });
});
