import { render, fireEvent, waitFor, screen } from '@testing-library/react';
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
import axios from 'axios';
import useAxios from 'axios-hooks';
import ProfilePage from '../../pages/profile';

// Mock axios for API calls
vi.mock('axios');
const mockedAxios = axios as typeof axios & {
  patch: Mock;
};

// Mock axios-hooks
vi.mock('axios-hooks');
const mockedUseAxios = useAxios as Mock;

// Mock auth
vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    withAuth: (Component: any) => (props: any) => 
      Component({ ...props, auth: { token: 'test-token' } }),
  };
});

// Mock Next.js Head
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock CircleSpaceEmbed to avoid iframe errors
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

  test('should render profile page with name correctly', () => {
    const { container } = render(<ProfilePage />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Name:')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  test('should show "Not set" when user has no name', () => {
    mockedUseAxios.mockImplementation((config: any) => {
      if (config.url === '/api/users/me') {
        return [
          { 
            data: { user: { ...mockUserData.user, name: null } }, 
            loading: false, 
            error: null 
          },
          vi.fn(),
        ];
      }
      return [{ data: null, loading: false, error: null }, vi.fn()];
    });

    render(<ProfilePage />);
    
    expect(screen.getByText('Not set')).toBeInTheDocument();
  });

  test('should enter edit mode when clicking on name field', async () => {
    render(<ProfilePage />);
    
    const nameDisplay = screen.getByRole('button', { name: /Name: John Doe/i });
    fireEvent.click(nameDisplay);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  test('should enter edit mode with keyboard navigation', async () => {
    render(<ProfilePage />);
    
    const nameDisplay = screen.getByRole('button', { name: /Name: John Doe/i });
    
    // Test Enter key
    fireEvent.keyDown(nameDisplay, { key: 'Enter' });
    
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Enter your name') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('John Doe'); // Should populate with current name
    });
    
    // Cancel and test Space key
    fireEvent.keyDown(screen.getByPlaceholderText('Enter your name'), { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Enter your name')).not.toBeInTheDocument();
    });
    
    fireEvent.keyDown(nameDisplay, { key: ' ' });
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    });
  });

  test('should cancel edit and revert to original name', async () => {
    render(<ProfilePage />);
    
    // Enter edit mode
    const nameDisplay = screen.getByRole('button', { name: /Name: John Doe/i });
    fireEvent.click(nameDisplay);
    
    // Change the name
    const input = await screen.findByPlaceholderText('Enter your name');
    fireEvent.change(input, { target: { value: 'Jane Doe' } });
    
    // Click cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Should revert to display mode with original name
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Enter your name')).not.toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });


  test('should save name successfully', async () => {
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

    render(<ProfilePage />);
    
    // Enter edit mode
    const nameDisplay = screen.getByRole('button', { name: /Name: John Doe/i });
    fireEvent.click(nameDisplay);
    
    // Change the name
    const input = await screen.findByPlaceholderText('Enter your name');
    fireEvent.change(input, { target: { value: 'Jane Doe' } });
    
    // Click save
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/api/users/me',
        { name: 'Jane Doe' },
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(refetchUser).toHaveBeenCalled();
    });
  });


  test('should show loading state while saving', async () => {
    let resolvePromise: any;
    const savePromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    mockedAxios.patch.mockReturnValueOnce(savePromise);

    render(<ProfilePage />);
    
    // Enter edit mode
    const nameDisplay = screen.getByRole('button', { name: /Name: John Doe/i });
    fireEvent.click(nameDisplay);
    
    // Change name
    const input = await screen.findByPlaceholderText('Enter your name');
    fireEvent.change(input, { target: { value: 'Jane Doe' } });
    
    // Click save
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    // Should show loading state immediately
    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
    
    // Check buttons are disabled
    const savingButton = screen.getByText('Saving...');
    const cancelButton = screen.getByText('Cancel');
    expect(savingButton.closest('button')).toBeDisabled();
    expect(cancelButton.closest('button')).toBeDisabled();
    
    // Resolve the promise to complete the test
    resolvePromise({ data: { success: true } });
  });

  test('should handle validation errors', async () => {
    render(<ProfilePage />);
    
    const nameDisplay = screen.getByRole('button', { name: /Name: John Doe/i });
    
    // Test empty name validation
    mockedAxios.patch.mockRejectedValueOnce({
      response: { 
        status: 400,
        data: { error: 'Invalid request body: [{"code":"too_small","minimum":1,"type":"string","inclusive":true,"exact":false,"message":"Name cannot be empty","path":["name"]}]' }
      }
    });
    
    fireEvent.click(nameDisplay);
    const input = await screen.findByPlaceholderText('Enter your name');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(screen.getByText('Name cannot be empty')).toBeInTheDocument();
    });
    
    // Test length validation
    mockedAxios.patch.mockRejectedValueOnce({
      response: { 
        status: 400,
        data: { error: 'Invalid request body: [{"code":"too_big","maximum":50,"type":"string","inclusive":true,"exact":false,"message":"Name must be under 50 characters","path":["name"]}]' }
      }
    });
    
    const longName = 'a'.repeat(51);
    fireEvent.change(input, { target: { value: longName } });
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(screen.getByText('Name must be under 50 characters')).toBeInTheDocument();
    });
  });

  test('should not make API call if name has not changed', async () => {
    render(<ProfilePage />);
    
    // Enter edit mode
    const nameDisplay = screen.getByRole('button', { name: /Name: John Doe/i });
    fireEvent.click(nameDisplay);
    
    // Don't change the name and save
    const saveButton = await screen.findByText('Save');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockedAxios.patch).not.toHaveBeenCalled();
      // Should exit edit mode
      expect(screen.queryByPlaceholderText('Enter your name')).not.toBeInTheDocument();
    });
  });

  test('should handle API errors', async () => {
    render(<ProfilePage />);
    
    const nameDisplay = screen.getByRole('button', { name: /Name: John Doe/i });
    
    // Test 401 error (session expired)
    mockedAxios.patch.mockRejectedValueOnce({
      response: { status: 401 }
    });
    
    fireEvent.click(nameDisplay);
    const input = await screen.findByPlaceholderText('Enter your name');
    fireEvent.change(input, { target: { value: 'Jane Doe' } });
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(screen.getByText('Session expired. Please refresh the page and try again.')).toBeInTheDocument();
    });
    
    // Test generic network error
    mockedAxios.patch.mockRejectedValueOnce(new Error('Network error'));
    
    fireEvent.change(input, { target: { value: 'Jane Smith' } });
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to update name. Please try again.')).toBeInTheDocument();
    });
  });
});