import React, { useState } from 'react';
import { Select } from '@bluedot/ui';
import { FaUser } from 'react-icons/fa6';
// TODO remove this import cycle
// eslint-disable-next-line import/no-cycle
import MarkdownExtendedRenderer from '../MarkdownExtendedRenderer';

const TRUNCATION_LINES = 8;

export type GroupData = {
  id: string;
  name: string;
  totalParticipants: number;
  responses: { name: string, response: string }[];
};

export type GroupResponsesProps = {
  groups: GroupData[];
};

const GroupResponses: React.FC<GroupResponsesProps> = ({
  groups,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);

  const selectedGroup = (selectedGroupId && groups.find((g) => g.id === selectedGroupId)) || groups[0];
  if (!selectedGroup) return null;

  const { responses, totalParticipants } = selectedGroup;
  const pendingCount = Math.max(0, totalParticipants - responses.length);

  return (
    <div className="bg-[#F9FBFF] px-8 pt-6 pb-8 rounded-b-lg flex flex-col gap-6">
      {groups.length > 1 && (
        <div className="flex flex-col gap-2">
          <span className="text-size-xs font-semibold text-bluedot-navy">Select your group:</span>
          <Select
            options={groups.map((g) => ({ value: g.id, label: g.name }))}
            value={selectedGroup.id}
            onChange={setSelectedGroupId}
            ariaLabel="Select your group"
          />
        </div>
      )}
      <p className="text-size-xs font-semibold text-bluedot-navy">
        <span>{responses.length} {responses.length === 1 ? 'Response' : 'Responses'}</span>
        {' · '}
        <span>{pendingCount} Pending</span>
      </p>

      <div className="flex flex-col divide-y divide-gray-200">
        {responses.map((r, i) => (
          <ResponseBlock
            // eslint-disable-next-line react/no-array-index-key -- no stable unique id, names can collide
            key={`${r.name}-${i}`}
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
  const canTruncate = response.length > 640 || response.split('\n').length > TRUNCATION_LINES;
  const [expanded, setExpanded] = useState(!canTruncate);

  return (
    <div className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2">
        <div className="size-6 rounded-full bg-bluedot-lighter flex items-center justify-center flex-shrink-0">
          <FaUser className="size-3 text-bluedot-normal" />
        </div>
        <span className="font-semibold text-size-xs text-bluedot-navy">{name}</span>
      </div>
      <div className="border-l-2 border-bluedot-lighter pl-4 ml-3">
        <div className="relative">
          <div
            className="leading-relaxed"
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
      {canTruncate && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-size-xs text-bluedot-normal font-medium mt-2 cursor-pointer hover:underline block ml-3 pl-4"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

export default GroupResponses;
