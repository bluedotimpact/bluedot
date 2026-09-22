import type {
  Course, Decision, InvitedThisWeek, Person, QueueItem,
} from '../types';
import type { WriteResult } from './airtable';

const examples: { id: string; name: string; course: Course }[] = [
  { id: 'recScoutSample001', name: 'Alex Morgan', course: 'Technical AI Safety' },
  { id: 'recScoutSample002', name: 'Sam Chen', course: 'Technical AI Safety' },
  { id: 'recScoutSample003', name: 'Jordan Patel', course: 'Technical AI Safety Project' },
  { id: 'recScoutSample004', name: 'Riley Williams', course: 'Biosecurity' },
];

export const samplePeople: Person[] = examples.map(({ id, name, course }) => ({
  id, name, course, email: `${name.toLowerCase().replace(' ', '.')}@example.org`,
  roundName: `${course} (2026 Aug W32) - Part-time`, roundEnd: '2026-09-01', opinion: 'Weak yes',
  jobTitle: 'Research engineer', organisation: 'Example Research Institute', country: 'United Kingdom',
  history: [{
    id, course, roundName: `${course} (2026 Aug W32) - Part-time`, roundEnd: '2026-09-01', facilitated: false, opinion: 'Weak yes', hasCertificate: true, droppedOut: false, isCurrent: true,
  }],
  grants: [{
    id: 'recSampleGrant001', status: 'Under review', createdAt: '2026-08-15', reasoning: 'A small grant would let this participant test their research direction with a focused, well-scoped project.',
  }],
  calls: [{
    id: 'recSampleCall001', callDate: '2026-07-15', opinion: 'Weak yes', cases: { commitment: 4, agency: 3, expertise: 3 },
  }],
  reports: [{
    id: 'recSampleReport01', date: '2026-08-25', quickTake: 'Asked precise questions, followed up with a working experiment, and helped peers understand the evaluation results.', nextSteps: ['Schedule follow-up call with BlueDot team within ~1 week (high-priority)'],
  }],
  facilitatorFeedback: [{
    id: 'recSamplePeer001', reviewer: 'Example facilitator', rating: 8, feedback: 'Strong independent work and clear reasoning. Worth a conversation about practical next steps.', nextSteps: [], oneOnOneRating: 'Promising', recommendToFacilitate: true,
  }],
  projects: [{ id: 'recSampleProject', title: 'Evaluation reliability', evalNotes: ['Compared several evaluation methods and documented where their results disagree.'] }],
  feedback: [{
    id: 'recSampleFeedback', rating: 9, timeSpent: 5, futureFacilitate: 'Yes', courseValue: 'The feedback on my project helped me choose a concrete research question.',
  }],
  application: {
    id: 'recSampleApp00001', careerLevel: 'Mid-career', profession: 'Software engineering', commitmentScore: 4, impressivenessScore: 4, experience: 'Three years building research software. Recently ran a reading group and published reproducible experiments.', pathToImpact: 'I want to test whether I can contribute reliable evaluation tools to a safety research team.', impressiveProject: 'Built a reproducible benchmark and worked with peers to investigate surprising failures.', skills: 'Python, experimental design, and communicating technical results.',
  },
}));

type State = { decisions: Record<string, Decision> };
const previewGlobal = globalThis as typeof globalThis & { scoutPreviewState?: State };
const state = () => {
  previewGlobal.scoutPreviewState ??= { decisions: {} };
  return previewGlobal.scoutPreviewState;
};

export const scoutPreview = {
  fetchQueue: async (): Promise<QueueItem[]> => samplePeople.filter((p) => !state().decisions[p.id]).map((p) => ({
    id: p.id, name: p.name, roundId: `sample-${p.course}`, course: p.course, roundName: p.roundName, roundEnd: p.roundEnd, opinion: p.opinion, hasCertificate: true, hasReport: true,
  })),
  fetchInvitedThisWeek: async (): Promise<InvitedThisWeek> => ({ 'Technical AI Safety': { total: 3, viaApp: 1 }, Biosecurity: { total: 1, viaApp: 0 } }),
  fetchPerson: async (id: string): Promise<Person | undefined> => {
    const person = samplePeople.find((p) => p.id === id);
    const decision = state().decisions[id];
    let scoutingStatus: string | undefined;
    if (decision) scoutingStatus = decision === 'invite' ? 'Invited' : 'Pass';
    return person ? { ...person, scoutingStatus } : undefined;
  },
  recordDecision: async (id: string, decision: Decision): Promise<WriteResult> => {
    if (!samplePeople.some((p) => p.id === id)) return { ok: false, reason: 'Participant not found.' };
    if (state().decisions[id]) return { ok: false, reason: 'This participant already has a decision. Refresh the queue to continue.' };
    state().decisions[id] = decision;
    return { ok: true };
  },
};
