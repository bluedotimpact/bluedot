import { render } from '@testing-library/react';
import {
  beforeEach, describe, expect, Mock, test, vi,
} from 'vitest';
import { useRouter } from 'next/router';
import AboutPage from '../../pages/about';
import { TrpcProvider } from '../trpcProvider';

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

const mockRouter = {
  asPath: '/about',
  pathname: '/about',
  push: vi.fn(),
};

beforeEach(() => {
  (useRouter as unknown as Mock).mockReturnValue(mockRouter);
});

describe('AboutPage', () => {
  test('should render correctly', () => {
    const { container } = render(<AboutPage />, { wrapper: TrpcProvider });
    expect(container).toMatchSnapshot();
  });
});
