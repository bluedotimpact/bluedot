import type { ReactNode } from 'react';
import { Avatar } from '@bluedot/ui';

type ParticipantRowProps = {
  name: string;
  /** Optional trailing slot (e.g. a button or link) */
  rightHandNode?: ReactNode;
};

const ParticipantRow = ({ name, rightHandNode }: ParticipantRowProps) => (
  <div className="flex items-center gap-3 border border-gray-300 rounded-md px-3 py-3">
    <Avatar name={name} />
    <span className="flex-1 text-size-xs font-medium text-bluedot-navy truncate">{name}</span>
    {rightHandNode}
  </div>
);

export default ParticipantRow;
