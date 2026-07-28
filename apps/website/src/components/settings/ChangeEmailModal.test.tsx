import '@testing-library/jest-dom';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { userTable } from '@bluedot/db';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import {
  createTrpcDbProvider, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../../__tests__/dbTestUtils';
import { sendEmailChangeVerification } from '../../lib/api/customerio';
import { adminRequest } from '../../lib/api/keycloak';
import env from '../../lib/api/env';
import ChangeEmailModal from './ChangeEmailModal';

vi.mock('../../lib/api/customerio', () => ({
  sendEmailChangeVerification: vi.fn(),
  updateCustomerIoEmail: vi.fn(),
}));

vi.mock('../../lib/api/keycloak', async () => ({
  ...await vi.importActual('../../lib/api/keycloak'),
  adminRequest: vi.fn(),
}));

setupTestDb();

const mutableEnv = env as { EMAIL_CHANGE_TOKEN_SECRET?: string };

beforeEach(async () => {
  vi.resetAllMocks();
  vi.mocked(adminRequest).mockResolvedValue([]);
  mutableEnv.EMAIL_CHANGE_TOKEN_SECRET = 'test-secret';
  await seedLoggedInUser();
});

const renderModal = (setIsOpen = vi.fn()) => {
  const utils = render(
    <ChangeEmailModal isOpen setIsOpen={setIsOpen} />,
    { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) },
  );
  return { ...utils, setIsOpen };
};

const typeEmail = (value: string) => {
  fireEvent.change(screen.getByLabelText(/new email/i), { target: { value } });
};

const submit = () => {
  fireEvent.click(screen.getByRole('button', { name: /send confirmation link/i }));
};

const successView = () => screen.queryByText(/valid for 48 hours/i);
const genericErrorView = () => screen.queryByRole('heading', { name: /^Error:/ });

describe('ChangeEmailModal', () => {
  test('User requests a change and sees the confirmation-sent view only after the server responds', async () => {
    renderModal();

    typeEmail(' New@Example.com ');
    submit();

    expect(await screen.findByText('new@example.com')).toBeInTheDocument();
    expect(successView()).toBeInTheDocument();
    expect(screen.queryByLabelText(/new email/i)).not.toBeInTheDocument();

    expect(sendEmailChangeVerification).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendEmailChangeVerification).mock.calls[0]![0]).toMatchObject({
      oldEmail: 'test@example.com',
      newEmail: 'new@example.com',
    });
    expect((await testDb.get(userTable, { id: 'test-user' })).email).toBe('test@example.com');
  });

  test('Done closes the modal after a successful request', async () => {
    const { setIsOpen } = renderModal();

    typeEmail('new@example.com');
    submit();

    fireEvent.click(await screen.findByRole('button', { name: 'Done' }));
    expect(setIsOpen).toHaveBeenCalledWith(false);
  });

  test('User sees a validation error for a malformed email, and nothing is sent', async () => {
    renderModal();

    typeEmail('not-an-email');
    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Please enter a valid email address');
    expect(sendEmailChangeVerification).not.toHaveBeenCalled();

    typeEmail('valid@example.com');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('User sees an in-flight state while the request runs, and no success view yet', async () => {
    let resolveSend: () => void;
    vi.mocked(sendEmailChangeVerification).mockReturnValue(new Promise((resolve) => {
      resolveSend = () => resolve();
    }));

    renderModal();
    typeEmail('new@example.com');
    submit();

    await waitFor(() => {
      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/new email/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel email change/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /send confirmation link/i })).toBeDisabled();
    expect(successView()).not.toBeInTheDocument();

    resolveSend!();
    expect(await screen.findByText('new@example.com')).toBeInTheDocument();
  });

  test('User sees a friendly inline message when the email belongs to another account', async () => {
    await testDb.insert(userTable, { id: 'other-user', email: 'taken@example.com' });
    renderModal();

    typeEmail('Taken@Example.com');
    submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('That email address is already linked to another BlueDot account. If it\'s yours, sign in with it instead.');
    expect(genericErrorView()).not.toBeInTheDocument();
    expect(successView()).not.toBeInTheDocument();
    expect(screen.getByLabelText(/new email/i)).toBeEnabled();
    expect(sendEmailChangeVerification).not.toHaveBeenCalled();
  });

  test('Any other server rejection surfaces through the generic error view', async () => {
    renderModal();

    typeEmail('test@example.com');
    submit();

    expect(await screen.findByRole('heading', { name: /New email is the same as the current email/ })).toBeInTheDocument();
    expect(successView()).not.toBeInTheDocument();
  });

  test('An unexpected failure surfaces through the generic error view, and the form stays usable', async () => {
    vi.mocked(sendEmailChangeVerification).mockRejectedValue(new Error('customer.io is down'));
    renderModal();

    typeEmail('new@example.com');
    submit();

    expect(await screen.findByRole('heading', { name: /^Error:/ })).toBeInTheDocument();
    expect(successView()).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send confirmation link/i })).toBeEnabled();
  });

  test('User can retry after a failure, and the form is clean when the modal is reopened', async () => {
    await testDb.insert(userTable, { id: 'other-user', email: 'taken@example.com' });

    const setIsOpen = vi.fn();
    const { rerender } = render(
      <ChangeEmailModal isOpen setIsOpen={setIsOpen} />,
      { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) },
    );

    typeEmail('taken@example.com');
    submit();
    await screen.findByRole('alert');

    typeEmail('new@example.com');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    submit();
    expect(await screen.findByText('new@example.com')).toBeInTheDocument();

    rerender(<ChangeEmailModal isOpen={false} setIsOpen={setIsOpen} />);
    rerender(<ChangeEmailModal isOpen setIsOpen={setIsOpen} />);

    expect(screen.getByLabelText(/new email/i)).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(successView()).not.toBeInTheDocument();
  });
});
