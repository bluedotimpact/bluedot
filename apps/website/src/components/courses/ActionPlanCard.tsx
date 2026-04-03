import {
  Card, CTALinkOrButton, ProgressDots, useAuthStore,
} from '@bluedot/ui';
import type React from 'react';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import { trpc } from '../../utils/trpc';
import { getActionPlanUrl } from '../../lib/utils';

type ActionPlanCardProps = {
  courseId: string;
};

const ActionPlanCard: React.FC<ActionPlanCardProps> = ({ courseId }) => {
  const auth = useAuthStore((s) => s.auth);

  if (!auth) {
    return null;
  }

  return <ActionPlanCardAuthed courseId={courseId} />;
};

const ActionPlanCardAuthed: React.FC<ActionPlanCardProps> = ({ courseId }) => {
  const {
    data: certificateData,
    isLoading,
    error,
  } = trpc.certificates.getStatus.useQuery({ courseId });

  if (isLoading) {
    return (
      <Card
        title="Your Certificate"
        className="container-lined p-8 bg-white"
      >
        <ProgressDots />
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        title="Your Certificate"
        className="container-lined p-8 bg-white"
      >
        <ErrorView error={error} />
      </Card>
    );
  }

  if (certificateData?.status !== 'action-plan-pending') {
    return null;
  }

  const actionPlanUrl = getActionPlanUrl(certificateData.meetPersonId);
  const { hasSubmittedActionPlan } = certificateData;

  return (
    <Card
      title="Your Certificate"
      subtitle="To be eligible for a certificate, you need to submit your action plan/project and miss no more than 1 discussion."
      className="container-lined p-8 bg-white"
    >
      <CTALinkOrButton
        url={actionPlanUrl}
        variant={hasSubmittedActionPlan ? 'secondary' : 'primary'}
        target="_blank"
        disabled={hasSubmittedActionPlan ?? false}
      >
        {hasSubmittedActionPlan ? 'Submitted!' : 'Submit here'}
      </CTALinkOrButton>
    </Card>
  );
};

export default ActionPlanCard;
