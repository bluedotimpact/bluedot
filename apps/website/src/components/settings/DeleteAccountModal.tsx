import {
  CTALinkOrButton,
  ErrorSection,
  Modal,
  P,
} from '@bluedot/ui';
import { useEffect, useState } from 'react';
import { CheckIcon } from '../icons';
import { trpc } from '../../utils/trpc';

const CONFIRMATION_PHRASE = 'delete account';

type DeleteAccountModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  initiatedBy: 'user' | 'admin';
  userId: string;
};

const DeleteAccountModal = ({
  isOpen, setIsOpen, initiatedBy, userId,
}: DeleteAccountModalProps) => {
  const [confirmationText, setConfirmationText] = useState('');

  const requestDeletion = trpc.deletionRequests.triggerAccountDeletion.useMutation();
  const { reset: resetMutation } = requestDeletion;

  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      resetMutation();
    }
  }, [isOpen, resetMutation]);

  if (initiatedBy === 'user') {
    throw new Error('Not implemented');
  }

  const confirmed = confirmationText.trim().toLowerCase() === CONFIRMATION_PHRASE;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (requestDeletion.isPending || !confirmed) {
      return;
    }

    requestDeletion.mutate({ userId });
  };

  const renderRequestedView = () => (
    <div className="flex w-full flex-col items-center justify-center gap-8">
      <div className="bg-bluedot-normal/10 flex rounded-full p-4">
        <CheckIcon className="text-bluedot-normal" />
      </div>
      <div className="flex w-full flex-col gap-4">
        <P>The account will be deleted shortly. The user will also receive an email confirming this request.</P>
      </div>
    </div>
  );

  const renderForm = () => (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {requestDeletion.error && <ErrorSection error={requestDeletion.error} />}
      <P className="text-pretty">
        This closes the user's BlueDot Impact account. They will lose access to their courses,
        progress, and any certificates they have earned. This action cannot be undone.
      </P>

      <div className="flex flex-col gap-4">
        <label htmlFor="delete-confirmation" className="text-size-xs font-semibold text-bluedot-navy">
          Type &quot;{CONFIRMATION_PHRASE}&quot; to confirm <span className="text-red-600">*</span>
        </label>
        <input
          id="delete-confirmation"
          autoFocus
          value={confirmationText}
          onChange={(e) => {
            setConfirmationText(e.target.value);
            if (requestDeletion.isError) {
              resetMutation();
            }
          }}
          placeholder={CONFIRMATION_PHRASE}
          disabled={requestDeletion.isPending}
          className="w-full border border-gray-300 rounded-md p-3 text-size-xs text-bluedot-navy placeholder:text-gray-400"
        />
      </div>

      <div className="flex gap-3 justify-end pt-4">
        <CTALinkOrButton
          variant="secondary"
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
          disabled={requestDeletion.isPending || !confirmed}
          aria-label="Delete account"
        >
          Delete account
        </CTALinkOrButton>
      </div>
    </form>
  );

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={requestDeletion.isSuccess ? 'Deletion requested' : 'Delete account'}
      bottomDrawerOnMobile
    >
      <div className="w-full max-w-modal">
        <div className="h-0 w-[600px] max-w-full" />
        {requestDeletion.isSuccess ? renderRequestedView() : renderForm()}
      </div>
    </Modal>
  );
};

export default DeleteAccountModal;
