import {
  render,
  fireEvent,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import '@testing-library/jest-dom';
import {
  describe,
  expect,
  test,
  vi,
  beforeEach,
  afterEach,
  type MockedFunction,
} from 'vitest';
import axios, { AxiosError } from 'axios';
import PasswordSection from './PasswordSection';

// Mock axios module
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    isAxiosError: vi.fn(),
  },
}));

const mockedAxios = axios as typeof axios & {
  post: MockedFunction<typeof axios.post>;
  isAxiosError: MockedFunction<typeof axios.isAxiosError>;
};

describe('PasswordSection - User Journeys', () => {
  // Test data
  const authToken = 'test-token';
  const validPasswords = {
    current: 'MyCurrentPassword123!',
    new: 'MyNewSecurePassword456!',
  };

  // Helper to flush all pending promises
  const flushPromises = () => new Promise((resolve) => { setTimeout(resolve, 0); });

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

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup axios.isAxiosError
    mockedAxios.isAxiosError.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any): error is AxiosError => error?.isAxiosError === true,
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test('User can successfully change their password', async () => {
    // Setup successful response
    mockedAxios.post.mockResolvedValueOnce({ data: {} });

    render(<PasswordSection authToken={authToken} />);

    // User clicks "Change Password" button
    openPasswordModal();

    // User fills in the form correctly
    fillPasswordForm(
      validPasswords.current,
      validPasswords.new,
      validPasswords.new,
    );

    // User submits the form
    submitForm();

    // Wait for the API call and success flow
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/users/change-password',
        {
          currentPassword: validPasswords.current,
          newPassword: validPasswords.new,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
    });

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
    // Setup 401 error response
    const error = {
      isAxiosError: true,
      response: { status: 401 },
    };
    mockedAxios.post.mockRejectedValueOnce(error);

    render(<PasswordSection authToken={authToken} />);

    // User opens modal and fills form
    openPasswordModal();
    fillPasswordForm(
      'WrongPassword123!',
      validPasswords.new,
      validPasswords.new,
    );

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
    render(<PasswordSection authToken={authToken} />);

    openPasswordModal();

    // User tries to submit empty form
    submitForm();

    // User sees all required field errors
    const errors = await screen.findAllByRole('alert');
    expect(errors).toHaveLength(3);
    expect(errors[0]).toHaveTextContent('Current password is required');
    expect(errors[1]).toHaveTextContent('Password must be at least 8 characters');
    expect(errors[2]).toHaveTextContent('Please confirm your new password');

    // No API call should be made
    expect(mockedAxios.post).not.toHaveBeenCalled();

    // User fills current password and short new password
    fillPasswordForm(
      validPasswords.current,
      'short',
      'short',
    );
    submitForm();

    // User sees password length error
    const lengthError = await screen.findByText('Password must be at least 8 characters', {
      selector: '[role="alert"]',
    });
    expect(lengthError).toBeInTheDocument();

    // User fixes password but confirms don't match
    fillPasswordForm(
      validPasswords.current,
      validPasswords.new,
      'DifferentPassword123!',
    );
    submitForm();

    // User sees mismatch error
    const mismatchError = await screen.findByText('Passwords do not match');
    expect(mismatchError).toHaveAttribute('role', 'alert');
  });

  test('User can cancel password change', async () => {
    render(<PasswordSection authToken={authToken} />);

    openPasswordModal();

    // User fills in some data
    fillPasswordForm(
      validPasswords.current,
      validPasswords.new,
      'MismatchedPassword',
    );

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
    mockedAxios.post.mockResolvedValueOnce({ data: {} });

    render(<PasswordSection authToken={authToken} />);

    openPasswordModal();
    fillPasswordForm(
      validPasswords.current,
      validPasswords.new,
      validPasswords.new,
    );

    // User presses Enter in any field
    fireEvent.keyDown(screen.getByLabelText(/confirm new password/i), {
      key: 'Enter',
      code: 'Enter',
    });

    // Form is submitted
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled();
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
    render(<PasswordSection authToken={authToken} />);

    openPasswordModal();

    // User sees password requirement hint
    const hint = screen.getByText('Password must be at least 8 characters');
    expect(hint).toBeInTheDocument();
    expect(hint).toHaveAttribute('id', 'new-password-hint');
  });

  test('Form is properly disabled during submission', async () => {
    // Mock a slow API response
    let resolvePromise: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    
    mockedAxios.post.mockImplementation(() => promise);

    render(<PasswordSection authToken={authToken} />);

    openPasswordModal();
    fillPasswordForm(
      validPasswords.current,
      validPasswords.new,
      validPasswords.new,
    );

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
    resolvePromise!();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Ensure all promises including the finally block are resolved
    await act(async () => {
      await flushPromises();
    });
  });

  test('User can close modal with Escape key', async () => {
    render(<PasswordSection authToken={authToken} />);

    openPasswordModal();

    // User fills in some data
    fillPasswordForm(
      validPasswords.current,
      validPasswords.new,
      'MismatchedPassword',
    );

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
    // Setup 503 error response (service unavailable)
    const error = {
      isAxiosError: true,
      response: {
        status: 503,
        data: { error: 'Authentication service not configured. Please contact support.' },
      },
    };
    mockedAxios.post.mockRejectedValueOnce(error);

    render(<PasswordSection authToken={authToken} />);

    // User opens modal and fills form
    openPasswordModal();
    fillPasswordForm(
      validPasswords.current,
      validPasswords.new,
      validPasswords.new,
    );

    // User submits
    submitForm();

    // User sees the configuration error message
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent('Failed to update password: Authentication service not configured. Please contact support.');

    // Modal stays open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Ensure all promises including the finally block are resolved
    await act(async () => {
      await flushPromises();
    });
  });

  test('User sees generic error message for unexpected backend errors', async () => {
    // Setup 500 error response (internal server error)
    const error = {
      isAxiosError: true,
      response: {
        status: 500,
        data: { error: 'An unexpected error occurred during authentication.' },
      },
    };
    mockedAxios.post.mockRejectedValueOnce(error);

    render(<PasswordSection authToken={authToken} />);

    // User opens modal and fills form
    openPasswordModal();
    fillPasswordForm(
      validPasswords.current,
      validPasswords.new,
      validPasswords.new,
    );

    // User submits
    submitForm();

    // User sees the error message
    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent('Failed to update password: An unexpected error occurred during authentication.');

    // Modal stays open
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Ensure all promises including the finally block are resolved
    await act(async () => {
      await flushPromises();
    });
  });

  test('User sees fallback error message when backend error has no details', async () => {
    // Setup error response with no error message
    const error = {
      isAxiosError: true,
      response: {
        status: 500,
        data: {},
      },
    };
    mockedAxios.post.mockRejectedValueOnce(error);

    render(<PasswordSection authToken={authToken} />);

    // User opens modal and fills form
    openPasswordModal();
    fillPasswordForm(
      validPasswords.current,
      validPasswords.new,
      validPasswords.new,
    );

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
