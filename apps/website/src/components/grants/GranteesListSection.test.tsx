// @vitest-environment happy-dom

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import GranteesListSection from './GranteesListSection';

const mockUseQuery = vi.fn();

vi.mock('../../utils/trpc', () => ({
  trpc: {
    grants: {
      getAllPublicGrantees: {
        useQuery: () => mockUseQuery(),
      },
    },
  },
}));

const mockGrantees = [
  {
    granteeName: 'Alice',
    projectTitle: 'Alpha Project',
    amountUsd: 1000,
    projectSummary: 'Alpha summary',
    link: 'https://example.com/alpha',
  },
  {
    granteeName: 'Bob',
    projectTitle: 'Beta Project',
    amountUsd: 2000,
    projectSummary: undefined,
    link: undefined,
  },
];

describe('GranteesListSection', () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({
      data: mockGrantees,
      isLoading: false,
      error: null,
    });
  });

  test('applies scroll margin to the section and toggles hidden grants', async () => {
    const { container } = render(<GranteesListSection
      id="grants-made"
      title="Projects we have funded"
      limit={1}
      background="canvas"
    />);

    await waitFor(() => {
      expect(screen.getByText('Alpha Project')).toBeDefined();
    });

    const section = container.querySelector('section#grants-made');
    expect(section?.className).toContain('scroll-mt-28');
    expect(screen.queryByText('Beta Project')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Show all 2 public grants' }));

    await waitFor(() => {
      expect(screen.getByText('Beta Project')).toBeDefined();
    });
  });
});
