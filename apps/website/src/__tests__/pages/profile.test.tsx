/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  render, fireEvent, waitFor, screen,
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
import useAxios from 'axios-hooks';
import ProfilePage from '../../pages/profile';

// Mock axios for API calls
vi.mock('axios');
const mockedAxios = axios as typeof axios & {
  patch: Mock;
  isAxiosError: Mock;
};

// Setup axios.isAxiosError to return true for our mock errors
(mockedAxios.isAxiosError as any) = vi.fn((error) => error.isAxiosError === true);

// Mock axios-hooks
vi.mock('axios-hooks');
const mockedUseAxios = useAxios as unknown as Mock;

// Mock auth
vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    withAuth: (Component: any) => (props: any) => Component({ ...props, auth: { token: 'test-token' } }),
  };
});

// Mock Next.js Head
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock CircleSpaceEmbed to avoid iframe errors
// Courses will be part of another page soon
vi.mock('../../components/courses/exercises/CircleSpaceEmbed', () => ({
  default: () => null,
}));

const mockUserData = {
  user: {
    id: '123',
    email: 'test@example.com',
    name: 'John Doe',
  },
};

const mockCourseRegistrations = {
  courseRegistrations: [],
};

const mockCourses = {
  courses: [],
};

// Test helper function for selecting elements by class name
const getNameInput = (container: HTMLElement): HTMLInputElement => {
  const input = container.querySelector('.profile-account-details__name-input') as HTMLInputElement;
  expect(input).toBeInTheDocument();
  return input;
};

// Helper functions for other stable selectors
const getNameSaveButton = (container: HTMLElement): HTMLElement | null => {
  return container.querySelector('.profile-account-details__name-save-button');
};

const getNameCancelButton = (container: HTMLElement): HTMLElement | null => {
  return container.querySelector('.profile-account-details__name-cancel-button');
};

