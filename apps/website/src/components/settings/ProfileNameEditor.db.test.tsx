import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { userTable } from '@bluedot/db';
import db from '../../lib/api/db';
import { setupDbTests, TrpcDbProvider } from '../../__tests__/dbTestUtils';
import ProfileNameEditor from './ProfileNameEditor';

setupDbTests();

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
