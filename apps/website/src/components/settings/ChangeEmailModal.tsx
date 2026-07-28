import {
  CTALinkOrButton,
  ErrorSection,
  Input,
  Modal,
  P,
  ProgressDots,
} from '@bluedot/ui';
import { TRPCClientError } from '@trpc/client';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { trpc } from '../../utils/trpc';

const emailSchema = z.string().trim().toLowerCase().email('Please enter a valid email address');

const EMAIL_TAKEN_MESSAGE = 'That email address is already linked to another BlueDot account.';

const isEmailTakenError = (error: unknown) => error instanceof TRPCClientError && error.data?.code === 'CONFLICT';

type ChangeEmailModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const ChangeEmailModal = ({ isOpen, setIsOpen }: ChangeEmailModalProps) => {
  const [newEmail, setNewEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const newEmailRef = useRef<HTMLInputElement>(null);

  const requestEmailChange = trpc.users.requestOwnEmailChange.useMutation();
  const { reset: resetMutation } = requestEmailChange;

  useEffect(() => {
    if (isOpen) {
      setNewEmail('');
      setValidationError('');
      resetMutation();
      setTimeout(() => {
        newEmailRef.current?.focus();
      }, 100);
    }
  }, [isOpen, resetMutation]);

  const handleSubmit = () => {
    if (requestEmailChange.isPending) {
      return;
    }

    const result = emailSchema.safeParse(newEmail);
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? 'Please enter a valid email address');
      return;
    }

    setValidationError('');
    requestEmailChange.mutate({ newEmail: result.data });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !requestEmailChange.isPending) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const emailTaken = isEmailTakenError(requestEmailChange.error);
  const inlineError = validationError || (emailTaken ? EMAIL_TAKEN_MESSAGE : '');

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Change email" bottomDrawerOnMobile>
      <div className="w-full max-w-modal">
        <div className="h-0 w-[600px] max-w-full" />
        {requestEmailChange.isSuccess ? (
          <div className="space-y-4">
            <P>
              We've sent a confirmation link to <span className="font-semibold">{requestEmailChange.data.sentTo}</span>.
            </P>
            <P className="text-charcoal-mid">
              Click the link in that email to finish updating your email address.
              Until then, you'll keep signing in with your current email. The link is valid for 48 hours.
            </P>
            <div className="flex justify-end pt-4">
              <CTALinkOrButton
                variant="primary"
                onClick={() => setIsOpen(false)}
              >
                Done
              </CTALinkOrButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {requestEmailChange.error && !emailTaken && <ErrorSection error={requestEmailChange.error} />}
            <P className="text-charcoal-mid">
              We'll send a confirmation link to your new email address.
              Your email won't change until you click it.
            </P>
            <div>
              <Input
                ref={newEmailRef}
                type="email"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  if (validationError) {
                    setValidationError('');
                  }

                  if (requestEmailChange.isError) {
                    resetMutation();
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter new email address"
                label="New email*"
                aria-label="New email address"
                aria-describedby={inlineError ? 'new-email-error' : undefined}
                aria-invalid={!!inlineError}
                disabled={requestEmailChange.isPending}
              />
              {inlineError && (
                <p
                  className="text-red-600 text-size-sm mt-1"
                  id="new-email-error"
                  role="alert"
                  aria-live="polite"
                >
                  {inlineError}
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <CTALinkOrButton
                variant="secondary"
                onClick={() => setIsOpen(false)}
                disabled={requestEmailChange.isPending}
                aria-label="Cancel email change"
              >
                Cancel
              </CTALinkOrButton>
              <CTALinkOrButton
                variant="primary"
                onClick={handleSubmit}
                disabled={requestEmailChange.isPending}
                aria-label="Send confirmation link"
              >
                {requestEmailChange.isPending ? (
                  <span className="flex items-center gap-2">
                    <ProgressDots className="my-0" dotClassName="bg-white" />
                    <span>Sending...</span>
                  </span>
                ) : (
                  'Send confirmation link'
                )}
              </CTALinkOrButton>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ChangeEmailModal;
