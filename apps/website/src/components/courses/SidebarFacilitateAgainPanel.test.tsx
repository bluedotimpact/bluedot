import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
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

  // Decoy course first: a panel that ignored courseSlug and took rounds[0] would link to
  // the wrong course's round, so the href assertion catches a broken filter deterministically.
  test('links to the round for the current course, not another eligible course', async () => {
    server.use(trpcMsw.facilitatorApplications.eligibleRounds.query(() => [
      course({
        courseId: 'course-other',
        courseSlug: 'other-course',
        rounds: [{
          id: 'round-other', label: 'Week 1', firstDiscussionDate: '2026-01-06', lastDiscussionDate: '2026-01-13',
        }],
      }),
      course({
        rounds: [{
          id: 'round-agi', label: 'Week 28', firstDiscussionDate: '2026-04-07', lastDiscussionDate: '2026-04-14',
        }],
      }),
    ]));

    render(<SidebarFacilitateAgainPanel courseSlug="agi-strategy" />, { wrapper: TrpcProvider });

    const link = await screen.findByRole('link', { name: /quick apply to facilitate again/i });
    expect(link).toHaveAttribute('href', '/facilitator-applications/quick-apply?round=round-agi');
  });
});
