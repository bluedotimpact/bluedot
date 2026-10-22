import {
  A,
  Callout,
  Button,
  DatePicker,
  Modal,
  P,
  ProgressDots,
  Select,
  Textarea,
  TimePicker,
  useCurrentTimeMs,
} from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import {
  Fragment, useEffect, useId, useState,
} from 'react';
import { FaCheck, FaClock, FaPeopleArrows } from 'react-icons/fa6';
import { trpc } from '../../utils/trpc';
import type { GroupDiscussionWithGroupAndUnit } from '../../server/routers/group-discussions';
import {
  buildCoverMessage, formatCoverTime, formatCoverTimeUtcBracket, type CoverMessageDetails, type CoverMessageSegment,
} from '../../lib/facilitatorCover';

const MODAL_TYPE_OPTIONS = [
  {
    value: 'Update discussion time',
    label: (
      <span className="grid grid-cols-[20px_1fr] items-center gap-2">
        <FaClock aria-hidden="true" className="size-5" /> Update discussion time
      </span>
    ),
  },
  {
    value: 'Change facilitator',
    label: (
      <span className="grid grid-cols-[20px_1fr] items-center gap-2">
        <FaPeopleArrows aria-hidden="true" className="size-5" /> Change facilitator
      </span>
    ),
  },
] as const;

export type FacilitatorModalType = (typeof MODAL_TYPE_OPTIONS)[number]['value'];

const SWITCH_OPTIONS = [
  { value: 'Change for one unit', label: 'Change for one unit' },
  { value: 'Change permanently', label: 'Change permanently' },
] as const;

export type FacilitatorSwitchType = (typeof SWITCH_OPTIONS)[number]['value'];

const COVER_OPTIONS = [
  { value: 'Yes', label: 'Yes, I\'ve agreed with someone' },
  { value: 'No', label: 'No, ask in #facilitator-community' },
] as const;

const AGREED_COVER_LABEL = COVER_OPTIONS[0].label;

const coverOptionValue = (hasFoundCover: boolean | undefined) => {
  if (hasFoundCover === undefined) return undefined;
  return hasFoundCover ? 'Yes' : 'No';
};

type FacilitatorSwitchModalProps = {
  handleClose: () => void;
  roundId: string;
  /** Only `id` and `group` needed from initialDiscussion */
  initialDiscussion: { id: string; group: string } | null;
  initialGroupId?: string;
  initialModalType?: FacilitatorModalType;
  initialSwitchType?: FacilitatorSwitchType;
  /** Presets "Have you found someone to cover?" in "Change facilitator" mode; leave out to start unanswered */
  initialHasFoundCover?: boolean;
};

