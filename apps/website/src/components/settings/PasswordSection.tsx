import {
  CTALinkOrButton,
  Input,
  Modal,
  ProgressDots,
} from '@bluedot/ui';
import { TRPCClientError } from '@trpc/client';
import { useEffect, useRef, useState } from 'react';
import { changePasswordWithConfirmSchema } from '../../lib/schemas/user/changePassword.schema';
import { trpc } from '../../utils/trpc';
import { P } from '../Text';

const PasswordSection = () => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);

  const handlePasswordChangeSuccess = () => {
    // Show success message in the UI
    setPasswordUpdateSuccess(true);

    // Clear success message after 5 seconds
    setTimeout(() => {
      setPasswordUpdateSuccess(false);
    }, 5000);
  };

  return (
    <>
      {/* Password Section */}
      <div className="mb-6">
        <P className="font-semibold mb-2">Password</P>
        <CTALinkOrButton
          variant="secondary"
          onClick={() => setShowChangePasswordModal(true)}
          aria-label="Change password"
        >
          Change Password
        </CTALinkOrButton>
        {passwordUpdateSuccess && (
          <p
            className="text-size-sm text-green-600 mt-2"
            role="status"
            aria-live="polite"
          >
            Password updated successfully!
          </p>
        )}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        setIsOpen={setShowChangePasswordModal}
        onSuccess={handlePasswordChangeSuccess}
      />
    </>
  );
};

type ChangePasswordModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess: () => void;
};

const ChangePasswordModal = ({
  isOpen,
  setIsOpen,
  onSuccess,
}: ChangePasswordModalProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const currentPasswordRef = useRef<HTMLInputElement>(null);

  const changePasswordMutation = trpc.users.changePassword.useMutation();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({ current: '', new: '', confirm: '' });
      // Focus current password input when modal opens
      setTimeout(() => {
        currentPasswordRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors = { current: '', new: '', confirm: '' };

    const result = changePasswordWithConfirmSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === 'currentPassword') {
          newErrors.current = issue.message;
        } else if (field === 'newPassword') {
          newErrors.new = issue.message;
        } else if (field === 'confirmPassword') {
          newErrors.confirm = issue.message;
        }
      });
    }

    setErrors(newErrors);
    return result.success;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({ current: '', new: '', confirm: '' });

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          // Close modal immediately and trigger success callback
          setIsOpen(false);
          onSuccess(); // This will show success message in account settings
        },
        onError: (err) => {
          if (err instanceof TRPCClientError) {
            if (err.data?.code === 'UNAUTHORIZED') {
              setErrors({ ...errors, current: 'Incorrect password' });
            } else if (err.data?.code === 'BAD_REQUEST') {
              // Handle password policy violations
              const message = err.message || 'Password must be at least 8 characters';
              setErrors({ ...errors, new: message });
            } else {
              // Other errors
              setErrors({
                ...errors,
                current: `Failed to update password: ${err.message || 'Please try again.'}`,
              });
            }
          } else {
            setErrors({ ...errors, current: 'Network error occurred. Please check your connection and try again.' });
          }
        },
        onSettled: () => {
          setIsLoading(false);
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Change Password">
      <div className="space-y-4">
        <div>
          <Input
            ref={currentPasswordRef}
            type="password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (errors.current) setErrors({ ...errors, current: '' });
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter current password"
            label="Current Password*"
            aria-label="Current password"
            aria-describedby={
              errors.current ? 'current-password-error' : undefined
            }
            aria-invalid={!!errors.current}
            disabled={isLoading}
          />
          {errors.current && (
            <p
              className="text-red-600 text-size-sm mt-1"
              id="current-password-error"
              role="alert"
              aria-live="polite"
            >
              {errors.current}
            </p>
          )}
        </div>

        <div>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (errors.new) setErrors({ ...errors, new: '' });
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter new password"
            label="New Password*"
            aria-label="New password"
            aria-describedby={
              errors.new ? 'new-password-error' : 'new-password-hint'
            }
            aria-invalid={!!errors.new}
            disabled={isLoading}
          />
          {!errors.new && (
            <p
              className="text-gray-600 text-size-sm mt-1"
              id="new-password-hint"
            >
              Password must be at least 8 characters
            </p>
          )}
          {errors.new && (
            <p
              className="text-red-600 text-size-sm mt-1"
              id="new-password-error"
              role="alert"
              aria-live="polite"
            >
              {errors.new}
            </p>
          )}
        </div>

        <div>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirm) setErrors({ ...errors, confirm: '' });
            }}
            onKeyDown={handleKeyDown}
            placeholder="Confirm new password"
            label="Confirm New Password*"
            aria-label="Confirm new password"
            aria-describedby={
              errors.confirm ? 'confirm-password-error' : undefined
            }
            aria-invalid={!!errors.confirm}
            disabled={isLoading}
          />
          {errors.confirm && (
            <p
              className="text-red-600 text-size-sm mt-1"
              id="confirm-password-error"
              role="alert"
              aria-live="polite"
            >
              {errors.confirm}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <CTALinkOrButton
            variant="secondary"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
            aria-label="Cancel password change"
          >
            Cancel
          </CTALinkOrButton>
          <CTALinkOrButton
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading}
            aria-label="Update password"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <ProgressDots className="my-0" dotClassName="bg-white" />
                <span>Updating...</span>
              </span>
            ) : (
              'Update Password'
            )}
          </CTALinkOrButton>
        </div>
      </div>
    </Modal>
  );
};

export default PasswordSection;
