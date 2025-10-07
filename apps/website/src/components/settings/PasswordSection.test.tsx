import '@testing-library/jest-dom';
import {
  act, fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { TRPCError } from '@trpc/server';
import { createTRPCMsw, httpLink } from 'msw-trpc';
import {
  afterAll, beforeAll, beforeEach, describe, expect, test,
} from 'vitest';
// eslint-disable-next-line import/no-extraneous-dependencies
import { setupServer } from 'msw/node';
import { TrpcWrapper } from '../../__tests__/trpcWrapper';
import type { AppRouter } from '../../server/routers/_app';
import PasswordSection from './PasswordSection';

const trpcMsw = createTRPCMsw<AppRouter>({
  links: [
    httpLink({
      url: 'http://localhost:8000/api/trpc',
    }),
  ],
});

describe('PasswordSection - User Journeys', () => {
  const server = setupServer();

  // Test data
  const validPasswords = {
    current: 'MyCurrentPassword123!',
    new: 'MyNewSecurePassword456!',
  };

  // Helper to flush all pending promises
  const flushPromises = () => new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

  // Helper functions
  const openPasswordModal = () => {
    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    fireEvent.click(changePasswordButton);
  };

  const fillPasswordForm = (current: string, newPass: string, confirm: string) => {
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: current },
    });
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: newPass },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: confirm },
    });
  };

  const submitForm = () => {
    const updateButton = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(updateButton);
  };

  beforeAll(() => server.listen());
  afterAll(() => server.close());

  beforeEach(() => {
    server.resetHandlers();
  });

  test('User can successfully change their password', async () => {
    server.use(trpcMsw.users.changePassword.mutation(() => ({ message: 'Password updated successfully' })));

    render(<PasswordSection />, { wrapper: TrpcWrapper });

    // User clicks "Change Password" button
    openPasswordModal();

    // User fills in the form correctly
    fillPasswordForm(validPasswords.current, validPasswords.new, validPasswords.new);

    // User submits the form
    submitForm();

    // User sees success message
    const successMessage = await screen.findByRole('status');
    expect(successMessage).toHaveTextContent('Password updated successfully!');

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Ensure all promises including the finally block are resolved
    await act(async () => {
      await flushPromises();
    });
  });

  test('User sees error when current password is wrong', async () => {
    server.use(
      trpcMsw.users.changePassword.mutation(() => {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Incorrect password' });
      }),
    );

    render(<PasswordSection />, { wrapper: TrpcWrapper });

    // User opens modal and fills form
    openPasswordModal();
    fillPasswordForm('WrongPassword123!', validPasswords.new, validPasswords.new);

    // User submits
    submitForm();

    // User sees error message
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent('Incorrect password');

    // Modal stays open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // User can fix the error and try again
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: validPasswords.current },
    });

    // Error clears when user types
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Ensure all promises including the finally block are resolved
    await act(async () => {
      await flushPromises();
    });
  });

  test('User sees validation errors for invalid inputs', async () => {
    render(<PasswordSection />, { wrapper: TrpcWrapper });

    openPasswordModal();

    // User tries to submit empty form
    submitForm();

    // User sees all required field errors
    const errors = await screen.findAllByRole('alert');
    expect(errors).toHaveLength(3);
    expect(errors[0]).toHaveTextContent('Current password is required');
    expect(errors[1]).toHaveTextContent('Password must be at least 8 characters');
    expect(errors[2]).toHaveTextContent('Please confirm your new password');

    // User fills current password and short new password
    fillPasswordForm(validPasswords.current, 'short', 'short');
    submitForm();

    // User sees password length error
    const lengthError = await screen.findByText('Password must be at least 8 characters', {
      selector: '[role="alert"]',
    });
    expect(lengthError).toBeInTheDocument();

    // User fixes password but confirms don't match
    fillPasswordForm(validPasswords.current, validPasswords.new, 'DifferentPassword123!');
    submitForm();

    // User sees mismatch error
    const mismatchError = await screen.findByText('Passwords do not match');
    expect(mismatchError).toHaveAttribute('role', 'alert');
  });

  test('User can cancel password change', async () => {
    render(<PasswordSection />, { wrapper: TrpcWrapper });

    openPasswordModal();

    // User fills in some data
    fillPasswordForm(validPasswords.current, validPasswords.new, 'MismatchedPassword');

    // User decides to cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Modal closes
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // When user opens modal again, form is clean
    openPasswordModal();
    expect(screen.getByLabelText(/current password/i)).toHaveValue('');
    expect(screen.getByLabelText(/^new password/i)).toHaveValue('');
    expect(screen.getByLabelText(/confirm new password/i)).toHaveValue('');
  });

  test('User can submit form with Enter key', async () => {
    server.use(trpcMsw.users.changePassword.mutation(() => ({ message: 'Password updated successfully' })));

    render(<PasswordSection />, { wrapper: TrpcWrapper });

    openPasswordModal();
    fillPasswordForm(validPasswords.current, validPasswords.new, validPasswords.new);

    // User presses Enter in any field
    fireEvent.keyDown(screen.getByLabelText(/confirm new password/i), {
      key: 'Enter',
      code: 'Enter',
    });

    // Success message appears
    const successMessage = await screen.findByRole('status');
    expect(successMessage).toHaveTextContent('Password updated successfully!');

    // Wait for modal to close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Ensure all promises including the finally block are resolved
    await act(async () => {
      await flushPromises();
    });
  });

  test('User sees helpful password hint', () => {
    render(<PasswordSection />, { wrapper: TrpcWrapper });

    openPasswordModal();

    // User sees password requirement hint
    const hint = screen.getByText('Password must be at least 8 characters');
    expect(hint).toBeInTheDocument();
    expect(hint).toHaveAttribute('id', 'new-password-hint');
  });

  test('Form is properly disabled during submission', async () => {
    // Mock a slow API response
    let resolvePromise: (value: { message: string }) => void;
    const promise = new Promise<{ message: string }>((resolve) => {
      resolvePromise = resolve;
    });

    server.use(trpcMsw.users.changePassword.mutation(() => promise));

    render(<PasswordSection />, { wrapper: TrpcWrapper });

    openPasswordModal();
    fillPasswordForm(validPasswords.current, validPasswords.new, validPasswords.new);

    submitForm();

    // All inputs and buttons should be disabled
    expect(screen.getByLabelText(/current password/i)).toBeDisabled();
    expect(screen.getByLabelText(/^new password/i)).toBeDisabled();
    expect(screen.getByLabelText(/confirm new password/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /update password/i })).toBeDisabled();

    // Loading state is shown
    expect(screen.getByText('Updating...')).toBeInTheDocument();

    // Resolve the promise and wait for the component to update
    resolvePromise!({ message: 'Password updated successfully' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Ensure all promises including the finally block are resolved
    await act(async () => {
      await flushPromises();
    });
  });

  test('User can close modal with Escape key', async () => {
    render(<PasswordSection />, { wrapper: TrpcWrapper });

    openPasswordModal();

    // User fills in some data
    fillPasswordForm(validPasswords.current, validPasswords.new, 'MismatchedPassword');

    // User presses Escape key in any field
    fireEvent.keyDown(screen.getByLabelText(/current password/i), {
      key: 'Escape',
      code: 'Escape',
    });

    // Modal closes
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // When user opens modal again, form is clean
    openPasswordModal();
    expect(screen.getByLabelText(/current password/i)).toHaveValue('');
    expect(screen.getByLabelText(/^new password/i)).toHaveValue('');
    expect(screen.getByLabelText(/confirm new password/i)).toHaveValue('');
  });

  test('User sees system error messages when backend has configuration issues', async () => {
    server.use(
      trpcMsw.users.changePassword.mutation(() => {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Authentication service not configured. Please contact support.',
        });
      }),
    );

    render(<PasswordSection />, { wrapper: TrpcWrapper });

    // User opens modal and fills form
    openPasswordModal();
    fillPasswordForm(validPasswords.current, validPasswords.new, validPasswords.new);

    // User submits
    submitForm();

    // User sees the configuration error message
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent(
      'Failed to update password: Authentication service not configured. Please contact support.',
    );

    // Modal stays open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Ensure all promises including the finally block are resolved
    await act(async () => {
      await flushPromises();
    });
  });

  test('User sees generic error message for unexpected backend errors', async () => {
    server.use(
      trpcMsw.users.changePassword.mutation(() => {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred during authentication.',
        });
      }),
    );

    render(<PasswordSection />, { wrapper: TrpcWrapper });

    // User opens modal and fills form
    openPasswordModal();
    fillPasswordForm(validPasswords.current, validPasswords.new, validPasswords.new);

    // User submits
    submitForm();

    // User sees the error message
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent(
      'Failed to update password: An unexpected error occurred during authentication.',
    );

    // Modal stays open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Ensure all promises including the finally block are resolved
    await act(async () => {
      await flushPromises();
    });
  });

  test('User sees fallback error message when backend error has no details', async () => {
    server.use(
      trpcMsw.users.changePassword.mutation(() => {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '',
        });
      }),
    );

    render(<PasswordSection />, { wrapper: TrpcWrapper });

    // User opens modal and fills form
    openPasswordModal();
    fillPasswordForm(validPasswords.current, validPasswords.new, validPasswords.new);

    // User submits
    submitForm();

    // User sees the fallback error message
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent('Failed to update password: Please try again.');

    // Modal stays open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Ensure all promises including the finally block are resolved
    await act(async () => {
      await flushPromises();
    });
  });
});
