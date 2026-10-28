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
import { formatCoverTimeLocal, formatCoverTimeUtcBracket, type CoverMessageDetails } from '../../lib/facilitatorCover';

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
    isGroupFacilitator: true,
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
    renderModal({ initialModalType: 'Change facilitator', initialHasFoundCover: true });

    const submit = await screen.findByRole('button', { name: 'Submit' });
    expect(submit.closest('form')).not.toBeNull();
  });

  describe('Change facilitator: adding someone from outside the round', () => {
    let mockRequestFacilitatorChange: Mock;

    beforeEach(() => {
      mockRequestFacilitatorChange = vi.fn();
      server.use(
        trpcMsw.facilitators.getFacilitatorsForRound.query(() => [{ value: 'facilitator-2', label: 'Robin Round' }]),
        trpcMsw.facilitators.searchSubstituteCandidates.query(({ input }) => (
          input.searchTerm === 'sa' ? [{ userId: 'user-sasha', name: 'Sasha Substitute', hasFacilitatedThisCourse: true }] : []
        )),
        trpcMsw.facilitators.requestFacilitatorChange.mutation(({ input }) => {
          mockRequestFacilitatorChange(input);
          return null;
        }),
      );
    });

    const openFacilitatorPicker = async () => {
      fireEvent.click(await screen.findByRole('button', { name: /Select new facilitator/ }));
      return screen.getAllByRole('option');
    };

    test('the option sits at the end of the list and opens the search', async () => {
      renderModal({ initialModalType: 'Change facilitator', initialHasFoundCover: true });

      const options = await openFacilitatorPicker();
      expect(options.map((o) => o.textContent)).toEqual(['Robin Round', '+ Add someone else']);
      fireEvent.click(options[1]!);

      expect(await screen.findByRole('dialog', { name: 'Add someone else as a facilitator' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Select new facilitator/ })).toHaveTextContent('Choose a facilitator');
    });

    test('choosing someone shows them in the picker and submits their user id', async () => {
      renderModal({ initialModalType: 'Change facilitator', initialHasFoundCover: true });
      fireEvent.click((await openFacilitatorPicker())[1]!);
      await screen.findByRole('dialog', { name: 'Add someone else as a facilitator' });

      fireEvent.change(screen.getByPlaceholderText('Search by name...'), { target: { value: 'sa' } });
      fireEvent.click(await screen.findByRole('button', { name: 'Select' }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: 'Add someone else as a facilitator' })).not.toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /Select new facilitator/ })).toHaveTextContent('Sasha Substitute');

      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(mockRequestFacilitatorChange).toHaveBeenCalledWith({
          roundId: 'round-1',
          groupId: 'group-1',
          discussionId: 'discussion-1',
          newFacilitator: { kind: 'user', userId: 'user-sasha' },
        });
      });
      expect(await screen.findByText(/Please allow up to 10 minutes/)).toBeInTheDocument();
    });

    test('cancelling the search leaves the picker as it was', async () => {
      renderModal({ initialModalType: 'Change facilitator', initialHasFoundCover: true });
      fireEvent.click((await openFacilitatorPicker())[0]!);
      expect(screen.getByRole('button', { name: /Select new facilitator/ })).toHaveTextContent('Robin Round');

      fireEvent.click((await openFacilitatorPicker())[1]!);
      await screen.findByRole('dialog', { name: 'Add someone else as a facilitator' });
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: 'Add someone else as a facilitator' })).not.toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /Select new facilitator/ })).toHaveTextContent('Robin Round');
    });

    test('a facilitator from the round is submitted by meet person id', async () => {
      renderModal({ initialModalType: 'Change facilitator', initialHasFoundCover: true });
      fireEvent.click((await openFacilitatorPicker())[0]!);
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(mockRequestFacilitatorChange).toHaveBeenCalledWith(expect.objectContaining({
          newFacilitator: { kind: 'meetPerson', id: 'facilitator-2' },
        }));
      });
      expect(await screen.findByText(/Please allow up to 10 minutes/)).toBeInTheDocument();
    });
  });

  describe('Change facilitator: asking in #facilitator-community', () => {
    const messageDetails: CoverMessageDetails = {
      requester: { name: 'Sam Rivera', slackUserId: 'U0SAM' },
      courseTitle: 'AGI Strategy',
      unitNumber: '1',
      groupName: 'Monday 9am ET',
      startTimeSeconds: nowSeconds + ONE_DAY_SECONDS,
      endTimeSeconds: nowSeconds + ONE_DAY_SECONDS + 3600,
      availableFacilitators: [{ name: 'Jordan Lee', slackUserId: 'U0JORDAN' }],
      noClashFacilitators: [],
      moreAvailableThanTagged: false,
      assignUrl: 'https://bluedot.org/facilitated-courses?changeFacilitator=discussion-1',
    };
    let mockRequestCover: Mock;

    beforeEach(() => {
      mockRequestCover = vi.fn();
      server.use(
        trpcMsw.facilitators.getCoverRequestPreview.query(() => ({ messageDetails })),
        trpcMsw.facilitators.requestCover.mutation(({ input }) => {
          mockRequestCover(input);
          return { threadUrl: 'https://slack.com/archives/C1/p123' };
        }),
      );
    });

    const answerNo = async () => {
      fireEvent.click(await screen.findByRole('button', { name: /Have you found someone to cover/ }));
      fireEvent.click(screen.getByRole('option', { name: 'No, ask in #facilitator-community' }));
    };

    test('the question is unanswered by default and nothing follows the discussion', async () => {
      renderModal({ initialModalType: 'Change facilitator' });

      expect(await screen.findByRole('button', { name: /Have you found someone to cover/ })).toHaveTextContent('Choose an option');
      expect(screen.queryByRole('button', { name: /Select new facilitator/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Post to #facilitator-community' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    });

    test('initialHasFoundCover presets "Yes" and shows the facilitator picker', async () => {
      renderModal({ initialModalType: 'Change facilitator', initialHasFoundCover: true });

      expect(await screen.findByRole('button', { name: /Have you found someone to cover/ })).toHaveTextContent('Yes, I\'ve agreed with someone');
      expect(screen.getByRole('button', { name: /Select new facilitator/ })).toBeInTheDocument();
    });

    test('"No" shows the draft post built from the preview', async () => {
      renderModal({ initialModalType: 'Change facilitator' });
      await answerNo();

      const draft = (await screen.findByText('@Jordan Lee')).closest('div')!;
      expect(draft).toHaveTextContent('@Sam Rivera is looking for cover for "AGI Strategy · Unit 1 · Monday 9am ET"');
      const range = { startTimeSeconds: messageDetails.startTimeSeconds, endTimeSeconds: messageDetails.endTimeSeconds };
      const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
      expect(draft).toHaveTextContent(`${formatCoverTimeLocal({ ...range, timeZone })} ${formatCoverTimeUtcBracket({ ...range, timeZone })}`);
      expect(screen.getByRole('link', { name: 'here' })).toHaveAttribute('href', messageDetails.assignUrl);
      expect(screen.queryByRole('button', { name: /Select new facilitator/ })).not.toBeInTheDocument();
    });

    test('typing a note updates the draft', async () => {
      renderModal({ initialModalType: 'Change facilitator' });
      await answerNo();
      await screen.findByText('@Jordan Lee');

      fireEvent.change(screen.getByLabelText(/Anything to add/), { target: { value: 'At a conference that week' } });

      expect(screen.getByText('@Jordan Lee').closest('div')).toHaveTextContent('Note from them: "At a conference that week"');
    });

    test('posting sends the previewed tags and shows a link to the thread', async () => {
      renderModal({ initialModalType: 'Change facilitator' });
      await answerNo();
      await screen.findByText('@Jordan Lee');
      fireEvent.change(screen.getByLabelText(/Anything to add/), { target: { value: 'Happy to swap' } });

      fireEvent.click(screen.getByRole('button', { name: 'Post to #facilitator-community' }));

      expect(await screen.findByText(/Posted in #facilitator-community/)).toBeInTheDocument();
      expect(mockRequestCover).toHaveBeenCalledWith({
        roundId: 'round-1',
        groupId: 'group-1',
        discussionId: 'discussion-1',
        note: 'Happy to swap',
      });
      expect(screen.getByRole('link', { name: 'Open the thread' })).toHaveAttribute('href', 'https://slack.com/archives/C1/p123');
    });

    test('without a thread URL, the success state has no thread link', async () => {
      server.use(trpcMsw.facilitators.requestCover.mutation(() => ({ threadUrl: null })));
      renderModal({ initialModalType: 'Change facilitator' });
      await answerNo();
      await screen.findByText('@Jordan Lee');

      fireEvent.click(screen.getByRole('button', { name: 'Post to #facilitator-community' }));

      expect(await screen.findByText(/Posted in #facilitator-community/)).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Open the thread' })).not.toBeInTheDocument();
    });

    test('a failed post shows its message', async () => {
      server.use(trpcMsw.facilitators.requestCover.mutation(() => {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Slack is down' });
      }));
      renderModal({ initialModalType: 'Change facilitator' });
      await answerNo();
      await screen.findByText('@Jordan Lee');

      fireEvent.click(screen.getByRole('button', { name: 'Post to #facilitator-community' }));

      expect(await screen.findByText('Slack is down')).toBeInTheDocument();
    });

    test('a failed preview shows its message and the post stays disabled', async () => {
      server.use(trpcMsw.facilitators.getCoverRequestPreview.query(() => {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Discussion has no end time' });
      }));
      renderModal({ initialModalType: 'Change facilitator' });
      await answerNo();

      expect(await screen.findByText('Discussion has no end time')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Post to #facilitator-community' })).toBeDisabled();
    });
  });
});
