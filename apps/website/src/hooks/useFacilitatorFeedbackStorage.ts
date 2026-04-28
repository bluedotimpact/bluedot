import { useEffect, useRef, useState } from 'react';

export type AddedParticipant = { id: string; name: string };

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

/**
 * Per-meetPerson localStorage for the facilitator feedback flow.
 * Holds two lists that survive a page refresh: participants the facilitator marked
 * "no strong impression", and participants the facilitator added via "+ Add a participant".
 */
export const useFacilitatorFeedbackStorage = (meetPersonId: string) => {
  const noStrongImpressionKey = `facilitator-feedback:${meetPersonId}:no-strong-impression`;
  const addedKey = `facilitator-feedback:${meetPersonId}:added`;

  const [noStrongImpressionIds, setNoStrongImpressionIdsState] = useState<string[]>([]);
  const [addedParticipants, setAddedParticipantsState] = useState<AddedParticipant[]>([]);
  const addedParticipantsRef = useRef<AddedParticipant[]>([]);

  useEffect(() => {
    setNoStrongImpressionIdsState(safeParse(localStorage.getItem(noStrongImpressionKey), [] as string[]));
    const initialAdded = safeParse(localStorage.getItem(addedKey), [] as AddedParticipant[]);
    addedParticipantsRef.current = initialAdded;
    setAddedParticipantsState(initialAdded);
  }, [noStrongImpressionKey, addedKey]);

  const setNoStrongImpressionIds = (next: string[]) => {
    setNoStrongImpressionIdsState(next);
    localStorage.setItem(noStrongImpressionKey, JSON.stringify(next));
  };

  const addParticipant = (person: AddedParticipant) => {
    const next = [...addedParticipantsRef.current, person];
    addedParticipantsRef.current = next;
    localStorage.setItem(addedKey, JSON.stringify(next));
    setAddedParticipantsState(next);
  };

  return {
    noStrongImpressionIds,
    setNoStrongImpressionIds,
    addedParticipants,
    addParticipant,
  };
};
