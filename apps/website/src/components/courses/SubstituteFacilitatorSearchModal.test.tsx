import '@testing-library/jest-dom';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import {
  courseRegistrationTable, groupDiscussionTable, meetPersonTable, roundTable, userTable,
} from '@bluedot/db';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import {
  createTrpcDbProvider, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../../__tests__/dbTestUtils';
import SubstituteFacilitatorSearchModal from './SubstituteFacilitatorSearchModal';

setupTestDb();
beforeEach(seedLoggedInUser);

const ROUND = 'rec-round';
const DISCUSSION = 'rec-discussion';
const COURSE = 'rec-course';
const START_SECONDS = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;

async function seedPastFacilitator(userId: string, name: string, { courseId = COURSE, role = 'Facilitator' } = {}) {
  await testDb.insert(userTable, { id: userId, email: `${userId}@example.com`, name });
  await testDb.insert(courseRegistrationTable, {
    id: `reg-${userId}`, email: `${userId}@example.com`, userId, courseId, role, decision: 'Accept',
  });
}

async function seed() {
  await testDb.insert(roundTable, { id: ROUND, title: 'Round 1', course: COURSE });
  await testDb.insert(courseRegistrationTable, {
    id: 'reg-caller', email: 'test@example.com', userId: 'test-user', courseId: COURSE, role: 'Facilitator', decision: 'Accept',
  });
  await testDb.insert(meetPersonTable, {
    id: 'rec-facilitator', userId: 'test-user', round: ROUND, role: 'Facilitator', applicationsBaseRecordId: 'reg-caller', expectedDiscussionsFacilitator: [DISCUSSION],
  });
  await testDb.insert(groupDiscussionTable, {
    id: DISCUSSION, group: 'rec-group', facilitators: ['rec-facilitator'], participantsExpected: [], startDateTime: START_SECONDS, endDateTime: START_SECONDS + 3600,
  });
  await seedPastFacilitator('user-sasha', 'Sasha Substitute');
  await seedPastFacilitator('user-sam', 'Sam Second');
  await seedPastFacilitator('user-other', 'Sally Other', { courseId: 'rec-other-course' });
  await seedPastFacilitator('user-sid', 'Sid Inround');
  await testDb.insert(meetPersonTable, {
    id: 'rec-sid', userId: 'user-sid', round: ROUND, role: 'Facilitator',
  });
}

const renderModal = (overrides: Partial<React.ComponentProps<typeof SubstituteFacilitatorSearchModal>> = {}) => render(
  <SubstituteFacilitatorSearchModal
    roundId={ROUND}
    discussionId={DISCUSSION}
    onSelect={() => {}}
    onClose={() => {}}
    {...overrides}
  />,
  { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) },
);

const search = (term: string) => fireEvent.change(screen.getByPlaceholderText('Search by name...'), { target: { value: term } });

describe('SubstituteFacilitatorSearchModal', () => {
  test('lists past facilitators who are not in this round, flagging those new to this course', async () => {
    await seed();
    renderModal();

    search('sa');

    expect(await screen.findByText('Sam Second')).toBeInTheDocument();
    expect(screen.getByText('Sasha Substitute')).toBeInTheDocument();
    expect(screen.getByText('Sally Other')).toBeInTheDocument();
    expect(screen.getAllByText('Has not facilitated this course before')).toHaveLength(1);
    expect(screen.queryByText('Sid Inround')).not.toBeInTheDocument();
  });

  test('shows the empty state when nobody matches', async () => {
    await seed();
    renderModal();

    search('nobody');

    expect(await screen.findByText(/No one found/)).toBeInTheDocument();
  });

  test('Select fires onSelect with the chosen person', async () => {
    await seed();
    const onSelect = vi.fn();
    renderModal({ onSelect });

    search('sasha');
    fireEvent.click(await screen.findByRole('button', { name: 'Select' }));

    expect(onSelect).toHaveBeenCalledWith({ userId: 'user-sasha', name: 'Sasha Substitute', hasFacilitatedThisCourse: true });
  });

  test('Cancel fires onClose', async () => {
    await seed();
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
