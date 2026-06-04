import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import type { EligibleRoundsCourse } from '../../server/routers/facilitator-applications';
import { SidebarFacilitateAgainPanel } from './SidebarFacilitateAgainPanel';

const course = (overrides: Partial<EligibleRoundsCourse> = {}): EligibleRoundsCourse => ({
  courseId: 'course-agi',
  courseTitle: 'AGI Strategy',
  courseSlug: 'agi-strategy',
  rounds: [
    {
      id: 'round-1', label: 'Week 28 Intensive', firstDiscussionDate: '2026-04-07', lastDiscussionDate: '2026-04-14',
    },
  ],
  ...overrides,
});

describe('SidebarFacilitateAgainPanel', () => {
  test('links to the first (soonest) open round for the matching course', async () => {
    server.use(trpcMsw.facilitatorApplications.eligibleRounds.query(() => [
      course({
        rounds: [
          {
            id: 'round-early', label: 'Week 28', firstDiscussionDate: '2026-04-07', lastDiscussionDate: '2026-04-14',
          },
          {
            id: 'round-late', label: 'Week 30', firstDiscussionDate: '2026-04-21', lastDiscussionDate: '2026-04-28',
          },
        ],
      }),
    ]));

    render(<SidebarFacilitateAgainPanel courseSlug="agi-strategy" />, { wrapper: TrpcProvider });

    const link = await screen.findByRole('link', { name: /quick apply to facilitate again/i });
    expect(link).toHaveAttribute('href', '/facilitator-applications/quick-apply?round=round-early');
  });

  test('renders nothing when no eligible course matches the current course', async () => {
    server.use(trpcMsw.facilitatorApplications.eligibleRounds.query(() => [course({ courseSlug: 'other-course' })]));

    const { container } = render(<SidebarFacilitateAgainPanel courseSlug="agi-strategy" />, { wrapper: TrpcProvider });

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
