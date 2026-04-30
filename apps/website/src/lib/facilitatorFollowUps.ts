// `id` strings must match the option values in the Airtable nextSteps column.
export const FOLLOW_UP_OPTIONS = [
  { id: 'No further action needed', label: 'No further action needed' },
  { id: 'Add to talent pipeline [keep warm for future opportunities/check-ins]', label: 'Add to talent pipeline (keep warm) — for future opportunities' },
  { id: 'Flag for 1-1 advising with BlueDot team', label: 'Flag for 1-1 advising with BlueDot team' },
  { id: 'Flag as candidate for funding (career transition/project)', label: 'Potential funding candidate — career transition or project support' },
  { id: 'Recommend to facilitate', label: 'Invite to apply as a facilitator' },
] as const;

export const FOLLOW_UP_IDS = FOLLOW_UP_OPTIONS.map((o) => o.id) as [
  typeof FOLLOW_UP_OPTIONS[number]['id'],
  ...typeof FOLLOW_UP_OPTIONS[number]['id'][],
];

export type FollowUpId = typeof FOLLOW_UP_OPTIONS[number]['id'];

export const ACTIONABLE_FOLLOW_UP_IDS = [
  'Flag for 1-1 advising with BlueDot team',
  'Flag as candidate for funding (career transition/project)',
  'Recommend to facilitate',
] as const;

export const isFlagged = (followUps: readonly string[] | null | undefined): boolean => ACTIONABLE_FOLLOW_UP_IDS.some((id) => followUps?.includes(id));
