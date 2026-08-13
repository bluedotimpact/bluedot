import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import {
  beforeEach, describe, expect, type Mock, test, vi,
} from 'vitest';
import { useRouter } from 'next/router';
import ContactPage from '../../pages/contact';
import { TrpcProvider } from '../trpcProvider';
import { server, trpcMsw } from '../trpcMswSetup';
import { MOCK_NAV_GRANTS, MOCK_NAV_IN_PERSON_PROGRAMS } from '../testUtils';

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

const mockRouter = {
  asPath: '/contact',
  pathname: '/contact',
  push: vi.fn(),
};

beforeEach(() => {
  (useRouter as unknown as Mock).mockReturnValue(mockRouter);
});

describe('ContactPage', () => {
  test('renders both legal entities without publishing the US street address', async () => {
    server.use(
      trpcMsw.courses.getAll.query(() => []),
      trpcMsw.programs.getInPerson.query(() => MOCK_NAV_IN_PERSON_PROGRAMS),
      trpcMsw.programs.getGrants.query(() => MOCK_NAV_GRANTS),
    );

    const { container } = render(<ContactPage />, { wrapper: TrpcProvider });

    expect(screen.getByRole('heading', { name: 'Contact & legal', level: 1 })).toBeInTheDocument();
    expect(await screen.findByText(/71-75 Shelton Street/)).toBeInTheDocument();
    expect(await screen.findByText(/99-4885308/)).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'team@bluedot.org' })).toHaveAttribute('href', 'mailto:team@bluedot.org');
    expect(screen.getByText(/general questions or feedback/)).toBeInTheDocument();
    expect(container).not.toHaveTextContent('1680 Mission');
  });
});
