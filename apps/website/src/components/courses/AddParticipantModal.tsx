import {
  Button, Modal, ProgressDots, SearchInput,
} from '@bluedot/ui';
import { useState } from 'react';
import { trpc } from '../../utils/trpc';
import ParticipantRow from './ParticipantRow';

type AddParticipantModalProps = {
  meetPersonId: string;
  excludeIds: string[];
  onAdd: (person: { id: string; name: string }) => void;
  onClose: () => void;
};

const AddParticipantModal = ({ meetPersonId, excludeIds, onAdd, onClose }: AddParticipantModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, isError } = trpc.facilitators.searchAddableParticipants.useQuery({
    meetPersonId,
    searchTerm: searchTerm.trim() || undefined,
  });

  const excluded = new Set(excludeIds);
  const results = (data ?? []).filter((p) => !excluded.has(p.id));

  return (
    <Modal
      isOpen
      setIsOpen={(v) => {
        if (!v) onClose();
      }}
      title="Add a participant"
      bottomDrawerOnMobile
      aria-label="Add a participant"
      isDismissable={false}
    >
      <div className="flex flex-col gap-4">
        <p className="text-size-xs leading-normal text-secondary">
          Search for a participant enrolled in this course who isn't already on your list.
        </p>

        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name..."
          aria-label="Search participants by name"
        />

        <div className="flex flex-col gap-1.5">
          {isLoading && <ProgressDots />}
          {isError && (
            <p className="text-error-fg text-size-xs py-2" role="alert" aria-live="polite">
              Couldn't load participants. Please try again.
            </p>
          )}
          {!isLoading && !isError && results.length === 0 && (
            <p className="text-size-xs text-secondary py-2">No participants found.</p>
          )}
          {results.map((person) => (
            <ParticipantRow
              key={person.id}
              name={person.name}
              rightHandNode={(
                <Button size="small" onClick={() => onAdd(person)}>
                  Add
                </Button>
              )}
            />
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-subtle pb-4 sm:pb-0">
          <Button variant="outline-black" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddParticipantModal;
