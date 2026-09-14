import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseLander from './CourseLander';
import { createAiGovernanceContent } from './course-content/AiGovernanceContent';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';

const applicationUrl = 'https://web.miniextensions.com/test';
const round = {
  id: 'recTestRound',
  intensity: 'intensive',
  applicationDeadline: '27 Sep',
  applicationDeadlineDetailed: '27 Sep at 23:59 anywhere on earth',
  applicationDeadlineRaw: '2026-09-27',
  firstDiscussionDateRaw: '2026-10-05',
  dateRange: '5 Oct - 10 Oct',
  numberOfUnits: 6,
};

vi.mock('../Nav/Nav', () => ({ Nav: () => <nav /> }));
vi.mock('next/head', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@bluedot/ui', async () => ({
  ...await vi.importActual('@bluedot/ui'),
  useLatestUtmParams: () => ({ latestUtmParams: { utm_source: 'governance-test', utm_campaign: 'autumn' } }),
}));

const renderLander = (soonestDeadline: string | null) => render(
  <CourseLander
    courseSlug="ai-governance"
    baseApplicationUrl={applicationUrl}
    createContentFor={createAiGovernanceContent}
    courseOgImage="https://bluedot.org/images/courses/link-preview/ai-governance.png"
    soonestDeadline={soonestDeadline}
  />,
  { wrapper: TrpcProvider },
);

describe('Frontier AI Governance landing page', () => {
  beforeEach(() => {
    server.use(
      trpcMsw.testimonials.getCommunityMembersByCourseSlug.query(() => []),
      trpcMsw.courseRounds.getRoundsForCourse.query(() => ({ intense: [round], partTime: [{ ...round, id: 'recPartTime', intensity: 'part-time' }] })),
    );
  });

  it('uses the supplied live deadline and preserves attribution on hero and final application links', async () => {
    renderLander('27 Sep');
    const applyLinks = screen.getAllByRole('link', { name: 'Apply by 27 Sep' });
    expect(applyLinks).toHaveLength(3);
    for (const link of applyLinks) {
      const url = new URL(link.getAttribute('href')!);
      expect(url.origin + url.pathname).toBe(applicationUrl);
      expect(url.searchParams.get('prefill_Source')).toBe('governance-test');
      expect(url.searchParams.get('prefill_Campaign')).toBe('autumn');
    }

    const roundLink = await screen.findAllByRole('link', { name: 'Apply now (opens in a new tab)' });
    expect(roundLink[0]).toHaveAttribute('href', expect.stringContaining('recTestRound'));
  });

  it('links to the curriculum overview and shows support after the course format and dates', async () => {
    const { container } = renderLander(null);
    expect(screen.getAllByRole('link', { name: 'Browse curriculum' })[0]).toHaveAttribute('href', '#curriculum');
    const sectionIds = Array.from(container.querySelectorAll('section[id]'), (section) => section.id);
    expect(sectionIds.indexOf('curriculum')).toBeLessThan(sectionIds.indexOf('structure'));
    expect(sectionIds.indexOf('schedule')).toBeLessThan(sectionIds.indexOf('support'));
    expect(screen.getAllByRole('link', { name: 'Apply now' })).toHaveLength(3);
    expect(await screen.findByText('6 day course (6–7h/day)')).toBeInTheDocument();
    expect(await screen.findByText('6 week course (6–7h/week)')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/30 hours|5h\/|AGI Strategy|10 May/);
  });

  it('keeps the application available without inventing dates when there are no rounds', async () => {
    server.use(trpcMsw.courseRounds.getRoundsForCourse.query(() => ({ intense: [], partTime: [] })));
    renderLander(null);
    expect(await screen.findByText('Check the application form for upcoming cohorts.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Apply now' })).toHaveLength(4);
  });
});
