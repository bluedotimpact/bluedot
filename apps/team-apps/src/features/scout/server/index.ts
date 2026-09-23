import type { Decision } from '../types';
import * as airtable from './airtable';

export const fetchQueue = () => airtable.fetchQueue();
export const fetchInvitedThisWeek = () => airtable.fetchInvitedThisWeek();
export const fetchPerson = (id: string) => airtable.fetchPerson(id);

// Both writes re-read the registration first and refuse if anyone already touched it
export const recordDecision = (id: string, decision: Decision) => (decision === 'invite' ? airtable.inviteForReal(id) : airtable.declineForReal(id));
