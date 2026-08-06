import '@testing-library/jest-dom';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { deletionRequestTable, userTable } from '@bluedot/db';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import {
  createTrpcDbProvider, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../../__tests__/dbTestUtils';
import DeleteAccountModal from './DeleteAccountModal';

setupTestDb();

const SUBJECT = { id: 'user-subject', email: 'subject@example.com' };

beforeEach(async () => {
  // Absorbs the fire-and-forget customer.io confirmation notice the router sends.
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
  await seedLoggedInUser({ isAdmin: true });
  await testDb.insert(userTable, { ...SUBJECT, name: 'Subject Person' });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const renderAsAdmin = () => {
  const setIsOpen = vi.fn();
  render(
    <DeleteAccountModal isOpen setIsOpen={setIsOpen} initiatedBy="admin" userId={SUBJECT.id} />,
    { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) },
  );
  return { setIsOpen };
};

const typeConfirmation = (value: string) => {
  fireEvent.change(screen.getByLabelText(/to confirm/i), { target: { value } });
};

const deleteButton = () => document.querySelector('button[type="submit"]')!;

const requestsInDb = () => testDb.pg.select().from(deletionRequestTable.pg);

describe('DeleteAccountModal', () => {
  test('an admin confirms by typing the phrase, and a request is recorded for the subject', async () => {
    renderAsAdmin();

    typeConfirmation('delete account');
    fireEvent.click(deleteButton());

    await waitFor(() => expect(screen.getByText(/The account will be deleted shortly/)).toBeInTheDocument());
    expect(await requestsInDb()).toMatchObject([{
      email: SUBJECT.email,
      userId: SUBJECT.id,
      status: 'Pending',
      initiatedByRole: 'Admin',
    }]);
  });

  test('nothing happens until the phrase matches', async () => {
    renderAsAdmin();

    expect(deleteButton()).toBeDisabled();

    typeConfirmation('delete');
    expect(deleteButton()).toBeDisabled();

    fireEvent.submit(screen.getByRole('button', { name: 'Cancel' }).closest('form')!);
    expect(await requestsInDb()).toEqual([]);

    typeConfirmation('  Delete Account  ');
    expect(deleteButton()).toBeEnabled();
  });

  test('cancelling closes the modal without recording anything', async () => {
    const { setIsOpen } = renderAsAdmin();

    typeConfirmation('delete account');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(setIsOpen).toHaveBeenCalledWith(false);
    expect(await requestsInDb()).toEqual([]);
  });

  test('the user-initiated flow is not built yet', () => {
    expect(() => render(
      <DeleteAccountModal isOpen setIsOpen={vi.fn()} initiatedBy="user" userId={SUBJECT.id} />,
      { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) },
    )).toThrow('Not implemented');
  });
});
