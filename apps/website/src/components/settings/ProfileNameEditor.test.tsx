import '@testing-library/jest-dom';
import {
  fireEvent, render, waitFor,
} from '@testing-library/react';
import { TRPCError } from '@trpc/server';
import { describe, expect, test } from 'vitest';
import { userTable } from '@bluedot/db';
import db from '../../lib/api/db';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { setupDbTests, TrpcDbProvider } from '../../__tests__/dbTestUtils';
import ProfileNameEditor from './ProfileNameEditor';

setupDbTests();

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Jane Doe',
  createdAt: null,
  lastSeenAt: null,
  utmSource: null,
  utmCampaign: null,
  utmContent: null,
  autoNumberId: null,
  isAdmin: null,
};

// Test helper function for selecting elements
const getNameInput = (container: HTMLElement): HTMLInputElement => {
  const input = container.querySelector<HTMLInputElement>('input[aria-label="Profile name"]')!;
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
  test('should render with initial name correctly', async () => {
    const { container } = render(
      <ProfileNameEditor initialName="John Doe" />,
      { wrapper: TrpcProvider },
    );

    const nameInput = getNameInput(container);
    expect(nameInput.value).toBe('John Doe');

    // Initially no buttons should be shown
    expect(getNameSaveButton(container)).not.toBeInTheDocument();
    expect(getNameCancelButton(container)).not.toBeInTheDocument();
  });

  test('should allow user to successfully change their name', async () => {
    server.use(trpcMsw.users.updateName.mutation(() => mockUser));

    const { container } = render(
      <ProfileNameEditor initialName="John Doe" />,
      { wrapper: TrpcProvider },
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
      <ProfileNameEditor initialName="John Doe" />,
      { wrapper: TrpcProvider },
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
  });

  test('should not show buttons when name matches original', async () => {
    const { container } = render(
      <ProfileNameEditor initialName="John Doe" />,
      { wrapper: TrpcProvider },
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
    // Test session expired error (401)
    server.use(trpcMsw.users.updateName.mutation(() => {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }));

    const { container } = render(
      <ProfileNameEditor initialName="John Doe" />,
      { wrapper: TrpcProvider },
    );

    const input = getNameInput(container);

    fireEvent.change(input, { target: { value: 'Jane Doe' } });
    const saveButton = getNameSaveButton(container);
    fireEvent.click(saveButton!);

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

    // Test generic error
    server.use(trpcMsw.users.updateName.mutation(() => {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }));

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
    let resolvePromise: (value: typeof mockUser) => void;
    const promise = new Promise<typeof mockUser>((resolve) => {
      resolvePromise = resolve;
    });

    server.use(trpcMsw.users.updateName.mutation(() => promise));

    const { container } = render(
      <ProfileNameEditor initialName="John Doe" />,
      { wrapper: TrpcProvider },
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

    // Resolve the promise and wait for the component to update
    resolvePromise!(mockUser);
    await waitFor(() => {
      expect(getNameSaveButton(container)).not.toBeInTheDocument();
    });
  });
});

describe('ProfileNameEditor (real DB)', () => {
  test('saves name change to the database', async () => {
    await db.insert(userTable, {
      email: 'test@example.com',
      name: 'John Doe',
    });

    const { container } = render(
      <ProfileNameEditor initialName="John Doe" />,
      { wrapper: TrpcDbProvider },
    );

    const input = container.querySelector<HTMLInputElement>('input[aria-label="Profile name"]')!;
    expect(input.value).toBe('John Doe');

    // Change the name and click Save
    fireEvent.change(input, { target: { value: 'Jane Doe' } });
    const saveButton = container.querySelector('button[aria-label="Save profile name changes"]')!;
    fireEvent.click(saveButton);

    // Wait for success (Save/Cancel buttons disappear)
    await waitFor(() => {
      expect(container.querySelector('button[aria-label="Save profile name changes"]')).not.toBeInTheDocument();
    });

    expect(input.value).toBe('Jane Doe');

    // Verify the name was persisted in the database
    const user = await db.get(userTable, { email: 'test@example.com' });
    expect(user.name).toBe('Jane Doe');
  });

  test('shows error when user does not exist in DB', async () => {
    const { container } = render(
      <ProfileNameEditor initialName="Ghost User" />,
      { wrapper: TrpcDbProvider },
    );

    const input = container.querySelector<HTMLInputElement>('input[aria-label="Profile name"]')!;
    fireEvent.change(input, { target: { value: 'New Name' } });

    const saveButton = container.querySelector('button[aria-label="Save profile name changes"]')!;
    fireEvent.click(saveButton);

    await waitFor(() => {
      const error = container.querySelector('[role="alert"]');
      expect(error).toBeInTheDocument();
    });
  });
});
