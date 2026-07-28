import {
  CTALinkOrButton,
  Input,
  Modal,
  P,
} from '@bluedot/ui';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().email('Please enter a valid email address');

type ChangeEmailModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentEmail: string;
};

const ChangeEmailModal = ({ isOpen, setIsOpen, currentEmail }: ChangeEmailModalProps) => {
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const newEmailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNewEmail('');
      setError('');
      setSentTo(null);
      setTimeout(() => {
        newEmailRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const result = emailSchema.safeParse(newEmail);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please enter a valid email address');
      return;
    }

    if (result.data === currentEmail.trim().toLowerCase()) {
      setError('This is already your email address');
      return;
    }

    setSentTo(result.data);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Change email" bottomDrawerOnMobile>
      <div className="w-full max-w-modal">
        <div className="h-0 w-[600px] max-w-full" />
        {sentTo ? (
          <div className="space-y-4">
            <P>
              We've sent a confirmation link to <span className="font-semibold">{sentTo}</span>.
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
                  if (error) {
                    setError('');
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter new email address"
                label="New email*"
                aria-label="New email address"
                aria-describedby={error ? 'new-email-error' : undefined}
                aria-invalid={!!error}
              />
              {error && (
                <p
                  className="text-red-600 text-size-sm mt-1"
                  id="new-email-error"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <CTALinkOrButton
                variant="secondary"
                onClick={() => setIsOpen(false)}
                aria-label="Cancel email change"
              >
                Cancel
              </CTALinkOrButton>
              <CTALinkOrButton
                variant="primary"
                onClick={handleSubmit}
                aria-label="Send confirmation link"
              >
                Send confirmation link
              </CTALinkOrButton>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ChangeEmailModal;
