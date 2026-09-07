import { useState } from 'react';
import {
  CTALinkOrButton,
  Input,
} from '@bluedot/ui';
import type { User } from '@bluedot/db';
import { updateNameSchema } from '../../lib/schemas/user/me.schema';
import { splitName } from '../../lib/name';
import { trpc } from '../../utils/trpc';

type NameParts = { firstName: string; lastName: string };

type ProfileNameEditorProps = {
  user: Pick<User, 'firstName' | 'lastName' | 'name'>;
  onSave?: () => void;
};

// Users from before first/last were stored only have `name`; split it as a suggestion they confirm by saving
const getInitialNames = (user: ProfileNameEditorProps['user']): NameParts => {
  const hasStoredNames = Boolean(user.firstName) || Boolean(user.lastName);
  return hasStoredNames
    ? { firstName: user.firstName ?? '', lastName: user.lastName ?? '' }
    : splitName(user.name);
};

const ProfileNameEditor = ({ user, onSave }: ProfileNameEditorProps) => {
  const [names, setNames] = useState<NameParts>(() => getInitialNames(user));
  const [savedNames, setSavedNames] = useState<NameParts>(names);
  const [nameError, setNameError] = useState('');

  const trimmed: NameParts = { firstName: names.firstName.trim(), lastName: names.lastName.trim() };

  const updateNameMutation = trpc.users.updateName.useMutation({
    onMutate() {
      setNameError('');
    },
    onSuccess(result) {
      const saved = { firstName: result.firstName ?? '', lastName: result.lastName ?? '' };
      setSavedNames(saved);
      setNames(saved);
      onSave?.();
    },
    onError(error) {
      if (error.data?.code === 'UNAUTHORIZED') {
        setNameError('Session expired. Please refresh the page and try again.');
      } else if (error.data?.code === 'BAD_REQUEST') {
        setNameError(`${error.message}. Invalid name format.`);
      } else {
        setNameError('Failed to update name. Please try again.');
      }
    },
  });

  const isSaving = updateNameMutation.isPending;

  const handleSave = () => {
    const validationResult = updateNameSchema.safeParse(trimmed);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      setNameError(firstError?.message || 'Failed to update name. Please try again.');
      return;
    }

    updateNameMutation.mutate(validationResult.data);
  };

  const handleCancel = () => {
    setNames(savedNames);
    setNameError('');
  };

  const handleFocus = () => {
    setNameError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }

    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const showButtons = trimmed.firstName !== savedNames.firstName.trim() || trimmed.lastName !== savedNames.lastName.trim();

  return (
    <div className="mb-6">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name*"
            labelClassName="font-semibold"
            inputClassName="font-normal"
            value={names.firstName}
            onChange={(e) => setNames({ ...names, firstName: e.target.value })}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder="Enter your first name"
            aria-label="First name"
            aria-describedby={nameError ? 'profile-name-error' : undefined}
            aria-invalid={!!nameError}
          />
          <Input
            label="Last name*"
            labelClassName="font-semibold"
            inputClassName="font-normal"
            value={names.lastName}
            onChange={(e) => setNames({ ...names, lastName: e.target.value })}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder="Enter your last name"
            aria-label="Last name"
            aria-describedby={nameError ? 'profile-name-error' : undefined}
            aria-invalid={!!nameError}
          />
        </div>
        {showButtons && (
          <div className="flex gap-2">
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
        {nameError && (
          <p
            className="text-red-600 text-size-sm"
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
};

export default ProfileNameEditor;
