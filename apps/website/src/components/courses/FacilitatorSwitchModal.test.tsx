import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  describe, expect, test, vi, beforeEach, type Mock,
} from 'vitest';
import { TRPCError } from '@trpc/server';
import FacilitatorSwitchModal from './FacilitatorSwitchModal';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { createMockGroup, createMockGroupDiscussion, createMockUnit } from '../../__tests__/testUtils';
import { ONE_DAY_SECONDS } from '../../lib/constants';

const nowSeconds = Math.floor(Date.now() / 1000);

const mockDiscussions = [
  {
    ...createMockGroupDiscussion({
      id: 'discussion-1',
      group: 'group-1',
      startDateTime: nowSeconds + ONE_DAY_SECONDS,
      endDateTime: nowSeconds + ONE_DAY_SECONDS + 3600,
    }),
    groupDetails: createMockGroup({ id: 'group-1', groupName: 'Monday 9am ET' }),
    unitRecord: createMockUnit({ unitNumber: '1', title: 'Introduction' }),
  },
];

describe('FacilitatorSwitchModal', () => {
  let mockUpdateDiscussion: Mock;

  beforeEach(() => {
    mockUpdateDiscussion = vi.fn();

    server.use(
      trpcMsw.facilitators.discussionsAvailable.query(() => mockDiscussions),
      trpcMsw.facilitators.getFacilitatorsForRound.query(() => []),
      trpcMsw.facilitators.updateDiscussion.mutation(({ input }) => {
        mockUpdateDiscussion(input);
        return null;
      }),
    );
  });

  const renderModal = (props: Partial<React.ComponentProps<typeof FacilitatorSwitchModal>> = {}) => render(
    <FacilitatorSwitchModal
      handleClose={() => {}}
      roundId="round-1"
      initialDiscussion={{ id: 'discussion-1', group: 'group-1' }}
      {...props}
    />,
    { wrapper: TrpcProvider },
  );

  test('Update discussion time: Submit sits in the modal footer and sends the request', async () => {
    renderModal();

    const submit = await screen.findByRole('button', { name: 'Submit' });
    // Outside the scrolling form, so it stays in view on small screens
    expect(screen.getByRole('dialog')).toContainElement(submit);
    expect(submit.closest('form')).toBeNull();
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);

    await waitFor(() => {
      expect(mockUpdateDiscussion).toHaveBeenCalledWith({
        roundId: 'round-1',
        discussionId: 'discussion-1',
        groupId: 'group-1',
        requestedDateTimeInSeconds: Math.floor((nowSeconds + ONE_DAY_SECONDS) / 60) * 60,
      });
    });

    expect(await screen.findByText('We\'ve updated your group\'s discussion.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
  });

  test('Update discussion time: Submit stays disabled until the form is filled in', async () => {
    renderModal({ initialDiscussion: null });

    expect(await screen.findByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  test('Update discussion time: a failed request shows its message next to Submit', async () => {
    server.use(trpcMsw.facilitators.updateDiscussion.mutation(() => {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Requested time must be in the future' });
    }));
    renderModal();

    fireEvent.click(await screen.findByRole('button', { name: 'Submit' }));

    const message = await screen.findByText('Requested time must be in the future');
    expect(screen.getByRole('dialog')).toContainElement(message);
    expect(message.closest('form')).toBeNull();
    expect(screen.getByRole('button', { name: 'Submit' })).not.toBeDisabled();
  });

  test('Change facilitator: Submit stays in the form', async () => {
    renderModal({ initialModalType: 'Change facilitator' });

    const submit = await screen.findByRole('button', { name: 'Submit' });
    expect(submit.closest('form')).not.toBeNull();
  });
});
