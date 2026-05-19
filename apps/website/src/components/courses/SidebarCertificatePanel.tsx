import {
  A, cn, Modal, P,
} from '@bluedot/ui';
import { type ReactNode, useState } from 'react';
import { FaArrowRight } from 'react-icons/fa6';
import { FiLock } from 'react-icons/fi';
import { COURSE_CONFIG, FOAI_COURSE_SLUG } from '../../lib/constants';
import { getActionPlanUrl } from '../../lib/utils';
import type { CertificateData } from '../../server/routers/certificates';

// Cohort-course gate. FoAI (self-paced) is handled separately at each callsite because the rule
// there is simpler: only `has-certificate` is accessible.
export const isCongratulationsAccessible = (data: CertificateData | undefined): boolean => {
  if (!data) return true;
  const { status } = data;
  return (
    status === 'not-authenticated'
    || status === 'not-enrolled'
    || status === 'not-eligible'
    || status === 'has-certificate'
    || (status === 'attendance-ineligible' && data.isLastDiscussionSoonOrPassed)
  );
};

// Hides the panel and redirects the page when the only CTA we could offer is "join a cohort"
// but no upcoming rounds exist for that course.
export const shouldShowCongratulations = (data: CertificateData | undefined): boolean => {
  if (!data) return true;
  if (!isCongratulationsAccessible(data)) return false;
  if (
    (data.status === 'not-authenticated' || data.status === 'not-enrolled' || data.status === 'not-eligible')
    && !data.hasUpcomingRounds
  ) {
    return false;
  }

  return true;
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

const LockedPanel = ({ label, subtitle, className }: {
  label: string; subtitle: ReactNode; className?: string;
}) => (
  <div className={cn('flex items-center gap-3 rounded-[10px] bg-black/[0.04] px-3 py-4', className)}>
    <div className="text-bluedot-navy/60 flex min-w-0 flex-1 flex-col gap-1">
      <p className="text-size-sm leading-[1.5] font-bold">{label}</p>
      <p className="text-size-xs leading-[1.5] font-normal">{subtitle}</p>
    </div>
    <FiLock className="text-bluedot-navy/40 size-5 shrink-0" />
  </div>
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

  if (status === 'is-facilitator' || !certificateData) return null;

  // FoAI is self-paced: only `has-certificate` gets a clickable CTA; every other state renders
  // as a locked panel and the page itself redirects.
  if (courseSlug === FOAI_COURSE_SLUG && status !== 'has-certificate') {
    return (
      <LockedPanel
        label={label}
        subtitle="Complete all exercises to unlock your certificate"
        className={className}
      />
    );
  }

  // Unenrolled/unauthenticated users with no upcoming rounds: render nothing rather than
  // surface a "join a cohort" CTA that leads nowhere. Discriminate on `certificateData.status`
  // directly so TypeScript narrows the object to the variants that carry `hasUpcomingRounds`;
  // the aliased `status` from `certificateData?.status` breaks that narrowing.
  if (
    (certificateData.status === 'not-authenticated'
      || certificateData.status === 'not-enrolled'
      || certificateData.status === 'not-eligible')
    && !certificateData.hasUpcomingRounds
  ) {
    return null;
  }

  if (isCongratulationsAccessible(certificateData)) {
    const defaultCtaOverride = (
      status === 'not-authenticated'
      || status === 'not-enrolled'
      || status === 'not-eligible'
    ) ? COURSE_CONFIG[courseSlug]?.certificateCtaOverride : undefined;
    let subtitle = 'Join a facilitated cohort today';
    if (status === 'has-certificate') {
      subtitle = 'View your certificate';
    } else if (status === 'attendance-ineligible') {
      subtitle = 'See what\'s next';
    }

    const hasCert = status === 'has-certificate';
    const isAttendanceIneligible = status === 'attendance-ineligible';
    let defaultTitle = label;
    if (hasCert) {
      defaultTitle = `Your ${label}`;
    } else if (isAttendanceIneligible) {
      defaultTitle = 'Course complete';
    }

    const title = defaultCtaOverride?.label ?? defaultTitle;

    return (
      <A
        href={defaultCtaOverride?.href ?? congratsUrl}
        target={defaultCtaOverride?.target}
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
            {title}
          </p>
          {!defaultCtaOverride && <p className="text-size-xs leading-[1.5] font-normal">{subtitle}</p>}
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
        <a
          href={getActionPlanUrl(certificateData.meetPersonId)}
          target="_blank"
          rel="noopener noreferrer"
          className="border-bluedot-normal bg-bluedot-normal/5 text-bluedot-normal flex items-center gap-3 rounded-[10px] border-[0.5px] border-solid px-3 py-4 no-underline transition-opacity hover:opacity-90"
        >
          <p className="text-size-sm min-w-0 flex-1 leading-[1.5] font-bold">Submit your project/action plan</p>
          <FaArrowRight className="size-5 shrink-0" />
        </a>
        <LockedPanel label={label} subtitle="Submit your project/action plan to claim" />
      </div>
    );
  }

  let subtitle: ReactNode;
  if (status === 'action-plan-pending' && certificateData.hasSubmittedActionPlan) {
    subtitle = 'Action plan submitted, pending review';
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
      <LockedPanel label={label} subtitle={subtitle} className={className} />
    </>
  );
};
