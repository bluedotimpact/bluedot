import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import GrantsPage from '../../pages/grants';
import { server, trpcMsw } from '../trpcMswSetup';
import { TrpcProvider } from '../trpcProvider';
import { MOCK_NAV_GRANTS, MOCK_NAV_IN_PERSON_PROGRAMS } from '../testUtils';

vi.mock('next/router', () => ({
  useRouter: () => ({
    asPath: '/grants',
    pathname: '/grants',
    query: {},
  }),
}));

beforeEach(() => {
  server.use(
    trpcMsw.programs.getInPerson.query(() => MOCK_NAV_IN_PERSON_PROGRAMS),
    trpcMsw.programs.getGrants.query(() => MOCK_NAV_GRANTS),
    trpcMsw.courses.getAll.query(() => []),
    trpcMsw.grants.getRapidGrantStats.query(() => ({
      count: 104,
      totalAmountUsd: 105000,
      averageHoursToDecision: null,
      p90DaysToDecision: null,
    })),
    trpcMsw.grants.getCareerTransitionGrantStats.query(() => ({
      count: 8,
      totalAmountUsd: 67500,
      averageDaysToDecision: null,
    })),
  );
});

describe('GrantsPage', () => {
  test('lists active grants but not unlaunched grant placeholders', async () => {
    render(<GrantsPage />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByText('Rapid Grants', { selector: 'p' })).toBeInTheDocument();
      expect(screen.getByText('Career Transition Grants', { selector: 'p' })).toBeInTheDocument();
    });

    expect(screen.queryByText('Media Grants', { selector: 'p' })).not.toBeInTheDocument();
    expect(screen.queryByText('Seed Grants', { selector: 'p' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore in-person programs' })).toHaveAttribute('href', '/programs');
  });
});
