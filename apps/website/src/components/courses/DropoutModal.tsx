import {
  CTALinkOrButton, H1, Modal, P, ProgressDots, Select, Textarea,
} from '@bluedot/ui';
import { useMemo, useState } from 'react';
import type { CourseRound, CourseRoundsData } from '../../server/routers/course-rounds';
import { ONE_DAY_MS } from '../../lib/constants';
import { formatMonthAndDay } from '../../lib/utils';
import { trpc } from '../../utils/trpc';
import { CheckIcon, InfoIcon } from '../icons';

const TYPE_OPTIONS = [
  { value: 'Drop out', label: 'Drop out of the course' },
  { value: 'Deferral', label: 'Defer to a future round' },
] as const;

type DropoutType = (typeof TYPE_OPTIONS)[number]['value'];

const INTENSITY_OPTIONS = [
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Intensive', label: 'Intensive' },
] as const;

type Intensity = (typeof INTENSITY_OPTIONS)[number]['value'];

const MAX_ROUNDS_PER_INTENSITY = 3;

type DropoutModalProps = {
  applicantId: string;
  courseSlug: string;
  currentRoundId: string | null;
  handleClose: () => void;
};

const filterFutureRounds = (rounds: CourseRound[]): CourseRound[] => {
  const now = new Date();
  return rounds
    .filter((r) => r.firstDiscussionDateRaw && new Date(r.firstDiscussionDateRaw) > now)
    .slice(0, MAX_ROUNDS_PER_INTENSITY);
};

const intensityOfRound = (
  courseRounds: CourseRoundsData | undefined,
  roundId: string | null,
): Intensity | null => {
  if (!courseRounds || !roundId) return null;
  if (courseRounds.intense.some((r) => r.id === roundId)) return 'Intensive';
  if (courseRounds.partTime.some((r) => r.id === roundId)) return 'Part-time';
  return null;
};

