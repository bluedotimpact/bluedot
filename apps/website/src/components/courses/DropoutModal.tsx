import {
  CTALinkOrButton, H1, Modal, P, ProgressDots, Select, Textarea,
} from '@bluedot/ui';
import { useState } from 'react';
import { trpc } from '../../utils/trpc';
import { CheckIcon } from '../icons/CheckIcon';
import { InfoIcon } from '../icons/InfoIcon';

const TYPE_OPTIONS = [
  { value: 'dropout', label: 'Drop out of the course' },
  { value: 'deferral', label: 'Defer to a future cohort' },
] as const;

type DropoutType = (typeof TYPE_OPTIONS)[number]['value'];

type DropoutModalProps = {
  applicantId: string;
  handleClose: () => void;
};

const DropoutModal: React.FC<DropoutModalProps> = ({ applicantId, handleClose }) => {
  const [dropoutType, setDropoutType] = useState<DropoutType | undefined>();
  const [reason, setReason] = useState('');

  const dropoutMutation = trpc.dropout.dropoutOrDeferral.useMutation();

  const isDeferral = dropoutType === 'deferral';
  const submitDisabled = !dropoutType || dropoutMutation.isPending;

  const handleSubmit = () => {
    if (!dropoutType) {
      return;
    }

    dropoutMutation.mutate({
      applicantId,
      reason: reason.trim(),
      isDeferral,
    });
  };

  const renderContent = () => {
    if (dropoutMutation.isSuccess) {
      return (
        <div className="flex w-full flex-col items-center justify-center gap-8">
          <div className="bg-bluedot-normal/10 flex rounded-full p-4">
            <CheckIcon className="text-bluedot-normal" />
          </div>
          <div className="flex max-w-[512px] flex-col items-center gap-4">
            <P className="text-center text-bluedot-navy/80">
              {isDeferral
                ? 'Your deferral request has been submitted. We\'ll be in touch about joining a future cohort.'
                : 'Your dropout request has been submitted. We\'re sorry to see you go. You should receive a confirmation email soon.'}
            </P>
          </div>
          <CTALinkOrButton className="bg-bluedot-normal w-full" onClick={handleClose}>
            Close
          </CTALinkOrButton>
        </div>
      );
    }

    return (
      <>
        <InformationBanner />

        <div className="flex flex-col gap-2">
          <H1 className="text-size-md font-medium text-black">1. What would you like to do?</H1>
          <Select
            ariaLabel="Action type"
            value={dropoutType}
            onChange={(value) => setDropoutType(value as DropoutType)}
            options={TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
            placeholder="Choose an option"
          />
        </div>

        <div className="flex flex-col gap-2">
          <H1 className="text-size-md font-medium text-black">2. Please tell us why</H1>
          <P>
            Would you like to share why you're dropping out? It's really helpful for us to know what kind of problems
            our participants have that lead them to drop out (we understand and don't expect details if the reason is
            personal, though). We'd also like to know if and how the course didn't live up to your expectations.
          </P>
          <P>
            If you choose to defer we'll reconsider your application for the next round of the course. We'll drop you
            out from this course and contact you again closer to the start of the next round.
          </P>
          <P>Thanks again for participating.</P>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Share your reason for leaving..."
            rows={3}
            className="w-full"
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
  };

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
      setIsOpen={(open: boolean) => !open && handleClose()}
      title={renderTitle()}
      bottomDrawerOnMobile
      desktopHeaderClassName="border-b border-charcoal-light py-4"
    >
      <div className="w-full md:w-[600px]">
        <form className="flex flex-col gap-8" onSubmit={(e) => e.preventDefault()}>
          {renderContent()}
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
          <InfoIcon className="size-5 shrink-0" />
        </div>
        <P className="text-bluedot-normal flex-1 justify-start">
          If you're having trouble keeping up or need to adjust your schedule, consider deferring to a future cohort
          instead of dropping out completely.
        </P>
      </div>
    </div>
  );
};

export default DropoutModal;
