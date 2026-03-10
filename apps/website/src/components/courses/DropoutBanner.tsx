import { CTALinkOrButton } from '@bluedot/ui';
import { useState } from 'react';
import DropoutModal from './DropoutModal';

type DropoutBannerProps = {
  applicantId: string;
};

const DropoutBanner: React.FC<DropoutBannerProps> = ({
  applicantId,
}) => {
  const [dropoutModalOpen, setDropoutModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 px-4 py-3 bg-[#FFF7ED]">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* <WarningIcon className="shrink-0 mt-0.5" /> */}
          <p className="text-[13px] leading-[1.5] text-[#9A3412]">
            Due to inactivity you were pulled out of upcoming discussions. If you wish to continue{' '}
            <strong>please rejoin a group</strong>
          </p>
        </div>
        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <CTALinkOrButton
            variant="primary"
            size="small"
            // onClick={() => setRejoinModalOpen(true)}
            className="bg-[#EA580C] hover:bg-[#C2410C] flex-1 sm:flex-initial"
          >
            Rejoin a group
          </CTALinkOrButton>
          <CTALinkOrButton
            variant="outline-black"
            size="small"
            onClick={() => setDropoutModalOpen(true)}
            className="border-[#EA580C] text-[#EA580C] hover:bg-[#FFF7ED] flex-1 sm:flex-initial"
          >
            Drop out of course
          </CTALinkOrButton>
        </div>
      </div>

      {/* TODO: rejoin modal */}

      {dropoutModalOpen && (
        <DropoutModal
          applicantId={applicantId}
          handleClose={() => setDropoutModalOpen(false)}
        />
      )}
    </>
  );
};

export default DropoutBanner;
