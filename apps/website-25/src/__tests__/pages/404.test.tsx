import { render } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import Error404Page from '../../pages/404';

vi.mock('next/router', () => ({
  useRouter: () => ({
    asPath: '/an-invalid-path',
  }),
}));

describe('Error404Page', () => {
  test('should render correctly', () => {
    const { container } = render(<Error404Page />);
    expect(container).toMatchSnapshot();
  });
});
