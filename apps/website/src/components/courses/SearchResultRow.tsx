import type { ReactNode } from 'react';
import { Avatar } from '@bluedot/ui';

type SearchResultRowProps = {
  name: string;
  /** Optional line shown under the name */
  note?: ReactNode;
  /** Optional trailing slot (e.g. a button or link) */
  rightHandNode?: ReactNode;
};

const SearchResultRow = ({ name, note, rightHandNode }: SearchResultRowProps) => (
  <div className="flex items-center gap-3 border rounded-md px-3 py-3">
    <Avatar name={name} />
    <span className="flex-1 min-w-0 flex flex-col gap-1">
      <span className="text-size-xs font-medium text-primary truncate">{name}</span>
      {note && <span className="text-size-xxs text-secondary">{note}</span>}
    </span>
    {rightHandNode}
  </div>
);

export default SearchResultRow;
