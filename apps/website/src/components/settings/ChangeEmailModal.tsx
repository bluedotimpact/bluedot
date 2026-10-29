import {
  Button,
  ErrorSection,
  Field,
  Input,
  Modal,
  P,
} from '@bluedot/ui';
import { suggestEmailFix } from '@bluedot/utils';
import { TRPCClientError } from '@trpc/client';
import { useEffect, useState } from 'react';
import { newEmailSchema } from '../../lib/schemas/user/changeEmail.schema';
import { trpc } from '../../utils/trpc';

const EMAIL_TAKEN_MESSAGE = 'That email address is already linked to another BlueDot account.';

const isEmailTakenError = (error: unknown) => error instanceof TRPCClientError && error.data?.code === 'CONFLICT';

type ChangeEmailModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const ChangeEmailModal = ({ isOpen, setIsOpen }: ChangeEmailModalProps) => {
  const [newEmail, setNewEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [suggestedEmail, setSuggestedEmail] = useState<string | null>(null);

  const requestEmailChange = trpc.users.requestOwnEmailChange.useMutation();
  const { reset: resetMutation } = requestEmailChange;

  useEffect(() => {
    if (isOpen) {
      setNewEmail('');
      setValidationError('');
      setSuggestedEmail(null);
      resetMutation();
    }
  }, [isOpen, resetMutation]);

  const updateEmail = (value: string) => {
    setNewEmail(value);
    setSuggestedEmail(null);
    if (validationError) {
      setValidationError('');
    }

    if (requestEmailChange.isError) {
      resetMutation();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (requestEmailChange.isPending) {
      return;
    }

    const result = newEmailSchema.safeParse(newEmail);
    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? 'Please enter a valid email address');
      return;
    }

    setValidationError('');
    requestEmailChange.mutate({ newEmail: result.data });
  };

  const emailTaken = isEmailTakenError(requestEmailChange.error);
  const inlineError = validationError || (emailTaken ? EMAIL_TAKEN_MESSAGE : '');

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Change email" bottomDrawerOnMobile>
      <>
        {requestEmailChange.isSuccess ? (
          <div className="space-y-4">
            <P>
              We've sent a confirmation link to <span className="font-semibold">{requestEmailChange.data.sentTo}</span>.
            </P>
            <P className="text-secondary">
              Click the link in that email to finish updating your email address.
              Until then, you'll keep signing in with your current email. The link is valid for 48 hours.
            </P>
            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                onClick={() => setIsOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {requestEmailChange.error && !emailTaken && <ErrorSection error={requestEmailChange.error} />}
            <P className="text-secondary">
              We'll send a confirmation link to your new email address.
              Your email won't change until you click it.
            </P>
            <Field label="New email" required error={inlineError}>
              <div>
                <Input
                  autoFocus
                  type="email"
                  value={newEmail}
                  onChange={(e) => updateEmail(e.target.value)}
                  onBlur={() => setSuggestedEmail(suggestEmailFix(newEmail))}
                  placeholder="Enter new email address"
                  disabled={requestEmailChange.isPending}
                />
                <p aria-live="polite" className="text-size-xs leading-normal text-secondary">
                  {suggestedEmail && (
                    <>
                      Did you mean{' '}
                      <Button variant="link" size="small" className="inline-flex" disabled={requestEmailChange.isPending} onClick={() => updateEmail(suggestedEmail)}>
                        {/* One child, so Button's flex gap doesn't split the address */}
                        <span>
                          {suggestedEmail.slice(0, suggestedEmail.lastIndexOf('@') + 1)}
                          <strong>{suggestedEmail.slice(suggestedEmail.lastIndexOf('@') + 1)}</strong>
                        </span>
                      </Button>?
                    </>
                  )}
                </p>
              </div>
            </Field>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsOpen(false)}
                disabled={requestEmailChange.isPending}
                aria-label="Cancel email change"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={requestEmailChange.isPending}
                aria-label="Send confirmation link"
              >
                {requestEmailChange.isPending ? 'Sending...' : 'Send confirmation link'}
              </Button>
            </div>
          </form>
        )}
      </>
    </Modal>
  );
};

export default ChangeEmailModal;
