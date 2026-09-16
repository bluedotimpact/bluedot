import { CTALinkOrButton } from '@bluedot/ui';
import type React from 'react';
import { useRouter } from 'next/router';
import { getActionPlanUrl } from '../../../lib/utils';
import { trpc } from '../../../utils/trpc';
import { CircledCheckmarkIcon } from '../../icons';
import { shouldShowCongratulations } from '../SidebarCertificatePanel';

export type ProjectSubmissionProps = {
  courseId: string | null;
};

// Matches how a completed free-text exercise reports itself, minus the undo affordance.
const SubmittedIndicator = () => (
  <div className="flex items-center gap-2 h-[30px]">
    <CircledCheckmarkIcon />
    <span className="font-medium text-size-xs leading-normal text-bluedot-normal">Project/action plan submitted</span>
  </div>
);

export const ProjectSubmission: React.FC<ProjectSubmissionProps> = ({ courseId }) => {
  const router = useRouter();
  const courseSlug = typeof router.query.courseSlug === 'string' ? router.query.courseSlug : undefined;

  // UnitLayout already runs this query for the same course, so on a unit page this is a cache hit.
  const { data: certificateData } = trpc.certificates.getStatus.useQuery(
    { courseId: courseId ?? '' },
    { enabled: !!courseId },
  );

  if (!certificateData) {
    return null;
  }

  // A Meet person id is what the submission form needs, so its presence — rather than the
  // certificate status around it — decides what someone can do here.
  const meetPersonId = 'meetPersonId' in certificateData ? certificateData.meetPersonId : null;
  const hasSubmitted = 'hasSubmittedActionPlan' in certificateData && certificateData.hasSubmittedActionPlan;

  if (meetPersonId) {
    return hasSubmitted ? <SubmittedIndicator /> : (
      <div className="flex">
        <CTALinkOrButton
          url={getActionPlanUrl(meetPersonId)}
          target="_blank"
          withChevron
          className="!w-auto !whitespace-normal text-center min-w-0"
        >
          Submit your project/action plan
        </CTALinkOrButton>
      </div>
    );
  }

  // The congratulations page redirects to unit 1 for anyone it won't pitch a cohort to — a
  // facilitator, or a learner with no upcoming rounds — so only link there when it will render.
  if (!shouldShowCongratulations(certificateData) || !courseSlug) {
    return null;
  }

  return (
    <div className="flex">
      <CTALinkOrButton
        url={`/courses/${courseSlug}/congratulations`}
        withChevron
        className="!w-auto !whitespace-normal text-center min-w-0"
      >
        Join a facilitated cohort today
      </CTALinkOrButton>
    </div>
  );
};
