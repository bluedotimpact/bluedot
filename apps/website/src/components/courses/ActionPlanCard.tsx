import {
  Card, CTALinkOrButton, ProgressDots, useAuthStore,
} from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import type React from 'react';
import { getActionPlanUrl } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

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
  const { data: certificateData, isLoading, error } = trpc.certificates.getStatus.useQuery({ courseId });

  if (isLoading) {
    return (
      <Card title="Your Certificate" className="container-lined bg-white p-8">
        <ProgressDots />
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Your Certificate" className="container-lined bg-white p-8">
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
      className="container-lined bg-white p-8"
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
