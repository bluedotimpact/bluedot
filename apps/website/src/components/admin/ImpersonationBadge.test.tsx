import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { userTable } from '@bluedot/db';
import { ImpersonationBadge } from './ImpersonationBadge';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import {
  createTrpcDbProvider, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../../__tests__/dbTestUtils';

const createMockStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    key: vi.fn(),
    length: 0,
    store,
  };
};

let mockSessionStorage: ReturnType<typeof createMockStorage>;

beforeEach(() => {
  vi.clearAllMocks();
  mockSessionStorage = createMockStorage();
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true,
  });
});

describe('ImpersonationBadge', () => {
  test('displays masked email when impersonating', async () => {
    mockSessionStorage.store.bluedot_impersonating = 'rec123abc';

    server.use(trpcMsw.users.getUser.query(() => ({
      id: 'rec123abc',
      email: 'testuser@example.com',
      name: 'Test User',
      createdAt: '2024-01-01',
      lastSeenAt: '2024-01-01',
      autoNumberId: 1,
      utmSource: null,
      utmCampaign: null,
      utmContent: null,
      isAdmin: null,
      allowedImpersonationTargets: [],
    })));

    const { container } = render(<ImpersonationBadge />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByText(/Impersonating: te\*\*\*\*er@example\.com/)).toBeDefined();
    });
    expect(container).toMatchSnapshot();
  });

  test('stop impersonating button removes storage and reloads page', async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
      configurable: true,
    });

    mockSessionStorage.store.bluedot_impersonating = 'rec123abc';

    server.use(trpcMsw.users.getUser.query(() => ({
      id: 'rec123abc',
      email: 'testuser@example.com',
      name: 'Test User',
      createdAt: '2024-01-01',
      lastSeenAt: '2024-01-01',
      autoNumberId: 1,
      utmSource: null,
      utmCampaign: null,
      utmContent: null,
      isAdmin: null,
      allowedImpersonationTargets: [],
    })));

    render(<ImpersonationBadge />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByText(/Impersonating: te\*\*\*\*er@example\.com/)).toBeDefined();
    });

    const stopButton = screen.getByLabelText('Stop impersonating');
    await userEvent.click(stopButton);

    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('bluedot_impersonating');
    expect(reloadMock).toHaveBeenCalled();
  });
});

describe('ImpersonationBadge URL param handling', () => {
  setupTestDb();

  // happy-dom doesn't propagate `history.pushState` into `window.location.search`
  // (a side-effect of disableJavaScriptEvaluation in the vitest config), so we
  // replace window.location with a stub for each test.
  const stubLocationSearch = (search: string) => {
    Object.defineProperty(window, 'location', {
      value: {
        search, pathname: '/', hash: '', href: `http://localhost:8000/${search}`, replace: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  };

  test('?impersonate=<email> resolves via admin.searchUsers and writes sessionStorage', async () => {
    await testDb.insert(userTable, {
      id: 'rec-admin', email: testAuthContextLoggedIn.auth!.email, name: 'Admin', isAdmin: true,
    });
    await testDb.insert(userTable, { id: 'rec-foo', email: 'foo@bar.com', name: 'Foo' });

    stubLocationSearch('?impersonate=foo@bar.com');

    render(<ImpersonationBadge />, { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) });

    await waitFor(() => {
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('bluedot_impersonating', 'rec-foo');
    });
  });

  test('?impersonate=clear removes any active impersonation', async () => {
    mockSessionStorage.store.bluedot_impersonating = 'rec-existing';
    stubLocationSearch('?impersonate=clear');

    render(<ImpersonationBadge />, { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) });

    await waitFor(() => {
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('bluedot_impersonating');
    });
  });
});