const FacilitatorSwitchModal: React.FC<FacilitatorSwitchModalProps> = ({
  handleClose,
  roundId,
  initialDiscussion,
  initialGroupId,
  initialModalType = 'Update discussion time',
  initialSwitchType = 'Change for one unit',
  initialHasFoundCover,
}) => {
  const [modalType, setModalType] = useState<FacilitatorModalType>(initialModalType);

  // Update discussion time state
  const [switchType, setSwitchType] = useState<FacilitatorSwitchType | undefined>(initialSwitchType);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(initialDiscussion?.group ?? initialGroupId);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | undefined>(initialDiscussion?.id);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<Date | undefined>(undefined);

  // Change facilitator state
  const [hasFoundCover, setHasFoundCover] = useState<boolean | undefined>(initialHasFoundCover);
  const [selectedNewFacilitatorId, setSelectedNewFacilitatorId] = useState<string | undefined>();
  const [coverNote, setCoverNote] = useState('');
  const coverNoteId = useId();

  // Reset mode-specific state when modal type changes
  useEffect(() => {
    if (modalType === 'Update discussion time') {
      setSelectedNewFacilitatorId(undefined);
    } else {
      setSelectedDate(undefined);
      setSelectedTime(undefined);
    }
  }, [modalType]);

  const currentTimeMs = useCurrentTimeMs();
  const updateDiscussionTimeMutation = trpc.facilitators.updateDiscussion.useMutation();
  const changeFacilitatorMutation = trpc.facilitators.requestFacilitatorChange.useMutation();
  const requestCoverMutation = trpc.facilitators.requestCover.useMutation();

  // Fetch facilitators when in "Change facilitator" mode
  const facilitatorsQuery = trpc.facilitators.getFacilitatorsForRound.useQuery(
    { roundId },
    { enabled: modalType === 'Change facilitator' },
  );

  const {
    data: discussions = [],
    isLoading,
    isError,
    error,
  } = trpc.facilitators.discussionsAvailable.useQuery({ roundId });

  const isAskingForCover = modalType === 'Change facilitator' && hasFoundCover === false;
  // Each fetch reshuffles who gets tagged, so keep the first result for the post to match
  const coverPreviewQuery = trpc.facilitators.getCoverRequestPreview.useQuery(
    { roundId, groupId: selectedGroupId ?? '', discussionId: selectedDiscussionId ?? '' },
    {
      enabled: isAskingForCover && !!selectedGroupId && !!selectedDiscussionId,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
  );
  const { groupOptions, discussionOptionsByGroup } = buildOptions(discussions, currentTimeMs);
  // Substitutes can only change the time of the discussion they cover
  const switchOptions = SWITCH_OPTIONS.map((opt) => ({
    ...opt,
    disabled: opt.value === 'Change permanently' && discussions.some((d) => d.group === selectedGroupId && !d.isGroupFacilitator),
  }));

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const discussionOptions = discussionOptionsByGroup[selectedGroupId || ''] ?? [];
  const selectedDiscussion = discussionOptions.find((d) => d.value === selectedDiscussionId);
  const selectedDiscussionDateTime = selectedDiscussion ? new Date(selectedDiscussion.startDateTime * 1000) : undefined;
  const selectedDiscussionTimeString = selectedDiscussionDateTime
    ? `${selectedDiscussionDateTime.toLocaleDateString(undefined, { weekday: 'short' })}, ${selectedDiscussionDateTime.toLocaleDateString(undefined, { dateStyle: 'medium' })} at ${selectedDiscussionDateTime.toLocaleTimeString(undefined, { timeStyle: 'short' })}`
    : undefined;

  const isSingleUnitChange = switchType === 'Change for one unit';

  const submitDisabled = !switchType
    || !selectedGroupId
    || (isSingleUnitChange && !selectedDiscussionId)
    || (!selectedDate && !selectedDiscussionDateTime)
    || (!selectedTime && !selectedDiscussionDateTime);

  const handleSubmit = () => {
    if (!switchType || !selectedGroupId) {
      return;
    }

    // When `discussionId` is undefined the backend automation will update all future discussions for the group
    const discussionId = isSingleUnitChange ? selectedDiscussionId : undefined;

    const dateToUse = selectedDate ?? selectedDiscussionDateTime;
    const timeToUse = selectedTime ?? selectedDiscussionDateTime;

    if (!dateToUse || !timeToUse) {
      return;
    }

    // Local date and time, converted to UTC with `getTime()` below
    const newDateTime = new Date(dateToUse);
    newDateTime.setHours(timeToUse.getHours(), timeToUse.getMinutes(), 0, 0);

    updateDiscussionTimeMutation.mutate({
      roundId,
      discussionId,
      groupId: selectedGroupId,
      // `getTime()` converts to UTC milliseconds, we convert to seconds
      requestedDateTimeInSeconds: Math.floor(newDateTime.getTime() / 1000),
    });
  };

  // Change facilitator mode
  const facilitatorChangeSubmitDisabled = !selectedGroupId || !selectedDiscussionId || !selectedNewFacilitatorId;

  const handleFacilitatorChangeSubmit = () => {
    if (!selectedGroupId || !selectedDiscussionId || !selectedNewFacilitatorId) {
      return;
    }

    changeFacilitatorMutation.mutate({
      roundId,
      discussionId: selectedDiscussionId,
      groupId: selectedGroupId,
      newFacilitatorId: selectedNewFacilitatorId,
    });
  };

  const handleRequestCoverSubmit = () => {
    if (!selectedGroupId || !selectedDiscussionId || !coverPreviewQuery.data) {
      return;
    }

    requestCoverMutation.mutate({
      roundId,
      groupId: selectedGroupId,
      discussionId: selectedDiscussionId,
      note: coverNote,
      taggedFacilitatorIds: coverPreviewQuery.data.taggedFacilitatorIds,
    });
  };

  const renderTitle = () => {
    if (updateDiscussionTimeMutation.isSuccess || changeFacilitatorMutation.isSuccess || requestCoverMutation.isSuccess) {
      return 'Success';
    }

    return (
      <Select
        aria-label="Select action type"
        value={modalType}
        onChange={(value) => setModalType(value as FacilitatorModalType)}
        options={MODAL_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
        variant="ghost"
        className="mx-auto"
      />
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          {modalType === 'Update discussion time' && <InformationBanner />}
          <ProgressDots />
        </>
      );
    }

    if (isError) {
      return <ErrorView error={error} />;
    }

    if (updateDiscussionTimeMutation.isSuccess) {
      return (
        <div className="flex w-full flex-col items-center justify-center gap-8">
          <div className="bg-bluedot-normal/10 flex rounded-full p-4">
            <FaCheck aria-hidden="true" className="size-7.5 text-accent" />
          </div>
          <div className="flex max-w-narrow flex-col items-center gap-4">
            <P className="text-center text-primary">
              We've updated your group's {isSingleUnitChange ? 'discussion' : 'discussions'}.
            </P>
            <P className="text-center text-primary">
              As a reminder, <span className="font-bold">we have not notified your participants</span>, so please make
              sure you communicate this with them. You should see the changes reflected in the calendar event and Course
              Hub.
            </P>
            <P className="text-center text-primary">Please allow up to 10 minutes to see the changes.</P>
          </div>
          <Button className="w-full" onClick={handleClose}>
            Close
          </Button>
        </div>
      );
    }

    if (changeFacilitatorMutation.isSuccess) {
      return (
        <div className="flex w-full flex-col items-center justify-center gap-8">
          <div className="bg-bluedot-normal/10 flex rounded-full p-4">
            <FaCheck aria-hidden="true" className="size-7.5 text-accent" />
          </div>
          <div className="flex max-w-narrow flex-col items-center gap-4">
            <P className="text-center text-primary">
              You won't be facilitating the group discussion for {selectedDiscussion?.label} for the group{' '}
              {groupOptions.find((g) => g.value === selectedGroupId)?.label}.
            </P>
            <P className="text-center text-primary">
              You should see the changes reflected in the calendar event and Course Hub. Please allow up to 10 minutes
              to see the changes.
            </P>
          </div>
          <Button className="w-full" onClick={handleClose}>
            Close
          </Button>
        </div>
      );
    }

    if (requestCoverMutation.isSuccess) {
      const { threadUrl } = requestCoverMutation.data;
      return (
        <div className="flex w-full flex-col items-center justify-center gap-8">
          <div className="bg-bluedot-normal/10 flex rounded-full p-4">
            <FaCheck aria-hidden="true" className="size-7.5 text-accent" />
          </div>
          <div className="flex max-w-narrow flex-col items-center gap-4">
            <P className="text-center text-primary">
              Posted in #facilitator-community.
              {threadUrl && (
                <>
                  {' '}<A href={threadUrl} target="_blank">Open the thread</A>.
                </>
              )}
            </P>
            <P className="text-center text-primary">
              When someone replies, come back here and choose <span className="font-bold">"{AGREED_COVER_LABEL}"</span>.
            </P>
          </div>
          <Button className="w-full" onClick={handleClose}>
            Close
          </Button>
        </div>
      );
    }

    if (modalType === 'Update discussion time') {
      return (
        <>
          <InformationBanner />
          <div className="flex flex-col gap-2">
            <p className="text-size-md font-medium text-primary">1. What kind of update are you making?</p>
            <Select
              aria-label="Action"
              value={switchType}
              onChange={(value) => setSwitchType(value as FacilitatorSwitchType)}
              options={switchOptions}
              placeholder="Choose an option"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-size-md font-medium text-primary">2. For which group?</p>
            <Select
              aria-label="Group"
              value={selectedGroupId}
              onChange={(value) => {
                setSelectedGroupId(value);
                setSelectedDiscussionId(undefined);
              }}
              options={groupOptions.map((opt) => ({ ...opt, disabled: !isSingleUnitChange && discussions.some((d) => d.group === opt.value && !d.isGroupFacilitator) }))}
              placeholder="Choose a group"
            />
          </div>

          {isSingleUnitChange && (
            <div className="flex flex-col gap-2">
              <p className="text-size-md font-medium text-primary">3. For which discussion?</p>
              <Select
                aria-label="Discussion"
                options={discussionOptions}
                value={selectedDiscussionId}
                onChange={(value) => setSelectedDiscussionId(value)}
                placeholder="Choose a discussion"
              />
              {selectedDiscussion && (
                <P>
                  Current time: <span className="text-accent">{selectedDiscussionTimeString}</span>
                </P>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-size-md font-medium text-primary">
              {isSingleUnitChange ? '4' : '3'}. Select new discussion time
            </p>
            <P>The selected time is in your time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</P>
            <div className="flex gap-4">
              <DatePicker value={selectedDate ?? selectedDiscussionDateTime} onChange={setSelectedDate} />
              <TimePicker
                className="w-fit"
                timeValue={selectedTime ?? selectedDiscussionDateTime}
                onTimeChange={setSelectedTime}
              />
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="flex flex-col gap-2">
          <p className="text-size-md font-medium text-primary">1. Have you found someone to cover?</p>
          <Select
            aria-label="Have you found someone to cover?"
            value={coverOptionValue(hasFoundCover)}
            onChange={(value) => setHasFoundCover(value === 'Yes')}
            options={[...COVER_OPTIONS]}
            placeholder="Choose an option"
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-size-md font-medium text-primary">2. For which group?</p>
          <Select
            aria-label="Group"
            value={selectedGroupId}
            onChange={(value) => {
              setSelectedGroupId(value);
              setSelectedDiscussionId(undefined);
            }}
            options={groupOptions}
            placeholder="Choose a group"
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-size-md font-medium text-primary">3. For which discussion?</p>
          <Select
            aria-label="Discussion"
            options={discussionOptions}
            value={selectedDiscussionId}
            onChange={(value) => setSelectedDiscussionId(value)}
            placeholder="Choose a discussion"
          />
        </div>

        {hasFoundCover === true && (
          <>
            <div className="flex flex-col gap-2">
              <p className="text-size-md font-medium text-primary">4. Select new facilitator</p>
              {facilitatorsQuery.isError && (
                <P className="text-error-fg">
                  {facilitatorsQuery.error?.message || 'Failed to load facilitators. Please try again.'}
                </P>
              )}
              <Select
                aria-label="New facilitator"
                options={[...(facilitatorsQuery.data ?? [])].sort((a, b) => a.label.localeCompare(b.label))}
                value={selectedNewFacilitatorId}
                onChange={(value) => setSelectedNewFacilitatorId(value)}
                placeholder={facilitatorsQuery.isLoading ? 'Loading facilitators...' : 'Choose a facilitator'}
              />
            </div>

            {changeFacilitatorMutation.isError && (
              <P className="text-error-fg">
                {changeFacilitatorMutation.error?.message || 'An error occurred. Please try again.'}
              </P>
            )}

            <Button
              className="w-full"
              onClick={handleFacilitatorChangeSubmit}
              loading={changeFacilitatorMutation.isPending}
              disabled={facilitatorChangeSubmitDisabled}
            >
              {changeFacilitatorMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </>
        )}

        {hasFoundCover === false && renderAskForCover()}

        {hasFoundCover === undefined && (
          <Button className="w-full" disabled>Submit</Button>
        )}
      </>
    );
  };

  const renderAskForCover = () => (
    <>
      <div className="flex flex-col gap-2">
        <label htmlFor={coverNoteId} className="text-size-md font-medium text-primary">
          4. Anything to add? <span className="font-normal text-secondary">(optional)</span>
        </label>
        <Textarea
          id={coverNoteId}
          rows={2}
          maxLength={1000}
          placeholder="e.g. At a conference that week, happy to swap a session in return"
          value={coverNote}
          onChange={(e) => setCoverNote(e.target.value)}
        />
      </div>

      {selectedGroupId && selectedDiscussionId && (
        <div className="flex flex-col gap-2">
          <P className="text-primary">
            This will be posted in <span className="text-accent">#facilitator-community</span>:
          </P>
          {coverPreviewQuery.isLoading && <ProgressDots />}
          {coverPreviewQuery.isError && (
            <P className="text-error-fg">
              {coverPreviewQuery.error?.message || 'Failed to prepare the post. Please try again.'}
            </P>
          )}
          {coverPreviewQuery.data && (
            <CoverMessageDraft messageDetails={coverPreviewQuery.data.messageDetails} note={coverNote} />
          )}
        </div>
      )}

      <Callout>
        When someone replies in the thread, come back here and choose "{AGREED_COVER_LABEL}".
      </Callout>

      {requestCoverMutation.isError && (
        <P className="text-error-fg">
          {requestCoverMutation.error?.message || 'An error occurred. Please try again.'}
        </P>
      )}

      <Button
        className="w-full"
        onClick={handleRequestCoverSubmit}
        loading={requestCoverMutation.isPending}
        disabled={!coverPreviewQuery.data}
      >
        {requestCoverMutation.isPending ? 'Posting...' : 'Post to #facilitator-community'}
      </Button>
    </>
  );

  const showUpdateTimeFooter = modalType === 'Update discussion time'
    && !isLoading
    && !isError
    && !updateDiscussionTimeMutation.isSuccess;

  return (
    <Modal
      isOpen
      setIsOpen={(open: boolean) => !open && handleClose()}
      title={renderTitle()}
      bottomDrawerOnMobile
      footer={showUpdateTimeFooter && (
        <div className="flex flex-col gap-2">
          {updateDiscussionTimeMutation.isError && (
            <P className="text-error-fg">
              {updateDiscussionTimeMutation.error?.message || 'An error occurred. Please try again.'}
            </P>
          )}
          <Button
            className="w-full"
            onClick={handleSubmit}
            loading={updateDiscussionTimeMutation.isPending}
            disabled={submitDisabled}
          >
            {updateDiscussionTimeMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      )}
    >
      <form className="flex flex-col gap-8">{renderContent()}</form>
    </Modal>
  );
};

const InformationBanner = () => (
  <Callout>
    Please discuss any changes with your participants beforehand. Any changes will update the calendar invitation and
    Course Hub information, but not notify your participants.
  </Callout>
);

const CoverMessageDraft = ({ messageDetails, note }: { messageDetails: CoverMessageDetails; note: string }) => {
  const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
  const renderSegment = (segment: CoverMessageSegment) => {
    switch (segment.type) {
      case 'text': return segment.text;
      case 'time': return (
        <>
          <span className="font-bold">{formatCoverTime({ ...segment, timeZone })}</span>
          {` ${formatCoverTimeUtcBracket({ ...segment, timeZone })}`}
        </>
      );
      // Slack shows a plain name for people without a linked Slack account
      case 'mention': return segment.slackUserId
        ? <span className="rounded-[3px] bg-accent-subtle/60 px-[3px] text-accent box-decoration-clone">@{segment.name}</span>
        : segment.name;
      case 'link': return <A href={segment.url} target="_blank">{segment.text}</A>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-3 break-words rounded-surface border border-default p-4 text-size-sm leading-6 text-primary">
      {buildCoverMessage({ ...messageDetails, note }).map((segments, i) => (
        <p key={i}>{segments.map((segment, j) => <Fragment key={j}>{renderSegment(segment)}</Fragment>)}</p>
      ))}
    </div>
  );
};

type GroupOption = { value: string; label: string; disabled?: boolean };
type DiscussionOption = GroupOption & { startDateTime: number };

const buildOptions = (discussions: GroupDiscussionWithGroupAndUnit[], currentTimeMs: number) => {
  const groupOptions: GroupOption[] = [];
  const discussionOptionsByGroup: Record<string, DiscussionOption[]> = {};
  const seenGroups = new Set<string>();

  for (const discussion of discussions) {
    const groupId = discussion.group;

    if (!seenGroups.has(groupId)) {
      seenGroups.add(groupId);
      groupOptions.push({
        value: groupId,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        label: discussion.groupDetails?.groupName || 'Group [Unknown]',
      });
    }

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    if (!discussionOptionsByGroup[groupId]) {
      discussionOptionsByGroup[groupId] = [];
    }

    discussionOptionsByGroup[groupId].push({
      value: discussion.id,
      label: discussion.unitRecord
        ? `Unit ${discussion.unitRecord.unitNumber}: ${discussion.unitRecord.title}`
        : 'Unknown Unit',
      disabled: discussion.startDateTime * 1000 <= currentTimeMs,
      startDateTime: discussion.startDateTime,
    });
  }

  // Sort discussions within each group by startDateTime
  for (const group of Object.values(discussionOptionsByGroup)) {
    group.sort((a, b) => a.startDateTime - b.startDateTime);
  }

  return { groupOptions, discussionOptionsByGroup };
};

export default FacilitatorSwitchModal;
