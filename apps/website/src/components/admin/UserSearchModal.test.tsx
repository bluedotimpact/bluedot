import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { UserSearchModal } from './UserSearchModal';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';

describe('UserSearchModal', () => {
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
  const mockReload = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage = createMockStorage();
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
      configurable: true,
    });
  });

  test('displays search results and typing fires search requests', async () => {
    const mockUsers = [
      {
        id: 'rec123',
        email: 'john@example.com',
        name: 'John Doe' as string | null,
        lastSeenAt: '2024-01-01' as string | null,
        courseCount: 2,
      },
      {
        id: 'rec456',
        email: 'jane@example.com',
        name: 'Jane Smith' as string | null,
        lastSeenAt: '2024-01-02' as string | null,
        courseCount: 1,
      },
    ];

    server.use(
      trpcMsw.admin.searchUsers.query(({ input }) => {
        if (input.query === 'john') {
          return [mockUsers[0]!];
        }
        return mockUsers;
      }),
    );

    render(<UserSearchModal isOpen onClose={mockOnClose} />, { wrapper: TrpcProvider });

    // Initially shows all users
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeDefined();
      expect(screen.getByText('Jane Smith')).toBeDefined();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText('Search by name or email...');
    fireEvent.change(searchInput, { target: { value: 'john' } });

    // Should filter results
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeDefined();
      expect(screen.queryByText('Jane Smith')).toBeNull();
    });
  });

  test('calls setItem and reloads window when user is selected', async () => {
    const mockUsers = [
      {
        id: 'rec123',
        email: 'john@example.com',
        name: 'John Doe' as string | null,
        lastSeenAt: '2024-01-01' as string | null,
        courseCount: 2,
      },
    ];

    server.use(
      trpcMsw.admin.searchUsers.query(() => mockUsers),
    );

    render(<UserSearchModal isOpen onClose={mockOnClose} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeDefined();
    });

    // Click on user
    const userButton = screen.getByText('John Doe').closest('button');
    fireEvent.click(userButton!);

    // Verify sessionStorage.setItem was called with user ID
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('bluedot_impersonating', 'rec123');

    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalled();

    // Verify window.location.reload was called
    expect(mockReload).toHaveBeenCalled();
  });
});
