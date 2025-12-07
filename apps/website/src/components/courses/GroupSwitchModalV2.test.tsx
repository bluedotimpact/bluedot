import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  describe,
  expect,
  test,
  vi,
  beforeEach,
  type Mock,
} from 'vitest';
import { useAuthStore } from '@bluedot/ui';
import { TRPCError } from '@trpc/server';
import GroupSwitchModal, { sortGroupSwitchOptions } from './GroupSwitchModalV2';
import type { DiscussionsAvailable } from '../../server/routers/group-switching';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import {
  createMockCourse, createMockGroupDiscussion, createMockUnit, createMockGroup,
} from '../../__tests__/testUtils';

vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    useAuthStore: vi.fn(),
  };
});

const mockedUseAuthStore = useAuthStore as unknown as Mock;

const mockAuth = { token: 'test-token', email: 'test@bluedot.org' };

const mockUnit1 = createMockUnit({
  title: 'Introduction to AI Safety',
  unitNumber: '1',
});

const mockUnit2 = createMockUnit({
  title: 'AI Alignment',
  unitNumber: '2',
});

const mockCourse = createMockCourse({
  id: 'course-1',
  slug: 'ai-safety',
});

const mockCourseData = {
  course: mockCourse,
  units: [mockUnit1],
};

const mockCourseDataWithTwoUnits = {
  course: mockCourse,
  units: [mockUnit1, mockUnit2],
};

// Match real API structure exactly
const mockSwitchingData: DiscussionsAvailable = {
  groupsAvailable: [
    {
      group: createMockGroup({
        id: 'group-1',
        groupName: 'Morning Group A',
        participants: ['participant-1'], // Current user
      }),
      userIsParticipant: true,
      spotsLeftIfKnown: 0,
      allDiscussionsHaveStarted: false,
    },
    {
      group: createMockGroup({
        id: 'group-2',
        groupName: 'Evening Group B',
        participants: [],
      }),
      userIsParticipant: false,
      spotsLeftIfKnown: 3,
      allDiscussionsHaveStarted: false,
    },
  ],
  discussionsAvailable: {
    1: [
      {
        discussion: createMockGroupDiscussion({
          id: 'discussion-1',
          group: 'group-1',
          participantsExpected: ['participant-1'],
        }),
        groupName: 'Morning Group A',
        userIsParticipant: true, // This is the current discussion
        spotsLeftIfKnown: 0,
        hasStarted: false,
      },
      {
        discussion: createMockGroupDiscussion({
          id: 'discussion-2',
          group: 'group-2',
          participantsExpected: ['other-participant-1', 'other-participant-2'],
        }),
        groupName: 'Evening Group B',
        userIsParticipant: false, // Available to switch to
        spotsLeftIfKnown: 2,
        hasStarted: false, // Not started yet, so available
      },
    ],
  },
};

