import '@testing-library/jest-dom';
import { cleanup, screen } from '@testing-library/react';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import MediaGrantsPage from '../../pages/grants/media';
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
    asPath: '/grants/media',
    pathname: '/grants/media',
    query: {},
  }),
}));

beforeEach(() => {
  document.head.innerHTML = '';
  server.use(
    trpcMsw.courses.getAll.query(() => []),
    trpcMsw.programs.getInPerson.query(() => []),
    trpcMsw.programs.getGrants.query(() => []),
  );
});

afterEach(() => cleanup());

describe('unlisted grant placeholders', () => {
  test.each([
    ['Media Grants', MediaGrantsPage, '/grants/media'],
    ['Seed Grants', SeedGrantsPage, '/grants/seed'],
  ])('%s exists at a direct URL but is marked noindex', (title, Page, path) => {
    renderWithHead(<TrpcProvider><Page /></TrpcProvider>);

    expect(screen.getByRole('heading', { name: title, level: 1 })).toBeInTheDocument();
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`https://bluedot.org${path}`);
    expect(screen.getByRole('button', { name: 'Applications not yet open' })).toBeDisabled();
  });
});
