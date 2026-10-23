import { Modal, P } from '@bluedot/ui';
import { type ReactNode, useState } from 'react';
import { COURSE_CONFIG, FOAI_COURSE_SLUG } from '../../lib/constants';
import { getActionPlanUrl } from '../../lib/utils';
import type { CertificateData } from '../../server/routers/certificates';
import { SidebarActionCard, type SidebarActionTone } from './SidebarActionCard';

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
    // getStatus decides when a shortfall is final; there's no timing to re-check here.
    || status === 'attendance-ineligible'
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

export const SidebarCertificatePanel = ({
  courseTitle,
  courseSlug,
  certificateData,
}: {
  courseTitle: string;
  courseSlug: string;
  certificateData?: CertificateData;
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
      <SidebarActionCard
        tone="locked"
        title={label}
        subtitle="Complete all exercises to unlock your certificate"
      />
    );
  }

  if (shouldShowCongratulations(certificateData)) {
    const defaultCtaOverride = (
      status === 'not-authenticated'
      || status === 'not-enrolled'
      || status === 'not-eligible'
    ) ? COURSE_CONFIG[courseSlug]?.certificateCtaOverride : undefined;

    let cta: { tone: SidebarActionTone; title: string; subtitle: string } = {
      tone: 'solid', title: label, subtitle: 'Join a facilitated cohort today',
    };
    if (status === 'has-certificate') {
      cta = { tone: 'success', title: `Your ${label}`, subtitle: 'View your certificate' };
    } else if (status === 'attendance-ineligible') {
      cta = { tone: 'subtle', title: 'Course complete', subtitle: 'See what\'s next' };
    }

    return (
      <SidebarActionCard
        tone={cta.tone}
        title={defaultCtaOverride?.label ?? cta.title}
        subtitle={defaultCtaOverride ? undefined : cta.subtitle}
        href={defaultCtaOverride?.href ?? congratsUrl}
        target={defaultCtaOverride?.target}
      />
    );
  }

  // Reached here only when `shouldShowCongratulations` returned false. For the three "join a
  // cohort" statuses that implies `!hasUpcomingRounds`, and we render nothing rather than fall
  // through to the LockedPanel below.
  if (
    certificateData.status === 'not-authenticated'
    || certificateData.status === 'not-enrolled'
    || certificateData.status === 'not-eligible'
  ) {
    return null;
  }

  // action-plan-pending + not yet submitted + open: two-panel layout
  if (
    status === 'action-plan-pending'
    && !certificateData.hasSubmittedActionPlan
    && certificateData.hasAtMostOneDiscussionLeft
  ) {
    return (
      <div className="flex flex-col gap-3">
        <SidebarActionCard
          tone="subtle"
          title="Submit your project/action plan"
          href={getActionPlanUrl(certificateData.meetPersonId)}
          target="_blank"
        />
        <SidebarActionCard tone="locked" title={label} subtitle="Submit your project/action plan to claim" />
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
      <SidebarActionCard tone="locked" title={label} subtitle={subtitle} />
    </>
  );
};
