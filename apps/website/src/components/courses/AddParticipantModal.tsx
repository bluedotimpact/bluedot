import { Modal, ProgressDots } from '@bluedot/ui';
import { useState } from 'react';
import { RiSearchLine } from 'react-icons/ri';
import { trpc } from '../../utils/trpc';
import { getInitials } from '../../lib/utils';

type AddParticipantModalProps = {
  meetPersonId: string;
  excludeIds: string[];
  onAdd: (person: { id: string; name: string }) => void;
  onClose: () => void;
};

const AddParticipantModal: React.FC<AddParticipantModalProps> = ({ meetPersonId, excludeIds, onAdd, onClose }) => {
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
      title={<span className="font-bold text-size-md text-bluedot-navy">Add a participant</span>}
      desktopHeaderClassName="h-[73px] py-0 px-6 mb-0 border-b border-gray-200"
      bottomDrawerOnMobile
      ariaLabel="Add a participant"
      noClickaway
    >
      <div className="w-full max-w-[480px] flex flex-col gap-4 pt-0 sm:pt-5 -mb-4">
        <p className="text-size-xs leading-normal text-bluedot-navy/60">
          Search for a participant enrolled in this course who isn't already on your list.
        </p>

        <div className="flex items-center gap-2 h-[46px] border border-gray-300 rounded-md px-3">
          <RiSearchLine className="text-gray-400 shrink-0" size={15} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name..."
            className="flex-1 outline-none text-size-xs placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto">
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
            <div
              key={person.id}
              className="flex items-center gap-3 border border-gray-300 rounded-md px-3 py-3"
            >
              <div className="size-[30px] rounded-full bg-bluedot-normal flex items-center justify-center text-white text-size-xxs font-bold shrink-0">
                {getInitials(person.name)}
              </div>
              <span className="flex-1 text-size-xs font-medium text-bluedot-navy truncate">{person.name}</span>
              <button
                type="button"
                onClick={() => onAdd(person)}
                className="bg-bluedot-normal text-white h-8 px-3 rounded-md text-size-xs font-semibold transition-colors cursor-pointer hover:bg-bluedot-darker focus:outline-hidden focus:ring-2 focus:ring-bluedot-light"
              >
                Add
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="bg-white border border-gray-300 rounded-md px-4 py-2.5 text-size-xs font-medium text-bluedot-navy transition-colors cursor-pointer hover:bg-gray-50 active:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-bluedot-light"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddParticipantModal;
