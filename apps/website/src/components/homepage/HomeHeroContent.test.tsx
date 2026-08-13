import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { render } from '@testing-library/react';
import HomeHeroContent from './HomeHeroContent';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { MOCK_NAV_GRANTS, MOCK_NAV_IN_PERSON_PROGRAMS } from '../../__tests__/testUtils';

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    query: {},
  }),
}));

beforeEach(() => {
  server.use(
    trpcMsw.programs.getInPerson.query(() => MOCK_NAV_IN_PERSON_PROGRAMS),
    trpcMsw.programs.getGrants.query(() => MOCK_NAV_GRANTS),
    trpcMsw.courses.getAll.query(() => []),
  );
});

describe('HomeHeroContent', () => {
  test('renders as expected', () => {
    const { container } = render(<HomeHeroContent />, { wrapper: TrpcProvider });
    expect(container).toMatchSnapshot();
  });
});
