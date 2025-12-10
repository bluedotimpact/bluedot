import {
  describe, expect, test, vi,
} from 'vitest';
import { render } from '@testing-library/react';
import HomeHeroContent from './HomeHeroContent';
import { TrpcProvider } from '../../__tests__/trpcProvider';

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    query: {},
  }),
}));

describe('HomeHeroContent', () => {
  test('renders as expected', () => {
    const { container } = render(<HomeHeroContent />, { wrapper: TrpcProvider });
    expect(container).toMatchSnapshot();
  });
});
