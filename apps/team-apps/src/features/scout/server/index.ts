import { isLocalPreview } from '../../../lib/preview';
import type { Decision } from '../types';
import { scoutPreview } from './preview';
import * as airtable from './airtable';

export const fetchQueue = () => (isLocalPreview() ? scoutPreview.fetchQueue() : airtable.fetchQueue());
export const fetchInvitedThisWeek = () => (isLocalPreview() ? scoutPreview.fetchInvitedThisWeek() : airtable.fetchInvitedThisWeek());
export const fetchPerson = (id: string) => (isLocalPreview() ? scoutPreview.fetchPerson(id) : airtable.fetchPerson(id));

export const recordDecision = async (id: string, decision: Decision) => {
  if (isLocalPreview()) return scoutPreview.recordDecision(id, decision);
  const { withDecisionLock } = await import('./decisionLock');
  return withDecisionLock(id, () => (decision === 'invite' ? airtable.inviteForReal(id) : airtable.declineForReal(id)));
};
