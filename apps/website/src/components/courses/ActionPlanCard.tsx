import {
  Card, CTALinkOrButton, ProgressDots, useAuthStore,
} from '@bluedot/ui';
import React from 'react';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import { trpc } from '../../utils/trpc';
import { FOAI_COURSE_ID } from '../../lib/constants';
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
    data: courseRegistration,
    isLoading: courseRegistrationLoading,
    error: courseRegistrationError,
  } = trpc.courseRegistrations.getByCourseId.useQuery({ courseId });

  const {
    data: meetPerson,
    isLoading: meetPersonLoading,
    error: meetPersonError,
  } = trpc.meetPerson.getByCourseRegistrationId.useQuery(
    { courseRegistrationId: courseRegistration?.id || '' },
    { enabled: !!courseRegistration?.id },
  );

  const hasSubmittedActionPlan = meetPerson?.projectSubmission && meetPerson.projectSubmission.length > 0;

  // Handle loading state
  if (courseRegistrationLoading || meetPersonLoading) {
    return (
      <Card
        title="Your Certificate"
        className="container-lined p-8 bg-white"
      >
        <ProgressDots />
      </Card>
    );
  }

  // Handle error state
  if (courseRegistrationError || meetPersonError) {
    return (
      <Card
        title="Your Certificate"
        className="container-lined p-8 bg-white"
      >
        <ErrorView error={courseRegistrationError || meetPersonError} />
      </Card>
    );
  }

  // If no meetPerson record exists, cannot submit action plan
  if (!meetPerson) {
    return null;
  }

  if (meetPerson.role?.toLowerCase() !== 'participant') {
    return null;
  }

  // Check if conditions are met to show the card
  // 1. User is in a facilitated course (courseId !== FOAI_COURSE_ID)
  if (courseRegistration?.courseId === FOAI_COURSE_ID) {
    return null;
  }

  // 2. User doesn't have a certificate
  if (courseRegistration?.certificateId) {
    return null;
  }

  // All conditions met - show the action plan card
  const actionPlanUrl = getActionPlanUrl(meetPerson.id);

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
