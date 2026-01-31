import React, { useState } from 'react';
import { Select } from '@bluedot/ui';
import { PersonIcon } from '@bluedot/ui/src/icons/PersonIcon';
// TODO remove this import cycle
// eslint-disable-next-line import/no-cycle
import MarkdownExtendedRenderer from '../MarkdownExtendedRenderer';

const TRUNCATION_LINES = 8;

export type GroupResponsesProps = {
  responses: { name: string, response: string }[];
  totalParticipants: number;
  groups?: { id: string, name: string }[];
  selectedGroupId?: string;
  // TODO don't allow this to be undefined
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
    <div className="bg-[#F9FBFF] px-8 pt-6 pb-8 rounded-b-lg flex flex-col gap-6">
      {groups && groups.length > 1 && (
        <div className="flex flex-col gap-2">
          <span className="text-size-xs font-semibold text-[#13132E]">Select your group:</span>
          <Select
            options={groups.map((g) => ({ value: g.id, label: g.name }))}
            value={selectedGroupId}
            onChange={(value) => onGroupChange?.(value)}
            ariaLabel="Select your group"
          />
        </div>
      )}
      <p className="text-size-xs font-semibold text-[#13132E]">
        <span>{responses.length} {responses.length === 1 ? 'Response' : 'Responses'}</span>
        {' · '}
        <span>{pendingCount} Pending</span>
      </p>

      <div className="flex flex-col divide-y divide-gray-200">
        {responses.map((r) => (
          <ResponseBlock
            key={r.name}
            name={r.name}
            response={r.response}
          />
        ))}
      </div>
    </div>
  );
};

const ResponseBlock: React.FC<{
  name: string;
  response: string;
}> = ({ name, response }) => {
  const canTruncate = response.length > 640;
  const [expanded, setExpanded] = useState(!canTruncate);

  return (
    <div className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2">
        <div className="size-6 rounded-full bg-bluedot-lighter flex items-center justify-center flex-shrink-0">
          {/* TODO check if there is a a better icon for this, e.g. the one that is used in place of the login button */}
          <PersonIcon size={14} className="text-bluedot-normal" />
        </div>
        <span className="font-semibold text-size-xs text-[#13132E]">{name}</span>
      </div>
      <div className="border-l-2 border-bluedot-lighter pl-4 ml-3">
        <div className="relative">
          <div
            // TODO what does leading-[160%] achieve here?
            className="leading-[160%]"
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
            // TODO Make the #F9FBFF implicit based on the wrapper
            <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-[#F9FBFF] to-transparent pointer-events-none" />
          )}
        </div>
      </div>
      {!expanded && (
        // TODO support show less
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-size-xs text-bluedot-normal font-medium mt-2 cursor-pointer hover:underline block ml-3 pl-4"
        >
          Show more
        </button>
      )}
    </div>
  );
};

export default GroupResponses;
