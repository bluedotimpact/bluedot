import { CTALinkOrButton } from '@bluedot/ui';
import { useState } from 'react';
import { trpc } from '../../utils/trpc';
import { MoonStarsIcon } from '../icons/MoonStarsIcon';
import DropoutModal from './DropoutModal';
import RejoinGroupModal from './RejoinGroupModal';

type InactiveCoursesBannerProps = {
  courseSlug?: string;
  roundId: string | null;
};

export const InactiveCoursesBanner = ({ courseSlug, roundId }: InactiveCoursesBannerProps) => {
  const { data: inactiveCourseRegistrations } = trpc.meetPerson.getInactiveCourseRegistrations.useQuery({ courseSlug });

  return (
    <>
      {(inactiveCourseRegistrations ?? []).map((courseRegistration) => (
        <InactiveCourseBanner key={courseRegistration.courseRegistrationId} applicantId={courseRegistration.courseRegistrationId} roundId={roundId} />
      ))}
    </>
  );
};

type InactiveCourseBannerProps = {
  applicantId: string;
  roundId: string | null;
};

const InactiveCourseBanner = ({ applicantId, roundId }: InactiveCourseBannerProps) => {
  const [dropoutModalOpen, setDropoutModalOpen] = useState(false);
  const [rejoinModalOpen, setRejoinModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-start gap-3 bg-[#FFF7ED] border-b border-[#BB4D2214] px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <MoonStarsIcon className="shrink-0" stroke="#CC6B11" />
          <p className="text-[13px] leading-[1.5] font-medium text-[#CC6B11]">
            We've removed you from upcoming discussions due to inactivity.
            <strong> Please rejoin a group.</strong>
          </p>
        </div>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          <CTALinkOrButton
            variant="primary"
            size="small"
            onClick={() => setRejoinModalOpen(true)}
            className="flex-1 bg-[#CC6B11] hover:bg-[color-mix(in_oklab,#CC6B11,black_3%)] hover:text-white sm:flex-initial"
          >
            Rejoin a group
          </CTALinkOrButton>
          <CTALinkOrButton
            variant="outline-black"
            size="small"
            onClick={() => setDropoutModalOpen(true)}
            className="flex-1 bg-[#CC6B1114] text-[#CC6B11] border-none hover:bg-[#CC6B1124] hover:text-[#CC6B11] sm:flex-initial"
          >
            Drop out of course
          </CTALinkOrButton>
        </div>
      </div>

      {rejoinModalOpen && roundId && <RejoinGroupModal roundId={roundId} handleClose={() => setRejoinModalOpen(false)} />}

      {dropoutModalOpen && <DropoutModal applicantId={applicantId} handleClose={() => setDropoutModalOpen(false)} />}
    </>
  );
};
