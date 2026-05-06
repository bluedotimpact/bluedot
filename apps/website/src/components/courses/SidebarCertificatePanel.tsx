import {
  A, cn, Modal, P,
} from '@bluedot/ui';
import { type ReactNode, useState } from 'react';
import { FaArrowRight, FaLock } from 'react-icons/fa6';
import { getActionPlanUrl } from '../../lib/utils';
import type { CertificateData } from '../../server/routers/certificates';

export const isCongratulationsAccessible = (data: CertificateData | undefined): boolean => {
  if (!data) return true;
  const { status } = data;
  if (
    status === 'not-authenticated'
    || status === 'not-enrolled'
    || status === 'not-eligible'
    || status === 'has-certificate'
    || status === 'can-request'
    || (status === 'attendance-ineligible' && data.isLastDiscussionSoonOrPassed)
  ) {
    return true;
  }

  return false; // action-plan-pending (both states), is-facilitator
};

const CertificateRequirementsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal isOpen={isOpen} setIsOpen={(open) => !open && onClose()} title="Certificate requirement">
    <P>You must meet both requirements to receive a certificate at the end of the course:</P>
    <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
      <li>
        <P>
          <strong>Attendance:</strong> Miss no more than 1 discussion.
        </P>
      </li>
      <li>
        <P>
          <strong>Project/Action Plan:</strong> You are required to submit a project/action plan at the end of the
          course.
        </P>
      </li>
    </ul>
  </Modal>
);

export const SidebarCertificatePanel = ({
  courseTitle,
  courseSlug,
  certificateData,
  className,
}: {
  courseTitle: string;
  courseSlug: string;
  certificateData?: CertificateData;
  className?: string;
}) => {
  const [isRequirementsModalOpen, setIsRequirementsModalOpen] = useState(false);
  const congratsUrl = `/courses/${courseSlug}/congratulations`;
  const label = `${courseTitle} Certificate`;
  const status = certificateData?.status;
  const isAccessible = isCongratulationsAccessible(certificateData);

  if (status === 'is-facilitator' || !certificateData) return null;

  if (isAccessible) {
    let subtitle = 'Join a facilitated cohort today';
    if (status === 'has-certificate') {
      subtitle = 'View your certificate';
    } else if (status === 'can-request') {
      subtitle = 'Request your certificate once you complete all exercises';
    } else if (status === 'attendance-ineligible') {
      subtitle = 'See what\'s next';
    }

    const hasCert = status === 'has-certificate';
    const isAttendanceIneligible = status === 'attendance-ineligible';

    return (
      <A
        href={congratsUrl}
        className={cn(
          'flex items-center gap-3 rounded-[10px] border-[0.5px] border-solid px-3 py-4 no-underline transition-opacity hover:opacity-90',
          hasCert && 'border-[#1a7a52] bg-[#f2fff8] text-[#1a7a52]',
          isAttendanceIneligible && 'border-bluedot-normal bg-bluedot-normal/5 text-bluedot-normal',
          !hasCert && !isAttendanceIneligible && 'border-bluedot-normal bg-bluedot-normal text-white',
          className,
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-size-sm leading-[1.5] font-bold">
            {hasCert && `Your ${label}`}
            {isAttendanceIneligible && 'Course complete'}
            {!hasCert && !isAttendanceIneligible && label}
          </p>
          <p className="text-size-xs leading-[1.5] font-normal">{subtitle}</p>
        </div>
        <FaArrowRight className="size-5 shrink-0" />
      </A>
    );
  }

  // action-plan-pending + not yet submitted + open: two-panel layout
  if (
    status === 'action-plan-pending'
    && !certificateData.hasSubmittedActionPlan
    && certificateData.isLastDiscussionSoonOrPassed
  ) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <CertificateRequirementsModal
          isOpen={isRequirementsModalOpen}
          onClose={() => setIsRequirementsModalOpen(false)}
        />
        <a
          href={getActionPlanUrl(certificateData.meetPersonId)}
          target="_blank"
          rel="noopener noreferrer"
          className="border-bluedot-normal bg-bluedot-normal/5 text-bluedot-normal flex items-center gap-3 rounded-[10px] border-[0.5px] border-solid px-3 py-4 no-underline transition-opacity hover:opacity-90"
        >
          <p className="text-size-sm min-w-0 flex-1 leading-[1.5] font-bold">Submit your project/action plan</p>
          <FaArrowRight className="size-5 shrink-0" />
        </a>
        <div className="flex items-center gap-3 rounded-[10px] bg-black/[0.04] px-3 py-4">
          <div className="text-bluedot-navy/60 flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-size-sm leading-[1.5] font-bold">{label}</p>
            <p className="text-size-xs leading-[1.5] font-normal">Submit your project/action plan to claim</p>
          </div>
          <FaLock className="text-bluedot-navy/40 size-5 shrink-0" />
        </div>
      </div>
    );
  }

  const subtitle: ReactNode
    = status === 'action-plan-pending' && certificateData.hasSubmittedActionPlan ? (
      'Action plan submitted — pending review'
    ) : (
      <span>
        {'Finish the course and '}
        <button type="button" className="cursor-pointer underline" onClick={() => setIsRequirementsModalOpen(true)}>
          meet requirements
        </button>
        {' to unlock'}
      </span>
    );

  return (
    <>
      <CertificateRequirementsModal
        isOpen={isRequirementsModalOpen}
        onClose={() => setIsRequirementsModalOpen(false)}
      />
      <div className={cn('flex items-center gap-3 rounded-[10px] bg-black/[0.04] px-3 py-4', className)}>
        <div className="text-bluedot-navy/60 flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-size-sm leading-[1.5] font-bold">{label}</p>
          <p className="text-size-xs leading-[1.5] font-normal">{subtitle}</p>
        </div>
        <FaLock className="text-bluedot-navy/40 size-5 shrink-0" />
      </div>
    </>
  );
};
