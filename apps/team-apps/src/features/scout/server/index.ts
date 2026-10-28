import type { Course, Decision } from '../types';
import * as airtable from './airtable';

export const fetchQueue = (courses?: readonly Course[], part?: airtable.QueuePart, supported?: Promise<Set<string>>) => airtable.fetchQueue(courses, part, supported);
export const startSupportedCheck = () => airtable.startSupportedCheck();
export const warmRounds = () => airtable.warmRounds();
export const fetchLead = (email: string) => airtable.fetchLead(email);
export const fetchInvitedThisWeek = () => airtable.fetchInvitedThisWeek();
export const fetchPerson = (id: string) => airtable.fetchPerson(id);

// Both writes re-read the registration first and refuse if anyone already touched it
export const recordDecision = (id: string, decision: Decision, note?: string) => (decision === 'invite' ? airtable.inviteForReal(id, note) : airtable.declineForReal(id, note));
