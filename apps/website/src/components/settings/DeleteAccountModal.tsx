import {
  A,
  cn,
  CTALinkOrButton,
  ErrorSection,
  Modal,
  P,
  ProgressDots,
} from '@bluedot/ui';
import { useEffect, useState } from 'react';
import { CheckIcon } from '../icons';
import { ONE_SECOND_MS } from '../../lib/constants';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';

const LOGOUT_COUNTDOWN_SECONDS = 10;

type DeleteAccountModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
} & ({ initiatedBy: 'admin'; userId: string } | { initiatedBy: 'user'; userId?: never });

const DeleteAccountModal = (props: DeleteAccountModalProps) => {
  const { isOpen, setIsOpen, initiatedBy } = props;
  const isUserInitiated = initiatedBy === 'user';
  const confirmationPhrase = isUserInitiated ? 'delete my account' : 'delete account';

  const [confirmationText, setConfirmationText] = useState('');
  const [secondsUntilLogout, setSecondsUntilLogout] = useState(LOGOUT_COUNTDOWN_SECONDS);

  // Fetched on mount, so that by the time the model is opened this will
  // almost certainly have returned.
  const eligibility = trpc.deletionRequests.selfDeletionEligibility.useQuery(undefined, {
    enabled: isUserInitiated,
    retry: false,
  });

  const adminRequestDeletion = trpc.deletionRequests.adminRequestAccountDeletion.useMutation();
  const userRequestDeletion = trpc.deletionRequests.userRequestAccountDeletion.useMutation();
  const requestDeletion = isUserInitiated ? userRequestDeletion : adminRequestDeletion;
  const { reset: resetMutation } = requestDeletion;

  const blockedAsFacilitator = eligibility.data?.hasEverFacilitated === true;
  const alreadyRequested = !blockedAsFacilitator && eligibility.data?.hasExistingRequest === true;
  const showsCountdown = isUserInitiated && requestDeletion.isSuccess;

  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      setSecondsUntilLogout(LOGOUT_COUNTDOWN_SECONDS);
      resetMutation();
    }
  }, [isOpen, resetMutation]);

  useEffect(() => {
    if (!showsCountdown) {
      return undefined;
    }

    if (secondsUntilLogout <= 0) {
      window.location.assign(ROUTES.logout.url);
      return undefined;
    }

    const timer = setTimeout(() => setSecondsUntilLogout((seconds) => seconds - 1), ONE_SECOND_MS);
    return () => clearTimeout(timer);
  }, [showsCountdown, secondsUntilLogout]);

  const confirmed = confirmationText.trim().toLowerCase() === confirmationPhrase;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!!requestDeletion.isPending || !confirmed || blockedAsFacilitator) {
      return;
    }

    if (props.initiatedBy === 'user') {
      userRequestDeletion.mutate();
    } else {
      adminRequestDeletion.mutate({ userId: props.userId });
    }
  };

  const renderRequestedView = () => (
    <div className="flex w-full flex-col items-center justify-center gap-8">
      <div className="bg-bluedot-normal/10 flex rounded-full p-4">
        <CheckIcon className="text-bluedot-normal" />
      </div>
      <div className="flex w-full flex-col gap-4">
        {isUserInitiated ? (
          <>
            <P>Your account will be deleted shortly. You will also receive an email confirming this request.</P>
            <P>You will be logged out in {secondsUntilLogout}s.</P>
          </>
        ) : (
          <P>
            {adminRequestDeletion.data?.isRetry
              ? 'Retrying existing deletion request, the account should be deleted shortly. The user will not be re-notified (they should have received a notification on the initial attempt).'
              : 'The account will be deleted shortly. The user will also receive an email confirming this request.'}
          </P>
        )}
      </div>
    </div>
  );

  const renderForm = () => {
    const deleteLabel = isUserInitiated ? 'Delete my account' : 'Delete account';
    const submitLabel = alreadyRequested ? 'Deletion requested' : deleteLabel;

    return (
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {requestDeletion.error && <ErrorSection error={requestDeletion.error} />}
        {blockedAsFacilitator ? (
          <P className="text-pretty">
            Unfortunately, you cannot delete your account through this form because you have been a facilitator,
            and this may affect other users. Please{' '}
            <A href="mailto:team@bluedot.org">contact us</A>{' '}
            if you would like your account deleted, and an admin will review your request.
          </P>
        ) : (
          <>
            {isUserInitiated ? (
              <P className="text-pretty">
                This closes your BlueDot Impact account. You&apos;ll lose access to your courses, your progress
                and any certificates you&apos;ve earned. This action cannot be undone.
              </P>
            ) : (
              <P className="text-pretty">
                This closes the user&apos;s BlueDot Impact account. They will lose access to their courses,
                progress, and any certificates they have earned. This action cannot be undone.
              </P>
            )}

            <div className="flex flex-col gap-4">
              <label htmlFor="delete-confirmation" className="text-size-xs font-semibold text-bluedot-navy">
                Type &quot;{confirmationPhrase}&quot; to confirm <span className="text-red-600">*</span>
              </label>
              <input
                id="delete-confirmation"
                value={confirmationText}
                onChange={(e) => {
                  setConfirmationText(e.target.value);
                  if (requestDeletion.isError) {
                    resetMutation();
                  }
                }}
                placeholder={confirmationPhrase}
                disabled={requestDeletion.isPending || alreadyRequested}
                className={cn(
                  'w-full border border-gray-300 rounded-md p-3 text-size-xs text-bluedot-navy placeholder:text-gray-400',
                  requestDeletion.isPending && 'cursor-not-allowed',
                )}
              />
            </div>
          </>
        )}

        <div className="flex gap-3 justify-end pt-4">
          <CTALinkOrButton
            variant="secondary"
            type="button"
            onClick={() => setIsOpen(false)}
            disabled={requestDeletion.isPending}
            aria-label="Cancel"
          >
            Cancel
          </CTALinkOrButton>
          <CTALinkOrButton
            variant="primary"
            type="submit"
            className="bg-red-600 hover:bg-red-700"
            disabled={requestDeletion.isPending || !confirmed || blockedAsFacilitator || alreadyRequested || eligibility.isLoading}
            aria-label={submitLabel}
          >
            {submitLabel}
          </CTALinkOrButton>
        </div>
      </form>
    );
  };

  const formTitle = isUserInitiated ? 'Delete your account' : 'Delete account';

  const renderBody = () => {
    if (requestDeletion.isSuccess) {
      return renderRequestedView();
    }

    if (isUserInitiated && eligibility.isLoading) {
      return <ProgressDots className="py-8" />;
    }

    return renderForm();
  };

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={(open) => {
        if (requestDeletion.isPending || showsCountdown) {
          return;
        }

        setIsOpen(open);
      }}
      isDismissable={!showsCountdown}
      title={requestDeletion.isSuccess ? 'Deletion requested' : formTitle}
      bottomDrawerOnMobile
    >
      <div className="w-full max-w-modal">
        <div className="h-0 w-[600px] max-w-full" />
        {renderBody()}
      </div>
    </Modal>
  );
};

export default DeleteAccountModal;
