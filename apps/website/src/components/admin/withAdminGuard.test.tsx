import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { userTable } from '@bluedot/db';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { withAdminGuard } from './withAdminGuard';
import {
  createTrpcDbProvider, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../../__tests__/dbTestUtils';

const routerReplace = vi.fn();

vi.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    replace: routerReplace,
  }),
}));

const ctxFor = (sub: string) => ({
  ...testAuthContextLoggedIn,
  auth: { ...testAuthContextLoggedIn.auth!, sub },
});

const GuardedPage = withAdminGuard(() => <p>Admin only content</p>);

describe('withAdminGuard', () => {
  setupTestDb();

  beforeEach(() => {
    routerReplace.mockClear();
  });

  const renderGuard = (sub: string) => render(
    <GuardedPage />,
    { wrapper: createTrpcDbProvider(ctxFor(sub)) },
  );

  test('shows progress dots while the admin check is pending', () => {
    const { container } = renderGuard('admin-sub');

    expect(container.querySelector('.progress-dots')).toBeInTheDocument();
    expect(screen.queryByText('Admin only content')).not.toBeInTheDocument();
  });

  test('renders children for an admin', async () => {
    await testDb.insert(userTable, {
      id: 'admin-id', email: 'admin@example.com', name: 'Admin', isAdmin: true, keycloakIdentifier: 'admin-sub',
    });

    renderGuard('admin-sub');

    expect(await screen.findByText('Admin only content')).toBeInTheDocument();
    expect(routerReplace).not.toHaveBeenCalled();
  });

  test('redirects a non-admin to /404 without rendering children', async () => {
    await testDb.insert(userTable, {
      id: 'regular-id', email: 'regular@example.com', name: 'Regular', keycloakIdentifier: 'regular-sub',
    });

    renderGuard('regular-sub');

    await waitFor(() => {
      expect(routerReplace).toHaveBeenCalledWith('/404');
    });
    expect(screen.queryByText('Admin only content')).not.toBeInTheDocument();
  });
});
