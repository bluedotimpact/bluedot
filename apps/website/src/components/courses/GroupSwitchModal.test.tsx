/* eslint-disable @typescript-eslint/no-explicit-any */
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
import useAxios from 'axios-hooks';
import { useAuthStore } from '@bluedot/ui';
import type { Course } from '@bluedot/db';
import GroupSwitchModal, { sortGroupSwitchOptions } from './GroupSwitchModal';
import type { GetGroupSwitchingAvailableResponse } from '../../pages/api/courses/[courseSlug]/group-switching/available';
import type { GroupSwitchingRequest, GroupSwitchingResponse } from '../../pages/api/courses/[courseSlug]/group-switching';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { createMockGroupDiscussion, createMockUnit } from '../../__tests__/testUtils';

vi.mock('axios-hooks');
vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    useAuthStore: vi.fn(),
  };
});

const mockedUseAxios = useAxios as unknown as Mock;
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

const mockCourse = {
  id: 'course-1',
  slug: 'ai-safety',
} as Course;

const mockCourseData = {
  course: mockCourse,
  units: [mockUnit1],
};

const mockCourseDataWithTwoUnits = {
  course: mockCourse,
  units: [mockUnit1, mockUnit2],
};

// Match real API structure exactly
const mockSwitchingData: GetGroupSwitchingAvailableResponse = {
  type: 'success',
  groupsAvailable: [
    {
      group: {
        id: 'group-1',
        groupName: 'Morning Group A',
        autoNumberId: null,
        groupDiscussions: [],
        round: 'round-1',
        participants: ['participant-1'], // Current user
        startTimeUtc: Math.floor(new Date('2024-01-01T09:00:00Z').getTime() / 1000),
        whoCanSwitchIntoThisGroup: [],
      },
      userIsParticipant: true,
      spotsLeftIfKnown: 0,
      allDiscussionsHaveStarted: false,
    },
    {
      group: {
        id: 'group-2',
        groupName: 'Evening Group B',
        autoNumberId: null,
        groupDiscussions: [],
        round: 'round-1',
        participants: [],
        startTimeUtc: Math.floor(new Date('2024-01-01T19:00:00Z').getTime() / 1000),
        whoCanSwitchIntoThisGroup: [],
      },
      userIsParticipant: false,
      spotsLeftIfKnown: 3,
      allDiscussionsHaveStarted: false,
    },
  ],
  discussionsAvailable: {
    1: [
      {
        discussion: createMockGroupDiscussion({
          group: 'group-1',
          participantsExpected: ['participant-1'],
          unitNumber: 1,
        }),
        groupName: 'Morning Group A',
        userIsParticipant: true, // This is the current discussion
        spotsLeftIfKnown: 0,
        hasStarted: false,
      },
      {
        discussion: createMockGroupDiscussion({
          group: 'group-2',
          participantsExpected: ['other-participant-1', 'other-participant-2'],
          unitNumber: 2,
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
    mockSubmitGroupSwitch = vi.fn();

    mockedUseAuthStore.mockImplementation((selector) => {
      const state = { auth: mockAuth };
      return selector(state);
    });

    server.use(
      trpcMsw.courses.getBySlug.query(() => mockCourseData),
    );

    // Return mock data based on url to avoid handling the order of calls
    mockedUseAxios.mockImplementation((config?: any) => {
      if (config?.url?.includes('group-switching/available')) {
        return [{ data: mockSwitchingData, loading: false, error: null }, vi.fn()];
      }
      if (config?.url?.includes('group-switching') && config?.method === 'post') {
        return [{ data: null, loading: false, error: null }, mockSubmitGroupSwitch];
      }
      return [{ data: null, loading: false, error: null }, vi.fn()];
    });
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

      expect(screen.getByText('Switch group for one unit')).toBeInTheDocument();

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

      // Queue up mock for successful submit response
      mockSubmitGroupSwitch.mockResolvedValueOnce({
        data: { type: 'success' } as GroupSwitchingResponse,
      });

      const confirmButton = screen.getByRole('button', { name: /Confirm selection of Evening Group B/i });
      fireEvent.click(confirmButton);

      // Verify the API was called with correct data
      await waitFor(() => {
        expect(mockSubmitGroupSwitch).toHaveBeenCalledWith({
          data: {
            switchType: 'Switch group for one unit',
            notesFromParticipant: 'I have a scheduling conflict',
            isManualRequest: false,
            oldGroupId: undefined,
            newGroupId: undefined,
            oldDiscussionId: 'discussion-1',
            newDiscussionId: 'discussion-2',
          } as GroupSwitchingRequest,
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument();
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
      const actionButton = screen.getByLabelText('Select Action');
      fireEvent.click(actionButton);
      const listbox = await screen.findByRole('listbox', { name: /Action/i });
      const permanentOption = within(listbox).getByText('Switch group permanently');
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

      // Queue up mock for successful submit response
      mockSubmitGroupSwitch.mockResolvedValueOnce({
        data: { type: 'success' } as GroupSwitchingResponse,
      });

      const confirmButton = screen.getByRole('button', { name: /Confirm selection of Evening Group B/i });
      fireEvent.click(confirmButton);

      // Verify the API was called with correct data
      await waitFor(() => {
        expect(mockSubmitGroupSwitch).toHaveBeenCalledWith({
          data: {
            switchType: 'Switch group permanently',
            notesFromParticipant: 'Permanent time conflict with work schedule',
            isManualRequest: false,
            oldGroupId: 'group-1',
            newGroupId: 'group-2',
            oldDiscussionId: undefined,
            newDiscussionId: undefined,
          } as GroupSwitchingRequest,
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument();
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
        expect(screen.getByText(/keen for you to request manual switches/i)).toBeInTheDocument();
      });

      const reasonTextarea = screen.getByLabelText('Reason for group switch request');
      fireEvent.change(reasonTextarea, {
        target: { value: 'None of the available times work for my schedule' },
      });

      // Queue up mock for successful submit response
      mockSubmitGroupSwitch.mockResolvedValueOnce({
        data: { type: 'success' } as GroupSwitchingResponse,
      });

      const submitButton = screen.getByRole('button', { name: /Submit group switch request/i });
      expect(submitButton).not.toBeDisabled();
      fireEvent.click(submitButton);

      // Verify the API was called with correct data
      await waitFor(() => {
        expect(mockSubmitGroupSwitch).toHaveBeenCalledWith({
          data: {
            switchType: 'Switch group for one unit',
            notesFromParticipant: 'None of the available times work for my schedule',
            isManualRequest: true,
            oldGroupId: undefined,
            newGroupId: undefined,
            oldDiscussionId: 'discussion-1',
            newDiscussionId: undefined,
          } as GroupSwitchingRequest,
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
      const mockSwitchingDataWithUnit2: GetGroupSwitchingAvailableResponse = {
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
      );

      mockedUseAxios.mockImplementation((config?: any) => {
        if (config?.url?.includes('group-switching/available')) {
          return [{ data: mockSwitchingDataWithUnit2, loading: false, error: null }, vi.fn()];
        }
        if (config?.url?.includes('group-switching') && config?.method === 'post') {
          return [{ data: null, loading: false, error: null }, mockSubmitGroupSwitch];
        }
        return [{ data: null, loading: false, error: null }, vi.fn()];
      });

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

      // Verify selectedUnitNumber defaults to "2"
      const unitButton = screen.getByLabelText('Select Unit');
      expect(unitButton).toHaveTextContent('2');

      // Verify Unit 2 discussion is shown
      expect(screen.getByText('Unit 2 Group')).toBeInTheDocument();

      // Change to unit 1
      fireEvent.click(unitButton);
      const unitListbox = await screen.findByRole('listbox', { name: /Unit/i });
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
      const mockSwitchingDataWithDisabled: GetGroupSwitchingAvailableResponse = {
        type: 'success',
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
      );

      mockedUseAxios.mockImplementation((config?: any) => {
        if (config?.url?.includes('group-switching/available')) {
          return [{ data: mockSwitchingDataWithDisabled, loading: false, error: null }, vi.fn()];
        }
        if (config?.url?.includes('group-switching') && config?.method === 'post') {
          return [{ data: null, loading: false, error: null }, mockSubmitGroupSwitch];
        }
        return [{ data: null, loading: false, error: null }, vi.fn()];
      });

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

      // Verify "No spots left" message appears
      const noSpotsMessages = screen.getAllByText('No spots left');
      expect(noSpotsMessages.length).toBeGreaterThan(0);

      // Open unit selector to check if Unit 2 is disabled
      const unitButton = screen.getByLabelText('Select Unit');
      fireEvent.click(unitButton);

      const unitListbox = await screen.findByRole('listbox', { name: /Unit/i });
      const unit2Option = within(unitListbox).getByText(/Unit 2.*no upcoming discussions/i);
      expect(unit2Option).toBeInTheDocument();

      // Verify Unit 2 is disabled (has disabled attribute on its parent)
      const unit2ListItem = unit2Option.closest('[role="option"]');
      expect(unit2ListItem).toHaveAttribute('aria-disabled', 'true');

      // Now switch to manual request mode and verify units become enabled
      fireEvent.click(unitButton); // Close the unit dropdown
      const manualSwitchButton = screen.getByRole('button', { name: /Request manual group switch/i });
      fireEvent.click(manualSwitchButton);

      await waitFor(() => {
        expect(screen.getByText(/keen for you to request manual switches/i)).toBeInTheDocument();
      });

      // Open unit selector again in manual mode
      const unitButtonInManualMode = screen.getByLabelText('Select Unit');
      fireEvent.click(unitButtonInManualMode);

      const unitListboxInManualMode = await screen.findByRole('listbox', { name: /Unit/i });
      const unit2OptionInManualMode = within(unitListboxInManualMode).getByText(/Unit 2/i);

      // Verify Unit 2 is now enabled in manual mode
      const unit2ListItemInManualMode = unit2OptionInManualMode.closest('[role="option"]');
      expect(unit2ListItemInManualMode).not.toHaveAttribute('aria-disabled', 'true');
    });

    test('Manual switching is still available when there are no discussions available (in "Switch group for one unit" mode)', async () => {
      const mockSwitchingDataEmpty: GetGroupSwitchingAvailableResponse = {
        ...mockSwitchingData,
        groupsAvailable: [],
        discussionsAvailable: { 1: [] },
      };

      mockedUseAxios.mockImplementation((config?: any) => {
        if (config?.url?.includes('group-switching/available')) {
          return [{ data: mockSwitchingDataEmpty, loading: false, error: null }, vi.fn()];
        }
        if (config?.url?.includes('group-switching') && config?.method === 'post') {
          return [{ data: null, loading: false, error: null }, mockSubmitGroupSwitch];
        }
        return [{ data: null, loading: false, error: null }, vi.fn()];
      });

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
        expect(screen.getByText(/keen for you to request manual switches/i)).toBeInTheDocument();
      });

      const reasonTextarea = screen.getByLabelText('Reason for group switch request');
      fireEvent.change(reasonTextarea, {
        target: { value: 'No available options work for me' },
      });

      // Queue up mock for successful submit response
      mockSubmitGroupSwitch.mockResolvedValueOnce({
        data: { type: 'success' } as GroupSwitchingResponse,
      });

      const submitButton = screen.getByRole('button', { name: /Submit group switch request/i });
      fireEvent.click(submitButton);

      // Verify the manual request payload when no options are available
      await waitFor(() => {
        expect(mockSubmitGroupSwitch).toHaveBeenCalledWith({
          data: {
            switchType: 'Switch group for one unit',
            notesFromParticipant: 'No available options work for me',
            isManualRequest: true,
            oldGroupId: undefined,
            newGroupId: undefined,
            oldDiscussionId: undefined, // No discussions available
            newDiscussionId: undefined,
          } as GroupSwitchingRequest,
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
      const actionButton = screen.getByLabelText('Select Action');
      fireEvent.click(actionButton);
      const listbox = await screen.findByRole('listbox', { name: /Action/i });
      const permanentOption = within(listbox).getByText('Switch group permanently');
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
      const actionButton2 = screen.getByLabelText('Select Action');
      fireEvent.click(actionButton2);
      const listbox2 = await screen.findByRole('listbox', { name: /Action/i });
      const oneUnitOption = within(listbox2).getByText('Switch group for one unit');
      fireEvent.click(oneUnitOption);

      // Verify selection is cleared again
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Confirm/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    test('API error during submission', async () => {
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

      // Mock error response
      mockSubmitGroupSwitch.mockRejectedValueOnce(new Error('Network error'));

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
        expect(screen.getByText(/keen for you to request manual switches/i)).toBeInTheDocument();
      });

      // Queue up mock for successful submit response
      mockSubmitGroupSwitch.mockResolvedValueOnce({
        data: { type: 'success' } as GroupSwitchingResponse,
      });

      const submitButton = screen.getByRole('button', { name: /Submit group switch request/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSubmitGroupSwitch).toHaveBeenCalledWith({
          data: {
            switchType: 'Switch group for one unit',
            notesFromParticipant: 'Testing error handling',
            isManualRequest: true,
            oldGroupId: undefined,
            newGroupId: undefined,
            oldDiscussionId: 'discussion-1', // User's current discussion
            newDiscussionId: undefined,
          } as GroupSwitchingRequest,
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/We are working on your request/i)).toBeInTheDocument();
      });
    });
  });

  describe('Participant without group', () => {
    // Derive mock data from base by setting userIsParticipant to false everywhere
    const mockSwitchingDataNoGroup: GetGroupSwitchingAvailableResponse = {
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
      mockSubmitGroupSwitch = vi.fn();

      mockedUseAuthStore.mockImplementation((selector) => {
        const state = { auth: mockAuth };
        return selector(state);
      });

      // Return mock data with no participant groups
      mockedUseAxios.mockImplementation((config?: any) => {
        if (config?.url?.includes('group-switching/available')) {
          return [{ data: mockSwitchingDataNoGroup, loading: false, error: null }, vi.fn()];
        }
        if (config?.url?.includes('group-switching') && config?.method === 'post') {
          return [{ data: null, loading: false, error: null }, mockSubmitGroupSwitch];
        }
        return [{ data: null, loading: false, error: null }, vi.fn()];
      });
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

      // Queue up mock for successful submit response
      mockSubmitGroupSwitch.mockResolvedValueOnce({
        data: { type: 'success' } as GroupSwitchingResponse,
      });

      const confirmButton = screen.getByRole('button', { name: /Confirm selection of Evening Group B/i });
      fireEvent.click(confirmButton);

      // Verify the API was called with correct data: newGroupId set, oldGroupId undefined
      await waitFor(() => {
        expect(mockSubmitGroupSwitch).toHaveBeenCalledWith({
          data: {
            switchType: 'Switch group permanently',
            notesFromParticipant: 'This time works best for my schedule',
            isManualRequest: false,
            oldGroupId: undefined,
            newGroupId: 'group-2',
            oldDiscussionId: undefined,
            newDiscussionId: undefined,
          } as GroupSwitchingRequest,
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument();
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
        expect(screen.getByText(/keen for you to request manual switches/i)).toBeInTheDocument();
      });

      // Fill in form
      const reasonTextarea = screen.getByLabelText('Reason for group switch request');
      fireEvent.change(reasonTextarea, {
        target: { value: 'I need to join a group as I was accepted late' },
      });

      // Queue up mock for successful submit response
      mockSubmitGroupSwitch.mockResolvedValueOnce({
        data: { type: 'success' } as GroupSwitchingResponse,
      });

      const submitButton = screen.getByRole('button', { name: /Submit group switch request/i });
      fireEvent.click(submitButton);

      // Verify the API was called with correct data: no oldGroupId
      await waitFor(() => {
        expect(mockSubmitGroupSwitch).toHaveBeenCalledWith({
          data: {
            switchType: 'Switch group permanently',
            notesFromParticipant: 'I need to join a group as I was accepted late',
            isManualRequest: true,
            oldGroupId: undefined,
            newGroupId: undefined,
            oldDiscussionId: undefined,
            newDiscussionId: undefined,
          } as GroupSwitchingRequest,
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
