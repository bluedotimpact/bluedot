import '@testing-library/jest-dom';
import {
  act, fireEvent, render, waitFor,
} from '@testing-library/react';
import { TRPCError } from '@trpc/server';
import { describe, expect, test } from 'vitest';
import { userTable } from '@bluedot/db';
import db from '../../lib/api/db';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import {
  createTrpcDbProvider, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn,
} from '../../__tests__/dbTestUtils';
import ProfileNameEditor from './ProfileNameEditor';

setupTestDb();

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Jane Doe',
  firstName: 'Jane',
  lastName: 'Doe',
  createdAt: null,
  lastSeenAt: null,
  firstLoggedInAt: null,
  utmSource: null,
  utmCampaign: null,
  utmContent: null,
  autoNumberId: null,
  isAdmin: null,
  keycloakIdentifier: null,
  allowedImpersonationTargets: [],
};

const johnDoe = { firstName: 'John', lastName: 'Doe', name: 'John Doe' };

// Test helper function for selecting elements
const getInput = (container: HTMLElement, label: 'First name' | 'Last name'): HTMLInputElement => {
  const input = container.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
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

// Save/Cancel are always rendered; this row is hidden (keeping its width on wide screens) until something changes
const getButtonsRow = (container: HTMLElement): HTMLElement => getNameSaveButton(container)!.parentElement!;

// Helper function for error messages
const getErrorMessage = (container: HTMLElement): HTMLElement | null => {
  return container.querySelector('[role="alert"]');
};

describe('ProfileNameEditor', () => {
  test('should render with initial name correctly', async () => {
    const { container } = render(
      <ProfileNameEditor user={johnDoe} />,
      { wrapper: TrpcProvider },
    );

    expect(getInput(container, 'First name').value).toBe('John');
    expect(getInput(container, 'Last name').value).toBe('Doe');

    // Initially no buttons should be shown
    expect(getButtonsRow(container)).toHaveClass('sm:invisible');
  });

  test('should split the combined name when first/last name are not stored', () => {
    const { container } = render(
      <ProfileNameEditor user={{ firstName: null, lastName: null, name: 'Mary Jane Smith' }} />,
      { wrapper: TrpcProvider },
    );

    expect(getInput(container, 'First name').value).toBe('Mary');
    expect(getInput(container, 'Last name').value).toBe('Jane Smith');
  });

  test('should allow user to successfully change their name', async () => {
    server.use(trpcMsw.users.updateName.mutation(() => mockUser));

    const { container } = render(
      <ProfileNameEditor user={johnDoe} />,
      { wrapper: TrpcProvider },
    );

    const input = getInput(container, 'First name');

    // Change the name
    fireEvent.change(input, { target: { value: 'Jane' } });

    // Buttons should appear
    expect(getButtonsRow(container)).not.toHaveClass('sm:invisible');

    // Save the changes
    const saveButton = getNameSaveButton(container);
    fireEvent.click(saveButton!);

    // Verify buttons disappear after successful save
    await waitFor(() => {
      expect(getButtonsRow(container)).toHaveClass('sm:invisible');
    });

    // Verify inputs still show the new name
    expect(input.value).toBe('Jane');
    expect(getInput(container, 'Last name').value).toBe('Doe');
  });

  test('should show validation error for an empty name', async () => {
    const { container } = render(
      <ProfileNameEditor user={johnDoe} />,
      { wrapper: TrpcProvider },
    );

    fireEvent.change(getInput(container, 'Last name'), { target: { value: '  ' } });

    const saveButton = getNameSaveButton(container);
    fireEvent.click(saveButton!);

    await waitFor(() => {
      const errorMessage = getErrorMessage(container);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage?.textContent).toContain('Last name is required');
    });
  });

  test('should show validation error for names exceeding maximum length', async () => {
    const { container } = render(
      <ProfileNameEditor user={johnDoe} />,
      { wrapper: TrpcProvider },
    );

    const input = getInput(container, 'First name');

    // Test length validation - should be handled by zod schema
    const longName = 'a'.repeat(51);
    fireEvent.change(input, { target: { value: longName } });

    const saveButton = getNameSaveButton(container);
    fireEvent.click(saveButton!);

    // Client-side validation should show error immediately
    await waitFor(() => {
      const errorMessage = getErrorMessage(container);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage?.textContent).toContain('First name must be under 50 characters');
    });
  });

  test('should not show buttons when name matches original', async () => {
    const { container } = render(
      <ProfileNameEditor user={johnDoe} />,
      { wrapper: TrpcProvider },
    );

    const input = getInput(container, 'First name');

    // Change to different value first
    fireEvent.change(input, { target: { value: 'Jane' } });

    // Buttons should appear
    expect(getButtonsRow(container)).not.toHaveClass('sm:invisible');

    // Change back to original value
    fireEvent.change(input, { target: { value: 'John' } });

    // Buttons should disappear
    expect(getButtonsRow(container)).toHaveClass('sm:invisible');
  });

  test('should always show buttons with alwaysShowButtons', async () => {
    const { container } = render(
      <ProfileNameEditor user={johnDoe} alwaysShowButtons />,
      { wrapper: TrpcProvider },
    );

    expect(getButtonsRow(container)).not.toHaveClass('sm:invisible');
    expect(getButtonsRow(container)).not.toHaveClass('max-sm:hidden');
  });

  test('should keep local edits when the user prop is refetched', async () => {
    const { container, rerender } = render(
      <ProfileNameEditor user={johnDoe} />,
      { wrapper: TrpcProvider },
    );

    fireEvent.change(getInput(container, 'First name'), { target: { value: 'Johnny' } });

    await act(async () => {
      rerender(<ProfileNameEditor user={{ ...johnDoe }} />);
    });

    expect(getInput(container, 'First name').value).toBe('Johnny');
    expect(getButtonsRow(container)).not.toHaveClass('sm:invisible');
  });

  test('should restore both fields on cancel', async () => {
    const { container } = render(
      <ProfileNameEditor user={johnDoe} />,
      { wrapper: TrpcProvider },
    );

    fireEvent.change(getInput(container, 'First name'), { target: { value: 'Jane' } });
    fireEvent.change(getInput(container, 'Last name'), { target: { value: 'Smith' } });
    fireEvent.click(getNameCancelButton(container)!);

    expect(getInput(container, 'First name').value).toBe('John');
    expect(getInput(container, 'Last name').value).toBe('Doe');
    expect(getButtonsRow(container)).toHaveClass('sm:invisible');
  });

  test('should handle API errors gracefully', async () => {
    // Test session expired error (401)
    server.use(trpcMsw.users.updateName.mutation(() => {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }));

    const { container } = render(
      <ProfileNameEditor user={johnDoe} />,
      { wrapper: TrpcProvider },
    );

    const input = getInput(container, 'First name');

    fireEvent.change(input, { target: { value: 'Jane' } });
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

    fireEvent.change(input, { target: { value: 'Janet' } });
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
      <ProfileNameEditor user={johnDoe} />,
      { wrapper: TrpcProvider },
    );

    const input = getInput(container, 'First name');
    fireEvent.change(input, { target: { value: 'Jane' } });

    const saveButton = getNameSaveButton(container);
    fireEvent.click(saveButton!);

    // Should show "Saving..." text
    await waitFor(() => {
      expect(saveButton?.querySelector('[aria-hidden="false"]')?.textContent).toBe('Saving...');
    });

    // Should be disabled while saving
    expect(saveButton).toBeDisabled();
    expect(getNameCancelButton(container)).toBeDisabled();

    // Resolve the promise and wait for the component to update
    resolvePromise!(mockUser);
    await waitFor(() => {
      expect(getButtonsRow(container)).toHaveClass('sm:invisible');
    });
  });
});

