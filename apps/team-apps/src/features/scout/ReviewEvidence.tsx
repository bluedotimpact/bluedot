import type { ReactNode } from 'react';
import type { Person, QueueItem } from './types';
import { PersonCard } from './PersonCard';
import { button, panel } from './reviewStyles';

// The card is the whole evidence view: everything Airtable holds on the person,
// in fixed slots. No summary layer sits in front of it.
export const ReviewEvidence = ({
  item, person, error, showName, onRetry, actions,
}: { item: QueueItem; person?: Person; error?: string; showName: boolean; onRetry: () => void; actions: ReactNode }) => (
  <section aria-label="Participant evidence" className={panel}>
    <div className="p-4 sm:p-5">
      {!person && !error && <p role="status" className="text-size-sm text-secondary">Loading {showName ? item.name ?? 'participant' : 'participant'}…</p>}
      {error && (
        <div role="alert">
          <p className="text-size-sm">{error}</p>
          <button type="button" className={`${button} mt-3`} onClick={onRetry}>Retry participant</button>
        </div>
      )}
      {person && <PersonCard person={person} showName={showName} />}
    </div>
    {actions}
  </section>
);
