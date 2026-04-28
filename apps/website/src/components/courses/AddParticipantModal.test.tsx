import '@testing-library/jest-dom';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import {
  courseTable, groupTable, meetPersonTable, roundTable,
} from '@bluedot/db';
import {
  describe, expect, test, vi,
} from 'vitest';
import {
  createTrpcDbProvider, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../../__tests__/dbTestUtils';
import AddParticipantModal from './AddParticipantModal';

setupTestDb();

const FACILITATOR = 'rec-facilitator';
const GROUP = 'rec-group';
const ROUND = 'rec-round';
const ALICE = 'rec-alice';
const BOB = 'rec-bob';
const CARLA = 'rec-carla';

async function seed() {
  await testDb.insert(courseTable, {
    id: 'rec-course', slug: 'test', title: 'Test', shortDescription: 'T', units: [],
  });
  await testDb.insert(roundTable, { id: ROUND, title: 'Round 1', course: 'rec-course' });
  await testDb.insert(meetPersonTable, {
    id: FACILITATOR, email: testAuthContextLoggedIn.auth!.email, round: ROUND, role: 'Facilitator',
  });
  await testDb.insert(groupTable, {
    id: GROUP, groupName: 'Group A', round: ROUND, facilitator: [FACILITATOR], participants: [],
  });
  await testDb.insert(meetPersonTable, {
    id: ALICE, email: 'a@example.com', name: 'Alice Anand', round: ROUND, role: 'Participant',
  });
  await testDb.insert(meetPersonTable, {
    id: BOB, email: 'b@example.com', name: 'Bob Bryson', round: ROUND, role: 'Participant',
  });
  await testDb.insert(meetPersonTable, {
    id: CARLA, email: 'c@example.com', name: 'Carla Chen', round: ROUND, role: 'Participant',
  });
}

const renderModal = (overrides: Partial<React.ComponentProps<typeof AddParticipantModal>> = {}) => render(
  <AddParticipantModal
    meetPersonId={FACILITATOR}
    excludeIds={[]}
    onAdd={() => {}}
    onClose={() => {}}
    {...overrides}
  />,
  { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) },
);

describe('AddParticipantModal', () => {
  test('lists addable participants from the round', async () => {
    await seed();
    renderModal();

    await waitFor(() => {
      expect(screen.getByText('Alice Anand')).toBeInTheDocument();
    });
    expect(screen.getByText('Bob Bryson')).toBeInTheDocument();
    expect(screen.getByText('Carla Chen')).toBeInTheDocument();
  });

  test('client-side filters out excluded ids', async () => {
    await seed();
    renderModal({ excludeIds: [ALICE] });

    await waitFor(() => {
      expect(screen.getByText('Bob Bryson')).toBeInTheDocument();
    });
    expect(screen.queryByText('Alice Anand')).not.toBeInTheDocument();
  });

  test('search narrows results by name', async () => {
    await seed();
    renderModal();

    await waitFor(() => {
      expect(screen.getByText('Alice Anand')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Search by name...'), { target: { value: 'bryson' } });

    await waitFor(() => {
      expect(screen.queryByText('Alice Anand')).not.toBeInTheDocument();
      expect(screen.getByText('Bob Bryson')).toBeInTheDocument();
    });
  });

  test('shows empty state when nothing matches', async () => {
    await seed();
    renderModal();

    fireEvent.change(screen.getByPlaceholderText('Search by name...'), { target: { value: 'nobody' } });

    await waitFor(() => {
      expect(screen.getByText('No participants found.')).toBeInTheDocument();
    });
  });

  test('clicking Add fires onAdd with the selected person', async () => {
    await seed();
    const onAdd = vi.fn();
    renderModal({ onAdd });

    await waitFor(() => {
      expect(screen.getByText('Bob Bryson')).toBeInTheDocument();
    });

    const bobRow = screen.getByText('Bob Bryson').closest('div')!;
    fireEvent.click(bobRow.querySelector('button')!);

    expect(onAdd).toHaveBeenCalledWith({ id: BOB, name: 'Bob Bryson' });
  });

  test('clicking Cancel fires onClose', async () => {
    await seed();
    const onClose = vi.fn();
    renderModal({ onClose });

    await waitFor(() => {
      expect(screen.getByText('Alice Anand')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