const DropoutModal: React.FC<DropoutModalProps> = ({
  applicantId, courseSlug, currentRoundId, handleClose,
}) => {
  const [dropoutType, setDropoutType] = useState<DropoutType | undefined>();
  const [reason, setReason] = useState('');
  const [intensity, setIntensity] = useState<Intensity | undefined>();
  const [targetRoundId, setTargetRoundId] = useState<string | undefined>();

  const utils = trpc.useUtils();
  const dropoutMutation = trpc.dropout.dropoutOrDeferral.useMutation();

  const handleCloseWithInvalidation = () => {
    if (dropoutMutation.isSuccess) {
      utils.meetPerson.getInactiveCourseRegistrations.invalidate();
    }

    handleClose();
  };

  const { data: courseRounds } = trpc.courseRounds.getRoundsForCourse.useQuery({ courseSlug });

  const isDeferral = dropoutType === 'Deferral';

  const futureRoundsByIntensity = useMemo(() => ({
    'Part-time': courseRounds ? filterFutureRounds(courseRounds.partTime) : [],
    Intensive: courseRounds ? filterFutureRounds(courseRounds.intense) : [],
  }), [courseRounds]);

  const effectiveIntensity: Intensity = intensity
    ?? intensityOfRound(courseRounds, currentRoundId)
    ?? 'Part-time';
  const roundsForChosenIntensity = futureRoundsByIntensity[effectiveIntensity];

  // Default the round selection to the first future round of the chosen intensity
  const effectiveTargetRoundId = targetRoundId
    ?? roundsForChosenIntensity[0]?.id;

  const selectedRound = roundsForChosenIntensity.find((r) => r.id === effectiveTargetRoundId);

  const submitDisabled = !dropoutType
    || dropoutMutation.isPending
    || (isDeferral && !effectiveTargetRoundId);

  const handleSubmit = () => {
    if (!dropoutType) return;
    if (isDeferral && !effectiveTargetRoundId) return;

    dropoutMutation.mutate({
      applicantId,
      reason: reason.trim(),
      type: dropoutType,
      newRoundId: isDeferral ? effectiveTargetRoundId : undefined,
    });
  };

  const renderSuccess = () => {
    const startDateRaw = selectedRound?.firstDiscussionDateRaw;
    const startFormatted = startDateRaw ? formatMonthAndDay(startDateRaw) : null;
    const contactWeek = startDateRaw
      ? formatMonthAndDay(new Date(new Date(startDateRaw).getTime() - 7 * ONE_DAY_MS).toISOString())
      : null;

    let message: string;
    if (!isDeferral) {
      message = 'Your dropout request has been submitted. We\'re sorry to see you go. You should receive a confirmation email soon.';
    } else if (selectedRound && startFormatted && contactWeek) {
      message = `Your deferral request has been submitted. We'll move you to the ${selectedRound.intensity?.toLowerCase()} round starting ${startFormatted} and be in touch the week of ${contactWeek}.`;
    } else {
      message = 'Your deferral request has been submitted. You should receive a confirmation email soon.';
    }

    return (
      <div className="flex w-full flex-col items-center justify-center gap-8">
        <div className="bg-bluedot-normal/10 flex rounded-full p-4">
          <CheckIcon className="text-bluedot-normal" />
        </div>
        <div className="flex max-w-[512px] flex-col items-center gap-4">
          <P className="text-bluedot-navy/80 text-center">{message}</P>
        </div>
        <CTALinkOrButton className="bg-bluedot-normal w-full" onClick={handleCloseWithInvalidation}>
          Close
        </CTALinkOrButton>
      </div>
    );
  };

  const renderRoundPicker = () => {
    if (!courseRounds) {
      return <ProgressDots />;
    }

    const hasRounds = roundsForChosenIntensity.length > 0;

    const roundOptions = hasRounds
      ? roundsForChosenIntensity.map((r) => ({
        value: r.id,
        label: r.dateRange,
        disabled: dropoutMutation.isPending,
      }))
      : [];

    return (
      <div className="border-l-2 border-color-divider pl-4 ml-2 mt-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-size-sm font-medium text-bluedot-navy/80">Intensity</span>
          <Select
            ariaLabel="Intensity"
            value={effectiveIntensity}
            onChange={(value) => {
              setIntensity(value as Intensity);
              setTargetRoundId(undefined);
            }}
            options={INTENSITY_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
              disabled: dropoutMutation.isPending,
            }))}
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-size-sm font-medium text-bluedot-navy/80">Round</span>
          <Select
            ariaLabel="Round"
            value={hasRounds ? effectiveTargetRoundId : undefined}
            onChange={(value) => setTargetRoundId(value)}
            options={roundOptions}
            placeholder={hasRounds ? 'Choose a round' : 'No upcoming rounds available'}
            disabled={!hasRounds || dropoutMutation.isPending}
          />
          {!hasRounds && (
            <P className="text-bluedot-normal text-size-xs mt-1">
              No upcoming rounds for this intensity available. You can select a different intensity or drop out instead.
            </P>
          )}
        </div>
      </div>
    );
  };

  const renderForm = () => (
    <>
      <InformationBanner />

      <div className="flex flex-col gap-2">
        <H1 className="text-size-md font-medium text-black">1. What would you like to do?</H1>
        <Select
          ariaLabel="Action type"
          value={dropoutType}
          onChange={(value) => setDropoutType(value as DropoutType)}
          options={TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label, disabled: dropoutMutation.isPending }))}
          placeholder="Choose an option"
        />
        {isDeferral && renderRoundPicker()}
      </div>

      <div className="flex flex-col gap-2">
        <H1 className="text-size-md font-medium text-black">2. We'd love to hear why</H1>
        <p className="text-size-xs text-[#666C80]">
          Your feedback helps us improve the course. Thank you for participating.
        </p>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Share your reason for leaving..."
          rows={3}
          className="w-full"
          disabled={dropoutMutation.isPending}
        />
      </div>

      {dropoutMutation.isError && (
        <P className="text-red-600">{dropoutMutation.error?.message || 'An error occurred. Please try again.'}</P>
      )}

      <CTALinkOrButton
        className="bg-bluedot-normal w-full disabled:opacity-50"
        onClick={handleSubmit}
        disabled={submitDisabled}
      >
        {dropoutMutation.isPending ? (
          <div className="flex items-center gap-2">
            <ProgressDots className="my-0" dotClassName="bg-white" />
            Submitting...
          </div>
        ) : (
          <span>Submit</span>
        )}
      </CTALinkOrButton>
    </>
  );

  const renderTitle = () => (
    <div className="flex w-full items-center justify-center gap-2">
      <div className="text-size-md font-semibold">
        {dropoutMutation.isSuccess ? 'Request Submitted' : 'Leave Course'}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen
      setIsOpen={(open: boolean) => !open && handleCloseWithInvalidation()}
      title={renderTitle()}
      bottomDrawerOnMobile
      desktopHeaderClassName="border-b border-charcoal-light py-4"
    >
      <div className="w-full md:w-[600px]">
        <form className="flex flex-col gap-8" onSubmit={(e) => e.preventDefault()}>
          {dropoutMutation.isSuccess ? renderSuccess() : renderForm()}
        </form>
      </div>
    </Modal>
  );
};

const InformationBanner = () => {
  return (
    <div className="inline-flex items-center justify-between self-stretch rounded-md bg-[#E5EDFE] px-4 py-3">
      <div className="flex flex-1 items-start justify-start gap-3">
        <div className="flex items-center justify-start">
          <InfoIcon className="shrink-0" />
        </div>
        <P className="text-bluedot-normal flex-1 justify-start">
          If you're having trouble keeping up or need to adjust your schedule, consider deferring to a future round
          instead of dropping out completely.
        </P>
      </div>
    </div>
  );
};

export default DropoutModal;
