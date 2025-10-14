import { render } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import JoinUsPage from '../../pages/join-us';

vi.mock('../../utils/trpc', () => ({
  trpc: {
    jobs: {
      getAll: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
          error: null,
        })),
      },
    },
  },
}));

describe('JoinUsPage', () => {
  test('should render correctly', () => {
    const { container } = render(<JoinUsPage />);
    expect(container).toMatchSnapshot();
  });
});
