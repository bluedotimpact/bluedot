import type { Course, Decision } from '../types';
import * as airtable from './airtable';

export const fetchQueue = (courses?: readonly Course[]) => airtable.fetchQueue(courses);
export const fetchLead = (email: string) => airtable.fetchLead(email);
export const fetchInvitedThisWeek = () => airtable.fetchInvitedThisWeek();
export const fetchPerson = (id: string) => airtable.fetchPerson(id);

// Both writes re-read the registration first and refuse if anyone already touched it
export const recordDecision = (id: string, decision: Decision, note?: string) => (decision === 'invite' ? airtable.inviteForReal(id, note) : airtable.declineForReal(id, note));
