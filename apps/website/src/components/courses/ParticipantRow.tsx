import type { ReactNode } from 'react';
import { getInitials } from '../../lib/utils';

type ParticipantRowProps = {
  name: string;
  /** Optional trailing slot (e.g. a button or link) */
  rightHandNode?: ReactNode;
};

const ParticipantRow = ({ name, rightHandNode }: ParticipantRowProps) => (
  <div className="flex items-center gap-3 border border-gray-300 rounded-md px-3 py-3">
    <div className="size-[30px] rounded-full bg-bluedot-normal flex items-center justify-center text-white text-size-xxs font-bold shrink-0">
      {getInitials(name)}
    </div>
    <span className="flex-1 text-size-xs font-medium text-bluedot-navy truncate">{name}</span>
    {rightHandNode}
  </div>
);

export default ParticipantRow;
