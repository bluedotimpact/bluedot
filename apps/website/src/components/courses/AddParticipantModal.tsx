import {
  CTALinkOrButton, Input, Modal, ProgressDots,
} from '@bluedot/ui';
import { useRef, useState } from 'react';
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6';
import { trpc } from '../../utils/trpc';
import ParticipantRow from './ParticipantRow';

type AddParticipantModalProps = {
  meetPersonId: string;
  excludeIds: string[];
  onAdd: (person: { id: string; name: string }) => void;
  onClose: () => void;
};

const AddParticipantModal: React.FC<AddParticipantModalProps> = ({ meetPersonId, excludeIds, onAdd, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
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
      ariaLabel="Add a participant"
      isDismissable={false}
    >
      <div className="flex flex-col gap-4">
        <p className="text-size-xs leading-normal text-bluedot-navy/60">
          Search for a participant enrolled in this course who isn't already on your list.
        </p>

        <Input
          ref={searchInputRef}
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name..."
          aria-label="Search participants by name"
          leading={<FaMagnifyingGlass aria-hidden />}
          trailing={searchTerm ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearchTerm('');
                searchInputRef.current?.focus();
              }}
              className="-mr-3 flex size-11 items-center justify-center text-secondary hover:text-primary"
            >
              <FaXmark aria-hidden />
            </button>
          ) : undefined}
        />

        <div className="flex flex-col gap-1.5">
          {isLoading && <ProgressDots />}
          {isError && (
            <p className="text-red-600 text-size-xs py-2" role="alert" aria-live="polite">
              Couldn't load participants. Please try again.
            </p>
          )}
          {!isLoading && !isError && results.length === 0 && (
            <p className="text-size-xs text-bluedot-navy/60 py-2">No participants found.</p>
          )}
          {results.map((person) => (
            <ParticipantRow
              key={person.id}
              name={person.name}
              rightHandNode={(
                <CTALinkOrButton size="small" onClick={() => onAdd(person)}>
                  Add
                </CTALinkOrButton>
              )}
            />
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 pb-4 sm:pb-0">
          <CTALinkOrButton variant="outline-black" onClick={onClose}>
            Cancel
          </CTALinkOrButton>
        </div>
      </div>
    </Modal>
  );
};

export default AddParticipantModal;
