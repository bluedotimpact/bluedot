import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import {
  beforeEach, describe, expect, type Mock, test, vi,
} from 'vitest';
import { useRouter } from 'next/router';
import AboutPage from '../../pages/about';
import { TrpcProvider } from '../trpcProvider';
import { server, trpcMsw } from '../trpcMswSetup';
import { MOCK_NAV_GRANTS, MOCK_NAV_IN_PERSON_PROGRAMS } from '../testUtils';

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

const mockRouter = {
  asPath: '/about',
  pathname: '/about',
  push: vi.fn(),
};

beforeEach(() => {
  (useRouter as unknown as Mock).mockReturnValue(mockRouter);
});

describe('AboutPage', () => {
  test('should render correctly', async () => {
    server.use(
      trpcMsw.courses.getAll.query(() => []),
      trpcMsw.teamMembers.getAll.query(() => []),
      trpcMsw.programs.getInPerson.query(() => MOCK_NAV_IN_PERSON_PROGRAMS),
      trpcMsw.programs.getGrants.query(() => MOCK_NAV_GRANTS),
    );
    const { container } = render(<AboutPage />, { wrapper: TrpcProvider });

    expect(await screen.findByRole('list', { name: 'Team members' })).toBeInTheDocument();

    expect(container).toMatchSnapshot();
  });
});
