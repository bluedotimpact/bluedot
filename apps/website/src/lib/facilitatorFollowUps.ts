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

export const ACTIONABLE_FOLLOW_UP_IDS = ['schedule-call', 'funding-candidate', 'invite-facilitator'] as const;

export const followUpsToAirtable = (followUps: Record<string, boolean>): FollowUpAirtableValue[] => FOLLOW_UP_OPTIONS
  .filter((o) => followUps[o.id])
  .map((o) => o.airtableValue);

export const airtableToFollowUps = (nextSteps: string[] | null | undefined): Record<string, boolean> => {
  const result: Record<string, boolean> = {};
  for (const o of FOLLOW_UP_OPTIONS) {
    if (nextSteps?.includes(o.airtableValue)) result[o.id] = true;
  }

  return result;
};

export const isFlagged = (followUps: Record<string, boolean>): boolean => ACTIONABLE_FOLLOW_UP_IDS.some((id) => followUps[id]);
