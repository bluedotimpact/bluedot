import {
  cn, CTALinkOrButton, ErrorSection, Modal, ProgressDots,
} from '@bluedot/ui';
import type React from 'react';
import { useMemo, useState } from 'react';
import { formatDateMonthAndDay, formatTime12HourClock, getGMTOffsetWithCity } from '../../lib/utils';
import type { DiscussionsAvailable } from '../../server/routers/group-switching';
import { trpc } from '../../utils/trpc';
import { CheckIcon } from '../icons/CheckIcon';
import { UserIcon } from '../icons/UserIcon';

export type RejoinGroupModalProps = {
  handleClose: () => void;
  roundId: string;
};

type GroupEntry = DiscussionsAvailable['groupsAvailable'][number];

// eslint-disable-next-line react/function-component-definition
export default function RejoinGroupModal({ handleClose, roundId }: RejoinGroupModalProps) {
  const [joinedGroup, setJoinedGroup] = useState<GroupEntry | null>(null);

  const {
    data: availableGroups,
    isLoading,
    error,
  } = trpc.groupSwitching.discussionsAvailable.useQuery({ roundId }, { enabled: !joinedGroup });

  // TODO: Replace with a dedicated rejoin mutation
  const rejoinMutation = trpc.groupSwitching.switchGroup.useMutation({
    onSuccess() {},
  });

  const groups = availableGroups?.groupsAvailable?.filter((g) => !g.userIsParticipant) ?? [];

  const handleJoin = (entry: GroupEntry) => {
    setJoinedGroup(entry);
    rejoinMutation.mutate({
      switchType: 'Switch group permanently',
      isManualRequest: false,
      newGroupId: entry.group.id,
      roundId,
    });
  };

  return (
    <Modal
      isOpen
      setIsOpen={(open: boolean) => !open && handleClose()}
      title={
        <div className="text-size-md mx-auto py-3 font-semibold">
          {rejoinMutation.isSuccess ? 'Success' : 'Rejoin a group'}
        </div>
      }
      bottomDrawerOnMobile
      desktopHeaderClassName="border-b border-charcoal-light pt-3 pb-2 mb-0"
      ariaLabel="Rejoin a group"
    >
      <div className="w-full max-w-[600px] pt-6">
        <div className="h-0 w-[600px] max-w-full" />
        {isLoading && <ProgressDots />}
        {error && <ErrorSection error={error} />}
        {rejoinMutation.isError && <ErrorSection error={rejoinMutation.error} />}
        {!isLoading && !rejoinMutation.isSuccess && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-size-sm text-bluedot-navy font-medium">Select a group</span>
              <p className="text-size-xs text-[#666C80]">
                Select the group you want to rejoin. The displayed time is in your time zone:
                <span className="font-medium"> {getGMTOffsetWithCity()}</span>
              </p>
            </div>
            <div className="mt-1 flex flex-col gap-2">
              {groups.map((g) => (
                <RejoinGroupOption
                  key={g.group.id}
                  groupName={g.group.groupName ?? 'Group [Unknown]'}
                  dateTime={g.group.startTimeUtc}
                  spotsLeftIfKnown={g.spotsLeftIfKnown}
                  isDisabled={g.spotsLeftIfKnown === 0}
                  isSubmitting={rejoinMutation.isPending}
                  onJoin={() => handleJoin(g)}
                />
              ))}
            </div>
          </div>
        )}
        {rejoinMutation.isSuccess && joinedGroup && (
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="shrink-0 rounded-md border border-gray-200 px-3 py-[7px] text-center">
                  {joinedGroup.group.startTimeUtc && (
                    <>
                      <div className="text-size-sm font-semibold whitespace-nowrap">
                        {formatDateMonthAndDay(joinedGroup.group.startTimeUtc)}
                      </div>
                      <div className="text-size-xs text-bluedot-normal font-medium whitespace-nowrap">
                        {formatTime12HourClock(joinedGroup.group.startTimeUtc)}
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <div className="text-size-sm mb-[2px] font-semibold">
                    {joinedGroup.group.groupName ?? 'Group [Unknown]'}
                  </div>
                  <div className="text-size-xs text-bluedot-normal flex items-center gap-1">
                    <span>You joined this group</span>
                    <CheckIcon className="size-3" />
                  </div>
                </div>
              </div>
              <p className="text-size-xs text-bluedot-navy/70 max-w-[320px] text-center">
                You <strong>will receive a calendar invite shortly</strong> and be added to the group's Slack channel.
              </p>
            </div>
            <div className="border-color-divider w-full border-t pt-6">
              <CTALinkOrButton className="w-full" onClick={handleClose}>
                Close
              </CTALinkOrButton>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

type RejoinGroupOptionProps = {
  groupName: string;
  dateTime: number | null;
  spotsLeftIfKnown: number | null;
  isDisabled?: boolean;
  isSubmitting?: boolean;
  onJoin: () => void;
};

const RejoinGroupOption: React.FC<RejoinGroupOptionProps> = ({
  groupName,
  dateTime,
  spotsLeftIfKnown,
  isDisabled,
  isSubmitting,
  onJoin,
}) => {
  const displayDate = useMemo(() => {
    if (!dateTime) return null;
    return formatDateMonthAndDay(dateTime);
  }, [dateTime]);

  const displayTime = useMemo(() => {
    if (!dateTime) return null;
    return formatTime12HourClock(dateTime);
  }, [dateTime]);

  const spotsLabel
    = spotsLeftIfKnown === null ? 'Spots available' : `${spotsLeftIfKnown} spot${spotsLeftIfKnown === 1 ? '' : 's'} left`;

  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-3', isDisabled && 'opacity-50')}>
      <div className="grid grid-cols-[80px_1fr] items-center gap-4">
        <div className="self-center border-r border-gray-200 text-center">
          {displayDate && displayTime && (
            <>
              <div className="mt-px mb-[3px] font-medium whitespace-nowrap">{displayDate}</div>
              <div className="text-size-xs whitespace-nowrap text-gray-500">{displayTime}</div>
            </>
          )}
        </div>
        <div className="flex justify-between gap-4">
          <div>
            <div className="mb-[4px] font-semibold">{groupName}</div>
            <div className="text-size-xs flex items-center gap-[6px] text-gray-500">
              <UserIcon className="-translate-y-px" />
              <span>{spotsLabel}</span>
            </div>
          </div>
          <CTALinkOrButton
            onClick={onJoin}
            disabled={isDisabled ?? isSubmitting}
            aria-label={`Join ${groupName}`}
            className="my-auto h-fit"
          >
            {isSubmitting ? '...' : 'Join'}
          </CTALinkOrButton>
        </div>
      </div>
    </div>
  );
};
