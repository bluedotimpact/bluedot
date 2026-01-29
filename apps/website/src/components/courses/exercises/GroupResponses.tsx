import React, { useState } from 'react';
import MarkdownExtendedRenderer from '../MarkdownExtendedRenderer';

const TRUNCATION_LIMIT = 640;

export type GroupResponsesProps = {
  title: string;
  description: string;
  responses: Array<{ name: string, response: string }>;
};

const GroupResponses: React.FC<GroupResponsesProps> = ({
  title,
  description,
  responses,
}) => {
  return (
    <div className="container-lined bg-white p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="bluedot-h4 not-prose">{title}</p>
        <MarkdownExtendedRenderer>{description}</MarkdownExtendedRenderer>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-[13px] font-semibold text-[#6B7280] tracking-wide uppercase">Replies from my group</p>
        {responses.map((r, index) => (
          <ResponseBlock
            key={r.name + index}
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
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = response.length > TRUNCATION_LIMIT;
  const displayedResponse = needsTruncation && !expanded
    ? `${response.slice(0, TRUNCATION_LIMIT)}...`
    : response;

  return (
    <div className="bg-[#F9FAFB] rounded-lg p-4 border-l-[3px] border-l-[#D1D5DB]">
      <p className="font-semibold text-[14px] text-[#111827] mb-2">{name}</p>
      <div className="text-[14px] text-[#374151] leading-[160%]">
        <MarkdownExtendedRenderer>{displayedResponse}</MarkdownExtendedRenderer>
      </div>
      {needsTruncation && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-[13px] text-bluedot-normal font-medium mt-2 bg-transparent border-none cursor-pointer p-0 hover:underline"
        >
          Show all
        </button>
      )}
    </div>
  );
};

export default GroupResponses;
