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
  ...overrides,
});

const renderPage = async (apps: FacilitatorApplicationListItem[], tab = 'active') => {
  routerQuery = { tab };
  server.use(trpcMsw.facilitatorApplications.list.query(() => apps));
  render(<FacilitatorApplicationsPage />, { wrapper: TrpcProvider });
  await screen.findByText(apps[0]!.roundName!);
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
      trpcMsw.myBluedot.hasFacilitatorRegistrations.query(() => ({ hasFacilitatorRegistrations: true })),
    );
  });

  test('pending application offers withdraw, which opens the confirmation', async () => {
    await renderPage([application({ decision: null, roundStatus: 'Future' })]);

    expect(openMenuItems()).toEqual(['Withdraw application']);

    fireEvent.click(screen.getByRole('menuitem', { name: 'Withdraw application' }));
    expect(await screen.findByText(/Are you sure\?/)).toBeInTheDocument();
  });

  test('accepted application links to the course', async () => {
    await renderPage([application({ decision: 'Accept', roundStatus: 'Active' })]);

    expect(openMenuItems()).toEqual(['Go to course']);
    expect(screen.getByRole('menuitem', { name: 'Go to course' })).toHaveAttribute('href', '/courses/technical-ai-safety');
  });

  test('rejected application has no actions', async () => {
    await renderPage([application({ decision: 'Reject', roundStatus: 'Past' })], 'past');

    expect(openMenuItems()).toEqual([]);
  });
});
