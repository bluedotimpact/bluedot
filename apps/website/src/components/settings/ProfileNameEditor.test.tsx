/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  render, fireEvent, waitFor,
} from '@testing-library/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import '@testing-library/jest-dom';
import {
  describe,
  expect,
  test,
  vi,
  beforeEach,
  type Mock,
} from 'vitest';
import axios, { AxiosError } from 'axios';
import ProfileNameEditor from './ProfileNameEditor';

// Mock axios for API calls
vi.mock('axios');
const mockedAxios = axios as typeof axios & {
  patch: Mock;
  isAxiosError: Mock;
};

// Setup axios.isAxiosError to return true for our mock errors
vi.spyOn(axios, 'isAxiosError').mockImplementation(
  (error: any): error is AxiosError => error?.isAxiosError === true,
);

// Test helper function for selecting elements
const getNameInput = (container: HTMLElement): HTMLInputElement => {
  const input = container.querySelector('input[aria-label="Profile name"]') as HTMLInputElement;
  expect(input).toBeInTheDocument();
  return input;
};

// Helper functions for buttons
const getNameSaveButton = (container: HTMLElement): HTMLElement | null => {
  return container.querySelector('button[aria-label="Save profile name changes"]');
};

const getNameCancelButton = (container: HTMLElement): HTMLElement | null => {
  return container.querySelector('button[aria-label="Cancel profile name changes"]');
};

// Helper function for error messages
const getErrorMessage = (container: HTMLElement): HTMLElement | null => {
  return container.querySelector('[role="alert"]');
};

describe('ProfileNameEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render with initial name correctly', async () => {
    const { container } = render(
      <ProfileNameEditor initialName="John Doe" authToken="test-token" />,
    );

    const nameInput = getNameInput(container);
    expect(nameInput.value).toBe('John Doe');

    // Initially no buttons should be shown
    expect(getNameSaveButton(container)).not.toBeInTheDocument();
    expect(getNameCancelButton(container)).not.toBeInTheDocument();
  });

  test('should allow user to successfully change their name', async () => {
    mockedAxios.patch.mockResolvedValueOnce({ data: { success: true } });

    const { container } = render(
      <ProfileNameEditor initialName="John Doe" authToken="test-token" />,
    );

    const input = getNameInput(container);

    // Change the name
    fireEvent.change(input, { target: { value: 'Jane Doe' } });

    // Buttons should appear
    await waitFor(() => {
      expect(getNameSaveButton(container)).toBeInTheDocument();
      expect(getNameCancelButton(container)).toBeInTheDocument();
    });

    // Save the changes
    const saveButton = getNameSaveButton(container);
    fireEvent.click(saveButton!);

    // Verify the API was called correctly
    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/users/me',
        { name: 'Jane Doe' },
        { headers: { Authorization: 'Bearer test-token' } },
      );
    });

    // Verify buttons disappear after successful save
    await waitFor(() => {
      expect(getNameSaveButton(container)).not.toBeInTheDocument();
      expect(getNameCancelButton(container)).not.toBeInTheDocument();
    });

    // Verify input still shows the new name
    expect(input.value).toBe('Jane Doe');
  });

  test('should show validation error for names exceeding maximum length', async () => {
    const { container } = render(
      <ProfileNameEditor initialName="John Doe" authToken="test-token" />,
    );

    const input = getNameInput(container);

    // Test length validation - should be handled by zod schema
    const longName = 'a'.repeat(51);
    fireEvent.change(input, { target: { value: longName } });

    const saveButton = getNameSaveButton(container);
    fireEvent.click(saveButton!);

    // Client-side validation should show error immediately
    await waitFor(() => {
      const errorMessage = getErrorMessage(container);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage?.textContent).toContain('Name must be under 50 characters');
    });

    // Verify that no API call was made due to client-side validation
    expect(mockedAxios.patch).not.toHaveBeenCalled();
  });

  test('should not show buttons when name matches original', async () => {
    const { container } = render(
      <ProfileNameEditor initialName="John Doe" authToken="test-token" />,
    );

    const input = getNameInput(container);

    // Change to different value first
    fireEvent.change(input, { target: { value: 'Jane Doe' } });

    // Buttons should appear
    await waitFor(() => {
      expect(getNameSaveButton(container)).toBeInTheDocument();
    });

    // Change back to original value
    fireEvent.change(input, { target: { value: 'John Doe' } });

    // Buttons should disappear
    await waitFor(() => {
      expect(getNameSaveButton(container)).not.toBeInTheDocument();
      expect(getNameCancelButton(container)).not.toBeInTheDocument();
    });
  });

  test('should handle API errors gracefully', async () => {
    const { container } = render(
      <ProfileNameEditor initialName="John Doe" authToken="test-token" />,
    );

    const input = getNameInput(container);

    // Test session expired error (401)
    const axiosError401 = {
      message: 'Request failed with status code 401',
      name: 'AxiosError',
      isAxiosError: true,
      response: {
        status: 401,
        statusText: 'Unauthorized',
        data: {},
        headers: {},
        config: {},
      },
      config: {},
      toJSON: () => ({}),
    };
    mockedAxios.patch.mockRejectedValueOnce(axiosError401);

    fireEvent.change(input, { target: { value: 'Jane Doe' } });
    const saveButton = getNameSaveButton(container);
    fireEvent.click(saveButton!);

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalled();
    });

    await waitFor(() => {
      const errorMessage = getErrorMessage(container);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage?.textContent).toBe('Session expired. Please refresh the page and try again.');
    });

    // Clear the error by focusing on the input
    fireEvent.focus(input);
    await waitFor(() => {
      expect(getErrorMessage(container)).not.toBeInTheDocument();
    });

    // Test generic network error
    mockedAxios.patch.mockClear();
    mockedAxios.patch.mockRejectedValueOnce(new Error('Network error'));

    fireEvent.change(input, { target: { value: 'Jane Smith' } });
    const saveButton2 = getNameSaveButton(container);
    fireEvent.click(saveButton2!);

    await waitFor(() => {
      const errorMessage = getErrorMessage(container);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage?.textContent).toBe('Failed to update name. Please try again.');
    });
  });

  test('should show loading state while saving', async () => {
    // Mock a delayed response
    mockedAxios.patch.mockImplementation(() => new Promise((resolve) => {
      setTimeout(() => resolve({ data: { success: true } }), 100);
    }));

    const { container } = render(
      <ProfileNameEditor initialName="John Doe" authToken="test-token" />,
    );

    const input = getNameInput(container);
    fireEvent.change(input, { target: { value: 'Jane Doe' } });

    const saveButton = getNameSaveButton(container);
    fireEvent.click(saveButton!);

    // Should show "Saving..." text
    await waitFor(() => {
      expect(saveButton?.textContent).toBe('Saving...');
    });

    // Should be disabled while saving
    expect(saveButton).toBeDisabled();
    expect(getNameCancelButton(container)).toBeDisabled();

    // Wait for save to complete
    await waitFor(() => {
      expect(getNameSaveButton(container)).not.toBeInTheDocument();
    });
  });
});
