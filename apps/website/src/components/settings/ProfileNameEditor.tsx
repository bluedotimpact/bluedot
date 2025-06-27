import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Input,
  CTALinkOrButton,
} from '@bluedot/ui';
import { P } from '../Text';
import { meRequestBodySchema } from '../../lib/schemas/user/me.schema';
import { parseZodValidationError } from '../../lib/utils';

interface ProfileNameEditorProps {
  initialName: string;
  authToken: string;
}

function ProfileNameEditor({ initialName, authToken }: ProfileNameEditorProps) {
  const [tempName, setTempName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [currentSavedName, setCurrentSavedName] = useState(initialName);

  // Update when initial name changes
  useEffect(() => {
    setTempName(initialName);
    setCurrentSavedName(initialName);
  }, [initialName]);

  const handleSave = async () => {
    const trimmedName = tempName.trim();
    const validationResult = meRequestBodySchema.safeParse({ name: trimmedName });
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      setNameError(firstError?.message || 'Failed to update name. Please try again.');
      return;
    }

    setIsSaving(true);
    setNameError('');

    try {
      await axios.patch(
        '/api/users/me',
        { name: tempName },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      setCurrentSavedName(trimmedName);
      setTempName(trimmedName);
    } catch (err) {
      if (!axios.isAxiosError(err)) {
        setNameError('Failed to update name. Please try again.');
        return;
      }

      if (err.response?.status === 401) {
        setNameError('Session expired. Please refresh the page and try again.');
        return;
      }

      if (err.response?.status === 400) {
        setNameError(parseZodValidationError(err, 'Invalid name format'));
        return;
      }

      setNameError('Failed to update name. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempName(currentSavedName);
    setNameError('');
  };

  const handleFocus = () => {
    setNameError('');
  };

  const showButtons = tempName.trim() !== currentSavedName.trim();

  return (
    <div className="mb-6">
      <div className="flex flex-col gap-2">
        <div id="profile-name-label">
          <P className="font-semibold">Profile Name*</P>
        </div>
        <div className="flex gap-2 items-center">
          <Input
            inputClassName="flex-1"
            labelClassName="flex-1 min-w-0"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            placeholder="Enter your name"
            aria-label="Profile name"
            aria-describedby={nameError ? 'profile-name-error' : 'profile-name-label'}
            aria-invalid={!!nameError}
          />
          {showButtons && (
            <div className="flex gap-2 flex-shrink-0">
              <CTALinkOrButton
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
                className="whitespace-nowrap"
                aria-label="Save profile name changes"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </CTALinkOrButton>
              <CTALinkOrButton
                variant="secondary"
                onClick={handleCancel}
                disabled={isSaving}
                aria-label="Cancel profile name changes"
              >
                Cancel
              </CTALinkOrButton>
            </div>
          )}
        </div>
        {nameError && (
          <p 
            className="text-red-600 text-size-sm mt-1" 
            id="profile-name-error"
            role="alert"
            aria-live="polite"
          >
            {nameError}
          </p>
        )}
      </div>
    </div>
  );
}

export default ProfileNameEditor;