describe('GroupSwitchModal', () => {
  let mockSubmitGroupSwitch: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    mockedUseAuthStore.mockImplementation((selector) => {
      const state = { auth: mockAuth };
      return selector(state);
    });

    mockSubmitGroupSwitch = vi.fn();

    server.use(
      trpcMsw.courses.getBySlug.query(() => mockCourseData),
      trpcMsw.groupSwitching.discussionsAvailable.query(() => mockSwitchingData),
      trpcMsw.groupSwitching.switchGroup.mutation(({ input }) => {
        mockSubmitGroupSwitch(input);
        return undefined;
      }),
    );
  });

  describe('Happy paths', () => {
    test('Switch group for one unit: Submitting the form sends the expected API request', async () => {
      render(
        <GroupSwitchModal
          handleClose={() => {}}
          initialUnitNumber={mockUnit1.unitNumber}
          courseSlug="ai-safety"
        />,
        { wrapper: TrpcProvider },
      );
      await waitFor(() => {
        // This input only appears after api calls are complete, so verifies that the whole component has rendered
        expect(screen.getByLabelText('Reason for group switch request')).toBeInTheDocument();
      });

      // Verify the switch type selector shows "Switch group for one unit"
      // React Aria creates hidden <option> elements for accessibility, so multiple matches expected
      expect(screen.getAllByText(/Switch group for one unit/i).length).toBeGreaterThanOrEqual(1);

      // Current and alternative discussions are shown
      expect(screen.getByText('Morning Group A')).toBeInTheDocument();
      expect(screen.getByText('Evening Group B')).toBeInTheDocument();

      const reasonTextarea = screen.getByLabelText(/Tell us why you're making this change/i);
      fireEvent.change(reasonTextarea, {
        target: { value: 'I have a scheduling conflict' },
      });

      // Select the alternative discussion (Evening Group B)
      const eveningGroupOption = screen.getByText('Evening Group B').closest('[role="button"]');
      expect(eveningGroupOption).toBeInTheDocument();
      fireEvent.click(eveningGroupOption!);

      // Wait for the selection to be reflected and Confirm button to appear
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /Confirm selection of Evening Group B/i });
        expect(confirmButton).toBeInTheDocument();
        expect(confirmButton).not.toBeDisabled();
      });

      const confirmButton = screen.getByRole('button', { name: /Confirm selection of Evening Group B/i });
      fireEvent.click(confirmButton);

      // Verify the API was called with correct data
      await waitFor(() => {
        expect(mockSubmitGroupSwitch).toHaveBeenCalledWith({
          switchType: 'Switch group for one unit',
          notesFromParticipant: 'I have a scheduling conflict',
          isManualRequest: false,
          oldGroupId: undefined,
          newGroupId: undefined,
          oldDiscussionId: 'discussion-1',
          newDiscussionId: 'discussion-2',
          courseSlug: 'ai-safety',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
      });
    });

    test('Switch group permanently: Submitting the form sends the expected API request', async () => {
      render(
        <GroupSwitchModal
          handleClose={() => {}}
          initialUnitNumber={mockUnit1.unitNumber}
          courseSlug="ai-safety"
        />,
        { wrapper: TrpcProvider },
      );
      await waitFor(() => {
        expect(screen.getByLabelText('Reason for group switch request')).toBeInTheDocument();
      });

      // Change switch type to "Switch group permanently"
      const switchTypeButton = screen.getByRole('button', { name: /Select action/i });
      fireEvent.click(switchTypeButton);
      const listbox = await screen.findByRole('listbox', { name: /Select action/i });
      const permanentOption = within(listbox).getByText(/Switch group permanently/i);
      fireEvent.click(permanentOption);

      // Wait for UI to update and show groups instead of discussions
      await waitFor(() => {
        expect(screen.getByText('Morning Group A')).toBeInTheDocument();
        expect(screen.getByText('Evening Group B')).toBeInTheDocument();
        // Groups show day of week (isRecurringTime), discussions show specific dates.
        // Verify we're showing groups by checking for day of week (avoid exact day for timezone safety)
        const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const hasWeekday = weekdays.some((day) => screen.queryAllByText(new RegExp(day, 'i')).length > 0);
        expect(hasWeekday).toBe(true);
      });

      const reasonTextarea = screen.getByLabelText('Reason for group switch request');
      fireEvent.change(reasonTextarea, {
        target: { value: 'Permanent time conflict with work schedule' },
      });

      // Select the alternative group (Evening Group B)
      const eveningGroupOption = screen.getByLabelText('Select Evening Group B');
      fireEvent.click(eveningGroupOption);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /Confirm selection of Evening Group B/i });
        expect(confirmButton).toBeInTheDocument();
        expect(confirmButton).not.toBeDisabled();
      });

      const confirmButton = screen.getByRole('button', { name: /Confirm selection of Evening Group B/i });
      fireEvent.click(confirmButton);

      // Verify the API was called with correct data
      await waitFor(() => {
        expect(mockSubmitGroupSwitch).toHaveBeenCalledWith({
          switchType: 'Switch group permanently',
          notesFromParticipant: 'Permanent time conflict with work schedule',
          isManualRequest: false,
          oldGroupId: 'group-1',
          newGroupId: 'group-2',
          oldDiscussionId: undefined,
          newDiscussionId: undefined,
          courseSlug: 'ai-safety',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
      });
    });

    test('Manual switch request: Navigating to manual form and submitting sends the expected API request', async () => {
      render(
        <GroupSwitchModal
          handleClose={() => {}}
          initialUnitNumber={mockUnit1.unitNumber}
          courseSlug="ai-safety"
        />,
        { wrapper: TrpcProvider },
      );
      await waitFor(() => {
        expect(screen.getByLabelText('Reason for group switch request')).toBeInTheDocument();
      });

      // Click "Request manual switch" button
      const manualSwitchButton = screen.getByRole('button', { name: /Request manual group switch/i });
      fireEvent.click(manualSwitchButton);

      await waitFor(() => {
        // UI changes to show manual request form
        expect(screen.getByText(/To help us assign you to a group which best suits you/i)).toBeInTheDocument();
      });

      const reasonTextarea = screen.getByLabelText('Reason for group switch request');
      fireEvent.change(reasonTextarea, {
        target: { value: 'None of the available times work for my schedule' },
      });

      const availabilityCheckbox = screen.getByRole('checkbox', { name: /I have updated my availability/i });
      fireEvent.click(availabilityCheckbox);

      const submitButton = screen.getByRole('button', { name: /Submit group switch request/i });
      expect(submitButton).not.toBeDisabled();
      fireEvent.click(submitButton);

      // Verify the API was called with correct data
      await waitFor(() => {
        expect(mockSubmitGroupSwitch).toHaveBeenCalledWith({
          switchType: 'Switch group for one unit',
          notesFromParticipant: 'None of the available times work for my schedule',
          isManualRequest: true,
          oldGroupId: undefined,
          newGroupId: undefined,
          oldDiscussionId: 'discussion-1',
          newDiscussionId: undefined,
          courseSlug: 'ai-safety',
        });
      });

      await waitFor(() => {
        // Verify different success message for manual requests
        expect(screen.getByText(/We are working on your request/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form state', () => {
    test('Form starts with the unit specified by `currentUnit` pre-selected', async () => {
      const baseDiscussion = mockSwitchingData.discussionsAvailable[1]![0]!;
      const mockSwitchingDataWithUnit2: DiscussionsAvailable = {
        ...mockSwitchingData,
        discussionsAvailable: {
          1: mockSwitchingData.discussionsAvailable[1] || [],
          2: [
            {
              ...baseDiscussion,
              discussion: {
                ...baseDiscussion.discussion, id: 'discussion-2-1', unit: 'unit-2', unitNumber: 2, startDateTime: Math.floor((Date.now() + 48 * 60 * 60 * 1000) / 1000),
              },
              groupName: 'Unit 2 Group',
              spotsLeftIfKnown: 5,
            },
          ],
        },
      };

      server.use(
        trpcMsw.courses.getBySlug.query(() => mockCourseDataWithTwoUnits),
        trpcMsw.groupSwitching.discussionsAvailable.query(() => mockSwitchingDataWithUnit2),
      );

      render(
        <GroupSwitchModal
          handleClose={() => {}}
          initialUnitNumber={mockUnit2.unitNumber}
          courseSlug="ai-safety"
        />,
        { wrapper: TrpcProvider },
      );
      await waitFor(() => {
        expect(screen.getByLabelText('Reason for group switch request')).toBeInTheDocument();
      });

      // Verify selectedUnitNumber defaults to "2" and Unit 2 discussion is shown
      expect(screen.getByText('Unit 2 Group')).toBeInTheDocument();
      const unitButton = screen.getByRole('button', { name: /Select unit/i });
      expect(unitButton).toBeInTheDocument();

      // Change to unit 1
      fireEvent.click(unitButton);
      const unitListbox = await screen.findByRole('listbox', { name: /Select unit/i });
      const unit1Option = within(unitListbox).getByText(/Unit 1/i);
      fireEvent.click(unit1Option);

      // Verify Unit 1 discussions are now shown
      await waitFor(() => {
        expect(screen.getByText('Evening Group B')).toBeInTheDocument();
      });
    });

    test('Full discussions, started discussions, and units with no upcoming discussions are disabled', async () => {
      // Create mock data with disabled options
      const currentDiscussion = mockSwitchingData.discussionsAvailable[1]![0]!;
      const mockSwitchingDataWithDisabled: DiscussionsAvailable = {
        groupsAvailable: [
          { ...mockSwitchingData.groupsAvailable[0]!, group: { ...mockSwitchingData.groupsAvailable[0]!.group, groupName: 'Current Group' } },
          { ...mockSwitchingData.groupsAvailable[1]!, group: { ...mockSwitchingData.groupsAvailable[1]!.group, groupName: 'Full Group', id: 'group-full' }, spotsLeftIfKnown: 0 },
          { ...mockSwitchingData.groupsAvailable[1]!, group: { ...mockSwitchingData.groupsAvailable[1]!.group, groupName: 'Already Started Group', id: 'group-started' }, allDiscussionsHaveStarted: true },
        ],
        discussionsAvailable: {
          1: [
            { ...currentDiscussion, discussion: { ...currentDiscussion.discussion, id: 'discussion-current', group: 'group-1' }, groupName: 'Current Group' },
            {
              ...currentDiscussion, discussion: { ...currentDiscussion.discussion, id: 'discussion-full', group: 'group-full' }, groupName: 'Full Group', userIsParticipant: false, spotsLeftIfKnown: 0,
            },
            {
              ...currentDiscussion,
              discussion: {
                ...currentDiscussion.discussion, id: 'discussion-started', group: 'group-started', startDateTime: Math.floor((Date.now() - 2 * 60 * 60 * 1000) / 1000),
              },
              groupName: 'Already Started Group',
              userIsParticipant: false,
              spotsLeftIfKnown: 2,
              hasStarted: true,
            },
          ],
          2: [], // Unit 2 has no upcoming discussions
        },
      };

      // Override mock for this test
      server.use(
        trpcMsw.courses.getBySlug.query(() => mockCourseDataWithTwoUnits),
        trpcMsw.groupSwitching.discussionsAvailable.query(() => mockSwitchingDataWithDisabled),
      );

      render(
        <GroupSwitchModal
          handleClose={() => {}}
          initialUnitNumber={mockUnit1.unitNumber}
          courseSlug="ai-safety"
        />,
        { wrapper: TrpcProvider },
      );
      await waitFor(() => {
        expect(screen.getByLabelText('Reason for group switch request')).toBeInTheDocument();
      });

      // Verify disabled discussions are shown
      expect(screen.getByText('Full Group')).toBeInTheDocument();
      expect(screen.getByText('Already Started Group')).toBeInTheDocument();

      // Find disabled options: they don't have role="button" because they're disabled
      const fullGroupOption = screen.getByText('Full Group').closest('div.rounded-lg');
      const startedGroupOption = screen.getByText('Already Started Group').closest('div.rounded-lg');

      // Verify they have (at least some) disabled styling
      expect(fullGroupOption).toHaveClass('opacity-50');
      expect(startedGroupOption).toHaveClass('opacity-50');

      // Verify "No spots left" message appears for full groups
      const noSpotsMessages = screen.getAllByText('No spots left');
      expect(noSpotsMessages.length).toBeGreaterThan(0);
      // Verify "This discussion has passed" message appears for started discussions
      expect(screen.getByText('This discussion has passed')).toBeInTheDocument();

      // Open unit selector to check if Unit 2 is disabled
      const unitButton = screen.getByRole('button', { name: /Select unit/i });
      fireEvent.click(unitButton);

      const unitListbox = await screen.findByRole('listbox', { name: /Select unit/i });
      const unit2Option = within(unitListbox).getByText(/Unit 2.*no upcoming discussions/i);
      expect(unit2Option).toBeInTheDocument();

      // Verify Unit 2 is disabled (has disabled attribute on its parent)
      const unit2ListItem = unit2Option.closest('[role="option"]');
      expect(unit2ListItem).toHaveAttribute('aria-disabled', 'true');

      // Switch to manual request mode and verify units become enabled
      fireEvent.click(unitButton);
      const manualSwitchButton = screen.getByRole('button', { name: /Request manual group switch/i });
      fireEvent.click(manualSwitchButton);

      await waitFor(() => {
        expect(screen.getByText(/To help us assign you to a group which best suits you/i)).toBeInTheDocument();
      });

      // Open unit selector again in manual mode
      const unitButtonInManualMode = screen.getByRole('button', { name: /Select unit/i });
      fireEvent.click(unitButtonInManualMode);

      const unitListboxInManualMode = await screen.findByRole('listbox', { name: /Select unit/i });
      const unit2OptionInManualMode = within(unitListboxInManualMode).getByText(/Unit 2/i);

      // Verify Unit 2 is now enabled in manual mode
      const unit2ListItemInManualMode = unit2OptionInManualMode.closest('[role="option"]');
      expect(unit2ListItemInManualMode).not.toHaveAttribute('aria-disabled', 'true');
    });

    test('Manual switching is still available when there are no discussions available (in "Switch group for one unit" mode)', async () => {
      const mockSwitchingDataEmpty: DiscussionsAvailable = {
        ...mockSwitchingData,
        groupsAvailable: [],
        discussionsAvailable: { 1: [] },
      };

      server.use(
        trpcMsw.groupSwitching.discussionsAvailable.query(() => mockSwitchingDataEmpty),
      );

      render(
        <GroupSwitchModal
          handleClose={() => {}}
          initialUnitNumber={mockUnit1.unitNumber}
          courseSlug="ai-safety"
        />,
        { wrapper: TrpcProvider },
      );
      await waitFor(() => {
        expect(screen.getByLabelText('Reason for group switch request')).toBeInTheDocument();
      });

      // Verify message shows "There are 0 alternative time slots available"
      expect(screen.getByText(/There are 0 alternative time slots available/i)).toBeInTheDocument();

      // Verify "Request manual switch" is still available
      const manualSwitchButton = screen.getByRole('button', { name: /Request manual group switch/i });
      expect(manualSwitchButton).toBeInTheDocument();

      // Verify manual request flow still works
      fireEvent.click(manualSwitchButton);
      await waitFor(() => {
        expect(screen.getByText(/To help us assign you to a group which best suits you/i)).toBeInTheDocument();
      });

      const reasonTextarea = screen.getByLabelText('Reason for group switch request');
      fireEvent.change(reasonTextarea, {
        target: { value: 'No available options work for me' },
      });

      const availabilityCheckbox = screen.getByRole('checkbox', { name: /I have updated my availability/i });
      fireEvent.click(availabilityCheckbox);

      const submitButton = screen.getByRole('button', { name: /Submit group switch request/i });
      fireEvent.click(submitButton);

      // Verify the manual request payload when no options are available
      await waitFor(() => {
        expect(mockSubmitGroupSwitch).toHaveBeenCalledWith({
          switchType: 'Switch group for one unit',
          notesFromParticipant: 'No available options work for me',
          isManualRequest: true,
          oldGroupId: undefined,
          newGroupId: undefined,
          oldDiscussionId: undefined, // No discussions available
          newDiscussionId: undefined,
          courseSlug: 'ai-safety',
        });
      });
    });

    test('Switching between temporary and permanent switching clears previous selections', async () => {
      render(
        <GroupSwitchModal
          handleClose={() => {}}
          initialUnitNumber={mockUnit1.unitNumber}
          courseSlug="ai-safety"
        />,
        { wrapper: TrpcProvider },
      );
      await waitFor(() => {
        expect(screen.getByLabelText('Reason for group switch request')).toBeInTheDocument();
      });

      // Fill in reason
      const reasonTextarea = screen.getByLabelText('Reason for group switch request');
      fireEvent.change(reasonTextarea, {
        target: { value: 'Testing selection clearing' },
      });

      // Select a discussion
      const eveningGroupOption = screen.getByLabelText('Select Evening Group B');
      fireEvent.click(eveningGroupOption);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Confirm selection of Evening Group B/i })).toBeInTheDocument();
      });

      // Switch to "Switch group permanently"
      const actionButton = screen.getByRole('button', { name: /Select action/i });
      fireEvent.click(actionButton);
      const listbox = await screen.findByRole('listbox', { name: /Select action/i });
      const permanentOption = within(listbox).getByText(/Switch group permanently/i);
      fireEvent.click(permanentOption);

      // Verify selection is cleared - no Confirm button should appear without selecting a group
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Confirm/i })).not.toBeInTheDocument();
      });

      // Select a group in permanent mode
      const eveningGroupInPermanentMode = screen.getByLabelText('Select Evening Group B');
      fireEvent.click(eveningGroupInPermanentMode);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Confirm selection of Evening Group B/i })).toBeInTheDocument();
      });

      // Switch back to "Switch group for one unit"
      const actionButton2 = screen.getByRole('button', { name: /Select action/i });
      fireEvent.click(actionButton2);
      const listbox2 = await screen.findByRole('listbox', { name: /Select action/i });
      const oneUnitOption = within(listbox2).getByText(/Switch group for one unit/i);
      fireEvent.click(oneUnitOption);

      // Verify selection is cleared again
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Confirm/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    test('API error during submission', async () => {
      let callCount = 0;
      server.use(
        trpcMsw.groupSwitching.switchGroup.mutation(() => {
          callCount += 1;
          if (callCount === 1) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Network error' });
          }
          return undefined;
        }),
      );

      render(
        <GroupSwitchModal
          handleClose={() => {}}
          initialUnitNumber={mockUnit1.unitNumber}
          courseSlug="ai-safety"
        />,
        { wrapper: TrpcProvider },
      );
      await waitFor(() => {
        expect(screen.getByLabelText('Reason for group switch request')).toBeInTheDocument();
      });

      const reasonTextarea = screen.getByLabelText('Reason for group switch request');
      fireEvent.change(reasonTextarea, {
        target: { value: 'Testing error handling' },
      });

      const eveningGroupOption = screen.getByLabelText('Select Evening Group B');
      fireEvent.click(eveningGroupOption);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Confirm selection of Evening Group B/i })).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Confirm selection of Evening Group B/i });
      fireEvent.click(confirmButton);

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 3, name: /Error.*Network error/i })).toBeInTheDocument();
      });

      // Verify form remains accessible - can switch to manual and retry
      const manualSwitchButton = screen.getByRole('button', { name: /Request manual group switch/i });
      expect(manualSwitchButton).toBeInTheDocument();
      fireEvent.click(manualSwitchButton);

      await waitFor(() => {
        expect(screen.getByText(/To help us assign you to a group which best suits you/i)).toBeInTheDocument();
      });

      const availabilityCheckbox = screen.getByRole('checkbox', { name: /I have updated my availability/i });
      fireEvent.click(availabilityCheckbox);

      const submitButton = screen.getByRole('button', { name: /Submit group switch request/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/We are working on your request/i)).toBeInTheDocument();
      });
    });
  });

  describe('Participant without group', () => {
    // Derive mock data from base by setting userIsParticipant to false everywhere
    const mockSwitchingDataNoGroup: DiscussionsAvailable = {
      ...mockSwitchingData,
      groupsAvailable: mockSwitchingData.groupsAvailable.map((g) => ({
        ...g,
        userIsParticipant: false,
        spotsLeftIfKnown: 3,
      })),
      discussionsAvailable: {
        1: mockSwitchingData.discussionsAvailable[1]!.map((d) => ({
          ...d,
          userIsParticipant: false,
          spotsLeftIfKnown: 3,
        })),
      },
    };

    beforeEach(() => {
      vi.clearAllMocks();

      mockedUseAuthStore.mockImplementation((selector) => {
        const state = { auth: mockAuth };
        return selector(state);
      });

      server.use(
        trpcMsw.groupSwitching.discussionsAvailable.query(() => mockSwitchingDataNoGroup),
      );
    });

    test('Modal does not show current group section when participant has no group', async () => {
      render(
        <GroupSwitchModal
          handleClose={() => {}}
          initialUnitNumber={mockUnit1.unitNumber}
          initialSwitchType="Switch group permanently"
          courseSlug="ai-safety"
        />,
        { wrapper: TrpcProvider },
      );

      // Wait for UI to update
      await waitFor(() => {
        expect(screen.getByLabelText('Reason for group switch request')).toBeInTheDocument();
        expect(screen.getByText('Morning Group A')).toBeInTheDocument();
        expect(screen.getByText('Evening Group B')).toBeInTheDocument();
      });

      // Verify "You are currently in this group" or "You are switching out of this group" text does NOT appear
      expect(screen.queryByText(/You are currently in this group/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/You are switching out of this group/i)).not.toBeInTheDocument();

      expect(screen.getByText('Morning Group A')).toBeInTheDocument();
      expect(screen.getByText('Evening Group B')).toBeInTheDocument();
    });

    test('Participant with no group can request non-manual switch', async () => {
      render(
        <GroupSwitchModal
          handleClose={() => {}}
          initialUnitNumber={mockUnit1.unitNumber}
          initialSwitchType="Switch group permanently"
          courseSlug="ai-safety"
        />,
        { wrapper: TrpcProvider },
      );

      // Wait for UI to update
      await waitFor(() => {
        expect(screen.getByLabelText('Reason for group switch request')).toBeInTheDocument();
        expect(screen.getByText('Evening Group B')).toBeInTheDocument();
      });

      // Fill in form
      const reasonTextarea = screen.getByLabelText('Reason for group switch request');
      fireEvent.change(reasonTextarea, {
        target: { value: 'This time works best for my schedule' },
      });
      const eveningGroupOption = screen.getByLabelText('Select Evening Group B');
      fireEvent.click(eveningGroupOption);

      const confirmButton = screen.getByRole('button', { name: /Confirm selection of Evening Group B/i });
      fireEvent.click(confirmButton);

      // Verify the API was called with correct data: newGroupId set, oldGroupId undefined
      await waitFor(() => {
        expect(mockSubmitGroupSwitch).toHaveBeenCalledWith({
          switchType: 'Switch group permanently',
          notesFromParticipant: 'This time works best for my schedule',
          isManualRequest: false,
          oldGroupId: undefined,
          newGroupId: 'group-2',
          oldDiscussionId: undefined,
          newDiscussionId: undefined,
          courseSlug: 'ai-safety',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
      });
    });

    test('Participant with no group can request manual permanent switch', async () => {
      render(
        <GroupSwitchModal
          handleClose={() => {}}
          initialUnitNumber={mockUnit1.unitNumber}
          initialSwitchType="Switch group permanently"
          courseSlug="ai-safety"
        />,
        { wrapper: TrpcProvider },
      );

      // Wait for UI to update
      await waitFor(() => {
        expect(screen.getByLabelText('Reason for group switch request')).toBeInTheDocument();
        expect(screen.getByText('Morning Group A')).toBeInTheDocument();
      });

      // Click "Request manual switch" button
      const manualSwitchButton = screen.getByRole('button', { name: /Request manual group switch/i });
      fireEvent.click(manualSwitchButton);

      await waitFor(() => {
        expect(screen.getByText(/To help us assign you to a group which best suits you/i)).toBeInTheDocument();
      });

      // Fill in form
      const reasonTextarea = screen.getByLabelText('Reason for group switch request');
      fireEvent.change(reasonTextarea, {
        target: { value: 'I need to join a group as I was accepted late' },
      });

      const availabilityCheckbox = screen.getByRole('checkbox', { name: /I have updated my availability/i });
      fireEvent.click(availabilityCheckbox);

      const submitButton = screen.getByRole('button', { name: /Submit group switch request/i });
      fireEvent.click(submitButton);

      // Verify the API was called with correct data: no oldGroupId
      await waitFor(() => {
        expect(mockSubmitGroupSwitch).toHaveBeenCalledWith({
          switchType: 'Switch group permanently',
          notesFromParticipant: 'I need to join a group as I was accepted late',
          isManualRequest: true,
          oldGroupId: undefined,
          newGroupId: undefined,
          oldDiscussionId: undefined,
          newDiscussionId: undefined,
          courseSlug: 'ai-safety',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/We are working on your request/i)).toBeInTheDocument();
      });
    });
  });

  describe('sortGroupSwitchOptions', () => {
    test('sorts non-disabled before disabled', () => {
      const options = [
        {
          groupName: 'Group A', dateTime: 1000, isDisabled: true, description: '', isRecurringTime: false,
        },
        {
          groupName: 'Group B', dateTime: 500, isDisabled: false, description: '', isRecurringTime: false,
        },
      ];
      const sorted = sortGroupSwitchOptions(options);
      expect(sorted[0]?.groupName).toBe('Group B');
      expect(sorted[1]?.groupName).toBe('Group A');
    });

    test('sorts recurring times by different weekday (Monday first)', () => {
      // Monday 10am UTC vs Friday 9am UTC (from previous week)
      const monday10am = new Date('2024-01-08T10:00:00Z').getTime() / 1000; // Monday
      const friday9am = new Date('2024-01-05T09:00:00Z').getTime() / 1000; // Friday (earlier week)
      const options = [
        {
          groupName: 'Friday Group', dateTime: friday9am, description: '', isRecurringTime: true,
        },
        {
          groupName: 'Monday Group', dateTime: monday10am, description: '', isRecurringTime: true,
        },
      ];
      const sorted = sortGroupSwitchOptions(options);
      expect(sorted[0]?.groupName).toBe('Monday Group');
      expect(sorted[1]?.groupName).toBe('Friday Group');
    });

    test('sorts recurring times by time of day on same weekday', () => {
      // Monday 9am UTC vs Monday 5pm UTC
      const monday9am = new Date('2024-01-08T09:00:00Z').getTime() / 1000;
      const monday5pm = new Date('2024-01-01T17:00:00Z').getTime() / 1000;
      const options = [
        {
          groupName: 'Evening Group', dateTime: monday5pm, description: '', isRecurringTime: true,
        },
        {
          groupName: 'Morning Group', dateTime: monday9am, description: '', isRecurringTime: true,
        },
      ];
      const sorted = sortGroupSwitchOptions(options);
      expect(sorted[0]?.groupName).toBe('Morning Group');
      expect(sorted[1]?.groupName).toBe('Evening Group');
    });

    test('sorts non-recurring times by absolute timestamp', () => {
      const earlier = new Date('2024-01-15T10:00:00Z').getTime() / 1000;
      const later = new Date('2024-01-20T09:00:00Z').getTime() / 1000;
      const options = [
        {
          groupName: 'Later Discussion', dateTime: later, description: '', isRecurringTime: false,
        },
        {
          groupName: 'Earlier Discussion', dateTime: earlier, description: '', isRecurringTime: false,
        },
      ];
      const sorted = sortGroupSwitchOptions(options);
      expect(sorted[0]?.groupName).toBe('Earlier Discussion');
      expect(sorted[1]?.groupName).toBe('Later Discussion');
    });
  });
});
