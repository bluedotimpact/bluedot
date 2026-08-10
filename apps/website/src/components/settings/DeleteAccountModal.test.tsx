import '@testing-library/jest-dom';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import {
  courseRegistrationTable, deletionRequestTable, meetPersonTable, userTable,
} from '@bluedot/db';
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

const renderAsUser = () => {
  const setIsOpen = vi.fn();
  render(
    <DeleteAccountModal isOpen setIsOpen={setIsOpen} initiatedBy="user" />,
    { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) },
  );
  return { setIsOpen };
};

const seedCallerFacilitatorHistory = async () => {
  await testDb.insert(courseRegistrationTable, {
    id: 'reg-caller', email: 'test@example.com', userId: 'test-user', courseId: 'course-1',
  });
  await testDb.insert(meetPersonTable, {
    id: 'mp-caller', name: 'Test User', userId: 'test-user', applicationsBaseRecordId: 'reg-caller', role: 'Facilitator',
  });
};

const typeConfirmation = (value: string) => {
  fireEvent.change(screen.getByLabelText(/to confirm/i), { target: { value } });
};

const deleteButton = () => screen.getByRole('button', { name: 'Delete account' });

const deleteMyAccountButton = () => screen.getByRole('button', { name: 'Delete my account' });

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

  test('retrying a failed request says the user will not be notified again', async () => {
    await testDb.insert(deletionRequestTable, {
      id: 'req-failed',
      email: SUBJECT.email,
      userId: SUBJECT.id,
      status: 'Failed',
      initiatedByRole: 'Admin',
      requestedAt: '2026-08-01T00:00:00.000Z',
    });
    renderAsAdmin();

    typeConfirmation('delete account');
    fireEvent.click(deleteButton());

    await waitFor(() => expect(screen.getByText(/Retrying existing deletion request/)).toBeInTheDocument());
    expect(screen.queryByText(/will also receive an email/)).not.toBeInTheDocument();
    expect(await requestsInDb()).toMatchObject([{ id: 'req-failed', status: 'Pending' }]);
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

  test('the user form is not shown until the eligibility check resolves', async () => {
    renderAsUser();

    expect(screen.queryByLabelText(/to confirm/i)).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByLabelText(/to confirm/i)).toBeInTheDocument());
  });

  test('a user confirms with their own phrase, and a request is recorded against their account', async () => {
    renderAsUser();

    await waitFor(() => expect(deleteMyAccountButton()).toBeDisabled());

    typeConfirmation('delete account');
    expect(deleteMyAccountButton()).toBeDisabled();

    typeConfirmation('  Delete My Account  ');
    await waitFor(() => expect(deleteMyAccountButton()).toBeEnabled());
    fireEvent.click(deleteMyAccountButton());

    await waitFor(() => expect(screen.getByText(/Your account will be deleted shortly/)).toBeInTheDocument());
    expect(screen.getByText(/You will be logged out in 10s\./)).toBeInTheDocument();
    expect(await requestsInDb()).toMatchObject([{
      email: 'test@example.com',
      userId: 'test-user',
      status: 'Pending',
      initiatedByRole: 'User',
    }]);
  });

  test('a user who has facilitated cannot use the form, and is pointed at us instead', async () => {
    await seedCallerFacilitatorHistory();
    renderAsUser();

    await waitFor(() => expect(screen.getByText(/you have been a facilitator/)).toBeInTheDocument());
    expect(screen.getByLabelText(/to confirm/i)).toBeDisabled();
    expect(deleteMyAccountButton()).toBeDisabled();
    expect(screen.getByText('contact us')).toHaveAttribute('href', 'mailto:team@bluedot.org');
  });

  test('a user who has facilitated can still close the modal', async () => {
    await seedCallerFacilitatorHistory();
    const { setIsOpen } = renderAsUser();

    await waitFor(() => expect(screen.getByText(/you have been a facilitator/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(setIsOpen).toHaveBeenCalledWith(false);
  });

  test('the countdown view ignores attempts to close it', async () => {
    const { setIsOpen } = renderAsUser();

    await waitFor(() => expect(screen.getByLabelText(/to confirm/i)).toBeInTheDocument());
    typeConfirmation('delete my account');
    await waitFor(() => expect(deleteMyAccountButton()).toBeEnabled());
    fireEvent.click(deleteMyAccountButton());

    await waitFor(() => expect(screen.getByText(/Your account will be deleted shortly/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(setIsOpen).not.toHaveBeenCalled();
  });
});
