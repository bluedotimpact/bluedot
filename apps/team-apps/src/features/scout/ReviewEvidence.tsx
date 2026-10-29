import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '@bluedot/ui';
import type { Decision, Person, QueueItem } from './types';
import { PersonCard } from './PersonCard';
import { panel } from './reviewStyles';

export type Move = Decision | 'skip';

// The new card drifts in the way the key pointed: → invite, ← don't invite, ↓ skip
const ENTER_FROM: Record<Move, string> = { invite: 'translateX(-12px)', decline: 'translateX(12px)', skip: 'translateY(-12px)' };

// The card is the whole evidence view: everything Airtable holds on the person,
// in fixed slots. No summary layer sits in front of it.
export const ReviewEvidence = ({
  item, person, error, onRetry, actions, enteredBy,
}: { item: QueueItem; person?: Person; error?: string; onRetry: () => void; actions: ReactNode; enteredBy?: Move }) => {
  const body = useRef<HTMLDivElement>(null);
  const move = useRef(enteredBy);
  // Keyed per person, so this runs once per card; the action bar below stays still
  useEffect(() => {
    const from = move.current;
    if (!from || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    body.current?.animate?.([{ opacity: 0, transform: ENTER_FROM[from] }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'ease-out' });
  }, []);

  return (
    <section aria-label="Participant evidence" className={panel}>
      <div ref={body} className="p-4 sm:p-5">
        {!person && !error && <p role="status" className="text-size-sm text-secondary">Loading {item.name ?? 'participant'}…</p>}
        {error && (
          <div role="alert">
            <p className="text-size-sm">{error}</p>
            <Button variant="outline-black" className="mt-3" onClick={onRetry}>Retry participant</Button>
          </div>
        )}
        {person && <PersonCard person={person} showName mustLook={item.mustLook} />}
      </div>
      {actions}
    </section>
  );
};
