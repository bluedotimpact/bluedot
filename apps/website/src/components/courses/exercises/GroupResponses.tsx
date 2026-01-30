import React, { useState } from 'react';
import { Select } from '@bluedot/ui';
import { PersonIcon } from '@bluedot/ui/src/icons/PersonIcon';
// eslint-disable-next-line import/no-cycle
import MarkdownExtendedRenderer from '../MarkdownExtendedRenderer';

const TRUNCATION_LINES = 8;

export type GroupResponsesProps = {
  responses: { name: string, response: string }[];
  /** Total number of participants in the group (for pending count) */
  totalParticipants: number;
  /** Group selector: list of groups available */
  groups?: { id: string, name: string }[];
  /** Currently selected group ID */
  selectedGroupId?: string;
  /** Called when the user picks a different group */
  onGroupChange?: (groupId: string) => void;
};

const GroupResponses: React.FC<GroupResponsesProps> = ({
  responses,
  totalParticipants,
  groups,
  selectedGroupId,
  onGroupChange,
}) => {
  const pendingCount = totalParticipants - responses.length;

  return (
    <>
      <div className="flex flex-col gap-6 px-8 pb-2">
        <hr className="border-t border-[#E5E7EB] m-0" />

        {groups && groups.length > 1 && (
          <div className="flex flex-col gap-2">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="text-[14px] font-semibold text-[#111827]">Select your group:</label>
            <Select
              options={groups.map((g) => ({ value: g.id, label: g.name }))}
              value={selectedGroupId}
              onChange={(value) => onGroupChange?.(value)}
              ariaLabel="Select your group"
            />
          </div>
        )}
      </div>

      <div className="bg-[#F9FBFF] px-8 pt-6 pb-8 rounded-b-lg flex flex-col gap-6">
        <p className="text-[14px] text-[#374151]">
          <span className="font-semibold">{responses.length} {responses.length === 1 ? 'Response' : 'Responses'}</span>
          {' · '}
          <span className="font-semibold">{pendingCount} Pending</span>
        </p>

        <div className="flex flex-col">
          {responses.map((r) => (
            <ResponseBlock
              key={r.name}
              name={r.name}
              response={r.response}
            />
          ))}
        </div>
      </div>
    </>
  );
};

const ResponseBlock: React.FC<{
  name: string;
  response: string;
}> = ({ name, response }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2 [&+&]:border-t [&+&]:border-[#E5E7EB] [&+&]:pt-4 [&+&]:mt-4">
      <div className="flex items-center gap-2">
        <div className="size-6 rounded-full bg-[#E5E7EB] flex items-center justify-center flex-shrink-0">
          <PersonIcon size={14} className="text-[#9CA3AF]" />
        </div>
        <span className="font-semibold text-[14px] text-[#111827]">{name}</span>
      </div>
      <div className="border-l-2 border-[#D1D5DB] pl-4 ml-3">
        <div className="relative">
          <div
            className="text-[14px] text-[#374151] leading-[160%]"
            style={!expanded ? {
              display: '-webkit-box',
              WebkitLineClamp: TRUNCATION_LINES,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            } : undefined}
          >
            <MarkdownExtendedRenderer>{response}</MarkdownExtendedRenderer>
          </div>
          {!expanded && (
            <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-[#F9FBFF] to-transparent pointer-events-none" />
          )}
        </div>
      </div>
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-[13px] text-bluedot-normal font-medium mt-2 bg-transparent border-none cursor-pointer p-0 hover:underline block ml-3 pl-4"
        >
          Show more
        </button>
      )}
    </div>
  );
};

export default GroupResponses;
