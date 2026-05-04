import {
  A, cn, Modal, P,
} from '@bluedot/ui';
import { useState } from 'react';
import { FaArrowRight, FaLock } from 'react-icons/fa6';
import { COURSE_CONFIG } from '../../lib/constants';
import type { CertificateData } from '../../server/routers/certificates';

export const isCongratulationsAccessible = (data: CertificateData | undefined): boolean => {
  if (!data) return true;
  const { status } = data;
  if (
    status === 'not-eligible'
    || status === 'not-enrolled'
    || status === 'has-certificate'
    || status === 'can-request'
    || status === 'attendance-ineligible'
  ) {
    return true;
  }

  if (status === 'action-plan-pending') return !data.hasSubmittedActionPlan;
  return false; // facilitator-pending, submitted action-plan-pending
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
  const accentColor = COURSE_CONFIG[courseSlug]?.accentColor ?? '#6064d4';
  const congratsUrl = `/courses/${courseSlug}/congratulations`;
  const label = `${courseTitle} Certificate`;
  const status = certificateData?.status;
  const isAccessible = isCongratulationsAccessible(certificateData);

  if (isAccessible) {
    let subtitle = 'Join a facilitated cohort today';
    if (status === 'has-certificate') {
      subtitle = 'View your certificate';
    } else if (status === 'action-plan-pending') {
      subtitle = 'Submit your project/action plan to claim';
    } else if (status === 'can-request') {
      subtitle = 'Request your certificate once you complete all exercises';
    } else if (status === 'attendance-ineligible') {
      subtitle = "See what's next";
    }

    return (
      <A
        href={congratsUrl}
        className={cn(
          'flex items-center gap-3 rounded-[10px] px-3 py-4 text-white no-underline transition-opacity hover:opacity-90',
          className,
        )}
        style={{ backgroundColor: accentColor }}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-size-sm leading-[1.5] font-bold">
            {status === 'has-certificate' ? `Your ${label}` : label}
          </p>
          <p className="text-size-xs leading-[1.5] font-normal">{subtitle}</p>
        </div>
        <FaArrowRight className="size-5 shrink-0" />
      </A>
    );
  }

  let subtitle: JSX.Element | string = 'Action plan submitted — pending review';
  if (status === 'facilitator-pending') {
    subtitle = 'Pending cohort completion';
  } else {
    subtitle = (
      <span>
        {'Finish the course and '}
        <button type="button" className="cursor-pointer underline" onClick={() => setIsRequirementsModalOpen(true)}>
          meet requirements
        </button>
        {' to unlock'}
      </span>
    );
  }

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
