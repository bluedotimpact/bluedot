import { Callout, cn, type CalloutAction } from '@bluedot/ui';
import { useState } from 'react';
import { trpc } from '../../utils/trpc';
import DropoutModal from './DropoutModal';
import RejoinGroupModal from './RejoinGroupModal';

type InactiveCourseBannersProps = {
  courseSlug?: string;
  // Applied to the wrapper, which only renders when there's a banner, so callers can align it with their content
  className?: string;
};

// eslint-disable-next-line react/function-component-definition
export default function InactiveCourseBanners({ courseSlug, className }: InactiveCourseBannersProps) {
  const { data: inactiveCourseRegistrations } = trpc.meetPerson.getInactiveCourseRegistrations.useQuery({ courseSlug });

  if (!inactiveCourseRegistrations?.length) return null;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {inactiveCourseRegistrations.map((courseRegistration) => (
        <InactiveCourseBanner
          key={courseRegistration.courseRegistrationId}
          applicantId={courseRegistration.courseRegistrationId}
          courseSlug={courseRegistration.courseSlug}
          roundId={courseRegistration.roundId}
        />
      ))}
    </div>
  );
}

type InactiveCourseBannerProps = {
  applicantId: string;
  courseSlug: string;
  roundId: string | null;
};

const InactiveCourseBanner = ({ applicantId, courseSlug, roundId }: InactiveCourseBannerProps) => {
  const [dropoutModalOpen, setDropoutModalOpen] = useState(false);
  const [rejoinModalOpen, setRejoinModalOpen] = useState(false);

  const actions: CalloutAction[] = [
    ...(roundId ? [{ label: 'Rejoin a group', onClick: () => setRejoinModalOpen(true) }] : []),
    { label: 'Drop out of course', emphasis: 'secondary', onClick: () => setDropoutModalOpen(true) },
  ];

  return (
    <>
      <Callout tone="warning" title="We've removed you from upcoming discussions due to inactivity" actions={actions}>
        Please rejoin a group.
      </Callout>

      {rejoinModalOpen && roundId && (
        <RejoinGroupModal roundId={roundId} handleClose={() => setRejoinModalOpen(false)} />
      )}

      {dropoutModalOpen && (
        <DropoutModal
          applicantId={applicantId}
          courseSlug={courseSlug}
          currentRoundId={roundId}
          handleClose={() => setDropoutModalOpen(false)}
        />
      )}
    </>
  );
};
