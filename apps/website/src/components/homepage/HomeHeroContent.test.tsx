import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { render } from '@testing-library/react';
import HomeHeroContent from './HomeHeroContent';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { MOCK_NAV_PROGRAMS } from '../../__tests__/testUtils';

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    query: {},
  }),
}));

beforeEach(() => {
  server.use(trpcMsw.programs.getAll.query(() => MOCK_NAV_PROGRAMS));
});

describe('HomeHeroContent', () => {
  test('renders as expected', () => {
    const { container } = render(<HomeHeroContent />, { wrapper: TrpcProvider });
    expect(container).toMatchSnapshot();
  });
});
