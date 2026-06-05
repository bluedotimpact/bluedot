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
  test('links to the facilitator applications page when the course has an eligible round', async () => {
    server.use(trpcMsw.facilitatorApplications.eligibleRounds.query(() => [course()]));

    render(<SidebarFacilitateAgainPanel courseSlug="agi-strategy" />, { wrapper: TrpcProvider });

    const link = await screen.findByRole('link', { name: /quick apply to facilitate again/i });
    expect(link).toHaveAttribute('href', '/facilitator-applications');
  });

  // Render an eligible panel alongside a no-rounds course and a slug with no entry. The eligible
  // link appearing proves the shared query resolved; a single link then proves the other two
  // panels rendered nothing (i.e. the panel gates on the current slug having an open round).
  test('renders nothing for a course with no open rounds or no matching entry', async () => {
    server.use(trpcMsw.facilitatorApplications.eligibleRounds.query(() => [
      course(),
      course({ courseId: 'course-empty', courseSlug: 'empty-course', rounds: [] }),
    ]));

    render(
      <>
        <SidebarFacilitateAgainPanel courseSlug="agi-strategy" />
        <SidebarFacilitateAgainPanel courseSlug="empty-course" />
        <SidebarFacilitateAgainPanel courseSlug="missing-course" />
      </>,
      { wrapper: TrpcProvider },
    );

    await screen.findByRole('link', { name: /quick apply to facilitate again/i });
    expect(screen.getAllByRole('link', { name: /quick apply to facilitate again/i })).toHaveLength(1);
  });
});
