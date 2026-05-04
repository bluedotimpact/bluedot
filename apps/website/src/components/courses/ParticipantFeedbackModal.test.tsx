import '@testing-library/jest-dom';
import {
  fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import {
  courseTable, groupTable, meetPersonTable, peerFeedbackTable, roundTable,
} from '@bluedot/db';
import {
  describe, expect, test, vi,
} from 'vitest';
import {
  createTrpcDbProvider, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../../__tests__/dbTestUtils';
import ParticipantFeedbackModal from './ParticipantFeedbackModal';

vi.mock('../../server/airtableFieldOptions', () => ({
  getFieldOptions: vi.fn().mockResolvedValue([
    { id: 'sel1', name: 'No further action needed' },
    { id: 'sel2', name: 'Add to talent pipeline [keep warm for future opportunities/check-ins]' },
    { id: 'sel3', name: '[!] Flag for 1-1 advising with BlueDot team' },
    { id: 'sel4', name: '[!] Flag as candidate for funding (career transition/project)' },
    { id: 'sel5', name: '[!] Recommend to facilitate' },
  ]),
}));

setupTestDb();

const FACILITATOR = 'rec-facilitator';
const GROUP = 'rec-group';
const ROUND = 'rec-round';
const ALICE = 'rec-alice';

async function seed() {
  await testDb.insert(courseTable, {
    id: 'rec-course', slug: 'test', title: 'Test', shortDescription: 'T', units: [],
  });
  await testDb.insert(roundTable, { id: ROUND, title: 'Round 1', course: 'rec-course' });
  await testDb.insert(meetPersonTable, {
    id: FACILITATOR, email: testAuthContextLoggedIn.auth!.email, round: ROUND, role: 'Facilitator',
  });
  await testDb.insert(meetPersonTable, {
    id: ALICE, email: 'a@example.com', name: 'Alice Anand', round: ROUND, role: 'Participant',
  });
  await testDb.insert(groupTable, {
    id: GROUP, groupName: 'Group A', round: ROUND, facilitator: [FACILITATOR], participants: [ALICE],
  });
}

const FOLLOW_UP_OPTIONS = [
  {
    id: 'sel1', name: 'No further action needed', label: 'No further action needed', actionable: false,
  },
  {
    id: 'sel2', name: 'Add to talent pipeline [keep warm for future opportunities/check-ins]', label: 'Add to talent pipeline [keep warm for future opportunities/check-ins]', actionable: false,
  },
  {
    id: 'sel3', name: '[!] Flag for 1-1 advising with BlueDot team', label: 'Flag for 1-1 advising with BlueDot team', actionable: true,
  },
  {
    id: 'sel4', name: '[!] Flag as candidate for funding (career transition/project)', label: 'Flag as candidate for funding (career transition/project)', actionable: true,
  },
  {
    id: 'sel5', name: '[!] Recommend to facilitate', label: 'Recommend to facilitate', actionable: true,
  },
];

const renderModal = (overrides: Partial<React.ComponentProps<typeof ParticipantFeedbackModal>> = {}) => render(
  <ParticipantFeedbackModal
    meetPersonId={FACILITATOR}
    participant={{ id: ALICE, name: 'Alice Anand' }}
    followUpOptions={FOLLOW_UP_OPTIONS}
    onClose={() => {}}
    onSaved={() => {}}
    onNoStrongImpression={() => {}}
    {...overrides}
  />,
  { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) },
);

const getDoneButton = () => screen.getByRole('button', { name: 'Done' });

describe('ParticipantFeedbackModal', () => {
  test('Done starts disabled, enables once both rubrics and a follow-up are set, then saves and fires onSaved', async () => {
    await seed();
    const onSaved = vi.fn();
    renderModal({ onSaved });

    expect(getDoneButton()).toBeDisabled();

    fireEvent.click(screen.getByText('Took clear ownership of their learning')); // 4
    fireEvent.click(screen.getByText('Regularly engaged critically')); // 4
    expect(getDoneButton()).toBeDisabled(); // still need a follow-up

    fireEvent.click(screen.getByText('Flag for 1-1 advising with BlueDot team'));
    expect(getDoneButton()).toBeEnabled();

    fireEvent.change(screen.getByLabelText(/In 2-3 sentences/), { target: { value: 'Strong cohort member.' } });

    fireEvent.click(getDoneButton());

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith({
        showUpRating: 4,
        engageRating: 4,
        investmentNote: 'Strong cohort member.',
        followUps: ['[!] Flag for 1-1 advising with BlueDot team'],
      });
    });

    const rows = await testDb.scan(peerFeedbackTable);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      feedbackRecipient: [ALICE],
      initiativeRating: 4,
      reasoningQualityRating: 4,
      feedback: 'Strong cohort member.',
      nextSteps: ['[!] Flag for 1-1 advising with BlueDot team'],
    });
  });

  test('initialData hydrates fields and enables Done', async () => {
    await seed();
    renderModal({
      initialData: {
        showUpRating: 5,
        engageRating: 3,
        investmentNote: 'Existing note',
        followUps: ['No further action needed'],
      },
    });

    expect(getDoneButton()).toBeEnabled();
    expect(screen.getByDisplayValue('Existing note')).toBeInTheDocument();
    const noActionCheckbox = screen.getByLabelText<HTMLInputElement>('No further action needed');
    expect(noActionCheckbox.checked).toBe(true);
  });

  test('Cancel and "No strong impression" fire their callbacks', async () => {
    await seed();
    const onClose = vi.fn();
    const onNoStrongImpression = vi.fn();
    renderModal({ onClose, onNoStrongImpression });

    fireEvent.click(screen.getByRole('button', { name: 'No strong impression' }));
    expect(onNoStrongImpression).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
