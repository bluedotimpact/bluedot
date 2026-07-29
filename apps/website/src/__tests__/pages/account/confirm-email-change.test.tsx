import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import type { LoginMethods } from '../../../lib/api/keycloak';
import ConfirmEmailChange from '../../../pages/account/confirm-email-change';
import { server, trpcMsw } from '../../trpcMswSetup';
import { TrpcProvider } from '../../trpcProvider';

const mockReplaceState = vi.fn();
let mockQuery: Record<string, string> = {};

vi.mock('next/router', () => ({
  useRouter: () => ({
    isReady: true,
    pathname: '/account/confirm-email-change',
    query: mockQuery,
  }),
}));

const confirmAndGetAdvice = async (loginMethods: LoginMethods | null) => {
  server.use(trpcMsw.users.confirmEmailChange.mutation(() => ({ newEmail: 'new@example.com', loginMethods })));
  const { container } = render(<ConfirmEmailChange />, { wrapper: TrpcProvider });

  await userEvent.click(screen.getByRole('button', { name: /confirm email change/i }));
  await screen.findByText('Email updated');

  const paragraphs = container.querySelectorAll('p');
  return paragraphs[paragraphs.length - 1];
};

describe('ConfirmEmailChange', () => {
  beforeEach(() => {
    mockQuery = { token: 'a-token' };
    vi.stubGlobal('history', { replaceState: mockReplaceState });
    vi.stubGlobal('location', { search: '?token=a-token', pathname: '/account/confirm-email-change' });
  });

  test('strips the token from the address bar on load', () => {
    render(<ConfirmEmailChange />, { wrapper: TrpcProvider });

    expect(mockReplaceState).toHaveBeenCalledWith(null, '', '/account/confirm-email-change');
  });

  test('does not confirm until the user clicks', async () => {
    const confirm = vi.fn(() => ({ newEmail: 'new@example.com', loginMethods: null }));
    server.use(trpcMsw.users.confirmEmailChange.mutation(confirm));

    render(<ConfirmEmailChange />, { wrapper: TrpcProvider });

    expect(await screen.findByRole('button', { name: /confirm email change/i })).toBeInTheDocument();
    expect(confirm).not.toHaveBeenCalled();
  });

  test('tells a password user to use their new email and existing password', async () => {
    const advice = await confirmAndGetAdvice({ hasPassword: true, hasGoogleLogin: false });

    expect(advice).toHaveTextContent('Log in with your new email address and your existing password.');
  });

  test('tells a Google-only user that Google login still works', async () => {
    const advice = await confirmAndGetAdvice({ hasPassword: false, hasGoogleLogin: true });

    expect(advice).toHaveTextContent('Log in with Google as before, using your new email address.');
  });

  test('offers both methods when the user has a password and a Google login', async () => {
    const advice = await confirmAndGetAdvice({ hasPassword: true, hasGoogleLogin: true });

    expect(advice).toHaveTextContent('Log in with Google, or with your new email address and your existing password.');
  });

  test('tells a user left with no login method to set a password', async () => {
    const advice = await confirmAndGetAdvice({ hasPassword: false, hasGoogleLogin: false });

    expect(advice).toHaveTextContent('choose "Forgot password?" on the login page');
  });

  test('shows no login advice when the login methods could not be determined', async () => {
    const advice = await confirmAndGetAdvice(null);

    expect(advice).toHaveTextContent('Your BlueDot Impact account email is now new@example.com.');
  });

  test('shows the error state when the token is missing', () => {
    mockQuery = {};

    render(<ConfirmEmailChange />, { wrapper: TrpcProvider });

    expect(screen.getByRole('alert')).toHaveTextContent('This link is missing its confirmation code. Please use the link from your email.');
    expect(screen.queryByRole('button', { name: /confirm email change/i })).not.toBeInTheDocument();
  });
});
