import React from 'react';
import { InferSelectModel, groupDiscussionTable, unitTable } from '@bluedot/db';
import { CTALinkOrButton, Modal, Select } from '@bluedot/ui';

type GroupDiscussion = InferSelectModel<typeof groupDiscussionTable.pg>;
type Unit = InferSelectModel<typeof unitTable.pg>;

type GroupDiscussionBannerProps = {
  unit: Unit;
  groupDiscussion: GroupDiscussion;
  onClickPrepare: () => void
};

const formatTimeStrings = (startDateTime: number) => {
  const startDate = new Date(startDateTime * 1000);
  const now = new Date();

  // Calculate relative time
  const timeDiffMs = startDate.getTime() - now.getTime();
  const timeDiffHours = Math.round(timeDiffMs / (1000 * 60 * 60));

  let startTimeDisplayRelative: string;
  // TODO support displaying minutes and days
  if (timeDiffHours > 0) {
    startTimeDisplayRelative = `in ${timeDiffHours} hour${timeDiffHours !== 1 ? 's' : ''}`;
  } else if (timeDiffHours === 0) {
    startTimeDisplayRelative = 'starting now';
  } else {
    startTimeDisplayRelative = `${Math.abs(timeDiffHours)} hour${Math.abs(timeDiffHours) !== 1 ? 's' : ''} ago`;
  }

  // Format date and time
  const startTimeDisplayDate = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const startTimeDisplayTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return { startTimeDisplayRelative, startTimeDisplayDate, startTimeDisplayTime };
};

const GroupDiscussionBanner: React.FC<GroupDiscussionBannerProps> = ({
  unit,
  groupDiscussion,
  onClickPrepare,
}) => {
  const unitTitle = `${unit.unitNumber}. ${unit.title}`;
  const { startTimeDisplayRelative, startTimeDisplayDate, startTimeDisplayTime } = formatTimeStrings(groupDiscussion.startDateTime);

  const discussionMeetLink = ''; // TODO use field fld5H5CNHA0B0EnYF on groupDiscussionTable

  const discussionDocLink = ''; // TODO use field fldR74MrOB3EvDnmw on groupDiscussionTable
  const slackChannelLink = ''; // TODO use field fldYFQwPDKdzIAy93 on groupDiscussionTable (and derive link from Slack channel ID)

  // TODO update dynamically
  const discussionStartsSoon = (groupDiscussion.startDateTime * 1000 - Date.now()) <= 3600_000;

  return (
    <div className="flex flex-col p-2 border-1 border-charcoal-light gap-2">
      <div className="flex justify-between items-center px-4 my-1 gap-4">
        <div>
          Your discussion on <span className="font-semibold">{unitTitle}</span> starts {startTimeDisplayRelative}
        </div>
        <div className="inline-block border border-charcoal-light rounded p-2 text-center text-size-sm">
          <div className="font-semibold whitespace-nowrap">{startTimeDisplayDate}</div>
          <div className="text-gray-600 whitespace-nowrap">{startTimeDisplayTime}</div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {discussionStartsSoon ? (
          <CTALinkOrButton
            target="_blank"
            url={discussionMeetLink}
            className="w-full"
          >
            Join discussion
          </CTALinkOrButton>
        ) : (
          <CTALinkOrButton onClick={onClickPrepare} className="w-full">
            Prepare for discussion
          </CTALinkOrButton>
        )}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(175px,1fr))] gap-2 w-full">
          {discussionStartsSoon && (
            <CTALinkOrButton
              variant="secondary"
              target="_blank"
              className="w-full"
              url={discussionDocLink}
            >
              Open discussion doc
            </CTALinkOrButton>
          )}
          <CTALinkOrButton
            variant="secondary"
            target="_blank"
            className="w-full"
            url={slackChannelLink}
          >
            Message your group
          </CTALinkOrButton>
          {/* <CTALinkOrButton
            variant="secondary"
            className="w-full"
            onClick={() => setGroupSwitchModalOpen(true)}
          >
            Can't make it?
          </CTALinkOrButton> */}
        </div>
      </div>
      <GroupSwitchModal
        isOpen={groupSwitchModalOpen}
        setIsOpen={setGroupSwitchModalOpen}
        groupDiscussion={{} as GroupDiscussion}
        unit={unit}
        unitNumber={unitNumber}
        units={units}
      />
    </div>
  );
};

type GroupSwitchModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  groupDiscussion: GroupDiscussion;
  unit: Unit;
  unitNumber: number;
  units: Unit[];
};

const GroupSwitchModal: React.FC<GroupSwitchModalProps> = ({
  isOpen,
  setIsOpen,
  groupDiscussion,
  unit,
  unitNumber,
  units,
}) => {
  const switchTypeOptions = [
    { value: 'Switch group for one unit', label: 'Switch group for one unit' },
    { value: 'Switch group permanently', label: 'Switch group permanently' },
  ];

  const unitOptions = units.map((u) => ({ value: u.id, label: `${u.unitNumber}. ${u.title}` }));

  // TODO Make API call to fetch groups (same round and unit as current group)

  return (
    // TODO max height 600px
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Group switching">
      <form className="flex flex-col gap-4 max-w-[600px] max-4-[600px]">
        <Select
          label="Action"
          options={switchTypeOptions}
        />
        <Select
          label="Unit"
          options={unitOptions}
        />
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <p className="text-size-sm font-medium">Why are you making this change?</p>
            <p className="text-size-xs text-[#666C80]">
              Briefly, we'd like to understand why you're making this change. We've found that
              participants who stick with their group usually have a better experience on the course.
            </p>
          </div>
          <textarea
            className="border-[0.5px] border-[rgba(19,19,46,0.25)]"
          />
        </div>
        <div className="flex flex-col gap-2">

        </div>
      </form>
    </Modal>
  );
};

export default GroupDiscussionBanner;
