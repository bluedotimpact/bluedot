import '@testing-library/jest-dom';
import { render, waitFor } from '@testing-library/react';
import {
  beforeEach, describe, expect, type Mock, test, vi,
} from 'vitest';
import { useRouter } from 'next/router';
import AboutPage from '../../pages/about';
import { TrpcProvider } from '../trpcProvider';
import { server, trpcMsw } from '../trpcMswSetup';

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
  test('should render correctly', async () => {
    server.use(
      trpcMsw.courses.getAll.query(() => []),
      trpcMsw.teamMembers.getAll.query(() => []),
    );
    const { container } = render(<AboutPage />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(container.querySelector('.team-section .slide-list')).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(container).toMatchSnapshot();
  });
});
