import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
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
  );
});

test('offers a native form for ideas with any owner and discoverable agent instructions', async () => {
  render(<SpecialProjectsPage />, { wrapper: TrpcProvider });
  expect(await screen.findByRole('heading', { name: 'Special Projects', level: 1 })).toBeInTheDocument();
  expect(screen.getByRole('form', { name: 'Suggest a project' })).toBeInTheDocument();
  expect(screen.getByText(/something you think the wider field should do/)).toBeInTheDocument();
  expect(screen.getByText('For AI agents')).toBeInTheDocument();
  expect(screen.getByLabelText('Agent submission example')).toHaveTextContent('https://bluedot.org/api/special-projects');
  expect(screen.getByRole('link', { name: 'Rapid Grants' })).toHaveAttribute('href', '/grants/rapid');
});
