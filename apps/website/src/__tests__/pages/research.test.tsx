import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import {
  beforeEach, describe, expect, type Mock, test, vi,
} from 'vitest';
import { useRouter } from 'next/router';
import ResearchPage from '../../pages/research';
import { RESEARCH_AREAS, RESEARCH_SUPPORT } from '../../lib/research';
import { TrpcProvider } from '../trpcProvider';
import { server, trpcMsw } from '../trpcMswSetup';
import { MOCK_NAV_GRANTS, MOCK_NAV_IN_PERSON_PROGRAMS } from '../testUtils';

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

const mockRouter = {
  asPath: '/research',
  pathname: '/research',
  push: vi.fn(),
};

const getSection = (container: HTMLElement, id: string) => {
  const section = container.querySelector<HTMLElement>(`section#${id}`);
  if (!section) {
    throw new Error(`No section with id "${id}"`);
  }

  return section;
};

beforeEach(() => {
  (useRouter as unknown as Mock).mockReturnValue(mockRouter);
  server.use(
    trpcMsw.courses.getAll.query(() => []),
    trpcMsw.programs.getInPerson.query(() => MOCK_NAV_IN_PERSON_PROGRAMS),
    trpcMsw.programs.getGrants.query(() => MOCK_NAV_GRANTS),
  );
});

describe('ResearchPage', () => {
  test('renders every research area with one link per item', () => {
    const { container } = render(<ResearchPage />, { wrapper: TrpcProvider });

    expect(screen.getByRole('heading', { name: 'Research', level: 1 })).toBeInTheDocument();

    RESEARCH_AREAS.forEach((area) => {
      const section = getSection(container, area.id);
      expect(within(section).getByRole('heading', { name: area.title, level: 2 })).toBeInTheDocument();
      expect(within(section).getAllByRole('link')).toHaveLength(area.items.length);
    });

    const support = getSection(container, 'research-we-support');
    expect(within(support).getAllByRole('link')).toHaveLength(RESEARCH_SUPPORT.length);

    expect(container).toMatchSnapshot();
  });

  test('opens write-ups elsewhere in a new tab and keeps internal links in the same tab', () => {
    const { container } = render(<ResearchPage />, { wrapper: TrpcProvider });
    const fieldStrategy = getSection(container, 'field-strategy');

    const playbook = within(fieldStrategy).getByRole('link', { name: /A playbook for field strategy/ });
    expect(playbook).toHaveAttribute('href', 'https://blog.bluedot.org/p/field-strategy-playbook');
    expect(playbook).toHaveAttribute('target', '_blank');

    const missions = within(fieldStrategy).getByRole('link', { name: /^Missions/ });
    expect(missions).toHaveAttribute('href', '/missions');
    expect(missions).not.toHaveAttribute('target');
  });

  test('every item has a unique link', () => {
    const urls = RESEARCH_AREAS.flatMap((area) => area.items.map((item) => item.url));

    expect(new Set(urls).size).toBe(urls.length);
  });
});
