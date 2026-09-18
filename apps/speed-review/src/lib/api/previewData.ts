import type { Application } from '../client/types';
import type { Round, RoundStats } from './airtable';

const rounds: Round[] = [
  { id: 'recPreviewRound01', name: 'AGI Strategy (sample round)', course: 'AGI Strategy' },
  { id: 'recPreviewRound02', name: 'Technical AI Safety (sample round)', course: 'Technical AI Safety' },
];
const people: Application[] = [
  {
    id: 'recSamplePerson01', name: 'Alex Morgan', jobTitle: 'Policy researcher', organisation: 'Example Institute', experience: 'Three years researching technology policy and public sector procurement. Led a cross-functional project comparing AI assurance approaches.', pathToImpact: 'Help public institutions evaluate advanced AI systems and make better procurement decisions.', impressiveProject: 'Built an open assessment framework used by a small group of public sector researchers.', reasoning: 'I want a stronger technical grounding to connect my policy work with practical questions about model evaluations.', skills: 'Research design, policy analysis, stakeholder interviews.', totalScore: 12, commitmentScore: 4, impressivenessScore: 4, technicalSkillScore: 4, allowMoveToAgisc: true,
  },
  {
    id: 'recSamplePerson02', name: 'Sam Chen', jobTitle: 'Software engineer', organisation: 'Example Labs', experience: 'Develops infrastructure for machine learning experiments. Recently started an independent reading group on interpretability.', pathToImpact: 'Build evaluation infrastructure that makes safety research faster and easier to reproduce.', impressiveProject: 'Created a reproducible benchmark for comparing changes in model behavior across training runs.', totalScore: 11, commitmentScore: 4, impressivenessScore: 4, technicalSkillScore: 3, allowMoveToAgisc: true,
  },
  {
    id: 'recSamplePerson03', name: 'Jordan Patel', jobTitle: 'Graduate researcher', organisation: 'Example University', experience: 'Studies economics and the governance of emerging technologies.', pathToImpact: 'Contribute empirical research on the incentives shaping AI development.', totalScore: 10, allowMoveToAgisc: false,
  },
  {
    id: 'recSamplePerson04', name: 'Riley Williams', jobTitle: 'Program manager', organisation: 'Example Foundation', experience: 'Coordinates research grants and supports teams working on technology governance.', pathToImpact: 'Help promising research projects reach the people who can use their findings.', totalScore: 9, allowMoveToAgisc: true,
  },
];

type PreviewState = { opinions: Record<string, { opinion: string; decision: string }>; moved: Record<string, string> };
const previewGlobal = globalThis as typeof globalThis & { blueDotAppsPreview?: PreviewState };
const state = () => {
  previewGlobal.blueDotAppsPreview ??= { opinions: {}, moved: {} };
  return previewGlobal.blueDotAppsPreview;
};

export const previewData = {
  fetchRounds: async () => rounds,
  fetchApplications: async (_round: string, _offset?: string, direction = 'top') => ({ applications: people.filter((person) => !state().opinions[person.id] && !state().moved[person.id]).sort((a, b) => direction === 'bottom' ? (a.totalScore ?? 0) - (b.totalScore ?? 0) : (b.totalScore ?? 0) - (a.totalScore ?? 0)) }),
  fetchApplicationHistory: async () => [],
  fetchRoundStats: async (): Promise<RoundStats> => ({ total: people.length, evaluated: Object.keys(state().opinions).length, accepted: Object.values(state().opinions).filter((opinion) => opinion.decision === 'Accept').length }),
  writeOpinions: async (opinions: { id: string; opinion: string; decision: string }[]) => {
    opinions.forEach(({ id, ...opinion }) => {
      state().opinions[id] = opinion;
    });
  },
  resetOpinion: async (id: string) => {
    delete state().opinions[id];
  },
  moveApplicationToAgisc: async (id: string, round: string) => {
    state().moved[id] = round;
  },
};
