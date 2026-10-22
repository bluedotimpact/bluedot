import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CoursePage from '../../../../pages/courses/[courseSlug]/index';
import { TrpcProvider } from '../../../trpcProvider';
import { server, trpcMsw } from '../../../trpcMswSetup';
import { MOCK_NAV_GRANTS, MOCK_NAV_IN_PERSON_PROGRAMS, createMockCourse } from '../../../testUtils';

const APPLY_URL = 'https://forms.bluedot.org/apply';

vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/courses/[courseSlug]',
    query: {},
    asPath: '/courses/course-slug',
  }),
}));

vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    useLatestUtmParams: () => ({ latestUtmParams: {} }),
  };
});

const renderStandardCoursePage = (status: string) => render(
  <CoursePage
    courseSlug="course-slug"
    courseData={{ course: createMockCourse({ applyUrl: APPLY_URL, status }), units: [] }}
    courseOgImage="https://bluedot.org/images/courses/link-preview/course-slug.png"
    soonestDeadline={null}
  />,
  { wrapper: TrpcProvider },
);

describe('StandardCoursePage apply CTA', () => {
  beforeEach(() => {
    server.use(
      trpcMsw.programs.getInPerson.query(() => MOCK_NAV_IN_PERSON_PROGRAMS),
      trpcMsw.programs.getGrants.query(() => MOCK_NAV_GRANTS),
      trpcMsw.courses.getAll.query(() => []),
    );
  });

  it('links to the apply URL when the course is Active', () => {
    renderStandardCoursePage('Active');

    expect(screen.getByRole('link', { name: 'Apply now' })).toHaveAttribute('href', APPLY_URL);
    expect(screen.queryByRole('link', { name: 'Register interest' })).not.toBeInTheDocument();
  });

  it('falls back to register interest when the course is not Active, even with an apply URL', () => {
    renderStandardCoursePage('Past');

    expect(screen.queryByRole('link', { name: 'Apply now' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register interest' })).toHaveAttribute('href', expect.stringContaining('miniextensions.com'));
  });
});
