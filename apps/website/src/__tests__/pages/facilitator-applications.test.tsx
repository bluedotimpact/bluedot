import '@testing-library/jest-dom';
import {
  fireEvent, render, screen,
} from '@testing-library/react';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import FacilitatorApplicationsPage from '../../pages/facilitator-applications';
import type { FacilitatorApplicationListItem } from '../../server/routers/facilitator-applications';
import { TrpcProvider } from '../trpcProvider';
import { server, trpcMsw } from '../trpcMswSetup';

let routerQuery: Record<string, string> = {};

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/facilitator-applications',
    query: routerQuery,
    replace: vi.fn(),
  }),
}));

vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

const application = (overrides: Partial<FacilitatorApplicationListItem>): FacilitatorApplicationListItem => ({
  id: 'reg-1',
  courseId: 'course-1',
  courseTitle: 'Technical AI Safety',
  courseSlug: 'technical-ai-safety',
  roundId: 'round-1',
  roundName: 'Technical AI Safety (2026 Sep W38) - Intensive',
  roundFirstDiscussionDate: null,
  roundLastDiscussionDate: null,
  decision: null,
  roundStatus: 'Future',
  email: 'test@example.com',
  availabilityIntervalsUTC: null,
  availabilityTimezone: null,
  availabilityComments: null,
  ...overrides,
});

const renderPage = async (apps: FacilitatorApplicationListItem[], tab = 'active') => {
  routerQuery = { tab };
  server.use(trpcMsw.facilitatorApplications.list.query(() => apps));
  render(<FacilitatorApplicationsPage />, { wrapper: TrpcProvider });
  await screen.findByText(apps[0]!.roundName!);
};

/** The inline availability button renders once per layout (desktop + mobile); returns the desktop href. */
const availabilityLinkHref = (label: string): string | null => {
  const links = screen.queryAllByRole('link', { name: label });
  return links[0]?.getAttribute('href') ?? null;
};

/** Open the row's overflow menu and return its item labels. Returns [] when no menu renders. */
const openMenuItems = (): string[] => {
  const button = screen.queryByRole('button', { name: 'Application actions' });
  if (!button) return [];
  fireEvent.click(button);
  return screen.getAllByRole('menuitem').map((i) => i.textContent?.trim() ?? '');
};

describe('FacilitatorApplicationsPage', () => {
  beforeEach(() => {
    server.use(
      trpcMsw.facilitatorApplications.eligibleRounds.query(() => []),
      trpcMsw.myBluedot.hasFacilitatorNavItems.query(() => ({ hasFacilitatedCourses: true, hasFacilitatorApplications: true })),
    );
  });

  test('pending application offers availability and withdraw, which opens the confirmation', async () => {
    await renderPage([application({ decision: null, roundStatus: 'Future' })]);

    const href = availabilityLinkHref('Share availability') ?? '';
    expect(href).toContain('roundId=round-1');
    expect(href).toContain('utm_source=bluedot-facilitator-applications');
    expect(openMenuItems()).toEqual(['Withdraw application']);

    fireEvent.click(screen.getByRole('menuitem', { name: 'Withdraw application' }));
    expect(await screen.findByText(/Are you sure\?/)).toBeInTheDocument();
  });

  test('still pending once the round is active (decision not yet made)', async () => {
    await renderPage([application({ decision: null, roundStatus: 'Active', availabilityIntervalsUTC: 'M16:00 M18:00' })]);

    expect(availabilityLinkHref('Edit availability')).toContain('prefill_intervals=');
    expect(openMenuItems()).toEqual(['Withdraw application']);
  });

  test('undecided application on a past round has no actions', async () => {
    await renderPage([application({ decision: null, roundStatus: 'Past' })], 'past');

    expect(screen.queryAllByRole('link', { name: /availability/ })).toHaveLength(0);
    expect(openMenuItems()).toEqual([]);
  });

  test('accepted application links to the course', async () => {
    await renderPage([application({ decision: 'Accept', roundStatus: 'Active' })]);

    expect(screen.queryAllByRole('link', { name: /availability/ })).toHaveLength(0);
    expect(openMenuItems()).toEqual(['Go to course']);
    expect(screen.getByRole('menuitem', { name: 'Go to course' })).toHaveAttribute('href', '/courses/technical-ai-safety');
  });

  test('rejected application has no actions', async () => {
    await renderPage([application({ decision: 'Reject', roundStatus: 'Past' })], 'past');

    expect(openMenuItems()).toEqual([]);
  });
});
