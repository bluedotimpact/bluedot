import '@testing-library/jest-dom';
import {
  act, fireEvent, render, waitFor,
} from '@testing-library/react';
import { TRPCError } from '@trpc/server';
import {
  describe, expect, test, vi,
} from 'vitest';
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

const getInput = (container: HTMLElement, label: 'First name' | 'Last name'): HTMLInputElement => {
  const input = container.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
  expect(input).toBeInTheDocument();
  return input;
};

const getNameSaveButton = (container: HTMLElement): HTMLElement | null => {
  return container.querySelector('button[aria-label="Save profile name changes"]');
};

const getNameCancelButton = (container: HTMLElement): HTMLElement | null => {
  return container.querySelector('button[aria-label="Cancel profile name changes"]');
};

// Save/Cancel are always rendered; this row is hidden (keeping its width on wide screens) until something changes
const getButtonsRow = (container: HTMLElement): HTMLElement => getNameSaveButton(container)!.parentElement!;

const getErrorMessage = (container: HTMLElement): HTMLElement | null => {
  return container.querySelector('[role="alert"]');
};

describe('ProfileNameEditor', () => {
  test('should render stored first and last name', async () => {
    const { container } = render(
      <ProfileNameEditor user={johnDoe} />,
      { wrapper: TrpcProvider },
    );

    expect(getInput(container, 'First name').value).toBe('John');
    expect(getInput(container, 'Last name').value).toBe('Doe');
    expect(getButtonsRow(container)).toHaveClass('sm:invisible');
  });

  test('should prefill by splitting the combined name when first/last are not stored', async () => {
    const { container } = render(
      <ProfileNameEditor user={{ firstName: null, lastName: null, name: 'Maria de la Cruz' }} />,
      { wrapper: TrpcProvider },
    );

    expect(getInput(container, 'First name').value).toBe('Maria de la');
    expect(getInput(container, 'Last name').value).toBe('Cruz');
    // The prefill is a suggestion, so it isn't treated as an unsaved change
    expect(getButtonsRow(container)).toHaveClass('sm:invisible');
  });

  test('should allow user to successfully change their name', async () => {
    server.use(trpcMsw.users.updateName.mutation(() => mockUser));
    const onSave = vi.fn();

    const { container } = render(
      <ProfileNameEditor user={johnDoe} onSave={onSave} />,
      { wrapper: TrpcProvider },
    );

    const firstNameInput = getInput(container, 'First name');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });
    expect(getButtonsRow(container)).not.toHaveClass('sm:invisible');

    fireEvent.click(getNameSaveButton(container)!);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    expect(firstNameInput.value).toBe('Jane');
    expect(getInput(container, 'Last name').value).toBe('Doe');
    expect(getButtonsRow(container)).toHaveClass('sm:invisible');
  });

  test('hides the buttons again when the names are changed back', async () => {
    const { container } = render(
      <ProfileNameEditor user={johnDoe} />,
      { wrapper: TrpcProvider },
    );

    const input = getInput(container, 'First name');
    fireEvent.change(input, { target: { value: 'Jane' } });
    expect(getButtonsRow(container)).not.toHaveClass('sm:invisible');

    fireEvent.change(input, { target: { value: 'John' } });
    expect(getButtonsRow(container)).toHaveClass('sm:invisible');
  });

  test('alwaysShowButtons keeps save and cancel visible without changes', async () => {
    const { container } = render(
      <ProfileNameEditor user={johnDoe} alwaysShowButtons />,
      { wrapper: TrpcProvider },
    );

    expect(getButtonsRow(container)).not.toHaveClass('sm:invisible');
    expect(getButtonsRow(container)).not.toHaveClass('max-sm:hidden');
  });

  test('keeps local edits when the user prop is refetched', async () => {
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

  test('should show validation error for an empty last name', async () => {
    const { container } = render(
      <ProfileNameEditor user={johnDoe} />,
      { wrapper: TrpcProvider },
    );

    fireEvent.change(getInput(container, 'Last name'), { target: { value: '  ' } });
    fireEvent.click(getNameSaveButton(container)!);

    await waitFor(() => {
      expect(getErrorMessage(container)?.textContent).toBe('Last name is required');
    });
  });

  test('should show validation error for names exceeding maximum length', async () => {
    const { container } = render(
      <ProfileNameEditor user={johnDoe} />,
      { wrapper: TrpcProvider },
    );

    fireEvent.change(getInput(container, 'First name'), { target: { value: 'a'.repeat(51) } });
    fireEvent.click(getNameSaveButton(container)!);

    await waitFor(() => {
      expect(getErrorMessage(container)?.textContent).toBe('First name must be under 50 characters');
    });
  });

  test('cancel restores both fields', async () => {
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
    server.use(trpcMsw.users.updateName.mutation(() => {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }));

    const { container } = render(
      <ProfileNameEditor user={johnDoe} />,
      { wrapper: TrpcProvider },
    );

    const input = getInput(container, 'First name');
    fireEvent.change(input, { target: { value: 'Jane' } });
    fireEvent.click(getNameSaveButton(container)!);

    await waitFor(() => {
      expect(getErrorMessage(container)?.textContent).toBe('Session expired. Please refresh the page and try again.');
    });

    // Clear the error by focusing on the input
    fireEvent.focus(input);
    await waitFor(() => {
      expect(getErrorMessage(container)).not.toBeInTheDocument();
    });

    server.use(trpcMsw.users.updateName.mutation(() => {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }));

    fireEvent.change(input, { target: { value: 'Janet' } });
    fireEvent.click(getNameSaveButton(container)!);

    await waitFor(() => {
      expect(getErrorMessage(container)?.textContent).toBe('Failed to update name. Please try again.');
    });
  });

  test('should show loading state while saving', async () => {
    let resolvePromise: (value: typeof mockUser) => void;
    const promise = new Promise<typeof mockUser>((resolve) => {
      resolvePromise = resolve;
    });

    server.use(trpcMsw.users.updateName.mutation(() => promise));

    const { container } = render(
      <ProfileNameEditor user={johnDoe} />,
      { wrapper: TrpcProvider },
    );

    fireEvent.change(getInput(container, 'First name'), { target: { value: 'Jane' } });

    const saveButton = getNameSaveButton(container);
    fireEvent.click(saveButton!);

    await waitFor(() => {
      expect(saveButton?.querySelector('[aria-hidden="false"]')?.textContent).toBe('Saving...');
    });

    expect(saveButton).toBeDisabled();
    expect(getNameCancelButton(container)).toBeDisabled();

    resolvePromise!(mockUser);
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });
});

