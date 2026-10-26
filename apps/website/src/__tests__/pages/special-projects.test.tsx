import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import {
  beforeEach, expect, test, vi,
} from 'vitest';
import { useRouter } from 'next/router';
import SpecialProjectsPage from '../../pages/special-projects';
import { TrpcProvider } from '../trpcProvider';
import { server, trpcMsw } from '../trpcMswSetup';
import { MOCK_NAV_GRANTS, MOCK_NAV_IN_PERSON_PROGRAMS } from '../testUtils';

vi.mock('next/router', () => ({ useRouter: vi.fn() }));

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue({ asPath: '/special-projects', pathname: '/special-projects', push: vi.fn() } as never);
  server.use(
    trpcMsw.courses.getAll.query(() => []),
    trpcMsw.programs.getInPerson.query(() => MOCK_NAV_IN_PERSON_PROGRAMS),
    trpcMsw.programs.getGrants.query(() => MOCK_NAV_GRANTS),
    trpcMsw.teamMembers.getAll.query(() => [
      {
        name: 'Harry Waterman', jobTitle: 'Special Projects', imageUrl: '/harry.webp', url: 'https://harrywaterman.com/',
      },
      {
        name: 'Joshua Landes', jobTitle: 'Head of Special Projects', imageUrl: '/josh.webp', url: 'https://www.linkedin.com/in/josh-landes12/',
      },
      { name: 'Another teammate', jobTitle: 'Operations', imageUrl: '/other.webp' },
    ]),
  );
});

test('offers a native form for ideas with any owner and discoverable agent instructions', async () => {
  render(<SpecialProjectsPage />, { wrapper: TrpcProvider });
  expect(await screen.findByRole('heading', { name: 'Special Projects', level: 1 })).toBeInTheDocument();
  expect(screen.getByRole('form', { name: 'Suggest a project' })).toBeInTheDocument();
  expect(screen.getByText(/what BlueDot should try, what you’d like to build here, or what the wider field needs/)).toBeInTheDocument();
  expect(screen.getByText('For AI agents')).toBeInTheDocument();
  expect(screen.getByLabelText('Agent submission example')).toHaveTextContent('https://bluedot.org/api/special-projects');
  const team = within(await screen.findByRole('region', { name: 'Special Projects team' }));
  expect(team.getByRole('link', { name: 'Joshua Landes' })).toHaveAttribute('href', 'https://www.linkedin.com/in/josh-landes12/');
  expect(team.getByRole('link', { name: 'Harry Waterman' })).toHaveAttribute('href', 'https://harrywaterman.com/');
  expect(team.queryByText('Another teammate')).not.toBeInTheDocument();
});
