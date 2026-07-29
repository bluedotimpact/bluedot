import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { type Auth, useAuthStore } from '@bluedot/ui';
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { useCancelQueriesOnLogout } from './useCancelQueriesOnLogout';
import { ONE_HOUR_MS } from '../constants';

vi.mock('posthog-js', () => ({
  default: {
    identify: vi.fn(),
    reset: vi.fn(),
    alias: vi.fn(),
  },
}));

const createAuth = (overrides?: Partial<Auth>): Auth => ({
  token: 'test-token',
  expiresAt: Date.now() + ONE_HOUR_MS,
  email: 'user@bluedot.org',
  sub: 'keycloak-sub-123',
  ...overrides,
});

const queryClient = new QueryClient();
const cancelQueries = vi.spyOn(queryClient, 'cancelQueries');

const renderSubscription = () => renderHook(() => useCancelQueriesOnLogout(), {
  wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
});

describe('useCancelQueriesOnLogout', () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth(createAuth());
    cancelQueries.mockClear();
  });

  afterEach(() => {
    useAuthStore.getState().setAuth(null);
  });

  it('cancels in-flight queries on logout', () => {
    renderSubscription();

    useAuthStore.getState().setAuth(null);

    expect(cancelQueries).toHaveBeenCalledOnce();
  });

  it('cancels in-flight queries on logout of a session with no sub', () => {
    useAuthStore.getState().setAuth(createAuth({ sub: undefined }));
    cancelQueries.mockClear();
    renderSubscription();

    useAuthStore.getState().setAuth(null);

    expect(cancelQueries).toHaveBeenCalledOnce();
  });

  it('leaves queries alone on a token refresh', () => {
    renderSubscription();

    useAuthStore.getState().setAuth(createAuth({ token: 'refreshed-token', expiresAt: Date.now() + (2 * ONE_HOUR_MS) }));

    expect(cancelQueries).not.toHaveBeenCalled();
  });

  it('leaves queries alone on mount', () => {
    renderSubscription();

    expect(cancelQueries).not.toHaveBeenCalled();
  });

  it('stops cancelling once unmounted', () => {
    const { unmount } = renderSubscription();
    unmount();

    useAuthStore.getState().setAuth(null);

    expect(cancelQueries).not.toHaveBeenCalled();
  });
});