describe('ProfilePage - Edit Name Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default axios-hooks mock returns
    mockedUseAxios.mockImplementation((config: any) => {
      if (config.url === '/api/users/me') {
        return [
          { data: mockUserData, loading: false, error: null },
          vi.fn(), // refetchUser function
        ];
      }
      if (config.url === '/api/course-registrations') {
        return [
          { data: mockCourseRegistrations, loading: false, error: null },
          vi.fn(),
        ];
      }
      if (config.url === '/api/courses') {
        return [
          { data: mockCourses, loading: false, error: null },
          vi.fn(),
        ];
      }
      return [{ data: null, loading: false, error: null }, vi.fn()];
    });
  });

  test('should render profile page with name correctly', async () => {
    const { container } = render(<ProfilePage />);

    // Wait for the component to initialize with user data
    await waitFor(() => {
      const nameInput = getNameInput(container);
      expect(nameInput.value).toBe('John Doe');
    });
    expect(screen.getByText('Name:')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  test('should allow user to successfully change their name', async () => {
    const refetchUser = vi.fn();
    mockedUseAxios.mockImplementation((config: any) => {
      if (config.url === '/api/users/me') {
        return [
          { data: mockUserData, loading: false, error: null },
          refetchUser,
        ];
      }
      return [{ data: null, loading: false, error: null }, vi.fn()];
    });

    mockedAxios.patch.mockResolvedValueOnce({ data: { success: true } });

    const { container } = render(<ProfilePage />);

    // Find the name input and change it
    const input = await waitFor(() => {
      const nameInput = getNameInput(container);
      return nameInput;
    });
    fireEvent.change(input, { target: { value: 'Jane Doe' } });

    // Save the changes
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Verify the API was called correctly and buttons disappear after save
    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/users/me',
        { name: 'Jane Doe' },
        { headers: { Authorization: 'Bearer test-token' } },
      );
    });

    // Verify refetch is NOT called (optimization)
    expect(refetchUser).not.toHaveBeenCalled();

    // Verify buttons disappear after successful save (UI updates immediately)
    await waitFor(() => {
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    // Verify input still shows the new name
    expect((input as HTMLInputElement).value).toBe('Jane Doe');
  });

  test('should show validation errors for invalid names', async () => {
    const { container } = render(<ProfilePage />);

    const input = await waitFor(() => {
      const nameInput = getNameInput(container);
      return nameInput;
    });

    // Test length validation - client-side validation now happens before API call
    const longName = 'a'.repeat(51);
    fireEvent.change(input, { target: { value: longName } });

    // Save button should appear and we can click it
    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Save'));

    // Client-side validation should show error immediately
    await waitFor(() => {
      expect(screen.getByText('Name must be under 50 characters')).toBeInTheDocument();
    });

    // Verify that no API call was made due to client-side validation
    expect(mockedAxios.patch).not.toHaveBeenCalled();

    // Test regex validation for invalid characters
    fireEvent.change(input, { target: { value: 'John@123' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Name can only contain letters, spaces, hyphens, apostrophes, and periods')).toBeInTheDocument();
    });
  });

  test('should show save/cancel buttons when name is changed', async () => {
    const { container } = render(<ProfilePage />);

    const input = await waitFor(() => {
      const nameInput = getNameInput(container);
      return nameInput;
    });

    // Initially no buttons should be visible
    expect(getNameSaveButton(container)).not.toBeInTheDocument();
    expect(getNameCancelButton(container)).not.toBeInTheDocument();

    // Change the name - buttons should appear
    fireEvent.change(input, { target: { value: 'Jane Doe' } });

    await waitFor(() => {
      expect(getNameSaveButton(container)).toBeInTheDocument();
      expect(getNameCancelButton(container)).toBeInTheDocument();
    });
  });

  test('should not show buttons when name matches original', async () => {
    const { container } = render(<ProfilePage />);

    const input = await waitFor(() => {
      const nameInput = getNameInput(container);
      return nameInput;
    });

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

  test('should support keyboard shortcuts for save and cancel', async () => {
    // Mock successful API response
    mockedAxios.patch.mockResolvedValueOnce({ data: { success: true } });

    const { container } = render(<ProfilePage />);

    const input = await waitFor(() => {
      const nameInput = getNameInput(container);
      return nameInput;
    });

    // Change name and use Enter to save
    fireEvent.change(input, { target: { value: 'Jane Doe' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/users/me',
        { name: 'Jane Doe' },
        { headers: { Authorization: 'Bearer test-token' } },
      );
    });

    // Verify buttons disappear after successful save
    await waitFor(() => {
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    // Reset mock and test Escape key for cancel
    // After saving "Jane Doe", it becomes the new "saved" value
    mockedAxios.patch.mockClear();
    fireEvent.change(input, { target: { value: 'Jane Smith' } });

    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      // Should revert to the last saved value ("Jane Doe"), not the original server value ("John Doe")
      expect((input as HTMLInputElement).value).toBe('Jane Doe');
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  test('should handle API errors gracefully', async () => {
    const { container } = render(<ProfilePage />);

    const input = await waitFor(() => {
      const nameInput = getNameInput(container);
      return nameInput;
    });

    // Test session expired error
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
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Session expired. Please refresh the page and try again.')).toBeInTheDocument();
    });

    // Clear the error by clicking on the input
    fireEvent.focus(input);

    // Test generic network error
    mockedAxios.patch.mockRejectedValueOnce(new Error('Network error'));

    fireEvent.change(input, { target: { value: 'Jane Smith' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Failed to update name. Please try again.')).toBeInTheDocument();
    });
  });

  test('should handle null initial name', async () => {
    // Mock user data with null name
    const mockUserDataWithNullName = {
      user: {
        id: '123',
        email: 'test@example.com',
        name: null,
      },
    };

    mockedUseAxios.mockImplementation((config: any) => {
      if (config.url === '/api/users/me') {
        return [
          { data: mockUserDataWithNullName, loading: false, error: null },
          vi.fn(),
        ];
      }
      if (config.url === '/api/course-registrations') {
        return [
          { data: mockCourseRegistrations, loading: false, error: null },
          vi.fn(),
        ];
      }
      if (config.url === '/api/courses') {
        return [
          { data: mockCourses, loading: false, error: null },
          vi.fn(),
        ];
      }
      return [{ data: null, loading: false, error: null }, vi.fn()];
    });

    const { container } = render(<ProfilePage />);

    const input = await waitFor(() => {
      const nameInput = getNameInput(container);
      return nameInput;
    });

    // Input should be empty since user has null name
    expect((input as HTMLInputElement).value).toBe('');

    // No save/cancel buttons should appear initially
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });
});
