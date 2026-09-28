import clsx from 'clsx';
import type { ReactNode } from 'react';
import { IoTimeOutline } from 'react-icons/io5';

export type StatusPillProps = {
  icon?: ReactNode;
  children: ReactNode;
  /** 'strong' stands out on a tinted background (e.g. the unit page discussion banner). */
  emphasis?: 'subtle' | 'strong';
};

/** Read-only state chip that sits in an action slot (Attended, Absent, Dropped, ...). */
const StatusPill = ({ icon, children, emphasis = 'subtle' }: StatusPillProps) => (
  <span
    className={clsx(
      'inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-[7px] text-size-xxs font-medium',
      emphasis === 'subtle' ? 'bg-bluedot-lighter/30 text-bluedot-darker' : 'bg-accent-subtle text-bluedot-darker',
    )}
  >
    {icon}
    {children}
  </span>
);

// Outline clock with its stroke thickened to match IoBan's line weight.
const PendingIcon = () => <IoTimeOutline aria-hidden size={14} className="[&_path]:[stroke-width:48]" />;

/** Stands in for a Reschedule button while a switch request for that discussion is open. */
export const ReschedulingPill = ({ emphasis }: { emphasis?: StatusPillProps['emphasis'] }) => (
  <StatusPill icon={<PendingIcon />} emphasis={emphasis}>Rescheduling</StatusPill>
);

export const GroupSwitchRequestedPill = () => (
  <StatusPill icon={<PendingIcon />}>Group switch requested</StatusPill>
);

export default StatusPill;
