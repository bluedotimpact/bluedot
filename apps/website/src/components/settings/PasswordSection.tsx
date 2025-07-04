import { useState, useEffect, useRef } from 'react';
import {
  CTALinkOrButton, Modal, Input, ProgressDots,
} from '@bluedot/ui';
import axios from 'axios';
import type { ZodError } from 'zod';
import { P } from '../Text';
import { changePasswordWithConfirmSchema } from '../../lib/schemas/user/changePassword.schema';

type PasswordSectionProps = {
  authToken: string;
};

const PasswordSection = ({ authToken }: PasswordSectionProps) => {
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
        authToken={authToken}
        onSuccess={handlePasswordChangeSuccess}
      />
    </>
  );
};

type ChangePasswordModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  authToken: string;
  onSuccess: () => void;
};

const ChangePasswordModal = ({
  isOpen,
  setIsOpen,
  authToken,
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

    try {
      changePasswordWithConfirmSchema.parse({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setErrors(newErrors);
      return true;
    } catch (error) {
      if (error instanceof Error && 'errors' in error) {
        const zodError = error as ZodError;
        zodError.errors.forEach((err) => {
          const field = err.path[0] as string;
          if (field === 'currentPassword') {
            newErrors.current = err.message;
          } else if (field === 'newPassword') {
            newErrors.new = err.message;
          } else if (field === 'confirmPassword') {
            newErrors.confirm = err.message;
          }
        });
      }
      setErrors(newErrors);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({ current: '', new: '', confirm: '' });

    try {
      await axios.post(
        '/api/users/change-password',
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      // Close modal immediately and trigger success callback
      setIsOpen(false);
      onSuccess(); // This will show success message in account settings
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setErrors({ ...errors, current: 'Incorrect password' });
        } else if (err.response?.status === 400) {
          // Handle password policy violations
          const message = err.response?.data?.error
            || 'Password must be at least 8 characters';
          setErrors({ ...errors, new: message });
        } else {
          setErrors({
            ...errors,
            current: 'Failed to update password. Please try again.',
          });
        }
      } else {
        setErrors({ ...errors, current: 'An unexpected error occurred' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
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
              <>
                <ProgressDots />
                <span className="ml-2">Updating...</span>
              </>
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