describe('ProfileNameEditor (with DB)', () => {
  test('saves name change to the database', async () => {
    await seedLoggedInUser();

    const { container } = render(
      <ProfileNameEditor user={{ firstName: 'Test', lastName: 'User', name: 'Test User' }} />,
      { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) },
    );

    const firstNameInput = container.querySelector<HTMLInputElement>('input[aria-label="First name"]')!;
    const lastNameInput = container.querySelector<HTMLInputElement>('input[aria-label="Last name"]')!;
    expect(firstNameInput.value).toBe('Test');
    expect(lastNameInput.value).toBe('User');

    // Change the name and click Save
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    const saveButton = container.querySelector('button[aria-label="Save profile name changes"]')!;
    fireEvent.click(saveButton);

    // Wait for success (Save/Cancel buttons disappear)
    await waitFor(() => {
      expect(saveButton.parentElement).toHaveClass('sm:invisible');
    });

    expect(firstNameInput.value).toBe('Jane');
    expect(lastNameInput.value).toBe('Doe');

    // Verify the name was persisted in the database
    const user = await db.get(userTable, { email: 'test@example.com' });
    expect(user).toMatchObject({ firstName: 'Jane', lastName: 'Doe', name: 'Jane Doe' });
  });

  test('shows error when user does not exist in DB', async () => {
    const { container } = render(
      <ProfileNameEditor user={{ firstName: 'Ghost', lastName: 'User', name: 'Ghost User' }} />,
      { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) },
    );

    const input = container.querySelector<HTMLInputElement>('input[aria-label="First name"]')!;
    fireEvent.change(input, { target: { value: 'New' } });

    const saveButton = container.querySelector('button[aria-label="Save profile name changes"]')!;
    fireEvent.click(saveButton);

    await waitFor(() => {
      const error = container.querySelector('[role="alert"]');
      expect(error).toBeInTheDocument();
    });
  });
});
