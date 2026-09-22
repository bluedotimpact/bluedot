import '@testing-library/jest-dom';
import {
  act, render, screen, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      expect(screen.getByRole('link', { name: 'Rapid Grants' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Career Transition Grants' })).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: 'Rapid Grants', level: 2 })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Career Transition Grants', level: 2 })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Media Grants' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Seed Grants' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Rapid Grants' })).toHaveAttribute('href', '/grants/rapid');
    expect(screen.getByRole('link', { name: 'Career Transition Grants' })).toHaveAttribute('href', '/grants/career-transition');
    expect(document.getElementById('find-your-grant')).toBeInTheDocument();
  });

  test('shows funding guidance immediately, before optional statistics load', () => {
    server.use(
      trpcMsw.grants.getRapidGrantStats.query(() => new Promise<never>(() => {})),
      trpcMsw.grants.getCareerTransitionGrantStats.query(() => new Promise<never>(() => {})),
    );

    render(<GrantsPage />, { wrapper: TrpcProvider });

    expect(screen.getByText('Up to $20k')).toBeInTheDocument();
    expect(screen.getByText('Up to $200k')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'What funding restrictions apply?' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('link', { name: 'Rapid Grants' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Career Transition Grants' })).toBeInTheDocument();
  });

  test('opens funding guidance and provides contact routes', async () => {
    const user = userEvent.setup();
    render(<GrantsPage />, { wrapper: TrpcProvider });

    await screen.findByText('$105k awarded across 104 grants');
    await screen.findByText('$67.5k awarded across 8 grants');

    const question = screen.getByRole('button', { name: 'What about a larger project or funding for an organization?' });
    expect(question).toHaveAttribute('aria-expanded', 'false');
    await act(async () => {
      await user.click(question);
    });
    expect(question).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Contact us' })).toHaveAttribute('href', '/contact');

    const restrictions = screen.getByRole('button', { name: 'What funding restrictions apply?' });
    await act(async () => {
      await user.click(restrictions);
    });
    expect(restrictions).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/We cannot send money to the following countries and territories: Afghanistan/)).toBeVisible();
    expect(screen.getByText(/breach applicable sanctions/)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Contact us before applying' })).toHaveAttribute('href', '/contact');
  });
});
