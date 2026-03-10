import { CTALinkOrButton } from '@bluedot/ui';
import { useState } from 'react';
import { MoonStarsIcon } from '../icons/MoonStarsIcon';
import DropoutModal from './DropoutModal';

type DropoutBannerProps = {
  applicantId: string;
};

const DropoutBanner: React.FC<DropoutBannerProps> = ({ applicantId }) => {
  const [dropoutModalOpen, setDropoutModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-start gap-3 bg-[#FFF7ED] border-b border-[#BB4D2214] px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <MoonStarsIcon className="shrink-0" stroke="#CC6B11" />
          <p className="text-[13px] leading-[1.5] font-medium text-[#CC6B11]">
            Due to inactivity you were pulled out of upcoming discussions. If you wish to continue{' '}
            <strong>please rejoin a group</strong>
          </p>
        </div>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          <CTALinkOrButton
            variant="primary"
            size="small"
            // onClick={() => setRejoinModalOpen(true)}
            className="flex-1 bg-[#CC6B11] sm:flex-initial"
          >
            Rejoin a group
          </CTALinkOrButton>
          <CTALinkOrButton
            variant="outline-black"
            size="small"
            onClick={() => setDropoutModalOpen(true)}
            className="flex-1 bg-[#CC6B1114] text-[#CC6B11] border-none hover:bg-[#FFF7ED] sm:flex-initial"
          >
            Drop out of course
          </CTALinkOrButton>
        </div>
      </div>

      {/* TODO: rejoin modal */}

      {dropoutModalOpen && <DropoutModal applicantId={applicantId} handleClose={() => setDropoutModalOpen(false)} />}
    </>
  );
};

export default DropoutBanner;
