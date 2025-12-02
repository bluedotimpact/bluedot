import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { ImpersonationBadge } from './ImpersonationBadge';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';

describe('ImpersonationBadge', () => {
  const createMockStorage = () => {
    const store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { Object.keys(store).forEach((key) => delete store[key]); }),
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

  test('displays masked email when impersonating', async () => {
    mockSessionStorage.store.bluedot_impersonating = 'rec123abc';

    server.use(
      trpcMsw.users.getUser.query(() => ({
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
      })),
    );

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

    server.use(
      trpcMsw.users.getUser.query(() => ({
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
      })),
    );

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
