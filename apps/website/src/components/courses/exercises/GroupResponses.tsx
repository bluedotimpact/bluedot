import React, { useState } from 'react';
import { Select } from '@bluedot/ui';
import { PersonIcon } from '@bluedot/ui/src/icons/PersonIcon';
import MarkdownExtendedRenderer from '../MarkdownExtendedRenderer';

const TRUNCATION_LIMIT = 640;

export type GroupResponsesProps = {
  title: string;
  description: string;
  responses: Array<{ name: string, response: string }>;
  /** Total number of participants in the group (for pending count) */
  totalParticipants: number;
  /** Group selector: list of groups available */
  groups?: Array<{ id: string, name: string }>;
  /** Currently selected group ID */
  selectedGroupId?: string;
  /** Called when the user picks a different group */
  onGroupChange?: (groupId: string) => void;
  /** Rendered above the card (e.g. "Exercise" label + toggle) */
  headerControls?: React.ReactNode;
};

const GroupResponses: React.FC<GroupResponsesProps> = ({
  title,
  description,
  responses,
  totalParticipants,
  groups,
  selectedGroupId,
  onGroupChange,
  headerControls,
}) => {
  const pendingCount = totalParticipants - responses.length;

  return (
    <div className="flex flex-col gap-2">
      {headerControls}

      <div className="container-lined bg-white p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="bluedot-h4 not-prose">{title}</p>
          <MarkdownExtendedRenderer>{description}</MarkdownExtendedRenderer>
        </div>

        <hr className="border-t border-[#E5E7EB] m-0" />

        {groups && groups.length > 1 && (
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-semibold text-[#111827]">Select your group:</label>
            <Select
              options={groups.map((g) => ({ value: g.id, label: g.name }))}
              value={selectedGroupId}
              onChange={(value) => onGroupChange?.(value)}
              ariaLabel="Select your group"
            />
          </div>
        )}

        <div className="bg-[#F9FBFF] -mx-8 px-8 -mb-8 pb-8 rounded-b-lg flex flex-col gap-6">
          <p className="text-[14px] text-[#374151]">
            <span className="font-semibold">{responses.length} {responses.length === 1 ? 'Response' : 'Responses'}</span>
            {' · '}
            <span className="font-semibold">{pendingCount} Pending</span>
          </p>

          <div className="flex flex-col">
            {responses.map((r, index) => (
              <ResponseBlock
                key={r.name + index}
                name={r.name}
                response={r.response}
                showDivider={index > 0}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ResponseBlock: React.FC<{
  name: string;
  response: string;
  showDivider: boolean;
}> = ({ name, response, showDivider }) => {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = response.length > TRUNCATION_LIMIT;
  const displayedResponse = needsTruncation && !expanded
    ? response.slice(0, TRUNCATION_LIMIT)
    : response;

  return (
    <>
      {showDivider && <hr className="border-t border-[#E5E7EB] my-4" />}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#E5E7EB] flex items-center justify-center flex-shrink-0">
            <PersonIcon size={14} className="text-[#9CA3AF]" />
          </div>
          <span className="font-semibold text-[14px] text-[#111827]">{name}</span>
        </div>
        <div className="border-l-2 border-[#D1D5DB] pl-4 ml-3">
          <div className="relative">
            <div className="text-[14px] text-[#374151] leading-[160%]">
              <MarkdownExtendedRenderer>{displayedResponse}</MarkdownExtendedRenderer>
            </div>
            {needsTruncation && !expanded && (
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#F9FBFF] to-transparent pointer-events-none" />
            )}
          </div>
          {needsTruncation && !expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-[13px] text-bluedot-normal font-medium mt-2 bg-transparent border-none cursor-pointer p-0 hover:underline block mx-auto"
            >
              Show more
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default GroupResponses;
