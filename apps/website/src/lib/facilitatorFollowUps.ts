export const FOLLOW_UP_OPTIONS = [
  { id: 'no-action', label: 'No further action needed', airtableValue: 'No further action needed' },
  { id: 'talent-pipeline', label: 'Add to talent pipeline (keep warm) — for future opportunities', airtableValue: 'Add to talent pipeline [keep warm for future opportunities/check-ins]' },
  { id: 'schedule-call', label: 'Schedule a call within the week (high priority)', airtableValue: 'Schedule follow-up call with BlueDot team within ~1 week (high-priority)' },
  { id: 'funding-candidate', label: 'Potential funding candidate — career transition or project support', airtableValue: 'Flag as candidate for funding (career transition/project)' },
  { id: 'invite-facilitator', label: 'Invite to apply as a facilitator', airtableValue: 'Recommend to facilitate' },
] as const;

export const FOLLOW_UP_AIRTABLE_VALUES = FOLLOW_UP_OPTIONS.map((o) => o.airtableValue) as [
  typeof FOLLOW_UP_OPTIONS[number]['airtableValue'],
  ...typeof FOLLOW_UP_OPTIONS[number]['airtableValue'][],
];

export type FollowUpAirtableValue = typeof FOLLOW_UP_OPTIONS[number]['airtableValue'];

const NO_ACTION_AIRTABLE_VALUE = FOLLOW_UP_OPTIONS.find((o) => o.id === 'no-action')!.airtableValue;

/** A participant is "flagged" if the facilitator picked any follow-up other than "no further action needed". */
export const isFlaggedFromAirtable = (nextSteps: string[] | null | undefined): boolean => (nextSteps ?? []).some((step) => step !== NO_ACTION_AIRTABLE_VALUE);
