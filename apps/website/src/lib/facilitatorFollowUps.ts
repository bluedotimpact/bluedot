// Subset of nextSteps option names that count as actionable for flagging.
// Must match the option names in the Airtable nextSteps column verbatim.
export const ACTIONABLE_FOLLOW_UP_IDS = [
  'Flag for 1-1 advising with BlueDot team',
  'Flag as candidate for funding (career transition/project)',
  'Recommend to facilitate',
] as const;

export const isFlagged = (followUps: readonly string[] | null | undefined): boolean => ACTIONABLE_FOLLOW_UP_IDS.some((id) => followUps?.includes(id));
