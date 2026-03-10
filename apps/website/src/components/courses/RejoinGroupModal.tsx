import {
  cn, CTALinkOrButton, ErrorSection, Modal, ProgressDots,
} from '@bluedot/ui';
import type React from 'react';
import { useMemo } from 'react';
import { formatDateMonthAndDay, formatTime12HourClock } from '../../lib/utils';
import { trpc } from '../../utils/trpc';
import { UserIcon } from '../icons/UserIcon';

export type RejoinGroupModalProps = {
  handleClose: () => void;
  roundId: string;
};

// eslint-disable-next-line react/function-component-definition
export default function RejoinGroupModal({ handleClose, roundId }: RejoinGroupModalProps) {
  const {
    data: availableGroups,
    isLoading,
    error,
  } = trpc.groupSwitching.discussionsAvailable.useQuery({ roundId }, { refetchInterval: 30_000 });

  // TODO: Replace with a dedicated rejoin mutation
  const rejoinMutation = trpc.groupSwitching.switchGroup.useMutation({
    onSuccess() {},
  });

  const groups = availableGroups?.groupsAvailable?.filter((g) => !g.userIsParticipant) ?? [];

  const handleJoin = (groupId: string) => {
    rejoinMutation.mutate({
      switchType: 'Switch group permanently',
      isManualRequest: false,
      newGroupId: groupId,
      roundId,
    });
  };

  const getGMTOffsetWithCity = () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const offsetMinutes = now.getTimezoneOffset();
    const offsetHours = Math.abs(offsetMinutes) / 60;
    const offsetSign = offsetMinutes <= 0 ? '+' : '-';
    const offsetFormatted = `${offsetSign}${Math.floor(offsetHours).toString().padStart(2, '0')}:${(Math.abs(offsetMinutes) % 60).toString().padStart(2, '0')}`;
    const cityName = timezone.split('/').pop()?.replace(/_/g, ' ') ?? timezone;
    return `(GMT ${offsetFormatted}) ${cityName}`;
  };

  return (
    <Modal
      isOpen
      setIsOpen={(open: boolean) => !open && handleClose()}
      title={<div className="text-size-md mx-auto py-3 font-semibold">Rejoin a group</div>}
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
                {'Select the group you want to rejoin to finish the course. The displayed time is in your time zone: '}
                <span className="font-medium">{getGMTOffsetWithCity()}</span>
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
                  onJoin={() => handleJoin(g.group.id)}
                />
              ))}
            </div>
          </div>
        )}
        {rejoinMutation.isSuccess && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-size-sm max-w-[500px] text-center text-[#666C80]">
              You have rejoined a group. You <strong>will receive the calendar invites shortly</strong> and be added to
              the group's Slack channel.
            </p>
            <CTALinkOrButton className="mt-4 w-full" onClick={handleClose}>
              Close
            </CTALinkOrButton>
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
    <div className={cn('rounded-lg border border-gray-200 bg-white pr-3', isDisabled && 'opacity-50')}>
      <div className="flex w-full items-center">
        <div className="flex w-[74px] shrink-0 flex-col items-center justify-center self-stretch border-r border-gray-200 px-3 py-1">
          {displayDate && <div className="text-size-sm font-semibold whitespace-nowrap">{displayDate}</div>}
          {displayTime && <div className="text-size-xs whitespace-nowrap text-gray-500">{displayTime}</div>}
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-4 py-3 pl-4">
          <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <div className="text-size-sm font-semibold">{groupName}</div>
            <div className="text-size-xs flex items-center gap-1 text-gray-500">
              <UserIcon className="-translate-y-px opacity-70" />
              <span>{spotsLabel}</span>
            </div>
          </div>
          <CTALinkOrButton
            onClick={onJoin}
            disabled={isDisabled ?? isSubmitting}
            aria-label={`Join ${groupName}`}
            className="h-[36px] shrink-0"
          >
            {isSubmitting ? '...' : 'Join'}
          </CTALinkOrButton>
        </div>
      </div>
    </div>
  );
};
