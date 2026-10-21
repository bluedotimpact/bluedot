import type { Decision } from '../types';
import * as airtable from './airtable';

export const fetchQueue = () => airtable.fetchQueue();
export const fetchLead = (email: string) => airtable.fetchLead(email);
export const fetchInvitedThisWeek = () => airtable.fetchInvitedThisWeek();
export const fetchPerson = (id: string) => airtable.fetchPerson(id);

// Both writes re-read the registration first and refuse if anyone already touched it. The note,
// if any, goes to the facilitator who endorsed the person (see airtable.ts).
export const recordDecision = (id: string, decision: Decision, note?: string) => (decision === 'invite' ? airtable.inviteForReal(id, note) : airtable.declineForReal(id, note));
