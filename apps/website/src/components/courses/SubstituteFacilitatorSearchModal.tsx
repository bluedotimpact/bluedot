import {
  Button, ErrorSection, Modal, ProgressDots, SearchInput,
} from '@bluedot/ui';
import { useState } from 'react';
import { trpc } from '../../utils/trpc';
import SearchResultRow from './SearchResultRow';

export type SubstituteCandidate = { userId: string; name: string; hasFacilitatedThisCourse: boolean };

type SubstituteFacilitatorSearchModalProps = {
  roundId: string;
  discussionId: string;
  onSelect: (candidate: SubstituteCandidate) => void;
  onClose: () => void;
};

const MIN_SEARCH_LENGTH = 2;

const SubstituteFacilitatorSearchModal = ({
  roundId, discussionId, onSelect, onClose,
}: SubstituteFacilitatorSearchModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const trimmed = searchTerm.trim();
  const hasSearchTerm = trimmed.length >= MIN_SEARCH_LENGTH;
  const { data, isLoading, error } = trpc.facilitators.searchSubstituteCandidates.useQuery(
    { roundId, discussionId, searchTerm: trimmed },
    { enabled: hasSearchTerm },
  );
  const results = data ?? [];

  return (
    <Modal
      isOpen
      setIsOpen={(open) => !open && onClose()}
      title="Add someone else as a facilitator"
      bottomDrawerOnMobile
      isDismissable={false}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name..."
            aria-label="Search past facilitators by name"
          />
          <p className="text-size-xs text-secondary italic">Search for anyone who has been a facilitator before.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          {hasSearchTerm && isLoading && <ProgressDots />}
          {hasSearchTerm && error && <ErrorSection error={error} />}
          {hasSearchTerm && !isLoading && !error && results.length === 0 && (
            <p className="text-size-xs text-secondary py-2">No one found.</p>
          )}
          {results.map((candidate) => (
            <SearchResultRow
              key={candidate.userId}
              name={candidate.name}
              note={!candidate.hasFacilitatedThisCourse && 'Has not facilitated this course before'}
              rightHandNode={(
                <Button size="small" onClick={() => onSelect(candidate)}>
                  Select
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

export default SubstituteFacilitatorSearchModal;