describe('ProfileNameEditor (with DB)', () => {
  test('saves first, last and combined name to the database', async () => {
    await seedLoggedInUser();
    const onSave = vi.fn();

    const { container } = render(
      <ProfileNameEditor user={{ firstName: null, lastName: null, name: 'Test User' }} onSave={onSave} />,
      { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) },
    );

    expect(getInput(container, 'First name').value).toBe('Test');
    expect(getInput(container, 'Last name').value).toBe('User');

    fireEvent.change(getInput(container, 'First name'), { target: { value: 'Jane' } });
    fireEvent.change(getInput(container, 'Last name'), { target: { value: 'Doe' } });
    fireEvent.click(getNameSaveButton(container)!);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });

    const user = await db.get(userTable, { email: 'test@example.com' });
    expect(user).toMatchObject({ firstName: 'Jane', lastName: 'Doe', name: 'Jane Doe' });
  });

  test('shows error when user does not exist in DB', async () => {
    const { container } = render(
      <ProfileNameEditor user={{ firstName: 'Ghost', lastName: 'User', name: 'Ghost User' }} />,
      { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) },
    );

    fireEvent.change(getInput(container, 'First name'), { target: { value: 'New' } });
    fireEvent.click(getNameSaveButton(container)!);

    await waitFor(() => {
      expect(getErrorMessage(container)).toBeInTheDocument();
    });
  });
});
